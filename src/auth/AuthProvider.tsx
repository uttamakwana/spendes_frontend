import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  authApi,
  AuthResult,
  clearTokens,
  getAccessToken,
  saveTokens,
  setAuthFailureHandler,
  User,
  usersApi,
} from '@/api';
import { queryClient } from '@/data/queryClient';
import { unregisterPushToken } from '@/features/push';

type Status = 'loading' | 'authed' | 'guest';

interface AuthContextValue {
  status: Status;
  user: User | null;
  signIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUserState] = useState<User | null>(null);

  const signOut = useCallback(async () => {
    // Detach this device's push token while the request can still authenticate.
    await unregisterPushToken();
    try {
      await authApi.logout();
    } catch {
      // best-effort; tokens are cleared regardless
    }
    await clearTokens();
    queryClient.clear();
    setUserState(null);
    setStatus('guest');
  }, []);

  const signIn = useCallback(async (result: AuthResult) => {
    await saveTokens(result.tokens);
    setUserState(result.user);
    setStatus('authed');
  }, []);

  const setUser = useCallback((u: User) => setUserState(u), []);

  // Wire refresh-failure → sign out (route guard reacts to status).
  useEffect(() => {
    setAuthFailureHandler(() => {
      clearTokens().finally(() => {
        queryClient.clear();
        setUserState(null);
        setStatus('guest');
      });
    });
    return () => setAuthFailureHandler(null);
  }, []);

  // Restore session on cold start.
  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getAccessToken();
      if (!token) {
        if (active) setStatus('guest');
        return;
      }
      try {
        const me = await usersApi.me();
        if (!active) return;
        setUserState(me);
        setStatus('authed');
      } catch {
        if (!active) return;
        await clearTokens();
        setStatus('guest');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signOut, setUser }),
    [status, user, signIn, signOut, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
