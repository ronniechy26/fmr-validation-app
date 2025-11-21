import { SQLiteStorage } from 'expo-sqlite/kv-store';

export type RememberPrefs = {
  email?: string;
  remember: boolean;
};

const storage = new SQLiteStorage('fmr-session');
const REMEMBER_KEY = 'remember-prefs';

export async function loadRememberPrefs(): Promise<RememberPrefs> {
  const raw = await storage.getItemAsync(REMEMBER_KEY);
  if (!raw) return { remember: true };
  try {
    return JSON.parse(raw) as RememberPrefs;
  } catch {
    return { remember: true };
  }
}

export async function saveRememberPrefs(prefs: RememberPrefs) {
  await storage.setItemAsync(REMEMBER_KEY, JSON.stringify(prefs));
}

export async function clearRememberPrefs() {
  await storage.removeItemAsync(REMEMBER_KEY);
}
