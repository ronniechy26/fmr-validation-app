import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../database/entities/project.entity';
import { FormRecordEntity } from '../database/entities/form-record.entity';
import { FmrRepository } from './fmr.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity, FormRecordEntity])],
  providers: [FmrRepository],
  exports: [FmrRepository],
})
export class SharedModule {}
