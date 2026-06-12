import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * A single source of truth for device connectivity.
 *
 * We register one NetInfo listener at module load and expose:
 *  - `getIsOnline()` — a synchronous read for non-React code (the axios
 *    request interceptor uses it to fail fast instead of hanging).
 *  - `subscribeOnline()` — a tiny pub/sub the `useOnlineStatus` hook builds on
 *    so the offline banner re-renders on change.
 *
 * Works on iOS, Android and web (NetInfo falls back to `navigator.onLine`).
 */

/** Shape of the synthetic rejection we raise when a request is attempted offline. */
export interface OfflineError {
  success: false;
  statusCode: 0;
  errorCode: 'OFFLINE';
  isOffline: true;
  message: string;
}

export function offlineError(): OfflineError {
  return {
    success: false,
    statusCode: 0,
    errorCode: 'OFFLINE',
    isOffline: true,
    message: "You're offline. Check your connection and try again.",
  };
}

let online = true;
const listeners = new Set<(online: boolean) => void>();

function isOnline(state: NetInfoState): boolean {
  // Treat the device as offline only when it is *explicitly* disconnected, or
  // connected to a network with confirmed-no internet. `isInternetReachable` is
  // `null` while NetInfo is still probing — don't block on that, or we'd flash a
  // false "offline" on every cold start.
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

NetInfo.addEventListener((state) => {
  const next = isOnline(state);
  if (next === online) return;
  online = next;
  listeners.forEach((fn) => fn(next));
});

/** Synchronous last-known connectivity. Defaults to `true` until the first event. */
export function getIsOnline(): boolean {
  return online;
}

/** Subscribe to connectivity changes. Returns an unsubscribe fn. */
export function subscribeOnline(fn: (online: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
