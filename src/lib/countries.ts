import type { CountryReference, PaymentHandleType } from '@/api';

/**
 * The countries Spendes accepts sign-ups from, shipped with the app.
 *
 * The server owns the real list (`GET /reference/countries`) and validates against
 * it, but the sign-up screen needs a country picker *before* there's an account or
 * necessarily a connection — so this is the offline copy, refreshed from the server
 * when that call succeeds. A build that ships before a new market opens still picks
 * it up without a store update.
 *
 * Keep in sync with `common/reference/countries.ts` on the server.
 */
export const COUNTRIES: CountryReference[] = [
  c('IN', 'India', '+91', '🇮🇳', 'INR', '₹', [10], 'upi', 'Asia/Kolkata'),
  c('US', 'United States', '+1', '🇺🇸', 'USD', '$', [10], 'venmo', 'America/New_York'),
  c('CA', 'Canada', '+1', '🇨🇦', 'CAD', 'CA$', [10], 'paypal', 'America/Toronto'),
  c('GB', 'United Kingdom', '+44', '🇬🇧', 'GBP', '£', [10], 'paypal', 'Europe/London'),
  c('AU', 'Australia', '+61', '🇦🇺', 'AUD', 'A$', [9], 'paypal', 'Australia/Sydney'),
  c('NZ', 'New Zealand', '+64', '🇳🇿', 'NZD', 'NZ$', [8, 9, 10], 'paypal', 'Pacific/Auckland'),
  c('AE', 'United Arab Emirates', '+971', '🇦🇪', 'AED', 'AED', [9], 'other', 'Asia/Dubai'),
  c('SG', 'Singapore', '+65', '🇸🇬', 'SGD', 'S$', [8], 'paypal', 'Asia/Singapore'),
  c('IE', 'Ireland', '+353', '🇮🇪', 'EUR', '€', [9], 'paypal', 'Europe/Dublin'),
  c('DE', 'Germany', '+49', '🇩🇪', 'EUR', '€', [10, 11], 'paypal', 'Europe/Berlin'),
  c('FR', 'France', '+33', '🇫🇷', 'EUR', '€', [9], 'paypal', 'Europe/Paris'),
  c('NL', 'Netherlands', '+31', '🇳🇱', 'EUR', '€', [9], 'paypal', 'Europe/Amsterdam'),
  c('ES', 'Spain', '+34', '🇪🇸', 'EUR', '€', [9], 'paypal', 'Europe/Madrid'),
  c('IT', 'Italy', '+39', '🇮🇹', 'EUR', '€', [9, 10], 'paypal', 'Europe/Rome'),
  c('PT', 'Portugal', '+351', '🇵🇹', 'EUR', '€', [9], 'paypal', 'Europe/Lisbon'),
  c('BE', 'Belgium', '+32', '🇧🇪', 'EUR', '€', [9], 'paypal', 'Europe/Brussels'),
  c('CH', 'Switzerland', '+41', '🇨🇭', 'CHF', 'CHF', [9], 'paypal', 'Europe/Zurich'),
  c('AT', 'Austria', '+43', '🇦🇹', 'EUR', '€', [10, 11], 'paypal', 'Europe/Vienna'),
  c('SE', 'Sweden', '+46', '🇸🇪', 'SEK', 'kr', [9], 'paypal', 'Europe/Stockholm'),
  c('NO', 'Norway', '+47', '🇳🇴', 'NOK', 'kr', [8], 'paypal', 'Europe/Oslo'),
  c('DK', 'Denmark', '+45', '🇩🇰', 'DKK', 'kr', [8], 'paypal', 'Europe/Copenhagen'),
  c('FI', 'Finland', '+358', '🇫🇮', 'EUR', '€', [9, 10], 'paypal', 'Europe/Helsinki'),
  c('PL', 'Poland', '+48', '🇵🇱', 'PLN', 'zł', [9], 'paypal', 'Europe/Warsaw'),
  c('SA', 'Saudi Arabia', '+966', '🇸🇦', 'SAR', 'SAR', [9], 'other', 'Asia/Riyadh'),
  c('QA', 'Qatar', '+974', '🇶🇦', 'QAR', 'QAR', [8], 'other', 'Asia/Qatar'),
  c('KW', 'Kuwait', '+965', '🇰🇼', 'KWD', 'KD', [8], 'other', 'Asia/Kuwait'),
  c('OM', 'Oman', '+968', '🇴🇲', 'OMR', 'OMR', [8], 'other', 'Asia/Muscat'),
  c('BH', 'Bahrain', '+973', '🇧🇭', 'BHD', 'BD', [8], 'other', 'Asia/Bahrain'),
  c('IL', 'Israel', '+972', '🇮🇱', 'ILS', '₪', [9], 'paypal', 'Asia/Jerusalem'),
  c('TR', 'Türkiye', '+90', '🇹🇷', 'TRY', '₺', [10], 'paypal', 'Europe/Istanbul'),
  c('MY', 'Malaysia', '+60', '🇲🇾', 'MYR', 'RM', [9, 10], 'paypal', 'Asia/Kuala_Lumpur'),
  c('ID', 'Indonesia', '+62', '🇮🇩', 'IDR', 'Rp', [9, 10, 11, 12], 'other', 'Asia/Jakarta'),
  c('PH', 'Philippines', '+63', '🇵🇭', 'PHP', '₱', [10], 'paypal', 'Asia/Manila'),
  c('TH', 'Thailand', '+66', '🇹🇭', 'THB', '฿', [9], 'other', 'Asia/Bangkok'),
  c('VN', 'Vietnam', '+84', '🇻🇳', 'VND', '₫', [9, 10], 'other', 'Asia/Ho_Chi_Minh'),
  c('HK', 'Hong Kong', '+852', '🇭🇰', 'HKD', 'HK$', [8], 'paypal', 'Asia/Hong_Kong'),
  c('JP', 'Japan', '+81', '🇯🇵', 'JPY', '¥', [10], 'paypal', 'Asia/Tokyo'),
  c('KR', 'South Korea', '+82', '🇰🇷', 'KRW', '₩', [9, 10], 'other', 'Asia/Seoul'),
  c('CN', 'China', '+86', '🇨🇳', 'CNY', '¥', [11], 'other', 'Asia/Shanghai'),
  c('PK', 'Pakistan', '+92', '🇵🇰', 'PKR', '₨', [10], 'other', 'Asia/Karachi'),
  c('BD', 'Bangladesh', '+880', '🇧🇩', 'BDT', '৳', [10], 'other', 'Asia/Dhaka'),
  c('LK', 'Sri Lanka', '+94', '🇱🇰', 'LKR', 'Rs', [9], 'other', 'Asia/Colombo'),
  c('NP', 'Nepal', '+977', '🇳🇵', 'NPR', 'Rs', [10], 'other', 'Asia/Kathmandu'),
  c('ZA', 'South Africa', '+27', '🇿🇦', 'ZAR', 'R', [9], 'paypal', 'Africa/Johannesburg'),
  c('NG', 'Nigeria', '+234', '🇳🇬', 'NGN', '₦', [10], 'other', 'Africa/Lagos'),
  c('KE', 'Kenya', '+254', '🇰🇪', 'KES', 'KSh', [9], 'other', 'Africa/Nairobi'),
  c('EG', 'Egypt', '+20', '🇪🇬', 'EGP', 'E£', [10], 'other', 'Africa/Cairo'),
  c('BR', 'Brazil', '+55', '🇧🇷', 'BRL', 'R$', [10, 11], 'paypal', 'America/Sao_Paulo'),
  c('AR', 'Argentina', '+54', '🇦🇷', 'ARS', 'AR$', [10], 'paypal', 'America/Argentina/Buenos_Aires'),
  c('MX', 'Mexico', '+52', '🇲🇽', 'MXN', 'MX$', [10], 'paypal', 'America/Mexico_City'),
];

