import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login, refreshSession, setAuthToken } from '@/lib/api';
import { clearSession, loadSession, saveSession } from '@/storage/session';
import { LoginResponse } from '@/types/auth';
import { StoredSession } from '@/types/session';
import { logger } from '@/lib/logger';

type AuthContextValue = {
  isSignedIn: boolean;
  loading: boolean;
  token: string | null;
  user: LoginResponse['user'] | null;
  signIn: (username: string, password: string, options?: { remember?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession<LoginResponse['user']> | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback(async (response: LoginResponse, remember = true) => {
    const expiresAt = Date.now() + response.expiresIn * 1000;
    const refreshExpiresAt = Date.now() + response.refreshExpiresIn * 1000;
    const nextSession: StoredSession<LoginResponse['user']> = {
      token: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
      expiresAt,
      refreshExpiresAt,
    };
    setSession(nextSession);
    setAuthToken(response.accessToken);
    if (remember) {
      await saveSession(nextSession);
    } else {
      // Ensure old persisted sessions are removed when remember is off
      await clearSession();
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      console.log('[AuthProvider] Bootstrap started');
      setLoading(true);
      const cached = await loadSession<LoginResponse['user']>();
      console.log('[AuthProvider] Cached session:', { hasCached: !!cached });

      if (!cached || !cached.refreshToken || !cached.refreshExpiresAt) {
        console.log('[AuthProvider] No valid cached session, clearing');
        await clearSession();
        setLoading(false);
        console.log('[AuthProvider] Bootstrap complete (no session)');
        return;
      }

      if (cached.refreshExpiresAt <= Date.now()) {
        console.log('[AuthProvider] Refresh token expired, clearing');
        await clearSession();
        setLoading(false);
        console.log('[AuthProvider] Bootstrap complete (expired)');
        return;
      }

      if (cached.expiresAt > Date.now()) {
        console.log('[AuthProvider] Using cached session');
        setSession(cached);
        setAuthToken(cached.token);
        setLoading(false);
        console.log('[AuthProvider] Bootstrap complete (cached)');
        return;
      }

      try {
        console.log('[AuthProvider] Refreshing session');
        const refreshed = await refreshSession(cached.refreshToken);
        await persistSession(refreshed);
        console.log('[AuthProvider] Session refreshed successfully');
      } catch (error) {
        console.error('[AuthProvider] Refresh failed:', error);
        await clearSession();
      }
      setLoading(false);
      console.log('[AuthProvider] Bootstrap complete (refreshed)');
    };
    bootstrap();
  }, [persistSession]);

  const signIn = useCallback(async (username: string, password: string, options?: { remember?: boolean }) => {
    const startTime = Date.now();
    logger.info('auth', 'signIn:start', { username });
    try {
      const response = await login({ username, password });
      await persistSession(response, options?.remember ?? true);
      const duration = Date.now() - startTime;
      logger.info('auth', 'signIn:success', { username, duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('auth', 'signIn:failed', { username, duration, error: String(error) });
      throw error;
    }
  }, [persistSession]);

  const signOut = useCallback(async () => {
    setSession(null);
    setAuthToken(null);
    await clearSession();
  }, []);

  const attemptRefresh = useCallback(async () => {
    if (!session) return;
    try {
      const refreshed = await refreshSession(session.refreshToken);
      await persistSession(refreshed);
    } catch (error) {
      await signOut();
    }
  }, [persistSession, session, signOut]);

  useEffect(() => {
    if (!session) return undefined;
    const earlyRefreshMs = 30_000;
    const timeoutMs = Math.max(session.expiresAt - Date.now() - earlyRefreshMs, 0);
    const timer = setTimeout(() => {
      attemptRefresh();
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [attemptRefresh, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isSignedIn: Boolean(session?.token),
      token: session?.token ?? null,
      user: session?.user ?? null,
      loading,
      signIn,
      signOut,
    }),
    [loading, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
