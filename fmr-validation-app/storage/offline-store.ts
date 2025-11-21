import { SQLiteStorage } from 'expo-sqlite/kv-store';
import { AttachmentPayload, FormRecord, ProjectRecord, ValidationForm } from '@/types/forms';
import { OfflineSnapshot } from '@/types/offline';
import { FormStatus } from '@/types/theme';

const SNAPSHOT_KEY = 'snapshot';
const PROJECTS_KEY = 'projects';
const FORMS_KEY = 'forms';
const storage = new SQLiteStorage('fmr-offline');
const LAST_SYNC_KEY = 'last-sync-at';
const LAST_PROJECTS_SYNC_KEY = 'last-projects-sync-at';
const LAST_FORMS_SYNC_KEY = 'last-forms-sync-at';

const cloneForm = (form: FormRecord): FormRecord => ({
  ...form,
  lastTouch: form.lastTouch,
  data: { ...form.data },
});

type LegacyProjectRecord = ProjectRecord & {
  name?: string;
  locationBarangay?: string;
  locationMunicipality?: string;
  locationProvince?: string;
};

const cloneProject = (project: ProjectRecord): ProjectRecord => {
  const legacy = project as LegacyProjectRecord;
  const normalizedTitle = project.title ?? legacy.name ?? 'Untitled FMR';
  const normalizedBarangay = project.barangay ?? legacy.locationBarangay;
  const normalizedMunicipality = project.municipality ?? legacy.locationMunicipality;
  const normalizedProvince = project.province ?? legacy.locationProvince;
  return {
    ...project,
    title: normalizedTitle,
    barangay: normalizedBarangay,
    municipality: normalizedMunicipality,
    province: normalizedProvince,
    geotags: project.geotags?.map((tag) => ({ ...tag })) ?? [],
    proposalDocuments: project.proposalDocuments?.map((doc) => ({ ...doc })) ?? [],
    forms: project.forms?.map(cloneForm) ?? [],
  };
};

const normalizeSnapshot = (snapshot: OfflineSnapshot): OfflineSnapshot => ({
  projects: snapshot.projects.map(cloneProject),
  standaloneDrafts: snapshot.standaloneDrafts.map(cloneForm),
});

async function readSnapshot(): Promise<OfflineSnapshot> {
  let raw = await storage.getItemAsync(SNAPSHOT_KEY);
  if (!raw) {
    const emptySnapshot: OfflineSnapshot = { projects: [], standaloneDrafts: [] };
    await storage.setItemAsync(SNAPSHOT_KEY, JSON.stringify(emptySnapshot));
    return emptySnapshot;
  }
  return JSON.parse(raw) as OfflineSnapshot;
}

