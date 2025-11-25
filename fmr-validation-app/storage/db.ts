import { SQLiteStorage } from 'expo-sqlite/kv-store';

// Create a singleton instance for the session database
// This prevents multiple connections/locks on the same DB file
export const storage = new SQLiteStorage('fmr-session');

let initPromise: Promise<void> | null = null;

export function ensureStorageReady() {
  if (!initPromise) {
    // expo-sqlite/kv-store doesn't expose an explicit initializer; keep a stub
    initPromise = Promise.resolve();
  }
  return initPromise;
}
