import { Injectable } from '@nestjs/common';
import { FormRecord } from '../../common/types/forms';
import { FmrRepository } from '../../shared/fmr.repository';

export interface UpsertFormDto {
  id?: string;
  annexTitle: string;
  status: FormRecord['status'];
  linkedProjectId?: string;
  abemisId?: string;
  qrReference?: string;
  data: FormRecord['data'];
}

@Injectable()
export class SyncService {
  constructor(private readonly repository: FmrRepository) {}

  getSnapshot() {
    return this.repository.getSnapshot();
  }

  async upsertForms(forms: UpsertFormDto[]) {
    return Promise.all(
      forms.map((form) =>
        this.repository.upsertFormFromClient({
          id: form.id ?? `client-${Date.now()}`,
          annexTitle: form.annexTitle,
          status: form.status,
          updatedAt: new Date().toISOString(),
          linkedProjectId: form.linkedProjectId,
          abemisId: form.abemisId,
          qrReference: form.qrReference,
          data: form.data,
        }),
      ),
    );
  }
}