async function writeSnapshot(snapshot: OfflineSnapshot) {
  await storage.setItemAsync(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export async function loadSnapshot(): Promise<OfflineSnapshot> {
  const snapshot = await readSnapshot();
  return normalizeSnapshot(snapshot);
}

export async function replaceSnapshot(snapshot: OfflineSnapshot): Promise<OfflineSnapshot> {
  await writeSnapshot(snapshot);
  return normalizeSnapshot(snapshot);
}

export async function getLastSyncTimestamp(): Promise<number | null> {
  const value = await storage.getItemAsync(LAST_SYNC_KEY);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function setLastSyncTimestamp(timestamp: number) {
  await storage.setItemAsync(LAST_SYNC_KEY, `${timestamp}`);
}

export async function getLastProjectsSyncTimestamp(): Promise<number | null> {
  const value = await storage.getItemAsync(LAST_PROJECTS_SYNC_KEY);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function setLastProjectsSyncTimestamp(timestamp: number) {
  await storage.setItemAsync(LAST_PROJECTS_SYNC_KEY, `${timestamp}`);
}

export async function getLastFormsSyncTimestamp(): Promise<number | null> {
  const value = await storage.getItemAsync(LAST_FORMS_SYNC_KEY);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function setLastFormsSyncTimestamp(timestamp: number) {
  await storage.setItemAsync(LAST_FORMS_SYNC_KEY, `${timestamp}`);
}


export async function deleteStandaloneDraft(formId: string) {
  const snapshot = await readSnapshot();

  // Try to delete from standalone drafts first
  const draftIndex = snapshot.standaloneDrafts.findIndex((draft) => draft.id === formId);
  if (draftIndex !== -1) {
    snapshot.standaloneDrafts.splice(draftIndex, 1);
    await writeSnapshot(snapshot);
    return { snapshot: normalizeSnapshot(snapshot) };
  }

  // If not found in standalone drafts, try to delete from project forms
  let found = false;
  snapshot.projects = snapshot.projects.map((project) => {
    const formIndex = project.forms.findIndex((form) => form.id === formId);
    if (formIndex !== -1) {
      found = true;
      const updatedForms = [...project.forms];
      updatedForms.splice(formIndex, 1);
      return { ...project, forms: updatedForms };
    }
    return project;
  });

  if (found) {
    await writeSnapshot(snapshot);
    return { snapshot: normalizeSnapshot(snapshot) };
  }

  // Form not found
  return undefined;
}

export async function attachDraftLocally(formId: string, payload: AttachmentPayload) {
  const snapshot = await readSnapshot();
  const draftIndex = snapshot.standaloneDrafts.findIndex((draft) => draft.id === formId);
  if (draftIndex === -1) {
    return undefined;
  }
  const draft = snapshot.standaloneDrafts[draftIndex];
  const project = findProjectByAttachment(snapshot.projects, payload);
  if (!project) {
    return undefined;
  }

  const attachedRecord: FormRecord = {
    ...draft,
    linkedProjectId: project.id,
    abemisId: payload.abemisId ?? project.abemisId,
    qrReference: payload.qrReference ?? draft.qrReference ?? project.qrReference,
    updatedAt: new Date().toISOString(),
    lastTouch: new Date().toISOString(),
    data: {
      ...draft.data,
      lastTouch: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  snapshot.standaloneDrafts.splice(draftIndex, 1);
  const projectIndex = snapshot.projects.findIndex((candidate) => candidate.id === project.id);
  if (projectIndex !== -1) {
    const filtered = snapshot.projects[projectIndex].forms.filter((form) => form.id !== formId);
    snapshot.projects[projectIndex] = { ...snapshot.projects[projectIndex], forms: [attachedRecord, ...filtered] };
  }

  await writeSnapshot(snapshot);
  return { snapshot: normalizeSnapshot(snapshot), attached: cloneForm(attachedRecord) };
}

export async function upsertFormRecord(
  form: ValidationForm,
  options: { annexTitle?: string; status?: FormStatus; linkedProjectId?: string } = {},
) {
  const snapshot = await readSnapshot();
  const formId = form.id || `draft-${Date.now()}`;
  const status = options.status ?? form.status ?? 'Draft';
  const timestamp = new Date().toISOString();
  const record: FormRecord = {
    id: formId,
    annexTitle: options.annexTitle ?? 'Annex C – Validation Form',
    status,
    updatedAt: timestamp,
    lastTouch: timestamp,
    linkedProjectId: options.linkedProjectId,
    abemisId: form.id && form.id.startsWith('ABEMIS') ? form.id : undefined,
    qrReference: undefined,
    data: {
      ...form,
      id: formId,
      status,
      updatedAt: timestamp,
      lastTouch: timestamp,
    },
  };

  let handled = false;
  snapshot.projects = snapshot.projects.map((project) => {
    if (project.id === record.linkedProjectId) {
      const filtered = project.forms.filter((entry) => entry.id !== record.id);
      handled = true;
      return { ...project, forms: [record, ...filtered] };
    }
    return project;
  });

  if (!handled) {
    const draftIndex = snapshot.standaloneDrafts.findIndex((entry) => entry.id === record.id);
    if (draftIndex !== -1) {
      snapshot.standaloneDrafts[draftIndex] = record;
    } else {
      snapshot.standaloneDrafts.unshift(record);
    }
  }

  await writeSnapshot(snapshot);
  return { snapshot: normalizeSnapshot(snapshot), record: cloneForm(record) };
}

export function findProjectByAttachment(projects: ProjectRecord[], payload: AttachmentPayload) {
  const candidates = [payload.projectId, payload.abemisId, payload.projectCode, payload.qrReference]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));
  if (!candidates.length) {
    return undefined;
  }
  return projects.find((project) => {
    const projectRefs = [project.abemisId, project.projectCode, project.qrReference, project.id]
      .map((value) => value?.toLowerCase())
      .filter((value): value is string => Boolean(value));
    return candidates.some((needle) => projectRefs.includes(needle));
  });
}
