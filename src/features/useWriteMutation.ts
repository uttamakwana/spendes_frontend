import {
  DefaultError,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';

import { haptics } from '@/lib/haptics';

/**
 * Drop-in replacement for `useMutation` for user-initiated writes (save, delete,
 * settle, contribute…). Adds a success/error haptic around whatever `onSuccess`/
 * `onError` the caller already passes — so the outcome of a save is *felt*, in one
 * consistent place. Use plain `useMutation` for silent/background writes.
 */
export function useWriteMutation<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    onSuccess: (...args) => {
      haptics.success();
      return options.onSuccess?.(...args);
    },
    onError: (...args) => {
      haptics.error();
      return options.onError?.(...args);
    },
  });
}
