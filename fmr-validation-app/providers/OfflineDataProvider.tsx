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
  getLastProjectsSyncTimestamp,
  getLastFormsSyncTimestamp,
  setLastProjectsSyncTimestamp,
  setLastFormsSyncTimestamp,
} from '@/storage/offline-store';
import {
  attachFormWithPayload,
  deleteForm,
  fetchSnapshotFromServer,
  fetchFormsFromServer,
  HttpError,
  syncFormsFromClient
} from '@/lib/api';
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

function mergeFormsIntoSnapshot(snapshot: OfflineSnapshot, updatedForms: FormRecord[]): OfflineSnapshot {
  const formsMap = new Map(updatedForms.map(form => [form.id, form]));

  const updatedProjects = snapshot.projects.map(project => {
    const updatedProjectForms = project.forms.map(form =>
      formsMap.has(form.id) ? formsMap.get(form.id)! : form
    );
    return { ...project, forms: updatedProjectForms };
  });

  const updatedDrafts = snapshot.standaloneDrafts.map(draft =>
    formsMap.has(draft.id) ? formsMap.get(draft.id)! : draft
  );

  return {
    projects: updatedProjects,
    standaloneDrafts: updatedDrafts,
  };
}

const OfflineDataContext = createContext<OfflineDataContextValue | null>(null);

