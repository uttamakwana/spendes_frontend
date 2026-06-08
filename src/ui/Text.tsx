import React from 'react';
import { StyleProp, StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Font, Type, TypeVariant } from '@/theme/fonts';

type InkTone = 'ink' | 'ink2' | 'ink3' | 'accent' | 'success' | 'danger' | 'warning';

export interface TxtProps extends TextProps {
  variant?: TypeVariant;
  tone?: InkTone;
  color?: string;
  weight?: keyof typeof Font;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export function Txt({
  variant = 'body',
  tone = 'ink',
  color,
  weight,
  center,
  style,
  children,
  ...rest
}: TxtProps) {
  const t = useTheme();
  const v = Type[variant];
  const resolvedColor =
    color ??
    (tone === 'accent'
      ? t.accent
      : tone === 'success'
        ? t.success
        : tone === 'danger'
          ? t.danger
          : tone === 'warning'
            ? t.warning
            : t[tone]);

  // If a call site overrides fontSize via `style`, scale the line-height to match
  // so tall glyphs (large numerals) aren't clipped at the top. An explicit
  // lineHeight in `style` always wins.
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const effFontSize = typeof flat?.fontSize === 'number' ? flat.fontSize : v.fontSize;
  const effLineHeight =
    typeof flat?.lineHeight === 'number'
      ? flat.lineHeight
      : effFontSize === v.fontSize
        ? v.lineHeight
        : Math.round(effFontSize * 1.25);

  return (
    <RNText
      allowFontScaling
      style={[
        {
          fontFamily: Font[weight ?? v.weight],
          fontSize: v.fontSize,
          lineHeight: effLineHeight,
          color: resolvedColor,
          letterSpacing: effFontSize >= 22 ? -0.5 : 0,
        },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
