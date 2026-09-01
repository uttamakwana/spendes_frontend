import { useEffect, useState } from 'react';

/**
 * The value, but only after it has stopped changing for `delay` ms.
 *
 * Search boxes need two different values: the one the field shows, which must
 * update on every keystroke or typing feels broken, and the one the query runs on,
 * which should wait until the user pauses. Feeding the raw value straight into a
 * query key fires a request per character and — because each key starts with no
 * cached data — empties the list between them.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
