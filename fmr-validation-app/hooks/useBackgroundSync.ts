import { useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { logger } from '@/lib/logger';
import {
  getSyncQueue,
  removeFromSyncQueue,
  incrementRetry,
  SyncOperation,
} from '@/storage/sync-queue';
import {
  syncFormsFromClient,
  attachFormWithPayload,
  deleteForm,
  fetchFormsFromServer,
} from '@/lib/api';
import {
  getLastFormsSyncTimestamp,
  setLastFormsSyncTimestamp,
} from '@/storage/offline-store';

const MAX_RETRIES = 3;
const SYNC_INTERVAL_MS = 30000; // 30 seconds when app is active

export function useBackgroundSync(
  enabled: boolean,
  onSyncComplete?: () => void,
) {
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const processSyncQueue = useCallback(async () => {
    if (!enabled) return;

    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    logger.info('sync', 'background:processing', { count: queue.length });

    for (const operation of queue) {
      if (operation.retries >= MAX_RETRIES) {
        logger.warn('sync', 'background:max-retries', {
          operationId: operation.id,
        });
        await removeFromSyncQueue(operation.id);
        continue;
      }

      try {
        await executeOperation(operation);
        await removeFromSyncQueue(operation.id);
        logger.info('sync', 'background:success', {
          operationId: operation.id,
          type: operation.type,
        });
      } catch (error) {
        logger.warn('sync', 'background:retry', {
          operationId: operation.id,
          error: String(error),
        });
        await incrementRetry(operation.id);
      }
    }

    onSyncComplete?.();
  }, [enabled, onSyncComplete]);

  const syncIncrementalForms = useCallback(async () => {
    if (!enabled) return;

    try {
      const lastSync = await getLastFormsSyncTimestamp();
      const response = await fetchFormsFromServer(lastSync || undefined);

      if (response.forms.length > 0) {
        logger.info('sync', 'incremental:received', {
          count: response.forms.length,
        });
        await setLastFormsSyncTimestamp(Date.now());
        onSyncComplete?.();
      }
    } catch (error) {
      logger.warn('sync', 'incremental:failed', { error: String(error) });
    }
  }, [enabled, onSyncComplete]);

  const performBackgroundSync = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected || !state.isInternetReachable) {
      logger.info('sync', 'background:skipped', { reason: 'offline' });
      return;
    }

    await processSyncQueue();
    await syncIncrementalForms();
  }, [processSyncQueue, syncIncrementalForms]);

  // Set up periodic sync when app is active
  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground, sync immediately
        performBackgroundSync();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    // Start periodic sync
    syncIntervalRef.current = setInterval(
      performBackgroundSync,
      SYNC_INTERVAL_MS,
    );

    // Initial sync
    performBackgroundSync();

    return () => {
      subscription.remove();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [enabled, performBackgroundSync]);

  // Network state monitoring
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        logger.info('sync', 'network:connected');
        performBackgroundSync();
      }
    });

    return () => unsubscribe();
  }, [enabled, performBackgroundSync]);

  return { performBackgroundSync };
}

async function executeOperation(operation: SyncOperation): Promise<void> {
  switch (operation.type) {
    case 'create':
    case 'update':
      await syncFormsFromClient([operation.payload]);
      break;
    case 'attach':
      await attachFormWithPayload(operation.formId, operation.payload);
      break;
    case 'delete':
      await deleteForm(operation.formId);
      break;
    default:
      throw new Error(`Unknown operation type: ${operation.type}`);
  }
}
