import { ensureStorageReady, storage } from './db';

const ONBOARDING_KEY = 'onboarding-completed';

// Helper to add timeout to async operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, defaultValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => {
      console.warn('[Onboarding] Operation timed out, using default value');
      resolve(defaultValue);
    }, timeoutMs))
  ]);
}

export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    await ensureStorageReady();
    const value = await withTimeout(
      storage.getItemAsync(ONBOARDING_KEY),
      3000, // 3 second timeout
      null
    );
    return value === 'true';
  } catch (error) {
    console.error('[Onboarding] Error checking status:', error);
    return false;
  }
}

export async function setOnboardingCompleted(completed: boolean) {
  try {
    await ensureStorageReady();
    await withTimeout(
      storage.setItemAsync(ONBOARDING_KEY, completed ? 'true' : 'false'),
      3000,
      undefined
    );
  } catch (error) {
    console.error('[Onboarding] Error setting status:', error);
  }
}

export async function clearOnboardingStatus() {
  try {
    await ensureStorageReady();
    await withTimeout(
      storage.removeItemAsync(ONBOARDING_KEY),
      3000,
      undefined
    );
  } catch (error) {
    console.error('[Onboarding] Error clearing status:', error);
  }
}
