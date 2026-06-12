import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useTheme } from '@/theme';
import { Txt } from './Text';

/**
 * A slim pill that appears below the status bar whenever the device loses
 * connectivity, giving users an immediate reason why actions aren't working.
 *
 * Absolutely positioned and `pointerEvents="none"` so it never disturbs the
 * navigator's layout, safe-area maths, or taps on the content beneath it.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const insets = useSafeAreaInsets();
  const t = useTheme();

  if (online) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + 6, backgroundColor: t.premium }]}
    >
      <View style={styles.row}>
        <Ionicons name="cloud-offline-outline" size={15} color={t.onPremium} />
        <Txt variant="caption" weight="semibold" color={t.onPremium}>
          No internet connection
        </Txt>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
