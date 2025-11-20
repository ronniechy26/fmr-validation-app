import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login, setAuthToken } from '@/lib/api';
import { clearSession, loadSession, saveSession } from '@/storage/session';
import { LoginResponse } from '@/types/auth';
import { StoredSession } from '@/types/session';

type AuthContextValue = {
  isSignedIn: boolean;
  loading: boolean;
  token: string | null;
  user: LoginResponse['user'] | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession<LoginResponse['user']> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      const cached = await loadSession<LoginResponse['user']>();
      if (cached && cached.expiresAt > Date.now()) {
        setSession(cached);
        setAuthToken(cached.token);
      } else {
        await clearSession();
      }
      setLoading(false);
    };
    bootstrap();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await login({ email, password });
    const expiresAt = Date.now() + response.expiresIn * 1000;
    const nextSession: StoredSession<LoginResponse['user']> = {
      token: response.accessToken,
      user: response.user,
      expiresAt,
    };
    setSession(nextSession);
    setAuthToken(response.accessToken);
    await saveSession(nextSession);
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    setAuthToken(null);
    await clearSession();
  }, []);

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
