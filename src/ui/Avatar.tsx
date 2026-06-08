import React from 'react';
import { View } from 'react-native';

import { CAT_VIZ, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Txt } from './Text';

const PALETTE = ['#DB7C5A', '#5B9279', '#C77DB1', '#6BA4B8', '#E0A458', '#8B7EC8', '#5C7AEA', '#C96868'];

export function initialsOf(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function colorOf(seed?: string | null): string {
  const s = seed ?? '';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export interface AvatarProps {
  name?: string | null;
  /** Stable seed for color (e.g. id); defaults to name. */
  seed?: string | null;
  size?: number;
  /** Render as "you" with the brand accent. */
  me?: boolean;
  ring?: boolean;
  dim?: boolean;
}

export function Avatar({ name, seed, size = 40, me, ring, dim }: AvatarProps) {
  const t = useTheme();
  const bg = dim ? t.fill2 : me ? t.accent : colorOf(seed ?? name);
  const fg = dim ? t.ink2 : '#fff';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        ...(ring ? { borderWidth: 2.5, borderColor: t.surface } : {}),
      }}
    >
      <Txt
        color={fg}
        style={{ fontFamily: Font.semibold, fontSize: size * 0.38, lineHeight: size * 0.46 }}
      >
        {me ? 'You'.slice(0, 2).toUpperCase() : initialsOf(name)}
      </Txt>
    </View>
  );
}

export interface AvatarStackProps {
  members: { id: string; name?: string | null; me?: boolean }[];
  size?: number;
  max?: number;
}

export function AvatarStack({ members, size = 28, max = 4 }: AvatarStackProps) {
  const t = useTheme();
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((m, i) => (
        <View key={m.id} style={{ marginLeft: i ? -size * 0.32 : 0, zIndex: shown.length - i }}>
          <Avatar name={m.name} seed={m.id} me={m.me} size={size} ring />
        </View>
      ))}
      {extra > 0 && (
        <View
          style={{
            marginLeft: -size * 0.32,
            width: size,
            height: size,
            borderRadius: 999,
            backgroundColor: t.fill2,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2.5,
            borderColor: t.surface,
          }}
        >
          <Txt tone="ink2" style={{ fontFamily: Font.semibold, fontSize: size * 0.36 }}>
            +{extra}
          </Txt>
        </View>
      )}
    </View>
  );
}

export { CAT_VIZ };
