import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Platform, RefreshControl, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
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
  refreshing,
  onRefresh,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  background?: string;
  /** Enables pull-to-refresh — pair with `useRefresh`. */
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const back = onBack ?? (() => router.back());
  const canBack = showBack ?? (onBack !== undefined || router.canGoBack());

  const isIOS = Platform.OS === 'ios';
  const navH = insets.top + 44;
  // On iOS the pull-to-refresh spinner anchors to the scroll view's contentInset
  // (so it lands below the notch); that shifts the resting scroll offset to -navH.
  // The collapse fade tracks that shifted baseline. Android keeps padding + a 0 base.
  const scrollY = useRef(new Animated.Value(isIOS ? -navH : 0)).current;
  const fade = scrollY.interpolate({
    inputRange: isIOS ? [14 - navH, 46 - navH] : [14, 46],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1, backgroundColor: background ?? t.canvas2 }}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentInsetAdjustmentBehavior="never"
        contentInset={isIOS ? { top: navH } : undefined}
        contentOffset={isIOS ? { x: 0, y: -navH } : undefined}
        contentContainerStyle={{ paddingTop: isIOS ? 4 : navH + 4 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              progressViewOffset={isIOS ? 0 : navH}
              tintColor={t.accent}
              colors={[t.accent]}
              progressBackgroundColor={t.surface}
            />
          ) : undefined
        }
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
