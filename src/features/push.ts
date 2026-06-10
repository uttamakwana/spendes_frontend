import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { pushApi } from '@/api';

/**
 * Device push notifications. Pairs with the backend `push` module: this device
 * hands its Expo push token to `POST /push/register`, and the backend fans every
 * in-app notification out to it. The notification taps are routed by `PushSync`.
 *
 * Remote push requires a development build on a physical device — it does not
 * work in Expo Go (Android since SDK 53, iOS always) or on a bare simulator.
 */

// How a notification is presented while the app is in the foreground (SDK 54
// shape — shouldShowBanner/shouldShowList replace the old shouldShowAlert).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Android delivery channel — its id must match the `channelId` the backend sends. */
const ANDROID_CHANNEL_ID = 'default';

// The token we last handed the backend, kept so we can detach it on sign-out.
let registeredToken: string | null = null;

/** Requests permission and resolves the Expo push token, or null when unavailable. */
async function getExpoPushToken(): Promise<{ token: string; platform: 'ios' | 'android' } | null> {
  const os = Platform.OS;
  // Remote push needs real hardware (and a dev build, not Expo Go / web).
  if (!Device.isDevice || (os !== 'ios' && os !== 'android')) return null;

  if (os === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#4F46E5',
    });
  }

  const existing = (await Notifications.getPermissionsAsync()).status;
  const status =
    existing === 'granted' ? existing : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  if (!projectId) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return { token: data, platform: os };
}

/**
 * Registers this device for push and hands the token to the backend. Best-effort:
 * permission denial, Expo Go, a missing projectId or no network all resolve quietly
 * rather than surfacing into the UI.
 */
export async function syncPushToken(): Promise<void> {
  try {
    const result = await getExpoPushToken();
    if (!result) return;
    await pushApi.register(result);
    registeredToken = result.token;
  } catch {
    // best-effort — never block the app on push registration
  }
}

/**
 * Detaches this device's token from the account. Call on sign-out *before* the
 * auth tokens are cleared, while the request can still authenticate.
 */
export async function unregisterPushToken(): Promise<void> {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  try {
    await pushApi.unregister(token);
  } catch {
    // best-effort
  }
}
