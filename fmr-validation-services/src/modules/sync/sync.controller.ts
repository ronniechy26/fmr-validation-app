import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SyncService, UpsertFormDto } from './sync.service';
import { Public } from '../auth/jwt-auth.guard';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) { }

  @Public()
  @Get('snapshot')
  snapshot() {
    return this.syncService.getSnapshot();
  }

  @Get('projects')
  async projects() {
    const snapshot = await this.syncService.getSnapshot();
    return { projects: snapshot.projects };
  }

  @Get('forms')
  async forms(@Query('since') since?: string) {
    const sinceTimestamp = since ? parseInt(since, 10) : undefined;
    return this.syncService.getIncrementalForms(sinceTimestamp);
  }

  @Post('forms')
  upsert(@Body() body: { forms: UpsertFormDto[] }) {
    return this.syncService.upsertForms(body.forms ?? []);
  }
}
