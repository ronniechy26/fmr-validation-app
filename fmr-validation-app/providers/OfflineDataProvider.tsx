import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AttachmentPayload, FormRecord, ProjectRecord, ValidationForm } from '@/types/forms';
import { OfflineSnapshot } from '@/types/offline';
import { attachDraftLocally, findProjectByAttachment, loadSnapshot, replaceSnapshot, upsertFormRecord } from '@/storage/offline-store';
import { attachFormWithPayload, fetchSnapshotFromServer, syncFormsFromClient } from '@/lib/api';
import { FormStatus } from '@/types/theme';
import { useAuth } from './AuthProvider';

type OfflineDataContextValue = {
  loading: boolean;
  projects: ProjectRecord[];
  standaloneDrafts: FormRecord[];
  refresh: (options?: { silent?: boolean }) => Promise<OfflineSnapshot | null>;
  attachDraft: (formId: string, payload: AttachmentPayload) => Promise<{ record?: FormRecord; synced: boolean }>;
  saveDraft: (
    form: ValidationForm,
    options?: { annexTitle?: string; status?: FormStatus; linkedProjectId?: string },
  ) => Promise<{ record: FormRecord; synced: boolean }>;
  findProjectByCode: (code: string) => ProjectRecord | undefined;
};

const OfflineDataContext = createContext<OfflineDataContextValue | null>(null);

export function OfflineDataProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [snapshot, setSnapshot] = useState<OfflineSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      const showSpinner = !options?.silent;
      if (showSpinner) {
        setLoading(true);
      }
      try {
        if (token) {
          const remoteSnapshot = await fetchSnapshotFromServer();
          const normalized = await replaceSnapshot(remoteSnapshot);
          setSnapshot(normalized);
          if (showSpinner) {
            setLoading(false);
          }
          return normalized;
        }
      } catch (error) {
        console.warn('[OfflineDataProvider] Falling back to cached snapshot:', error);
      }

      const cached = await loadSnapshot();
      setSnapshot(cached);
      if (showSpinner) {
        setLoading(false);
      }
      return cached;
    },
    [token],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const findFormById = useCallback(
    (source: OfflineSnapshot | null, formId: string) => {
      if (!source) return undefined;
      for (const project of source.projects) {
        const match = project.forms.find((form) => form.id === formId);
        if (match) return match;
      }
      return source.standaloneDrafts.find((draft) => draft.id === formId);
    },
    [],
  );

  const attachDraft = useCallback(
    async (formId: string, payload: AttachmentPayload) => {
      if (token) {
        try {
          await attachFormWithPayload(formId, payload);
          const refreshed = await refresh({ silent: true });
          const updated = findFormById(refreshed ?? snapshot, formId);
          return { record: updated, synced: true };
        } catch (error) {
          console.warn('[OfflineDataProvider] Remote attach failed, falling back to offline cache:', error);
        }
      }

      const result = await attachDraftLocally(formId, payload);
      if (!result) return { record: undefined, synced: false };
      setSnapshot(result.snapshot);
      return { record: result.attached, synced: false };
    },
    [token, refresh, findFormById, snapshot],
  );

  const saveDraft = useCallback(
    async (
      form: ValidationForm,
      options?: { annexTitle?: string; status?: FormStatus; linkedProjectId?: string },
    ) => {
      const result = await upsertFormRecord(form, {
        annexTitle: options?.annexTitle,
        status: options?.status,
        linkedProjectId: options?.linkedProjectId,
      });
      setSnapshot(result.snapshot);

      let synced = false;
      if (token) {
        try {
          await syncFormsFromClient([
            {
              id: result.record.id,
              annexTitle: result.record.annexTitle,
              status: result.record.status,
              linkedProjectId: result.record.linkedProjectId,
              abemisId: result.record.abemisId,
              qrReference: result.record.qrReference,
              data: result.record.data,
            },
          ]);
          await refresh({ silent: true });
          synced = true;
        } catch (error) {
          console.warn('[OfflineDataProvider] Failed to sync draft with server, keeping offline copy:', error);
        }
      }

      return { record: result.record, synced };
    },
    [token, refresh],
  );

  const findProjectByCode = (code: string) => {
    if (!snapshot) return undefined;
    return findProjectByAttachment(snapshot.projects, {
      projectId: code,
      projectCode: code,
      abemisId: code,
      qrReference: code,
    });
  };

  const value = useMemo<OfflineDataContextValue>(
    () => ({
      loading,
      projects: snapshot?.projects ?? [],
      standaloneDrafts: snapshot?.standaloneDrafts ?? [],
      refresh,
      attachDraft,
      saveDraft,
      findProjectByCode,
    }),
    [loading, snapshot, refresh, attachDraft, saveDraft],
  );

  return <OfflineDataContext.Provider value={value}>{children}</OfflineDataContext.Provider>;
}

export function useOfflineData() {
  const ctx = useContext(OfflineDataContext);
  if (!ctx) {
    throw new Error('useOfflineData must be used within OfflineDataProvider');
  }
  return ctx;
}
