import React from 'react';
import { View } from 'react-native';

import { money } from '@/lib/money';
import { hexA, useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';
import { Txt } from './Text';

/** Generic status pill. */
export function StatusPill({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg?: string;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: bg ?? hexA(color, t.dark ? 0.16 : 0.1),
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: color }} />
      <Txt style={{ fontFamily: Font.semibold, fontSize: 12 }} color={color}>
        {label}
      </Txt>
    </View>
  );
}

/**
 * Balance pill — encodes the universal money-direction semantics:
 * owed to you = green, you owe = red, settled = neutral gray.
 */
export function BalancePill({
  net,
  size = 'md',
  showLabel = true,
  currency,
}: {
  net: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  /** Render in this currency instead of the viewer's. */
  currency?: string | null;
}) {
  const t = useTheme();
  const settled = net === 0;
  const owed = net > 0;
  const color = settled ? t.ink2 : owed ? t.success : t.danger;
  return (
    <View style={{ alignItems: 'flex-end' }}>
      {showLabel && !settled && (
        <Txt tone="ink3" style={{ fontFamily: Font.medium, fontSize: 11 }}>
          {owed ? 'owes you' : 'you owe'}
        </Txt>
      )}
      <Txt
        color={color}
        style={[{ fontFamily: Font.semibold, fontSize: size === 'sm' ? 13 : 15 }, tabularNums]}
      >
        {settled ? 'settled' : money(Math.abs(net), { currency })}
      </Txt>
    </View>
  );
}

/** Category icon badge (soft-tinted square). */
