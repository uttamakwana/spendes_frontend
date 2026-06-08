import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hexA, useTheme } from '@/theme';
import { IconButton } from './Button';
import { Txt } from './Text';

/**
 * iOS-Settings-style screen: a large title sits inline at the top-left and, as
 * the content scrolls, collapses into a centered title over a blurred nav bar.
 * Owns the scroll view — pass page content as `children` and per-screen padding
 * via `contentContainerStyle`.
 */
export function CollapsibleScreen({
  title,
  subtitle,
  right,
  onBack,
  showBack,
  children,
  contentContainerStyle,
  background,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  background?: string;
}) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const back = onBack ?? (() => router.back());
  const canBack = showBack ?? (onBack !== undefined || router.canGoBack());

  const navH = insets.top + 44;
  const scrollY = useRef(new Animated.Value(0)).current;
  const fade = scrollY.interpolate({ inputRange: [14, 46], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1, backgroundColor: background ?? t.canvas2 }}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentContainerStyle={{ paddingTop: navH + 4 }}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <Txt variant="title1">{title}</Txt>
          {subtitle ? (
            <Txt tone="ink2" style={{ marginTop: 2 }}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        <View style={contentContainerStyle}>{children}</View>
      </Animated.ScrollView>

      {/* nav bar */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: navH, zIndex: 20 }}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <BlurView intensity={32} tint={t.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: hexA(t.canvas, t.dark ? 0.55 : 0.6) }]} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.line }} />
        </Animated.View>

        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, justifyContent: 'center' }}>
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 52, right: 52, alignItems: 'center', opacity: fade }}>
            <Txt variant="headline" numberOfLines={1}>
              {title}
            </Txt>
          </Animated.View>
          {canBack && (
            <View style={{ position: 'absolute', left: 8 }}>
              <IconButton name="chevron-back" onPress={back} />
            </View>
          )}
          {right ? <View style={{ position: 'absolute', right: 12 }}>{right}</View> : null}
        </View>
      </View>
    </View>
  );
}
