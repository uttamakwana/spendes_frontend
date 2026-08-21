import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { qk } from '@/api';
import { useAuth } from '@/auth/AuthProvider';
import { queryClient } from '@/data/queryClient';
import { syncPushToken } from '@/features/push';

/**
 * Bridges device push into the running app:
 *  - registers the Expo push token with the backend once authenticated,
 *  - refreshes the inbox/badge when a push arrives in the foreground,
 *  - routes a notification tap to the same screen the in-app inbox would
 *    (group vs friend, keyed on `isDirect`), including cold starts.
 *
 * Tap routing is deferred until the user is authenticated (and therefore past
 * the auth gate), so a tap that launches the app from a killed state still
 * lands on the right screen instead of racing session restore. Renders nothing.
 */
export function PushSync() {
  const { status } = useAuth();
  const router = useRouter();

  // The deep-link payload from a tap, held until we can safely navigate.
  const [pending, setPending] = useState<Record<string, unknown> | null>(null);
  // Notification ids already captured — guards against the cold-start response
  // and the live listener both firing for the same tap.
  const handled = useRef<Set<string>>(new Set());

  // Register this device whenever we become authenticated.
  useEffect(() => {
    if (status === 'authed') void syncPushToken();
  }, [status]);

  // A push arriving while foregrounded should refresh the inbox and bell badge
  // immediately rather than waiting for the next poll.
  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: qk.notificationsAll });
      queryClient.invalidateQueries({ queryKey: qk.notificationsUnread });
    });
    return () => received.remove();
  }, []);

  // Capture taps from both a cold start and while the app is already running.
  useEffect(() => {
    const capture = (res: Notifications.NotificationResponse | null) => {
      if (!res) return;
      const id = res.notification.request.identifier;
      if (handled.current.has(id)) return;
      handled.current.add(id);
      setPending(res.notification.request.content.data as Record<string, unknown>);
    };

    Notifications.getLastNotificationResponseAsync().then(capture);
    const sub = Notifications.addNotificationResponseReceivedListener(capture);
    return () => sub.remove();
  }, []);

  // Flush the captured deep link once authenticated (and past the auth gate).
  useEffect(() => {
    if (status !== 'authed' || !pending) return;
    const notificationId =
      typeof pending.notificationId === 'string' ? pending.notificationId : undefined;
    const groupId = typeof pending.groupId === 'string' ? pending.groupId : undefined;

    // A push about a split request should land on the request itself — that screen
    // decides whether there's anything to answer and shows the group otherwise.
    if (notificationId) {
      router.push(`/notifications/${notificationId}`);
    } else if (groupId) {
      router.push(pending.isDirect ? `/friends/${groupId}` : `/groups/${groupId}`);
    } else {
      router.push('/notifications');
    }
    setPending(null);
  }, [status, pending, router]);

  return null;
}
