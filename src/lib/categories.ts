import type { Ionicons } from '@expo/vector-icons';

import { CAT_VIZ } from '@/theme/colors';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface CategoryStyle {
  icon: IoniconName;
  color: string;
}

/**
 * Curated fallback styling for common category names. The backend also stores an
 * Ionicons glyph + hex color per category — prefer those when available and fall
 * back to this map (keyed by lowercased name) so personal-expense category
 * strings still render with a sensible icon + color.
 */
const MAP: Record<string, CategoryStyle> = {
  food: { icon: 'restaurant', color: '#DB7C5A' },
  'food & dining': { icon: 'restaurant', color: '#DB7C5A' },
  dining: { icon: 'restaurant', color: '#DB7C5A' },
  groceries: { icon: 'cart', color: '#5B9279' },
  transport: { icon: 'car', color: '#5C7AEA' },
  travel: { icon: 'airplane', color: '#4FA8A0' },
  shopping: { icon: 'bag-handle', color: '#C77DB1' },
  rent: { icon: 'home', color: '#8B7EC8' },
  'rent & home': { icon: 'home', color: '#8B7EC8' },
  home: { icon: 'home', color: '#8B7EC8' },
  bills: { icon: 'receipt', color: '#6BA4B8' },
  'bills & utilities': { icon: 'receipt', color: '#6BA4B8' },
  utilities: { icon: 'receipt', color: '#6BA4B8' },
  entertainment: { icon: 'film', color: '#E0A458' },
  fun: { icon: 'film', color: '#E0A458' },
  health: { icon: 'medkit', color: '#C96868' },
  healthcare: { icon: 'medkit', color: '#C96868' },
  investments: { icon: 'trending-up', color: '#7E8CE0' },
  invest: { icon: 'trending-up', color: '#7E8CE0' },
  emi: { icon: 'repeat', color: '#9C7B5A' },
  'emi & loans': { icon: 'repeat', color: '#9C7B5A' },
  loan: { icon: 'repeat', color: '#9C7B5A' },
  salary: { icon: 'briefcase', color: '#16A34A' },
  income: { icon: 'briefcase', color: '#16A34A' },
};

const FALLBACK: CategoryStyle = { icon: 'pricetag', color: '#6BA4B8' };

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CAT_VIZ[h % CAT_VIZ.length];
}

/** Resolve an icon + color for a category by name (case-insensitive). */
export function categoryStyle(name?: string | null): CategoryStyle {
  if (!name) return FALLBACK;
  const key = name.trim().toLowerCase();
  if (MAP[key]) return MAP[key];
  return { icon: FALLBACK.icon, color: hashColor(key) };
}

/** Normalize an arbitrary icon string (from API) to a valid Ionicons name. */
export function asIonicon(icon?: string | null, fallback?: string): IoniconName {
  const candidate = (icon ?? '').trim() as IoniconName;
  // We can't validate against glyphMap cheaply at runtime for every name, so we
  // trust the backend's Ionicons names and fall back to a category style.
  if (candidate) return candidate;
  return categoryStyle(fallback).icon;
}

export const PAYMENT_METHOD_ICON: Record<string, IoniconName> = {
  upi: 'phone-portrait',
  card: 'card',
  cash: 'cash',
  bank_transfer: 'business',
  bank: 'business',
  wallet: 'wallet',
  other: 'ellipsis-horizontal',
};
