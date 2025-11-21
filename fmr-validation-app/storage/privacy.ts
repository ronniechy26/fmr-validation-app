import { SQLiteStorage } from 'expo-sqlite/kv-store';

const storage = new SQLiteStorage('fmr-privacy');
const CONSENT_KEY = 'privacy-consent';

export async function loadPrivacyConsent() {
  const raw = await storage.getItemAsync(CONSENT_KEY);
  if (!raw) return false;
  return raw === 'true';
}

export async function savePrivacyConsent(accepted: boolean) {
  await storage.setItemAsync(CONSENT_KEY, accepted ? 'true' : 'false');
}
