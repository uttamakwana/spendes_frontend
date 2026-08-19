import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

/**
 * Standard height of the native tab bar we float above. The native bar can't be
 * measured from JS (explicitly unsupported on Android), so we use the platform
 * metric rather than guessing at runtime.
 */
const TAB_BAR_HEIGHT = Platform.select({ ios: 49, android: 80, default: 56 });

/**
 * The floating "+" action. Native tab bars can't host a custom center button,
 * so the composer lives here — above the bar, within thumb reach.
 */
export function AddFab({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add"
      hitSlop={8}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 18, stiffness: 420 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 13, stiffness: 320 });
      }}
      onPress={() => {
        haptics.medium();
        onPress();
      }}
      style={{ position: 'absolute', right: 20, bottom: TAB_BAR_HEIGHT + insets.bottom + 16 }}
    >
      <Animated.View
        style={[
          {
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
            ...t.shadowLg,
          },
          animStyle,
        ]}
      >
        <Ionicons name="add" size={30} color={t.onAccent} />
      </Animated.View>
    </Pressable>
  );
}
