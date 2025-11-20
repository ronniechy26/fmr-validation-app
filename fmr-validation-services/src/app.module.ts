import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  providers: [AppService],
})
export class AppModule {}
