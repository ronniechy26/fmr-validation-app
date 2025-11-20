import { Controller, Get, Param, Query } from '@nestjs/common';
import { FormStatus } from '../../common/types/forms';
import { ProjectFilterOptions } from '../../shared/fmr.repository';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@Query() query: Record<string, string | undefined>) {
    const filter: ProjectFilterOptions = {
      status: (query.status as FormStatus) || undefined,
      search: query.search,
      annexTitle: query.annexTitle,
    };
    return this.projectsService.findAll(filter);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }
}
