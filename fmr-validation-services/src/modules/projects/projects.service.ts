import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectFilterOptions, FmrRepository } from '../../shared/fmr.repository';

@Injectable()
export class ProjectsService {
  constructor(private readonly repository: FmrRepository) {}

  findAll(filter: ProjectFilterOptions = {}) {
    return this.repository.getProjects(filter);
  }

  async findOne(id: string) {
    const project = await this.repository.getProjectById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }
}
