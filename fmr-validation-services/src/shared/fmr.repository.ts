import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  FlattenedFormRecord,
  FormAttachmentInput,
  FormRecord,
  FormStatus,
  ProjectRecord,
  ValidationForm,
} from '../common/types/forms';
import { ProjectEntity } from '../database/entities/project.entity';
import { FormRecordEntity } from '../database/entities/form-record.entity';

export interface ProjectFilterOptions {
  search?: string;
  status?: FormStatus;
  annexTitle?: string;
}

export interface FormFilterOptions extends ProjectFilterOptions {
  projectId?: string;
  abemisId?: string;
}

export interface CreateFormInput {
  annexTitle: string;
  projectId?: string;
  abemisId?: string;
  qrReference?: string;
  status?: FormStatus;
  data?: Partial<ValidationForm>;
}

export interface UpdateFormInput {
  status?: FormStatus;
  annexTitle?: string;
  abemisId?: string;
  qrReference?: string;
  linkedProjectId?: string;
  data?: Partial<ValidationForm>;
}

export type AttachFormInput = FormAttachmentInput;

@Injectable()
export class FmrRepository {
  constructor(
    @InjectRepository(ProjectEntity) private readonly projectsRepo: Repository<ProjectEntity>,
    @InjectRepository(FormRecordEntity) private readonly formsRepo: Repository<FormRecordEntity>,
  ) {}

  async getProjects(filter: ProjectFilterOptions = {}): Promise<ProjectRecord[]> {
    const hasFilters = Boolean(filter.search || filter.status || filter.annexTitle);
    const projects = await this.projectsRepo.find({ relations: ['forms'] });
    return projects
      .map((project) => {
        const record = this.toProjectRecord(project);
        const filteredForms = this.applyFormFilters(record, filter);
        return this.toProjectRecord(project, filteredForms);
      })
      .filter((project) => (hasFilters ? (project.forms?.length ?? 0) > 0 : true));
  }

  async getProjectById(id: string): Promise<ProjectRecord | undefined> {
    const project = await this.projectsRepo.findOne({ where: { id }, relations: ['forms'] });
    return project ? this.toProjectRecord(project) : undefined;
  }

  async getAllForms(): Promise<FlattenedFormRecord[]> {
    const forms = await this.formsRepo.find({ relations: ['project'] });
    return forms.map((form) => this.toFlattenedForm(form));
  }

  async searchForms(filter: FormFilterOptions = {}): Promise<FlattenedFormRecord[]> {
    const forms = await this.getAllForms();
    return forms.filter((form) => this.matchesFormFilter(form, filter));
  }

  async findFormById(formId: string): Promise<FlattenedFormRecord | undefined> {
    const form = await this.formsRepo.findOne({ where: { id: formId }, relations: ['project'] });
    return form ? this.toFlattenedForm(form) : undefined;
  }

  async createForm(payload: CreateFormInput): Promise<FlattenedFormRecord> {
    const project = payload.projectId ? await this.projectsRepo.findOne({ where: { id: payload.projectId } }) : undefined;
    const formId = payload.data?.id ?? `form-${Date.now()}`;
    const record = this.formsRepo.create({
      id: formId,
      annexTitle: payload.annexTitle,
      status: payload.status ?? 'Draft',
      abemisId: payload.abemisId,
      qrReference: payload.qrReference,
      project: project ?? null,
      data: {
        id: formId,
        status: payload.status ?? 'Draft',
        updatedAt: new Date().toISOString(),
        ...payload.data,
      } as ValidationForm,
    });
    const saved = await this.formsRepo.save(record);
    const withProject = await this.formsRepo.findOne({ where: { id: saved.id }, relations: ['project'] });
    return this.toFlattenedForm(withProject ?? saved);
  }

  async updateForm(formId: string, payload: UpdateFormInput): Promise<FlattenedFormRecord | undefined> {
    const existing = await this.formsRepo.findOne({ where: { id: formId }, relations: ['project'] });
    if (!existing) return undefined;
    if (payload.linkedProjectId !== undefined) {
      existing.project = payload.linkedProjectId
        ? await this.projectsRepo.findOne({ where: { id: payload.linkedProjectId } })
        : null;
    }
    if (payload.annexTitle) existing.annexTitle = payload.annexTitle;
    if (payload.status) existing.status = payload.status;
    if (payload.abemisId !== undefined) existing.abemisId = payload.abemisId;
    if (payload.qrReference !== undefined) existing.qrReference = payload.qrReference;
    if (payload.data) {
      existing.data = { ...existing.data, ...payload.data, updatedAt: new Date().toISOString() } as ValidationForm;
    }
    const saved = await this.formsRepo.save(existing);
    return this.toFlattenedForm(saved);
  }

  async attachForm(formId: string, attachment: AttachFormInput): Promise<FlattenedFormRecord | undefined> {
    const form = await this.formsRepo.findOne({ where: { id: formId }, relations: ['project'] });
    if (!form) return undefined;
    const project = await this.resolveProject(attachment);
    if (!project) return undefined;
    form.project = project;
    form.abemisId = attachment.abemisId ?? project.abemisId ?? null;
    form.qrReference = attachment.qrReference ?? project.qrReference ?? null;
    const saved = await this.formsRepo.save(form);
    return this.toFlattenedForm(saved);
  }

  async getStandaloneDrafts(): Promise<FormRecord[]> {
    const drafts = await this.formsRepo.find({ where: { project: IsNull() } });
    return drafts.map((draft) => this.toFormRecord(draft));
  }

  async getSnapshot(): Promise<{ projects: ProjectRecord[]; standaloneDrafts: FormRecord[] }> {
    const [projects, drafts] = await Promise.all([this.getProjects(), this.getStandaloneDrafts()]);
    return { projects, standaloneDrafts: drafts };
  }

