import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AttachmentPayload, FormRecord, FormRoutePayload, ProjectRecord, ValidationForm } from '@/types/forms';
import {
  OfflineSnapshot,
  attachDraftLocally,
  findProjectByAttachment,
  loadSnapshot,
  replaceSnapshot,
  upsertFormRecord,
} from '@/storage/offline-store';
import { fetchSnapshotFromServer } from '@/lib/api';
import { FormStatus } from '@/theme';

type OfflineDataContextValue = {
  loading: boolean;
  projects: ProjectRecord[];
  standaloneDrafts: FormRecord[];
  refresh: () => Promise<void>;
  attachDraft: (formId: string, payload: AttachmentPayload) => Promise<FormRecord | undefined>;
  saveDraft: (form: ValidationForm, options?: { annexTitle?: string; status?: FormStatus; linkedProjectId?: string }) => Promise<void>;
  findProjectByCode: (code: string) => ProjectRecord | undefined;
};

const OfflineDataContext = createContext<OfflineDataContextValue | null>(null);

export function OfflineDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<OfflineSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const remoteSnapshot = await fetchSnapshotFromServer();
      const normalized = await replaceSnapshot(remoteSnapshot);
      setSnapshot(normalized);
    } catch (error) {
      console.warn('[OfflineDataProvider] Falling back to cached snapshot:', error);
      const cached = await loadSnapshot();
      setSnapshot(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const attachDraft = async (formId: string, payload: AttachmentPayload) => {
    const result = await attachDraftLocally(formId, payload);
    if (!result) return undefined;
    setSnapshot(result.snapshot);
    return result.attached;
  };

  const saveDraft = async (
    form: ValidationForm,
    options?: { annexTitle?: string; status?: FormStatus; linkedProjectId?: string },
  ) => {
    const result = await upsertFormRecord(form, {
      annexTitle: options?.annexTitle,
      status: options?.status,
      linkedProjectId: options?.linkedProjectId,
    });
    setSnapshot(result.snapshot);
  };

  const findProjectByCode = (code: string) => {
    if (!snapshot) return undefined;
    return findProjectByAttachment(snapshot.projects, {
      projectCode: code,
      abemisId: code,
      qrReference: code,
    });
  };

  const value = useMemo<OfflineDataContextValue>(() => ({
    loading,
    projects: snapshot?.projects ?? [],
    standaloneDrafts: snapshot?.standaloneDrafts ?? [],
    refresh,
    attachDraft,
    saveDraft,
    findProjectByCode,
  }), [loading, snapshot]);

  return <OfflineDataContext.Provider value={value}>{children}</OfflineDataContext.Provider>;
}

export function useOfflineData() {
  const ctx = useContext(OfflineDataContext);
  if (!ctx) {
    throw new Error('useOfflineData must be used within OfflineDataProvider');
  }
  return ctx;
}
