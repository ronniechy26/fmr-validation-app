import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './entities/project.entity';
import { FormRecordEntity } from './entities/form-record.entity';
import { SeedService } from './seed.service';
import { Init1700000000000 } from './migrations/1700000000000-init';
import { AddLatLong1700000000001 } from './migrations/1700000000001-add-lat-long';
import { AbemisService } from '../shared/abemis.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [ProjectEntity, FormRecordEntity],
        synchronize: false,
        migrationsRun: true,
        migrations: [Init1700000000000, AddLatLong1700000000001],
      }),
    }),
    TypeOrmModule.forFeature([ProjectEntity, FormRecordEntity]),
  ],
  providers: [SeedService, AbemisService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
