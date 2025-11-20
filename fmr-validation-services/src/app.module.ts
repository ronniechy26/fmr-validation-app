import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AnnexesModule } from './modules/annexes/annexes.module';
import { AuthModule } from './modules/auth/auth.module';
import { FormsModule } from './modules/forms/forms.module';
import { LocatorModule } from './modules/locator/locator.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SyncModule } from './modules/sync/sync.module';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    FormsModule,
    ProjectsModule,
    AnalyticsModule,
    AnnexesModule,
    LocatorModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
