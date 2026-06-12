import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { getIsOnline, offlineError } from './network';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokens';

/** Standard backend error envelope. */
export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errorCode?: string;
  errors?: { field: string; message: string }[];
}

/** Raw axios instance — used directly only for refresh (no interceptors loop). */
const raw = axios.create({ baseURL: API_BASE_URL, timeout: REQUEST_TIMEOUT_MS });

export const api = axios.create({ baseURL: API_BASE_URL, timeout: REQUEST_TIMEOUT_MS });

// Allow the auth layer to react when refresh fails (route to onboarding).
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: (() => void) | null) {
  onAuthFailure = fn;
}

// Attach the access token to every request. Fail fast when the device is offline
// so writes don't hang for the full timeout before surfacing a vague error.
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!getIsOnline()) return Promise.reject(offlineError());
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await raw.post('/auth/refresh', { refreshToken });
    const data = res.data?.data;
    if (data?.accessToken && data?.refreshToken) {
      await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data.accessToken as string;
    }
    return null;
  } catch {
    return null;
  }
}

// Unwrap the success envelope → callers receive `data` directly.
// Transparently refresh once on 401, then retry.
api.interceptors.response.use(
  (res) => res.data?.data,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing ??= refreshTokens().finally(() => {
        refreshing = null;
      });
      const newAccess = await refreshing;
      if (newAccess) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newAccess}` };
        return api(original);
      }
      await clearTokens();
      onAuthFailure?.();
    }

    return Promise.reject((error.response?.data as ApiError) ?? error);
  },
);

const OFFLINE_MSG = "You're offline. Check your connection and try again.";
const TIMEOUT_MSG = 'The connection timed out. Please try again.';

/** Human-readable message from an unknown rejection. */
export function errorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Partial<ApiError> & { message?: string; code?: string; isOffline?: boolean };
    // Our synthetic offline rejection (request blocked before it was sent)…
    if (e.isOffline || e.errorCode === 'OFFLINE') return e.message ?? OFFLINE_MSG;
    // …or a real axios network / timeout failure (no server response reached us).
    if (e.code === 'ERR_NETWORK') return OFFLINE_MSG;
    if (e.code === 'ECONNABORTED') return TIMEOUT_MSG;
    if (e.errors?.length) return e.errors[0].message;
    if (e.message) return e.message;
  }
  return 'Something went wrong. Please try again.';
}
