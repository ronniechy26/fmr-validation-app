import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AttachmentPayload, AttachmentResult, FormRecord, ProjectRecord, ValidationForm } from '@/types/forms';
import { OfflineSnapshot } from '@/types/offline';
import {
  attachDraftLocally,
  deleteStandaloneDraft,
  findProjectByAttachment,
  loadSnapshot,
  replaceSnapshot,
  upsertFormRecord,
} from '@/storage/offline-store';
import { attachFormWithPayload, deleteForm, fetchSnapshotFromServer, HttpError, syncFormsFromClient } from '@/lib/api';
import { FormStatus } from '@/types/theme';
import { useAuth } from './AuthProvider';

type OfflineDataContextValue = {
  loading: boolean;
  projects: ProjectRecord[];
  standaloneDrafts: FormRecord[];
  refresh: (options?: { silent?: boolean }) => Promise<OfflineSnapshot | null>;
  attachDraft: (formId: string, payload: AttachmentPayload) => Promise<AttachmentResult>;
  syncDrafts: () => Promise<{ ok: boolean; message?: string }>;
  deleteDraft: (formId: string) => Promise<boolean>;
  saveDraft: (
    form: ValidationForm,
    options?: { annexTitle?: string; status?: FormStatus; linkedProjectId?: string },
  ) => Promise<{ record: FormRecord; synced: boolean }>;
  findProjectByCode: (code: string) => ProjectRecord | undefined;
};

const OfflineDataContext = createContext<OfflineDataContextValue | null>(null);

export function OfflineDataProvider({ children, ready = true }: { children: ReactNode; ready?: boolean }) {
  const { token } = useAuth();
  const [snapshot, setSnapshot] = useState<OfflineSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(ready));

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
    if (!ready) return;
    refresh();
  }, [ready, refresh]);

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
          if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
            return { record: undefined, synced: false, error: error.message };
          }
          console.warn('[OfflineDataProvider] Remote attach failed, falling back to offline cache:', error);
        }
      }

      const result = await attachDraftLocally(formId, payload);
      if (!result) {
        return {
          record: undefined,
          synced: false,
          error: 'No FMR project matches that ABEMIS ID or QR reference.',
        };
      }
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
          synced = true;
          refresh({ silent: true }).catch((error) =>
            console.warn('[OfflineDataProvider] Background refresh after save failed:', error),
          );
        } catch (error) {
          console.warn('[OfflineDataProvider] Failed to sync draft with server, keeping offline copy:', error);
        }
      }

      return { record: result.record, synced };
    },
    [token, refresh],
  );

  const deleteDraft = useCallback(
    async (formId: string) => {
      if (token) {
        try {
          await deleteForm(formId);
          await refresh({ silent: true });
          return true;
        } catch (error) {
          console.warn('[OfflineDataProvider] Remote delete failed, falling back to offline cache:', error);
        }
      }
      const result = await deleteStandaloneDraft(formId);
      if (!result) return false;
      setSnapshot(result.snapshot);
    return true;
  },
    [token, refresh],
  );

  const syncDrafts = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected || !state.isInternetReachable) {
      return { ok: false, message: 'You are offline. Connect to the internet to sync drafts.' };
    }

    if (!snapshot) {
      await refresh({ silent: true });
      return { ok: true };
    }
    if (!token) {
      await refresh({ silent: true });
      return { ok: false, message: 'Sign in to sync drafts with the server.' };
    }
    const drafts = snapshot.standaloneDrafts ?? [];
    if (!drafts.length) {
      await refresh({ silent: true });
      return { ok: true };
    }
    try {
      await syncFormsFromClient(
        drafts.map((draft) => ({
          id: draft.id,
          annexTitle: draft.annexTitle,
          status: draft.status,
          linkedProjectId: draft.linkedProjectId,
          abemisId: draft.abemisId,
          qrReference: draft.qrReference,
          data: draft.data,
        })),
      );
      refresh({ silent: true }).catch((error) =>
        console.warn('[OfflineDataProvider] Background refresh after sync failed:', error),
      );
      return { ok: true };
    } catch (error) {
      console.warn('[OfflineDataProvider] Failed to sync drafts with server:', error);
      return { ok: false, message: 'Unable to sync drafts right now. Please try again later.' };
    }
  }, [snapshot, token, refresh]);

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
      syncDrafts,
      deleteDraft,
      saveDraft,
      findProjectByCode,
    }),
    [loading, snapshot, refresh, attachDraft, syncDrafts, deleteDraft, saveDraft, findProjectByCode],
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
