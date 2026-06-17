import {
  AnekLatin_400Regular,
  AnekLatin_500Medium,
  AnekLatin_600SemiBold,
  AnekLatin_700Bold,
  AnekLatin_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/anek-latin';

/** Font-family names — Anek Latin as the app's typeface. */
export const Font = {
  regular: 'AnekLatin_400Regular',
  medium: 'AnekLatin_500Medium',
  semibold: 'AnekLatin_600SemiBold',
  bold: 'AnekLatin_700Bold',
  extrabold: 'AnekLatin_800ExtraBold',
} as const;

export type FontWeightKey = keyof typeof Font;

/** Type scale (size / lineHeight / weight). */
export const Type = {
  display: { fontSize: 42, lineHeight: 46, weight: 'bold' as FontWeightKey },
  title1: { fontSize: 30, lineHeight: 36, weight: 'bold' as FontWeightKey },
  title2: { fontSize: 22, lineHeight: 28, weight: 'bold' as FontWeightKey },
  title3: { fontSize: 18, lineHeight: 24, weight: 'bold' as FontWeightKey },
  headline: { fontSize: 16, lineHeight: 22, weight: 'semibold' as FontWeightKey },
  body: { fontSize: 15, lineHeight: 21, weight: 'regular' as FontWeightKey },
  callout: { fontSize: 14, lineHeight: 20, weight: 'regular' as FontWeightKey },
  caption: { fontSize: 12.5, lineHeight: 17, weight: 'medium' as FontWeightKey },
  micro: { fontSize: 11, lineHeight: 14, weight: 'medium' as FontWeightKey },
} as const;

export type TypeVariant = keyof typeof Type;

/** Load app fonts; returns [loaded, error]. */
export function useAppFonts() {
  return useFonts({
    AnekLatin_400Regular,
    AnekLatin_500Medium,
    AnekLatin_600SemiBold,
    AnekLatin_700Bold,
    AnekLatin_800ExtraBold,
  });
}

/** Tabular-figures style for money. */
export const tabularNums = { fontVariant: ['tabular-nums' as const] };
