import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { categoryStyle } from '@/lib/categories';
import { hexA } from '@/theme';

export interface CategoryIconProps {
  /** Category name (resolves icon + color from the fallback map). */
  name?: string | null;
  /** Override icon (e.g. backend Ionicons glyph). */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Override color (e.g. backend hex). */
  color?: string;
  size?: number;
  radius?: number;
}

export function CategoryIcon({ name, icon, color, size = 44, radius }: CategoryIconProps) {
  const style = categoryStyle(name);
  const c = color ?? style.color;
  const glyph = icon ?? style.icon;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size * 0.32,
        backgroundColor: hexA(c, 0.14),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={glyph} size={size * 0.5} color={c} />
    </View>
  );
}
