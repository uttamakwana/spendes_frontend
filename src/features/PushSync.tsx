import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { qk } from '@/api';
import { useAuth } from '@/auth/AuthProvider';
import { queryClient } from '@/data/queryClient';
import { syncPushToken } from '@/features/push';

/**
 * Bridges device push into the running app. Once authenticated it registers the
 * Expo push token with the backend, and it routes a notification tap to the same
 * screen the in-app inbox would (group vs friend, keyed on `isDirect`). Renders
 * nothing — mount it once under the providers. Sign-out token cleanup lives in
 * `AuthProvider` (it must run before the auth tokens are cleared).
 */
export function PushSync() {
  const { status } = useAuth();
  const router = useRouter();

  // Register this device whenever we become authenticated.
  useEffect(() => {
    if (status === 'authed') void syncPushToken();
  }, [status]);

  // A push arriving while the app is foregrounded should refresh the inbox and
  // bell badge immediately, rather than waiting for the next poll.
  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: qk.notificationsAll });
      queryClient.invalidateQueries({ queryKey: qk.notificationsUnread });
    });
    return () => received.remove();
  }, []);

  // Route taps on a delivered notification to its deep-link target.
  useEffect(() => {
    const route = (data: Record<string, unknown> | undefined) => {
      const groupId = typeof data?.groupId === 'string' ? data.groupId : undefined;
      if (groupId) {
        router.push(data?.isDirect ? `/friends/${groupId}` : `/groups/${groupId}`);
      } else {
        router.push('/notifications');
      }
    };

    // Cold start: the app was opened by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((res) => {
      if (res) route(res.notification.request.content.data as Record<string, unknown>);
    });

    // Warm: tapped while the app was running or backgrounded.
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      route(res.notification.request.content.data as Record<string, unknown>);
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
