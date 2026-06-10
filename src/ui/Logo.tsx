import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { useTheme } from '@/theme';
import { Txt } from './Text';

/**
 * The Spendes mark — an "S" seam that reads as splitting/sharing. Pure vector,
 * recolorable via `color`. Mirrors `assets/spendes-mark.svg`; kept inline so we
 * don't need an SVG-to-component transformer for the few in-app placements.
 * The store/adaptive/splash PNGs are wired separately in `app.json`.
 */
function markXml(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <mask id="seam" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <rect width="100" height="100" fill="#fff"/>
      <rect x="27" y="46" width="46" height="8" rx="4" fill="#000" transform="rotate(-48 50 50)"/>
    </mask>
  </defs>
  <path d="M70 31 C70 21 61 17 50 17 C39 17 30 22 30 32 C30 42 39 46 50 50 C61 54 70 58 70 68 C70 78 61 83 50 83 C39 83 30 78 30 68" fill="none" stroke="${color}" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" mask="url(#seam)"/>
</svg>`;
}

export function Logo({ size = 28, color }: { size?: number; color?: string }) {
  const t = useTheme();
  return <SvgXml xml={markXml(color ?? t.accent)} width={size} height={size} />;
}

/**
 * Horizontal lockup: the mark + "Spendes" set in the app's own Inter face, so
 * the wordmark stays pixel-consistent with the rest of the UI (the baked-text
 * SVG lockups in `assets/` are for web/store surfaces where Inter is present).
 * `onDark` renders the white-on-dark variant.
 */
export function Wordmark({
  size = 28,
  onDark = false,
  style,
}: {
  size?: number;
  onDark?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      <Logo size={size} color={onDark ? '#FFFFFF' : undefined} />
      <Txt variant="title3" color={onDark ? '#FFFFFF' : undefined}>
        Spendes
      </Txt>
    </View>
  );
}
