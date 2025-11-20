import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AbemisInfraDetail,
  AbemisInfraDetailResponse,
  AbemisInfraListItem,
  AbemisInfraListResponse,
} from '../common/types/abemis';
import { ProjectRecord } from '../common/types/forms';

const DEFAULT_BASE_URL = 'https://abemis.staging.bafe.gov.ph';
const DEFAULT_PROJECT_TYPES = 'Farm-to-Market Road';
const DEFAULT_PAGE_SIZE = 100;

@Injectable()
export class AbemisService {
  private readonly logger = new Logger(AbemisService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly projectTypes: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config
      .get<string>('ABEMIS_BASE_URL', DEFAULT_BASE_URL)
      .replace(/\/+$/, '');
    this.apiKey = this.config.get<string>('ABEMIS_API_KEY', '');
    this.projectTypes = this.config.get<string>(
      'ABEMIS_PROJECT_TYPES',
      DEFAULT_PROJECT_TYPES,
    );
  }

  async fetchProjectsFromAbemis(): Promise<ProjectRecord[]> {
    const summaries = await this.fetchAllInfraList();
    const detailed = await Promise.all(
      summaries.map(async (summary) => {
        const detail = await this.safeFetchDetail(summary.id).catch((error) => {
          this.logger.warn(
            `Falling back to list data for ABEMIS id ${summary.id}: ${error instanceof Error ? error.message : error}`,
          );
          return undefined;
        });
        return this.toProjectRecord(detail ?? summary);
      }),
    );
    return detailed;
  }

  private async fetchAllInfraList(): Promise<AbemisInfraListItem[]> {
    let page = 1;
    let totalPages = 1;
    const results: AbemisInfraListItem[] = [];

    do {
      const response = await this.fetchInfraList(page);
      results.push(...response.data);
      totalPages = response.pagination?.total_pages ?? totalPages;
      page += 1;
    } while (page <= totalPages);

    return results;
  }

  private async fetchInfraList(page: number): Promise<AbemisInfraListResponse> {
    const url = new URL(`${this.baseUrl}/api/infra-list`);
    url.searchParams.set('project_types', this.projectTypes);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(DEFAULT_PAGE_SIZE));

    const response = await fetch(url.toString(), {
      headers: {
        'x-api-key': this.apiKey,
      },
    });
    if (!response.ok) {
      throw new Error(
        `ABEMIS infra-list failed with status ${response.status}`,
      );
    }
    const payload = (await response.json()) as AbemisInfraListResponse;
    if (!payload?.data) {
      throw new Error('ABEMIS infra-list payload malformed');
    }
    return payload;
  }

  private async safeFetchDetail(
    id: number | string,
  ): Promise<AbemisInfraDetail | undefined> {
    const response = await fetch(`${this.baseUrl}/api/infra/${id}`, {
      headers: {
        'x-api-key': this.apiKey,
      },
    });
    if (!response.ok) {
      throw new Error(
        `ABEMIS infra detail failed with status ${response.status}`,
      );
    }
    const payload = (await response.json()) as AbemisInfraDetailResponse;
    return payload?.data;
  }

  private toProjectRecord(
    input: AbemisInfraDetail | AbemisInfraListItem,
  ): ProjectRecord {
    const id = String((input as AbemisInfraDetail).id ?? input.project_id);
    const title =
      (input.project_title ?? input.project_id ?? '').trim() ||
      String(input.project_id);
    const geotags =
      (input as AbemisInfraDetail).geotag?.map((tag) => ({
        id: String(tag.id),
        projectId: String(tag.project_id),
        photoName: tag.photo_name,
        url: tag.url,
      })) ?? [];
    const proposalDocuments =
      (input as AbemisInfraDetail).proposalDocuments?.map((doc) => ({
        id: String(doc.id),
        projectId: String(doc.project_id),
        fileName: doc.file_name,
        category: doc.category,
        url: doc.url,
      })) ?? [];

    return {
      id,
      projectCode: input.project_id ?? id,
      title,
      operatingUnit: input.operating_unit,
      bannerProgram: input.banner_program,
      yearFunded: Number(input.year_funded) || undefined,
      projectType: input.project_type,
      region: input.region,
      province: input.province,
      district: input.district,
      municipality: input.municipality,
      barangay: input.barangay,
      stage: input.stage,
      status: input.status,
      author: input.author,
      quantity: input.quantity,
      quantityUnit: input.quantity_unit,
      allocatedAmount: (input as AbemisInfraDetail).allocated_amount,
      beneficiary: (input as AbemisInfraDetail).beneficiary,
      prexcProgram: (input as AbemisInfraDetail).prexc_program,
      subProgram: (input as AbemisInfraDetail).sub_program,
      indicatorLevel1: (input as AbemisInfraDetail).indicator_level1,
      indicatorLevel3: (input as AbemisInfraDetail).indicator_level3,
      recipientType: (input as AbemisInfraDetail).recipient_type,
      budgetProcess: (input as AbemisInfraDetail).budget_process,
      geotags,
      proposalDocuments,
      latitude: (input as AbemisInfraDetail).latitude,
      longitude: (input as AbemisInfraDetail).longitude,
      abemisId: id,
      qrReference: undefined,
      zone: undefined,
      forms: [],
    };
  }
}
