import { Injectable } from '@nestjs/common';
import { FmrRepository } from '../../shared/fmr.repository';

@Injectable()
export class LocatorService {
  constructor(private readonly repository: FmrRepository) {}

  async getHighlights(zone?: string) {
    const normalizedZone = zone?.trim().toLowerCase() || undefined;
    const forms = await this.repository.getAllForms();
    const items = forms
      .filter((form) => (normalizedZone ? (form.zone ?? '').toLowerCase() === normalizedZone : true))
      .map((form) => ({
        id: form.id,
        projectId: form.linkedProjectId,
        projectName: form.projectName ?? form.data.nameOfProject,
        barangay: form.locationBarangay ?? form.data.locationBarangay,
        municipality: form.locationMunicipality ?? form.data.locationMunicipality,
        status: form.status,
        updatedAt: form.updatedAt,
        zone: form.zone ?? 'Unassigned',
      }));

    return {
      zone: normalizedZone ?? 'All',
      count: items.length,
      items,
    };
  }
}
