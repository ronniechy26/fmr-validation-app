import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

function getLastTouchTimestamp(form?: FormRecord) {
  const raw = form?.lastTouch ?? form?.updatedAt;
  const ts = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(ts) ? ts : 0;
}

function mergeSnapshotsByLastTouch(base: OfflineSnapshot, incoming: OfflineSnapshot): OfflineSnapshot {
  const projectMap = new Map<string, ProjectRecord>();

  const seedProject = (project: ProjectRecord) => {
    const existing = projectMap.get(project.id);
    projectMap.set(project.id, { ...(existing ?? project), ...project, forms: [] });
  };

  base.projects.forEach(seedProject);
  incoming.projects.forEach(seedProject);

  const formMap = new Map<string, FormRecord>();
  const upsertForm = (form: FormRecord) => {
    const candidate: FormRecord = { ...form, data: { ...form.data } };
    const existing = formMap.get(candidate.id);
    if (!existing || getLastTouchTimestamp(candidate) >= getLastTouchTimestamp(existing)) {
      formMap.set(candidate.id, candidate);
    }
  };

  base.projects.forEach((project) => project.forms.forEach(upsertForm));
  base.standaloneDrafts.forEach(upsertForm);
  incoming.projects.forEach((project) => project.forms.forEach(upsertForm));
  incoming.standaloneDrafts.forEach(upsertForm);

  const ensureProject = (projectId: string): ProjectRecord => {
    const existing = projectMap.get(projectId);
    if (existing) return existing;
    const fallback: ProjectRecord = {
      id: projectId,
      projectCode: projectId,
      title: 'Untitled FMR',
      forms: [],
    };
    projectMap.set(projectId, fallback);
    return fallback;
  };

  const standaloneDrafts: FormRecord[] = [];

  formMap.forEach((form) => {
    if (form.linkedProjectId) {
      const targetProject = ensureProject(form.linkedProjectId);
      targetProject.forms.push(form);
    } else {
      standaloneDrafts.push(form);
    }
  });

  const projects = Array.from(projectMap.values()).map((project) => ({
    ...project,
    forms: (project.forms ?? [])
      .map((entry) => ({ ...entry, data: { ...entry.data } }))
      .sort((a, b) => getLastTouchTimestamp(b) - getLastTouchTimestamp(a)),
  }));

  standaloneDrafts.sort((a, b) => getLastTouchTimestamp(b) - getLastTouchTimestamp(a));

  return { projects, standaloneDrafts };
}

function mergeFormsIntoSnapshot(snapshot: OfflineSnapshot, updatedForms: FormRecord[]): OfflineSnapshot {
  const projectMap = new Map<string, ProjectRecord>();
  const standaloneDrafts: FormRecord[] = [];

  updatedForms.forEach((form) => {
    if (form.linkedProjectId) {
      if (!projectMap.has(form.linkedProjectId)) {
        projectMap.set(form.linkedProjectId, {
          id: form.linkedProjectId,
          projectCode: form.linkedProjectId,
          title: 'Untitled FMR',
          forms: [],
        });
      }
      projectMap.get(form.linkedProjectId)!.forms.push(form);
    } else {
      standaloneDrafts.push(form);
    }
  });

  const incomingSnapshot: OfflineSnapshot = {
    projects: Array.from(projectMap.values()),
    standaloneDrafts,
  };

  return mergeSnapshotsByLastTouch(snapshot, incomingSnapshot);
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

      let workingSnapshot = await loadSnapshot();

      try {
        if (token) {
          let remoteSnapshot: OfflineSnapshot | null = null;

          // Sync projects (daily)
          if (shouldSyncProjects) {
            logger.info('offline', 'refresh:projects-sync', { reason: options?.force ? 'forced' : 'scheduled' });
            remoteSnapshot = await fetchSnapshotFromServer();
            workingSnapshot = mergeSnapshotsByLastTouch(workingSnapshot, remoteSnapshot);
            workingSnapshot = await replaceSnapshot(workingSnapshot);
            await setLastProjectsSyncTimestamp(now);
          }

          // Sync forms (seamless)
          if (shouldSyncForms && !remoteSnapshot) {
            logger.info('offline', 'refresh:forms-sync', { since: lastFormsSync });
            const formsResponse = await fetchFormsFromServer(lastFormsSync || undefined);

            if (formsResponse.forms.length > 0) {
              workingSnapshot = mergeFormsIntoSnapshot(workingSnapshot, formsResponse.forms);
              workingSnapshot = await replaceSnapshot(workingSnapshot);
              await setLastFormsSyncTimestamp(now);
              remoteSnapshot = workingSnapshot;
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

      logger.info('offline', 'refresh:cache', {
        projects: workingSnapshot.projects.length,
        drafts: workingSnapshot.standaloneDrafts.length,
      });
      setSnapshot(workingSnapshot);
      if (showSpinner) {
        setLoading(false);
      }
      return workingSnapshot;
    },
    [token],
  );

  const initialLoadRef = useRef(false);

  useEffect(() => {
    // Load data once when user is authenticated
    if (!token || initialLoadRef.current) return;

    initialLoadRef.current = true;
    setLoading(true);

    // Load cached data immediately for instant UI feedback
    (async () => {
      try {
        // Always load cache first - this is fast and provides immediate data
        const cached = await loadSnapshot();
        logger.info('offline', 'cache-loaded-immediate', {
          projects: cached.projects.length,
          drafts: cached.standaloneDrafts.length
        });
        setSnapshot(cached);
        setLoading(false);

        // Then check if we need to sync in the background
        const lastSync = await getLastProjectsSyncTimestamp();
        const FIVE_MINUTES = 5 * 60 * 1000;
        const isFresh = lastSync && (Date.now() - lastSync) < FIVE_MINUTES;

        logger.info('offline', 'initial-load-check', {
          isFresh,
          lastSync,
          timeSinceSync: lastSync ? Date.now() - lastSync : null
        });

        if (!isFresh) {
          // Data is stale or missing, perform background sync
          logger.info('offline', 'background-sync-start', { reason: 'stale-data' });
          refresh({ silent: true, formsOnly: true });
        }
      } catch (error) {
        logger.error('offline', 'initial-load-error', { error: String(error) });
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
              lastTouch: result.record.lastTouch,
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
            lastTouch: result.record.lastTouch,
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
          lastTouch: result.record.lastTouch,
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

    const currentSnapshot = snapshot ?? (await loadSnapshot());

    if (!token) {
      await refresh({ silent: true });
      logger.warn('offline', 'syncDrafts:skipped', { reason: 'no_token' });
      return { ok: false, message: 'Sign in to sync drafts with the server.' };
    }
    const drafts = currentSnapshot.standaloneDrafts ?? [];
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
        data: { ...draft.data, status: 'Synced' as FormStatus, updatedAt: syncedAt, lastTouch: syncedAt },
      }));
      const snapshotWithSyncedDrafts = mergeFormsIntoSnapshot(currentSnapshot, syncedDrafts);
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
