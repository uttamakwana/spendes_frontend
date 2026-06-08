import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { hexA, useTheme } from '@/theme';
import { Sheet, Txt } from '@/ui';

const OPTIONS = [
  { icon: 'arrow-up-circle', color: '#DC2626', label: 'Expense', sub: 'Log a spend across any method', href: '/add-transaction?kind=expense' },
  { icon: 'arrow-down-circle', color: '#16A34A', label: 'Income', sub: 'Salary, refund or other credit', href: '/add-transaction?kind=income' },
  { icon: 'git-branch', color: '#4F46E5', label: 'Split an expense', sub: 'Share with a group or friend', href: '/add-split' },
  { icon: 'rocket', color: '#16A34A', label: 'Goal contribution', sub: 'Move money toward a savings goal', href: '/goals' },
] as const;

/** The central "+" chooser — a draggable bottom sheet rendered above the tabs. */
export function AddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme();
  const router = useRouter();

  const pick = (href: string) => {
    onClose();
    // let the sheet begin dismissing, then navigate to a normal card screen
    setTimeout(() => router.push(href as never), 180);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add">
      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.label}
            onPress={() => pick(o.href)}
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
                width: 44,
                height: 44,
                borderRadius: 13,
                backgroundColor: hexA(o.color, 0.15),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={o.icon as keyof typeof Ionicons.glyphMap} size={22} color={o.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="headline">{o.label}</Txt>
              <Txt tone="ink3" variant="caption" style={{ marginTop: 1 }}>
                {o.sub}
              </Txt>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.ink3} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
