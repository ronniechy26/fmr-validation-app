import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './entities/project.entity';
import { FormRecordEntity } from './entities/form-record.entity';
import { seedProjects, standaloneDrafts } from '../data/projects.seed';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(ProjectEntity) private readonly projectsRepo: Repository<ProjectEntity>,
    @InjectRepository(FormRecordEntity) private readonly formsRepo: Repository<FormRecordEntity>,
  ) {}

  async onModuleInit() {
    const projectCount = await this.projectsRepo.count();
    if (projectCount > 0) {
      return;
    }

    for (const project of seedProjects) {
      const entity = this.projectsRepo.create({
        id: project.id,
        projectCode: project.projectCode,
        title: project.title,
        operatingUnit: project.operatingUnit ?? null,
        bannerProgram: project.bannerProgram ?? null,
        yearFunded: project.yearFunded ?? null,
        projectType: project.projectType ?? null,
        region: project.region ?? null,
        province: project.province ?? null,
        district: project.district ?? null,
        municipality: project.municipality ?? null,
        barangay: project.barangay ?? null,
        stage: project.stage ?? null,
        status: project.status ?? null,
        author: project.author ?? null,
        quantity: project.quantity ?? null,
        quantityUnit: project.quantityUnit ?? null,
        allocatedAmount: project.allocatedAmount ?? null,
        beneficiary: project.beneficiary ?? null,
        prexcProgram: project.prexcProgram ?? null,
        subProgram: project.subProgram ?? null,
        indicatorLevel1: project.indicatorLevel1 ?? null,
        indicatorLevel3: project.indicatorLevel3 ?? null,
        recipientType: project.recipientType ?? null,
        budgetProcess: project.budgetProcess ?? null,
        geotags: project.geotags ?? [],
        proposalDocuments: project.proposalDocuments ?? [],
        abemisId: project.abemisId ?? null,
        qrReference: project.qrReference ?? null,
        zone: project.zone ?? null,
        forms: (project.forms ?? []).map((form) =>
          this.formsRepo.create({
            id: form.id,
            annexTitle: form.annexTitle,
            status: form.status,
            abemisId: form.abemisId,
            qrReference: form.qrReference,
            data: form.data,
          }),
        ),
      });
      await this.projectsRepo.save(entity);
    }

    for (const draft of standaloneDrafts) {
      await this.formsRepo.save(
        this.formsRepo.create({
          id: draft.id,
          annexTitle: draft.annexTitle,
          status: draft.status,
          abemisId: draft.abemisId,
          qrReference: draft.qrReference,
          data: draft.data,
        }),
      );
    }
  }
}
