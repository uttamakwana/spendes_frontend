import { useCallback, useRef, useState } from 'react';

interface Refetchable {
  refetch: () => Promise<unknown>;
}

/** Keep the spinner up at least this long so a fast (cached) refetch is still visible. */
const MIN_VISIBLE_MS = 800;

/**
 * Pull-to-refresh glue for React Query screens: pass the queries a screen shows,
 * get back `{ refreshing, onRefresh }` to feed a <RefreshControl>. Refetches run
 * in parallel; the spinner stays up until they settle, and for a minimum time so
 * an instant cache hit doesn't flash by too fast to see.
 */
export function useRefresh(queries: Refetchable[]): { refreshing: boolean; onRefresh: () => void } {
  const [refreshing, setRefreshing] = useState(false);
  const ref = useRef(queries);
  ref.current = queries;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const started = Date.now();
    try {
      await Promise.allSettled(ref.current.map((q) => q.refetch()));
    } finally {
      const elapsed = Date.now() - started;
      if (elapsed < MIN_VISIBLE_MS) {
        await new Promise((r) => setTimeout(r, MIN_VISIBLE_MS - elapsed));
      }
      setRefreshing(false);
    }
  }, []);

  return { refreshing, onRefresh };
}
