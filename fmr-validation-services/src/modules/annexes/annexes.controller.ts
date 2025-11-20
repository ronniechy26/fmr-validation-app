import { Controller, Get } from '@nestjs/common';
import { AnnexesService } from './annexes.service';

@Controller('annexes')
export class AnnexesController {
  constructor(private readonly annexesService: AnnexesService) {}

  @Get()
  list() {
    return this.annexesService.list();
  }
}
