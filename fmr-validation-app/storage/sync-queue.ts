import { SQLiteStorage } from 'expo-sqlite/kv-store';
import { FormRecord } from '@/types/forms';

const QUEUE_KEY = 'sync-queue';
const storage = new SQLiteStorage('fmr-offline');

export type SyncOperation = {
  id: string;
  type: 'create' | 'update' | 'attach' | 'delete';
  formId: string;
  payload: any;
  timestamp: number;
  retries: number;
};

export async function getSyncQueue(): Promise<SyncOperation[]> {
  const raw = await storage.getItemAsync(QUEUE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as SyncOperation[];
}

async function saveSyncQueue(queue: SyncOperation[]) {
  await storage.setItemAsync(QUEUE_KEY, JSON.stringify(queue));
}

export async function addToSyncQueue(
  type: SyncOperation['type'],
  formId: string,
  payload: any,
): Promise<void> {
  const queue = await getSyncQueue();
  const operation: SyncOperation = {
    id: `${type}-${formId}-${Date.now()}`,
    type,
    formId,
    payload,
    timestamp: Date.now(),
    retries: 0,
  };
  queue.push(operation);
  await saveSyncQueue(queue);
}

export async function removeFromSyncQueue(operationId: string): Promise<void> {
  const queue = await getSyncQueue();
  const filtered = queue.filter((op) => op.id !== operationId);
  await saveSyncQueue(filtered);
}

export async function incrementRetry(operationId: string): Promise<void> {
  const queue = await getSyncQueue();
  const operation = queue.find((op) => op.id === operationId);
  if (operation) {
    operation.retries += 1;
    await saveSyncQueue(queue);
  }
}

export async function clearSyncQueue(): Promise<void> {
  await storage.setItemAsync(QUEUE_KEY, JSON.stringify([]));
}

export async function getPendingSyncCount(): Promise<number> {
  const queue = await getSyncQueue();
  return queue.length;
}
