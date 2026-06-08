import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import { money, MoneyOptions } from '@/lib/money';
import { useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';

export interface MoneyTextProps {
  value: number;
  size?: number;
  weight?: keyof typeof Font;
  color?: string;
  /** Color positive green / keep negative neutral, and prefix +/−. */
  sign?: boolean;
  paise?: boolean;
  dim?: boolean;
  style?: StyleProp<TextStyle>;
}

export function MoneyText({
  value,
  size = 16,
  weight = 'semibold',
  color,
  sign = false,
  paise = false,
  dim = false,
  style,
}: MoneyTextProps) {
  const t = useTheme();
  let resolved = color;
  if (!resolved) {
    if (sign && value > 0) resolved = t.success;
    else if (sign && value < 0) resolved = t.ink;
    else resolved = dim ? t.ink2 : t.ink;
  }
  return (
    <Text
      style={[
        {
          fontFamily: Font[weight],
          fontSize: size,
          color: resolved,
          letterSpacing: size >= 28 ? -1 : -0.3,
        },
        tabularNums,
        style,
      ]}
    >
      {money(value, { sign, paise })}
    </Text>
  );
}
