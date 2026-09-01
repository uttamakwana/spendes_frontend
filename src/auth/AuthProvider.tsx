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
import { setActiveCurrency } from '@/lib/money';
import { unregisterPushToken } from '@/features/push';

type Status = 'loading' | 'authed' | 'guest';

interface AuthContextValue {
  status: Status;
  user: User | null;
  signIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUserState] = useState<User | null>(null);

  // Every amount in the app renders in the signed-in user's currency. It changes
  // only at sign-in (one currency per account, never converted), so it is set here
  // rather than threaded through every screen that shows a number.
  const applyUser = useCallback((next: User | null) => {
    setActiveCurrency(next?.defaultCurrency);
    setUserState(next);
  }, []);

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
    applyUser(null);
    setStatus('guest');
  }, [applyUser]);

  const signIn = useCallback(async (result: AuthResult) => {
    await saveTokens(result.tokens);
    applyUser(result.user);
    setStatus('authed');
  }, [applyUser]);

  // Permanently delete the account, then tear down the local session. The server
  // cascades the account and its push tokens, so (unlike sign-out) there's nothing
  // left to log out of or unregister — and the request must succeed before we
  // clear anything, so a failure surfaces to the caller with the session intact.
  const deleteAccount = useCallback(async () => {
    await usersApi.deleteAccount();
    await clearTokens();
    queryClient.clear();
    applyUser(null);
    setStatus('guest');
  }, [applyUser]);

  const setUser = useCallback((u: User) => applyUser(u), [applyUser]);

  // Wire refresh-failure → sign out (route guard reacts to status).
  useEffect(() => {
    setAuthFailureHandler(() => {
      clearTokens().finally(() => {
        queryClient.clear();
        applyUser(null);
        setStatus('guest');
      });
    });
    return () => setAuthFailureHandler(null);
  }, [applyUser]);

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
        applyUser(me);
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
  }, [applyUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signOut, deleteAccount, setUser }),
    [status, user, signIn, signOut, deleteAccount, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
