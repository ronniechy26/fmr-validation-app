import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { FormStatus } from '../../common/types/forms';
import type { AttachFormInput, CreateFormInput, FormFilterOptions, UpdateFormInput } from '../../shared/fmr.repository';
import { FormsService } from './forms.service';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  list(@Query() query: Record<string, string | undefined>) {
    const filter: FormFilterOptions = {
      status: (query.status as FormStatus) || undefined,
      search: query.search,
      annexTitle: query.annexTitle,
      projectId: query.projectId,
      abemisId: query.abemisId,
    };
    return this.formsService.findAll(filter);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateFormInput) {
    return this.formsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateFormInput) {
    return this.formsService.update(id, body);
  }

  @Patch(':id/attach')
  attach(@Param('id') id: string, @Body() body: AttachFormInput) {
    return this.formsService.attach(id, body);
  }
}
