import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
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
export class SyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncService.name);
  private readonly refreshIntervalMs: number;
  private readonly syncEnabled: boolean;

  constructor(
    private readonly repository: FmrRepository,
    private readonly abemisService: AbemisService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly config: ConfigService,
  ) {
    this.refreshIntervalMs = Number(
      this.config.get<number>('ABEMIS_SYNC_INTERVAL_MS', 15 * 60 * 1000),
    );
    this.syncEnabled =
      this.config.get<string>('ABEMIS_SEED_MODE', 'abemis') !== 'seed';
  }

  onModuleInit() {
    if (
      !this.syncEnabled ||
      !this.refreshIntervalMs ||
      this.refreshIntervalMs < 1000
    ) {
      this.logger.log('ABEMIS scheduled sync disabled');
      return;
    }
    const interval = setInterval(
      () =>
        this.refreshFromAbemis('interval').catch((error) => {
          const message =
            error instanceof Error ? error.message : JSON.stringify(error);
          this.logger.warn(`Scheduled ABEMIS refresh failed: ${message}`);
        }),
      this.refreshIntervalMs,
    );
    this.schedulerRegistry.addInterval('abemis-refresh', interval);
    this.logger.log(
      `ABEMIS scheduled sync initialized (every ${Math.round(
        this.refreshIntervalMs / 1000,
      )}s)`,
    );
  }

  onModuleDestroy() {
    try {
      this.schedulerRegistry.deleteInterval('abemis-refresh');
    } catch {
      // ignore missing interval
    }
  }

  async getSnapshot() {
    await this.refreshFromAbemis('snapshot');
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

  private async refreshFromAbemis(reason: string) {
    if (!this.syncEnabled) {
      return;
    }
    try {
      const projects = await this.abemisService.fetchProjectsFromAbemis();
      await this.repository.saveProjectsFromUpstream(projects);
      this.logger.log(
        `ABEMIS refresh (${reason}) synced ${projects.length} projects`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.warn(
        `Unable to refresh from ABEMIS (${reason}), serving cached snapshot instead: ${message}`,
      );
    }
  }
}
