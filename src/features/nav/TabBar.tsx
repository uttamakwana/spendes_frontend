import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Txt } from '@/ui';

/** Minimal shape of the props expo-router passes to a custom `tabBar`. */
interface TabRoute {
  key: string;
  name: string;
}
interface TabBarProps {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target?: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
  onAdd?: () => void;
}

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string }> = {
  home: { on: 'home', off: 'home-outline', label: 'Home' },
  groups: { on: 'people', off: 'people-outline', label: 'Groups' },
  analytics: { on: 'pie-chart', off: 'pie-chart-outline', label: 'Insights' },
  profile: { on: 'person', off: 'person-outline', label: 'Profile' },
};

const ORDER = ['home', 'groups', '__add', 'analytics', 'profile'];

export function TabBar({ state, navigation, onAdd }: TabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const activeName = state.routes[state.index]?.name;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        backgroundColor: t.surface,
        borderTopWidth: 1,
        borderTopColor: t.hair,
        paddingTop: 9,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
      }}
    >
      {ORDER.map((name) => {
        if (name === '__add') {
          return (
            <Pressable
              key="add"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                onAdd?.();
              }}
              style={({ pressed }) => ({
                width: 52,
                height: 52,
                borderRadius: 17,
                marginTop: -3,
                backgroundColor: t.accent,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? 0.94 : 1 }],
                ...t.shadowMd,
              })}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </Pressable>
          );
        }

        const cfg = ICONS[name];
        const on = activeName === name;
        const route = state.routes.find((r) => r.name === name);
        return (
          <Pressable
            key={name}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route?.key, canPreventDefault: true });
              if (!on && !event.defaultPrevented) navigation.navigate(name);
            }}
            style={{ width: 60, alignItems: 'center', gap: 3 }}
          >
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: on ? hexA(t.accent, 0.12) : 'transparent',
              }}
            >
              <Ionicons name={on ? cfg.on : cfg.off} size={23} color={on ? t.accent : t.ink3} />
            </View>
            <Txt color={on ? t.accent : t.ink3} style={{ fontFamily: on ? Font.semibold : Font.medium, fontSize: 10.5 }}>
              {cfg.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
