import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';

/** Font-family names — Inter as the cross-platform premium choice. */
export const Font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
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
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
}

/** Tabular-figures style for money. */
export const tabularNums = { fontVariant: ['tabular-nums' as const] };
