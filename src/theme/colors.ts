/**
 * Spendes design tokens — neutral premium minimalism.
 * Ported from the design prototype (theme.jsx) into a typed, RN-friendly theme.
 *
 * A neutral canvas does ~90% of the work; a single brand accent guides the eye.
 */

export type Accent = string;

/** Add an alpha channel to a hex color → `rgba(...)`. */
export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export interface Theme {
  dark: boolean;
  accent: string;

  // canvases / surfaces
  canvas: string;
  canvas2: string;
  surface: string;
  surface2: string;
  sheet: string;

  // ink (text)
  ink: string;
  ink2: string;
  ink3: string;

  // lines / fills
  line: string;
  hair: string;
  fill: string;
  fill2: string;

  // semantics
  success: string;
  successBg: string;
  danger: string;
  dangerBg: string;
  warning: string;
  info: string;

  // accent derivations
  onAccent: string;
  accentSoft: string;
  accentSoft2: string;

  // "premium" inverse card — a refined dark surface used for hero cards in BOTH
  // light and dark modes (so it never inverts to white-on-white), softer than #000.
  premium: string;
  onPremium: string;
  onPremiumDim: string;

  // elevation
  shadow: object;
  shadowMd: object;
  shadowLg: object;

  // radii
  radius: {
    card: number;
    btn: number;
    input: number;
    lg: number;
    sheet: number;
    pill: number;
  };
}

/** RN shadow helper (cross-platform-ish; elevation for Android). */
function shadow(opacity: number, radius: number, y: number, elevation: number) {
  return {
    shadowColor: '#101014',
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: y },
    elevation,
  };
}

export function makeTheme(accent: string, dark: boolean): Theme {
  return {
    dark,
    accent,

    canvas: dark ? '#0A0A0A' : '#FFFFFF',
    canvas2: dark ? '#0A0A0A' : '#FAFAFA',
    surface: dark ? '#18181B' : '#FFFFFF',
    surface2: dark ? '#1F1F23' : '#FAFAFA',
    sheet: dark ? '#18181B' : '#FFFFFF',

    ink: dark ? '#FAFAFA' : '#0A0A0A',
    ink2: dark ? '#A1A1AA' : '#52525B',
    ink3: dark ? '#71717A' : '#A1A1AA',

    line: dark ? '#27272A' : '#E4E4E7',
    hair: dark ? '#242427' : '#F0F0F1',
    fill: dark ? '#1C1C1F' : '#F4F4F5',
    fill2: dark ? '#27272A' : '#EFEFF1',

    success: dark ? '#34D399' : '#16A34A',
    successBg: dark ? 'rgba(52,211,153,0.13)' : 'rgba(22,163,74,0.10)',
    danger: dark ? '#F87171' : '#DC2626',
    dangerBg: dark ? 'rgba(248,113,113,0.13)' : 'rgba(220,38,38,0.09)',
    warning: dark ? '#FBBF24' : '#D97706',
    info: dark ? '#60A5FA' : '#2563EB',

    onAccent: '#FFFFFF',
    accentSoft: hexA(accent, dark ? 0.18 : 0.1),
    accentSoft2: hexA(accent, dark ? 0.26 : 0.16),

    premium: dark ? '#1C1C20' : '#1A1A1F',
    onPremium: '#FAFAFA',
    onPremiumDim: 'rgba(250,250,250,0.68)',

    shadow: dark ? shadow(0.5, 3, 1, 1) : shadow(0.06, 4, 1, 2),
    shadowMd: dark ? shadow(0.55, 12, 6, 6) : shadow(0.08, 14, 6, 6),
    shadowLg: dark ? shadow(0.6, 30, 16, 12) : shadow(0.16, 36, 20, 16),

    radius: { card: 16, btn: 12, input: 12, lg: 20, sheet: 28, pill: 999 },
  };
}

/** Curated brand accents offered in Settings. */
export const ACCENTS = ['#4F46E5', '#0E9F6E', '#2563EB', '#7C3AED', '#E0533D'];

/** Categorical data-viz palette that harmonizes with the neutral canvas. */
export const CAT_VIZ = [
  '#5C7AEA', '#DB7C5A', '#5B9279', '#C77DB1',
  '#E0A458', '#6BA4B8', '#8B7EC8', '#C96868',
];
