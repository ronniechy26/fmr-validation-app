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
import { logger } from '@/lib/logger';
import { getLastSyncTimestamp, setLastSyncTimestamp } from '@/storage/offline-store';

type OfflineDataContextValue = {
  loading: boolean;
  projects: ProjectRecord[];
  standaloneDrafts: FormRecord[];
  lastSyncedAt: number | null;
  refresh: (options?: { silent?: boolean; force?: boolean }) => Promise<OfflineSnapshot | null>;
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
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  useEffect(() => {
    getLastSyncTimestamp().then((timestamp) => setLastSyncedAt(timestamp)).catch(() => setLastSyncedAt(null));
  }, []);

  const refresh = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      const showSpinner = !options?.silent;
      if (showSpinner) {
        setLoading(true);
      }
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const withinStaleWindow = lastSyncedAt && now - lastSyncedAt < ONE_DAY_MS;

      try {
        if (token && (options?.force || !withinStaleWindow)) {
          const remoteSnapshot = await fetchSnapshotFromServer();
          logger.info('offline', 'refresh:remote-success', {
            projects: remoteSnapshot.projects.length,
            drafts: remoteSnapshot.standaloneDrafts.length,
          });
          const normalized = await replaceSnapshot(remoteSnapshot);
          await setLastSyncTimestamp(now);
          setLastSyncedAt(now);
          setSnapshot(normalized);
          if (showSpinner) {
            setLoading(false);
          }
          return normalized;
        }
      } catch (error) {
        logger.warn('offline', 'refresh:remote-fallback', { error: String(error) });
      }

      const cached = await loadSnapshot();
      logger.info('offline', 'refresh:cache', {
        projects: cached.projects.length,
        drafts: cached.standaloneDrafts.length,
      });
      setSnapshot(cached);
      if (showSpinner) {
        setLoading(false);
      }
      return cached;
    },
    [token, lastSyncedAt],
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
          logger.info('offline', 'attach:remote-success', { formId, payload });
          const updated = findFormById(refreshed ?? snapshot, formId);
          return { record: updated, synced: true };
        } catch (error) {
          if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
            return { record: undefined, synced: false, error: error.message };
          }
          logger.warn('offline', 'attach:remote-fallback', { formId, error: String(error) });
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
      logger.info('offline', 'attach:local', { formId, payload });
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
          logger.info('offline', 'saveDraft:remote-success', { formId: result.record.id });
          synced = true;
          refresh({ silent: true }).catch((error) =>
            logger.warn('offline', 'saveDraft:refresh-failed', { error: String(error) }),
          );
        } catch (error) {
          logger.warn('offline', 'saveDraft:remote-failed', { formId: result.record.id, error: String(error) });
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
          logger.info('offline', 'delete:remote-success', { formId });
          return true;
        } catch (error) {
          logger.warn('offline', 'delete:remote-fallback', { formId, error: String(error) });
        }
      }
      const result = await deleteStandaloneDraft(formId);
      if (!result) return false;
      setSnapshot(result.snapshot);
      logger.info('offline', 'delete:local', { formId });
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
      logger.info('offline', 'syncDrafts:noop', { reason: 'no_snapshot' });
      return { ok: true };
    }
    if (!token) {
      await refresh({ silent: true });
      logger.warn('offline', 'syncDrafts:skipped', { reason: 'no_token' });
      return { ok: false, message: 'Sign in to sync drafts with the server.' };
    }
    const drafts = snapshot.standaloneDrafts ?? [];
    if (!drafts.length) {
      await refresh({ silent: true });
      logger.info('offline', 'syncDrafts:noop', { reason: 'no_drafts' });
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
        logger.warn('offline', 'syncDrafts:refresh-failed', { error: String(error) }),
      );
      logger.info('offline', 'syncDrafts:remote-success', { count: drafts.length });
      return { ok: true };
    } catch (error) {
      logger.error('offline', 'syncDrafts:remote-failed', { error: String(error) });
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
      lastSyncedAt,
      attachDraft,
      syncDrafts,
      deleteDraft,
      saveDraft,
      findProjectByCode,
    }),
    [loading, snapshot, lastSyncedAt, refresh, attachDraft, syncDrafts, deleteDraft, saveDraft, findProjectByCode],
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
