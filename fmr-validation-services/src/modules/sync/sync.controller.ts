import { Body, Controller, Get, Post } from '@nestjs/common';
import { SyncService, UpsertFormDto } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('snapshot')
  snapshot() {
    return this.syncService.getSnapshot();
  }

  @Post('forms')
  upsert(@Body() body: { forms: UpsertFormDto[] }) {
    return this.syncService.upsertForms(body.forms ?? []);
  }
}
