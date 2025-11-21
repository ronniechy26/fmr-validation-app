import { SQLiteStorage } from 'expo-sqlite/kv-store';

const storage = new SQLiteStorage('fmr-session');
const ONBOARDING_KEY = 'onboarding-completed';

export async function isOnboardingCompleted(): Promise<boolean> {
  const value = await storage.getItemAsync(ONBOARDING_KEY);
  return value === 'true';
}

export async function setOnboardingCompleted(completed: boolean) {
  await storage.setItemAsync(ONBOARDING_KEY, completed ? 'true' : 'false');
}

export async function clearOnboardingStatus() {
  await storage.removeItemAsync(ONBOARDING_KEY);
}
