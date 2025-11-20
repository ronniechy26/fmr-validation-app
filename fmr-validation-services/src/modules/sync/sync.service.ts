import { Injectable, Logger } from '@nestjs/common';
import { FormRecord } from '../../common/types/forms';
import { FmrRepository } from '../../shared/fmr.repository';
import { AbemisService } from '../../shared/abemis.service';

export interface UpsertFormDto {
  id?: string;
  annexTitle: string;
  status: FormRecord['status'];
  linkedProjectId?: string;
  abemisId?: string;
  qrReference?: string;
  data: FormRecord['data'];
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly repository: FmrRepository,
    private readonly abemisService: AbemisService,
  ) {}

  async getSnapshot() {
    try {
      const projects = await this.abemisService.fetchProjectsFromAbemis();
      await this.repository.saveProjectsFromUpstream(projects);
    } catch (error) {
      this.logger.warn(
        `Unable to refresh from ABEMIS, serving cached snapshot instead: ${error instanceof Error ? error.message : error}`,
      );
    }
    return this.repository.getSnapshot();
  }

  async upsertForms(forms: UpsertFormDto[]) {
    return Promise.all(
      forms.map((form) =>
        this.repository.upsertFormFromClient({
          id: form.id ?? `client-${Date.now()}`,
          annexTitle: form.annexTitle,
          status: form.status,
          updatedAt: new Date().toISOString(),
          linkedProjectId: form.linkedProjectId,
          abemisId: form.abemisId,
          qrReference: form.qrReference,
          data: form.data,
        }),
      ),
    );
  }
}
