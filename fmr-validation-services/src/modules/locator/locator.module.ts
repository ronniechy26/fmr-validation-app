import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { LocatorController } from './locator.controller';
import { LocatorService } from './locator.service';

@Module({
  imports: [SharedModule],
  controllers: [LocatorController],
  providers: [LocatorService],
})
export class LocatorModule {}