function c(
  code: string,
  name: string,
  dialCode: string,
  flag: string,
  currency: string,
  currencySymbol: string,
  phoneLengths: number[],
  defaultHandle: PaymentHandleType,
  timezone: string,
): CountryReference {
  return { code, name, dialCode, flag, currency, currencySymbol, phoneLengths, defaultHandle, timezone };
}

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function findCountry(code?: string | null, list: CountryReference[] = COUNTRIES) {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return list.find((country) => country.code === upper);
}

/**
 * The country to preselect: whatever the device's locale/timezone says, falling
 * back to India. Guessing right saves a scroll for almost everyone, and guessing
 * wrong costs one tap — which is why the picker is always visible, never hidden
 * behind the guess.
 */
export function guessCountry(list: CountryReference[] = COUNTRIES): CountryReference {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const byZone = list.find((country) => country.timezone === timezone);
    if (byZone) return byZone;

    // Fall back to the region in the device locale, e.g. `en-US` → US.
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    const region = locale.split('-').pop()?.toUpperCase();
    const byRegion = region ? findCountry(region, list) : undefined;
    if (byRegion) return byRegion;
  } catch {
    // Intl is unavailable or odd — the default is a perfectly good answer.
  }
  return list[0] ?? DEFAULT_COUNTRY;
}

/** The device's IANA zone, sent at sign-up so budgets use the user's own month. */
export function deviceTimezone(fallback = 'Asia/Kolkata'): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

/**
 * A greyed-out example number of the right shape for this country, so the field
 * shows what's expected before a single digit is typed.
 */
export function examplePhone(country: CountryReference): string {
  const length = Math.max(...country.phoneLengths);
  const digits = (country.dialCode === '+1' ? '5551234567890' : '9876543210987').slice(0, length);
  return formatNationalNumber(digits, country);
}

/** Formats a national number for display, grouped the way that country writes it. */
export function formatNationalNumber(digits: string, country: CountryReference): string {
  if (!digits) return '';
  if (country.dialCode === '+1' && digits.length > 3) {
    const area = digits.slice(0, 3);
    const rest = digits.slice(3);
    return rest.length > 3 ? `(${area}) ${rest.slice(0, 3)}-${rest.slice(3)}` : `(${area}) ${rest}`;
  }
  if (country.code === 'IN' && digits.length > 5) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  // A generic, readable grouping for everywhere else.
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}
