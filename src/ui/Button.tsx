import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Txt } from './Text';

type Variant = 'primary' | 'soft' | 'neutral' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  full = true,
  disabled,
  loading,
  haptic = true,
  style,
}: ButtonProps) {
  const t = useTheme();
  const height = size === 'lg' ? 56 : size === 'sm' ? 40 : 50;
  const fontSize = size === 'lg' ? 17 : 16;

  const palette: Record<Variant, { bg: string; fg: string; border?: string; shadow?: object }> = {
    primary: { bg: t.accent, fg: t.onAccent, shadow: disabled ? undefined : t.shadowMd },
    soft: { bg: t.accentSoft, fg: t.accent },
    neutral: { bg: t.fill, fg: t.ink },
    ghost: { bg: 'transparent', fg: t.accent },
    outline: { bg: 'transparent', fg: t.ink, border: t.line },
    danger: { bg: t.dangerBg, fg: t.danger },
  };
  const p = palette[variant];

  const handle = () => {
    if (disabled || loading) return;
    if (haptic) haptics.medium();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height,
          width: full ? '100%' : undefined,
          borderRadius: t.radius.btn,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: full ? 0 : 20,
          backgroundColor: p.bg,
          borderWidth: p.border ? 1.5 : 0,
          borderColor: p.border,
          opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        variant === 'primary' && !disabled ? t.shadowMd : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={19} color={p.fg} />}
          {typeof children === 'string' ? (
            <Txt color={p.fg} style={{ fontFamily: Font.semibold, fontSize }}>
              {children}
            </Txt>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  );
}

/** Circular icon button. */
export function IconButton({
  name,
  onPress,
  size = 38,
  iconSize,
  color,
  bg,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  bg?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg ?? t.fill,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={name} size={iconSize ?? size * 0.5} color={color ?? t.ink} />
    </Pressable>
  );
}

export { hexA };
