import { SQLiteStorage } from 'expo-sqlite/kv-store';
import { StoredSession } from '@/types/session';

const storage = new SQLiteStorage('fmr-session');
const SESSION_KEY = 'session';

export async function loadSession<User>(): Promise<StoredSession<User> | null> {
  const raw = await storage.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession<User>;
    return session;
  } catch {
    return null;
  }
}

export async function saveSession<User>(session: StoredSession<User>) {
  await storage.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession() {
  await storage.removeItemAsync(SESSION_KEY);
}