  async upsertFormFromClient(record: FormRecord): Promise<FlattenedFormRecord> {
    const project = record.linkedProjectId ? await this.projectsRepo.findOne({ where: { id: record.linkedProjectId } }) : null;
    const entity = this.formsRepo.create({
      id: record.id,
      annexTitle: record.annexTitle,
      status: record.status,
      abemisId: record.abemisId ?? null,
      qrReference: record.qrReference ?? null,
      project,
      data: record.data,
    });
    const saved = await this.formsRepo.save(entity);
    const withProject = await this.formsRepo.findOne({ where: { id: saved.id }, relations: ['project'] });
    return this.toFlattenedForm(withProject ?? saved);
  }

  private matchesFormFilter(form: FlattenedFormRecord, filter: FormFilterOptions) {
    const statusOk = filter.status ? form.status === filter.status : true;
    const annexOk = filter.annexTitle ? form.annexTitle === filter.annexTitle : true;
    const projectOk = filter.projectId ? form.linkedProjectId === filter.projectId : true;
    const abemisOk = filter.abemisId ? form.abemisId === filter.abemisId : true;
    const query = filter.search?.trim().toLowerCase();
    const queryOk = query
      ? [
          form.projectName ?? '',
          form.data.nameOfProject,
          form.locationBarangay ?? '',
          form.locationMunicipality ?? '',
          form.annexTitle,
          form.data.agriCommodities,
        ].some((value) => value.toLowerCase().includes(query))
      : true;
    return statusOk && annexOk && projectOk && abemisOk && queryOk;
  }

  private async resolveProject(reference: FormAttachmentInput) {
    if (reference.projectId) {
      const byId = await this.projectsRepo.findOne({ where: { id: reference.projectId } });
      if (byId) return byId;
    }
    if (reference.projectCode) {
      const byCode = await this.projectsRepo.findOne({ where: { projectCode: reference.projectCode } });
      if (byCode) return byCode;
    }
    if (reference.abemisId) {
      const byAbemis = await this.projectsRepo.findOne({ where: { abemisId: reference.abemisId } });
      if (byAbemis) return byAbemis;
    }
    if (reference.qrReference) {
      return this.projectsRepo.findOne({ where: { qrReference: reference.qrReference } });
    }
    return undefined;
  }

  private toProjectRecord(project: ProjectEntity, formsOverride?: FormRecord[]): ProjectRecord {
    const forms = formsOverride ?? (project.forms ?? []).map((form) => this.toFormRecord(form));
    return {
      id: project.id,
      projectCode: project.projectCode,
      title: project.title,
      operatingUnit: project.operatingUnit ?? undefined,
      bannerProgram: project.bannerProgram ?? undefined,
      yearFunded: project.yearFunded ?? undefined,
      projectType: project.projectType ?? undefined,
      region: project.region ?? undefined,
      province: project.province ?? undefined,
      district: project.district ?? undefined,
      municipality: project.municipality ?? undefined,
      barangay: project.barangay ?? undefined,
      stage: project.stage ?? undefined,
      status: project.status ?? undefined,
      author: project.author ?? undefined,
      quantity: project.quantity ?? undefined,
      quantityUnit: project.quantityUnit ?? undefined,
      allocatedAmount: project.allocatedAmount ?? undefined,
      beneficiary: project.beneficiary ?? undefined,
      prexcProgram: project.prexcProgram ?? undefined,
      subProgram: project.subProgram ?? undefined,
      indicatorLevel1: project.indicatorLevel1 ?? undefined,
      indicatorLevel3: project.indicatorLevel3 ?? undefined,
      recipientType: project.recipientType ?? undefined,
      budgetProcess: project.budgetProcess ?? undefined,
      geotags: project.geotags ?? [],
      proposalDocuments: project.proposalDocuments ?? [],
      abemisId: project.abemisId ?? undefined,
      qrReference: project.qrReference ?? undefined,
      zone: project.zone ?? undefined,
      forms,
    };
  }

  private toFormRecord(form: FormRecordEntity): FormRecord {
    return {
      id: form.id,
      annexTitle: form.annexTitle,
      status: form.status as FormStatus,
      updatedAt: form.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      abemisId: form.abemisId ?? undefined,
      qrReference: form.qrReference ?? undefined,
      linkedProjectId: form.projectId ?? form.project?.id ?? undefined,
      data: form.data as ValidationForm,
    };
  }

  private applyFormFilters(project: ProjectRecord, filter: ProjectFilterOptions) {
    const query = filter.search?.trim().toLowerCase();
    return (project.forms ?? []).filter((form) => {
      const matchesStatus = filter.status ? form.status === filter.status : true;
      const matchesAnnex = filter.annexTitle ? form.annexTitle === filter.annexTitle : true;
      const matchesQuery = query
        ? [
            project.title,
            project.barangay,
            project.municipality,
            project.province,
            form.annexTitle,
            form.data.nameOfProject,
            form.data.agriCommodities,
          ]
            .filter(Boolean)
            .some((value) => (value ?? '').toLowerCase().includes(query))
        : true;
      return matchesStatus && matchesAnnex && matchesQuery;
    });
  }

  private toFlattenedForm(form: FormRecordEntity): FlattenedFormRecord {
    return {
      ...this.toFormRecord(form),
      projectName: form.project?.title ?? form.data.nameOfProject,
      district: form.project?.district ?? form.data.district,
      locationBarangay: form.project?.barangay ?? form.data.locationBarangay,
      locationMunicipality: form.project?.municipality ?? form.data.locationMunicipality,
      locationProvince: form.project?.province ?? form.data.locationProvince,
      zone: form.project?.zone ?? undefined,
    };
  }
}
