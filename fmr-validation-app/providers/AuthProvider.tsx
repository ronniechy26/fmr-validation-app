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
  signIn: (email: string, password: string, options?: { remember?: boolean }) => Promise<void>;
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
      setLoading(true);
      const cached = await loadSession<LoginResponse['user']>();
      if (!cached || !cached.refreshToken || !cached.refreshExpiresAt) {
        await clearSession();
        setLoading(false);
        return;
      }

      if (cached.refreshExpiresAt <= Date.now()) {
        await clearSession();
        setLoading(false);
        return;
      }

      if (cached.expiresAt > Date.now()) {
        setSession(cached);
        setAuthToken(cached.token);
        setLoading(false);
        return;
      }

      try {
        const refreshed = await refreshSession(cached.refreshToken);
        await persistSession(refreshed);
      } catch (error) {
        await clearSession();
      }
      setLoading(false);
    };
    bootstrap();
  }, [persistSession]);

  const signIn = useCallback(async (email: string, password: string, options?: { remember?: boolean }) => {
    const startTime = Date.now();
    console.log('🟢 AuthProvider signIn: Starting...', { email, remember: options?.remember });
    logger.info('auth', 'signIn:start', { email });
    try {
      console.log('🟢 AuthProvider signIn: Calling login API...');
      const response = await login({ email, password });
      console.log('🟢 AuthProvider signIn: Login API success, persisting session...');
      await persistSession(response, options?.remember ?? true);
      console.log('🟢 AuthProvider signIn: Session persisted');
      const duration = Date.now() - startTime;
      logger.info('auth', 'signIn:success', { email, duration });
      console.log('🟢 AuthProvider signIn: Complete!', { duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('🔴 AuthProvider signIn: Error!', { error, duration });
      logger.error('auth', 'signIn:failed', { email, duration, error: String(error) });
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
