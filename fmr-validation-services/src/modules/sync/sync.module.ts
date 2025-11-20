import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [SharedModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
