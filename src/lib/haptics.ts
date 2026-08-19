import * as Haptics from 'expo-haptics';

/**
 * The app's haptic vocabulary — one place so feedback stays consistent.
 *
 * - `selection` — moving between options (tabs, segments, pickers)
 * - `light` / `medium` / `heavy` — taps, in increasing weight
 * - `success` / `warning` / `error` — the outcome of an action (save, settle, fail)
 *
 * Every call is fire-and-forget and swallows errors (haptics are unavailable on
 * web and on devices without a Taptic Engine).
 */
export const haptics = {
  selection: () => Haptics.selectionAsync().catch(() => {}),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};
