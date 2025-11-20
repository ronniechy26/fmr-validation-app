import { Module } from '@nestjs/common';
import { AnnexesController } from './annexes.controller';
import { AnnexesService } from './annexes.service';

@Module({
  controllers: [AnnexesController],
  providers: [AnnexesService],
})
export class AnnexesModule {}
