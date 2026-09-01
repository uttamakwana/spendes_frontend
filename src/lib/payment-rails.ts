import type { Ionicons } from '@expo/vector-icons';

import type { PaymentHandleType } from '@/api';

/**
 * The settle-up rails, from the payee's side: what to call each one, what a handle
 * on it looks like, and how to check one before the server does.
 *
 * Mirrors `common/reference/countries.ts` + `users.validation.ts` on the server —
 * the app validates so a typo is caught while the keyboard is still open, and the
 * server validates because it must.
 */
export interface PaymentRail {
  type: PaymentHandleType;
  label: string;
  /** What to call the handle itself, in a field label. */
  fieldLabel: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** One line on who this is for, shown under the picker. */
  hint: string;
  /** The currency this rail settles in, or undefined when it handles any. */
  currency?: string;
  validate: (value: string) => boolean;
}

const UPI_VPA = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const USERNAME = /^[a-zA-Z0-9._-]{2,64}$/;

export const PAYMENT_RAILS: Record<PaymentHandleType, PaymentRail> = {
  upi: {
    type: 'upi',
    label: 'UPI',
    fieldLabel: 'UPI ID',
    placeholder: 'name@okhdfcbank',
    icon: 'phone-portrait-outline',
    hint: 'Friends with any UPI app can pay you in one tap.',
    currency: 'INR',
    validate: (v) => UPI_VPA.test(v.trim()),
  },
  paypal: {
    type: 'paypal',
    label: 'PayPal',
    fieldLabel: 'PayPal.me username',
    placeholder: 'janedoe',
    icon: 'logo-paypal',
    hint: 'Works worldwide, in any currency.',
    validate: (v) => USERNAME.test((v.trim().split('/').filter(Boolean).pop() ?? '')),
  },
  venmo: {
    type: 'venmo',
    label: 'Venmo',
    fieldLabel: 'Venmo username',
    placeholder: '@jane-doe',
    icon: 'cash-outline',
    hint: 'US only, and settles in dollars.',
    currency: 'USD',
    validate: (v) => USERNAME.test(v.trim().replace(/^@/, '')),
  },
  cashapp: {
    type: 'cashapp',
    label: 'Cash App',
    fieldLabel: '$Cashtag',
    placeholder: '$janedoe',
    icon: 'card-outline',
    hint: 'US only, and settles in dollars.',
    currency: 'USD',
    validate: (v) => USERNAME.test(v.trim().replace(/^\$/, '')),
  },
  other: {
    type: 'other',
    label: 'Something else',
    fieldLabel: 'Payment details',
    placeholder: 'Bank reference, Revolut tag…',
    icon: 'ellipsis-horizontal-circle-outline',
    hint: 'Shown to friends to copy — we can’t open an app for this one.',
    validate: (v) => v.trim().length >= 2,
  },
};

/** The rails offered in the picker, most linkable first. */
export const RAIL_ORDER: PaymentHandleType[] = ['upi', 'paypal', 'venmo', 'cashapp', 'other'];

/** Whether a rail can settle a balance in `currency` — mirrors the server's rule. */
export function railHandlesCurrency(type: PaymentHandleType, currency?: string | null): boolean {
  const rail = PAYMENT_RAILS[type];
  if (!rail.currency || !currency) return true;
  return rail.currency === currency.toUpperCase();
}
