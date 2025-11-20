import { Controller, Get, Query } from '@nestjs/common';
import { LocatorService } from './locator.service';

@Controller('locator')
export class LocatorController {
  constructor(private readonly locatorService: LocatorService) {}

  @Get('highlights')
  highlights(@Query('zone') zone?: string) {
    return this.locatorService.getHighlights(zone);
  }
}
