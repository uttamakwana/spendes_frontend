import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { IconButton } from './Button';
import { Txt } from './Text';

export function Screen({
  children,
  edges = ['top'],
  background,
}: {
  children: React.ReactNode;
  edges?: Edge[];
  background?: string;
}) {
  const t = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: background ?? t.canvas2 }}>
      {children}
    </SafeAreaView>
  );
}

export function TopBar({
  title,
  onBack,
  right,
  large,
  subtitle,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  large?: boolean;
  subtitle?: string;
}) {
  const t = useTheme();
  const router = useRouter();
  const back = onBack ?? (() => router.back());
  const canBack = onBack !== undefined || router.canGoBack();

  return (
    <View style={{ backgroundColor: t.canvas }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingTop: 6,
          paddingBottom: 8,
          minHeight: 44,
        }}
      >
        {canBack && <IconButton name="chevron-back" onPress={back} />}
        {!large && (
          <Txt
            variant="headline"
            numberOfLines={1}
            style={{ flex: 1, textAlign: canBack ? 'center' : 'left', marginRight: canBack ? 38 : 0 }}
          >
            {title}
          </Txt>
        )}
        {large && <View style={{ flex: 1 }} />}
        {right}
      </View>
      {large && (
        <View style={{ paddingHorizontal: 20, paddingTop: 2, paddingBottom: 12 }}>
          <Txt variant="title1">{title}</Txt>
          {subtitle && (
            <Txt tone="ink2" style={{ marginTop: 2 }}>
              {subtitle}
            </Txt>
          )}
        </View>
      )}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingBottom: 10,
      }}
    >
      <Txt variant="headline">{title}</Txt>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Txt tone="accent" variant="caption">
            {action}
          </Txt>
        </Pressable>
      )}
    </View>
  );
}

export { Ionicons };
