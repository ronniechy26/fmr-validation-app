import { ensureStorageReady, storage } from './db';
import { StoredSession } from '@/types/session';

const SESSION_KEY = 'session';

// Helper to add timeout to async operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, defaultValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => {
      console.warn('[Session] Operation timed out, using default value');
      resolve(defaultValue);
    }, timeoutMs))
  ]);
}

export async function loadSession<User>(): Promise<StoredSession<User> | null> {
  try {
    await ensureStorageReady();
    const raw = await withTimeout(
      storage.getItemAsync(SESSION_KEY),
      3000, // 3 second timeout
      null
    );
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as StoredSession<User>;
      return session;
    } catch {
      return null;
    }
  } catch (error) {
    console.error('[Session] Error loading session:', error);
    return null;
  }
}

export async function saveSession<User>(session: StoredSession<User>) {
  try {
    await ensureStorageReady();
    await withTimeout(
      storage.setItemAsync(SESSION_KEY, JSON.stringify(session)),
      3000,
      undefined
    );
  } catch (error) {
    console.error('[Session] Error saving session:', error);
  }
}

export async function clearSession() {
  try {
    await ensureStorageReady();
    await withTimeout(
      storage.removeItemAsync(SESSION_KEY),
      3000,
      undefined
    );
  } catch (error) {
    console.error('[Session] Error clearing session:', error);
  }
}
