import { FormRecord, ProjectRecord } from '@/types/forms';

export type OfflineSnapshot = {
  projects: ProjectRecord[];
  standaloneDrafts: FormRecord[];
};
