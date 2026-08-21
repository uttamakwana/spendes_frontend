import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';
import { Sheet } from './Sheet';
import { Txt } from './Text';

export interface MenuAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

/**
 * A long-press context menu, rendered as a themed bottom sheet (works everywhere,
 * including Expo Go). Drive it from a screen-level target state and pass the
 * relevant `actions`. Each action closes the sheet, then runs after it dismisses.
 */
export function ActionMenu({
  open,
  onClose,
  title,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: MenuAction[];
}) {
  const t = useTheme();
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <View style={{ paddingHorizontal: 16, paddingTop: 4, gap: 8 }}>
        {actions.map((a) => {
          const color = a.destructive ? t.danger : t.ink;
          return (
            <Pressable
              key={a.label}
              onPress={() => {
                onClose();
                // let the sheet begin dismissing before the action navigates/mutates
                setTimeout(a.onPress, 180);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 13,
                borderRadius: 16,
                backgroundColor: pressed ? t.fill2 : t.fill,
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: a.destructive ? t.dangerBg : t.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={a.icon} size={20} color={color} />
              </View>
              <Txt variant="headline" color={color} style={{ flex: 1 }}>
                {a.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}
