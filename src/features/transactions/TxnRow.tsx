import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';

import type { Expense, Income } from '@/api';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { CategoryIcon, MoneyText, Txt } from '@/ui';

export interface TxnItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  /** Signed: negative = spend, positive = income. */
  amount: number;
  method?: string;
  isShare?: boolean;
}

export function expenseToItem(e: Expense): TxnItem {
  return {
    id: e.id,
    title: e.merchant || e.description || e.category,
    subtitle: `${e.description || e.category} · ${format(new Date(e.spentAt), 'h:mm a')}`,
    category: e.category,
    amount: -Math.abs(e.amount),
    method: e.paymentMethod,
    isShare: e.source === 'group_share',
  };
}

export function incomeToItem(i: Income): TxnItem {
  return {
    id: i.id,
    title: i.source || i.category,
    subtitle: `${i.description || i.category} · ${format(new Date(i.receivedAt), 'h:mm a')}`,
    category: i.category,
    amount: Math.abs(i.amount),
    method: i.receivedVia,
  };
}

export function TxnRow({
  item,
  onPress,
  last,
  onDelete,
  onLongPress,
}: {
  item: TxnItem;
  onPress?: () => void;
  last?: boolean;
  /** When set, the row can be swiped left to reveal a Delete action. */
  onDelete?: () => void;
  /** Long-press to open a context menu (e.g. Edit / Delete). */
  onLongPress?: () => void;
}) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const income = item.amount > 0;

  const row = (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 11,
        paddingHorizontal: 4,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.hair,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <CategoryIcon name={item.category} size={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt variant="headline" numberOfLines={1} style={{ flexShrink: 1 }}>
            {item.title}
          </Txt>
          {item.isShare && (
            <View style={{ backgroundColor: t.accentSoft, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 999 }}>
              <Txt color={t.accent} style={{ fontFamily: Font.semibold, fontSize: 10.5 }}>
                split
              </Txt>
            </View>
          )}
        </View>
        <Txt tone="ink3" variant="caption" numberOfLines={1} style={{ marginTop: 1 }}>
          {item.subtitle}
        </Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <MoneyText value={item.amount} sign size={15.5} color={income ? t.success : t.ink} />
        {item.method && (
          <Txt tone="ink3" variant="micro" style={{ marginTop: 1, textTransform: 'capitalize' }}>
            {item.method.replace('_', ' ')}
          </Txt>
        )}
      </View>
    </Pressable>
  );

  return (
    <Reanimated.View
      entering={reduce ? undefined : FadeInDown.duration(260)}
      exiting={reduce ? undefined : FadeOut.duration(160)}
    >
      {onDelete ? (
        <ReanimatedSwipeable
          friction={2}
          rightThreshold={40}
          overshootRight={false}
          // Opaque so the row cleanly covers the red action until swiped — and
          // stays opaque even while the row dims on press (avoids a red flash).
          childrenContainerStyle={{ backgroundColor: t.surface }}
          renderRightActions={() => (
            <Pressable
              onPress={onDelete}
              style={{ width: 76, backgroundColor: t.danger, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="trash-outline" size={22} color="#fff" />
            </Pressable>
          )}
        >
          {row}
        </ReanimatedSwipeable>
      ) : (
        row
      )}
    </Reanimated.View>
  );
}
