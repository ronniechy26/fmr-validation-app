import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AttachFormInput,
  CreateFormInput,
  FormFilterOptions,
  FmrRepository,
  UpdateFormInput,
} from '../../shared/fmr.repository';

@Injectable()
export class FormsService {
  constructor(private readonly repository: FmrRepository) {}

  findAll(filter: FormFilterOptions = {}) {
    return this.repository.searchForms(filter);
  }

  async findOne(id: string) {
    const form = await this.repository.findFormById(id);
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }

  create(payload: CreateFormInput) {
    return this.repository.createForm(payload);
  }

  async update(formId: string, payload: UpdateFormInput) {
    const form = await this.repository.updateForm(formId, payload);
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }

  async attach(formId: string, payload: AttachFormInput) {
    const form = await this.repository.attachForm(formId, payload);
    if (!form) {
      throw new NotFoundException('Form or project not found');
    }
    return form;
  }
}
