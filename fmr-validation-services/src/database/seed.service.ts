import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './entities/project.entity';
import { FormRecordEntity } from './entities/form-record.entity';
import { seedProjects, standaloneDrafts } from '../data/projects.seed';
import { AbemisService } from '../shared/abemis.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectsRepo: Repository<ProjectEntity>,
    @InjectRepository(FormRecordEntity)
    private readonly formsRepo: Repository<FormRecordEntity>,
    private readonly abemisService: AbemisService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const resetRequested =
      this.config.get<string>('ABEMIS_SEED_RESET', 'false').toLowerCase() ===
      'true';
    if (resetRequested) {
      await this.formsRepo.delete({});
      await this.projectsRepo.delete({});
    }

    const projectCount = await this.projectsRepo.count();
    if (projectCount > 0) {
      return;
    }

    const preferAbemis =
      this.config.get<string>('ABEMIS_SEED_MODE', 'abemis') !== 'seed';

    if (preferAbemis) {
      try {
        const projects = await this.abemisService.fetchProjectsFromAbemis();
        for (const project of projects) {
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
            forms: [],
          });
          await this.projectsRepo.save(entity);
        }
        const seededCount = await this.projectsRepo.count();
        if (seededCount > 0) {
          this.logger.log(`Seeded ${seededCount} projects from ABEMIS`);
          return;
        }
      } catch (error: unknown) {
        let message = 'Unknown error';
        if (error instanceof Error) message = error.message;
        else if (typeof error === 'string') message = error;
        this.logger.warn(
          `ABEMIS seed failed, falling back to static seeds: ${message}`,
        );
      }
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
        latitude: project.latitude ?? null,
        longitude: project.longitude ?? null,
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
