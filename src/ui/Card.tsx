import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  /** Apply the soft elevation shadow. */
  elevated?: boolean;
}

export function Card({ children, onPress, padding = 16, style, elevated = true }: CardProps) {
  const t = useTheme();
  const base: StyleProp<ViewStyle> = [
    {
      backgroundColor: t.surface,
      borderRadius: t.radius.card,
      padding,
      borderWidth: 1,
      borderColor: t.hair,
    },
    elevated ? t.shadow : null,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, pressed && { opacity: 0.92, transform: [{ scale: 0.992 }] }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}