export function OfflineDataProvider({ children, ready = true }: { children: ReactNode; ready?: boolean }) {
  const { token } = useAuth();
  const [snapshot, setSnapshot] = useState<OfflineSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(ready));
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  useEffect(() => {
    getLastSyncTimestamp().then((timestamp) => setLastSyncedAt(timestamp)).catch(() => setLastSyncedAt(null));
  }, []);

  // Import and use background sync
  const handleSyncComplete = useCallback(() => {
    refresh({ silent: true, formsOnly: true }).catch((error) =>
      logger.warn('offline', 'background-sync:refresh-failed', { error: String(error) }),
    );
  }, []);

  // Enable background sync when authenticated
  useEffect(() => {
    if (!token || !ready) return;

    let mounted = true;

    const setupBackgroundSync = async () => {
      const { useBackgroundSync } = await import('@/hooks/useBackgroundSync');
      if (mounted) {
        // Hook will be called in the component that uses this provider
      }
    };

    setupBackgroundSync();

    return () => {
      mounted = false;
    };
  }, [token, ready]);

  const refresh = useCallback(
    async (options?: { silent?: boolean; force?: boolean; projectsOnly?: boolean; formsOnly?: boolean }) => {
      const showSpinner = !options?.silent;
      if (showSpinner) {
        setLoading(true);
      }
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const lastProjectsSync = await getLastProjectsSyncTimestamp();
      const lastFormsSync = await getLastFormsSyncTimestamp();

      const projectsStale = !lastProjectsSync || now - lastProjectsSync >= ONE_DAY_MS;
      const shouldSyncProjects = options?.force || options?.projectsOnly || projectsStale;
      const shouldSyncForms = options?.force || options?.formsOnly || !options?.projectsOnly;

      try {
        if (token) {
          let remoteSnapshot: OfflineSnapshot | null = null;

          // Sync projects (daily)
          if (shouldSyncProjects) {
            logger.info('offline', 'refresh:projects-sync', { reason: options?.force ? 'forced' : 'scheduled' });
            remoteSnapshot = await fetchSnapshotFromServer();
            await setLastProjectsSyncTimestamp(now);
          }

          // Sync forms (seamless)
          if (shouldSyncForms && !remoteSnapshot) {
            logger.info('offline', 'refresh:forms-sync', { since: lastFormsSync });
            const formsResponse = await fetchFormsFromServer(lastFormsSync || undefined);

            if (formsResponse.forms.length > 0) {
              const cached = await loadSnapshot();
              // Merge updated forms into existing snapshot
              const updatedSnapshot = mergeFormsIntoSnapshot(cached, formsResponse.forms);
              remoteSnapshot = await replaceSnapshot(updatedSnapshot);
              await setLastFormsSyncTimestamp(now);
            }
          }

          if (remoteSnapshot) {
            logger.info('offline', 'refresh:remote-success', {
              projects: remoteSnapshot.projects.length,
              drafts: remoteSnapshot.standaloneDrafts.length,
            });
            await setLastSyncTimestamp(now);
            setLastSyncedAt(now);
            setSnapshot(remoteSnapshot);
            if (showSpinner) {
              setLoading(false);
            }
            return remoteSnapshot;
          }
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
          const refreshed = await refresh({ silent: true, formsOnly: true });
          logger.info('offline', 'attach:remote-success', { formId, payload });
          const updated = findFormById(refreshed ?? snapshot, formId);
          return { record: updated, synced: true };
        } catch (error) {
          if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
            return { record: undefined, synced: false, error: error.message };
          }
          logger.warn('offline', 'attach:remote-fallback', { formId, error: String(error) });
          // Add to sync queue
          const { addToSyncQueue } = await import('@/storage/sync-queue');
          await addToSyncQueue('attach', formId, payload);
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

      // Add to sync queue when offline
      if (!token) {
        const { addToSyncQueue } = await import('@/storage/sync-queue');
        await addToSyncQueue('attach', formId, payload);
      }

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
          // Seamless background refresh for forms only
          refresh({ silent: true, formsOnly: true }).catch((error) =>
            logger.warn('offline', 'saveDraft:refresh-failed', { error: String(error) }),
          );
        } catch (error) {
          logger.warn('offline', 'saveDraft:remote-failed', { formId: result.record.id, error: String(error) });
          // Add to sync queue for later
          const { addToSyncQueue } = await import('@/storage/sync-queue');
          await addToSyncQueue('update', result.record.id, {
            id: result.record.id,
            annexTitle: result.record.annexTitle,
            status: result.record.status,
            linkedProjectId: result.record.linkedProjectId,
            abemisId: result.record.abemisId,
            qrReference: result.record.qrReference,
            data: result.record.data,
          });
        }
      } else {
        // Offline - add to queue
        const { addToSyncQueue } = await import('@/storage/sync-queue');
        await addToSyncQueue('update', result.record.id, {
          id: result.record.id,
          annexTitle: result.record.annexTitle,
          status: result.record.status,
          linkedProjectId: result.record.linkedProjectId,
          abemisId: result.record.abemisId,
          qrReference: result.record.qrReference,
          data: result.record.data,
        });
      }

      return { record: result.record, synced };
    },
    [token, refresh],
  );

  const deleteDraft = useCallback(
    async (formId: string) => {
      // Optimistic update: delete locally first for instant UI feedback
      const result = await deleteStandaloneDraft(formId);
      if (!result) return false;
      setSnapshot(result.snapshot);
      logger.info('offline', 'delete:local-optimistic', { formId });

      // Sync with server in background if online
      if (token) {
        try {
          await deleteForm(formId);
          logger.info('offline', 'delete:remote-success', { formId });
          // No need to refresh - we already updated local state optimistically
          return true;
        } catch (error) {
          logger.warn('offline', 'delete:remote-fallback', { formId, error: String(error) });
          // Add to sync queue for retry
          const { addToSyncQueue } = await import('@/storage/sync-queue');
          await addToSyncQueue('delete', formId, {});
        }
      } else {
        // Offline - add to sync queue
        const { addToSyncQueue } = await import('@/storage/sync-queue');
        await addToSyncQueue('delete', formId, {});
      }

      return true;
    },
    [token],
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
          lastTouch: draft.lastTouch,
          data: draft.data,
        })),
      );
      // Mark as synced locally for immediate UI feedback
      const syncedAt = new Date().toISOString();
      const syncedDrafts = drafts.map((draft) => ({
        ...draft,
        status: 'Synced' as FormStatus,
        updatedAt: syncedAt,
        lastTouch: syncedAt,
        data: { ...draft.data, status: 'Synced' as FormStatus, updatedAt: syncedAt },
      }));
      const snapshotWithSyncedDrafts: OfflineSnapshot = {
        projects: snapshot.projects,
        standaloneDrafts: syncedDrafts,
      };
      await replaceSnapshot(snapshotWithSyncedDrafts);
      setSnapshot(snapshotWithSyncedDrafts);
      await setLastSyncTimestamp(Date.now());

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
