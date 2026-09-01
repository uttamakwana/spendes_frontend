/**
 * Money formatting for whatever currency the user actually has.
 *
 * Spendes stores one currency per record and never converts, so formatting is the
 * only thing that varies: an American sees `$1,250.50`, an Indian `₹1,250.50` with
 * lakh/crore grouping, a Japanese user `¥1,250` with no minor unit at all.
 *
 * The active currency is set once from the signed-in user (see `AuthProvider`)
 * rather than threaded through 50-odd call sites, because in this model it changes
 * only at sign-in. Anything that belongs to a *different* currency than the viewer's
 * — a group settling in USD while you keep your books in INR — passes `currency`
 * explicitly, which is why every helper takes the override.
 */

export interface CurrencyFormat {
  code: string;
  symbol: string;
  /** Minor-unit digits: 2 for most, 0 for JPY/KRW/IDR/VND, 3 for the dinars. */
  decimals: number;
  /** BCP-47 locale whose grouping suits the currency (INR groups in lakhs). */
  locale: string;
  /** Compact-form suffixes, largest first — lakh/crore in India, K/M/B elsewhere. */
  compact: { value: number; suffix: string }[];
}

const WESTERN_COMPACT = [
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
];

const INDIAN_COMPACT = [
  { value: 1e7, suffix: 'Cr' },
  { value: 1e5, suffix: 'L' },
  { value: 1e3, suffix: 'k' },
];

const base = (code: string, symbol: string, locale = 'en-US', decimals = 2): CurrencyFormat => ({
  code,
  symbol,
  decimals,
  locale,
  compact: WESTERN_COMPACT,
});

/** Mirrors `common/reference/currencies.ts` on the server. */
export const CURRENCIES: Record<string, CurrencyFormat> = {
  INR: { code: 'INR', symbol: '₹', decimals: 2, locale: 'en-IN', compact: INDIAN_COMPACT },
  USD: base('USD', '$'),
  CAD: base('CAD', 'CA$'),
  EUR: base('EUR', '€', 'de-DE'),
  GBP: base('GBP', '£', 'en-GB'),
  AUD: base('AUD', 'A$'),
  NZD: base('NZD', 'NZ$'),
  CHF: base('CHF', 'CHF', 'de-CH'),
  SEK: base('SEK', 'kr', 'sv-SE'),
  NOK: base('NOK', 'kr', 'nb-NO'),
  DKK: base('DKK', 'kr', 'da-DK'),
  PLN: base('PLN', 'zł', 'pl-PL'),
  AED: base('AED', 'AED'),
  SAR: base('SAR', 'SAR'),
  QAR: base('QAR', 'QAR'),
  KWD: base('KWD', 'KD', 'en-US', 3),
  OMR: base('OMR', 'OMR', 'en-US', 3),
  BHD: base('BHD', 'BD', 'en-US', 3),
  ILS: base('ILS', '₪'),
  TRY: base('TRY', '₺', 'tr-TR'),
  SGD: base('SGD', 'S$'),
  MYR: base('MYR', 'RM'),
  IDR: base('IDR', 'Rp', 'id-ID', 0),
  PHP: base('PHP', '₱'),
  THB: base('THB', '฿'),
  VND: base('VND', '₫', 'vi-VN', 0),
  HKD: base('HKD', 'HK$'),
  JPY: base('JPY', '¥', 'ja-JP', 0),
  KRW: base('KRW', '₩', 'ko-KR', 0),
  CNY: base('CNY', '¥'),
  PKR: { code: 'PKR', symbol: '₨', decimals: 2, locale: 'en-IN', compact: INDIAN_COMPACT },
  BDT: { code: 'BDT', symbol: '৳', decimals: 2, locale: 'en-IN', compact: INDIAN_COMPACT },
  LKR: { code: 'LKR', symbol: 'Rs', decimals: 2, locale: 'en-IN', compact: INDIAN_COMPACT },
  NPR: { code: 'NPR', symbol: 'Rs', decimals: 2, locale: 'en-IN', compact: INDIAN_COMPACT },
  ZAR: base('ZAR', 'R'),
  NGN: base('NGN', '₦'),
  KES: base('KES', 'KSh'),
  EGP: base('EGP', 'E£'),
  BRL: base('BRL', 'R$', 'pt-BR'),
  ARS: base('ARS', 'AR$', 'es-AR'),
  MXN: base('MXN', 'MX$', 'es-MX'),
};

/** A code we don't carry shows itself rather than a wrong symbol. */
export function currencyFormat(code?: string | null): CurrencyFormat {
  const key = code?.trim().toUpperCase();
  if (key && CURRENCIES[key]) return CURRENCIES[key];
  return { ...base(key ?? 'USD', key ? `${key} ` : '$') };
}

// ── The viewer's currency ────────────────────────────────────────────────────

let active: CurrencyFormat = CURRENCIES.INR;

/** Sets the currency every unqualified `money()` call renders in. */
export function setActiveCurrency(code?: string | null): void {
  active = currencyFormat(code);
}

/** The viewer's currency — for screens that need the symbol on its own. */
export function activeCurrency(): CurrencyFormat {
  return active;
}

export interface MoneyOptions {
  /** Prefix with +/− instead of just − for negatives. */
  sign?: boolean;
  /** Force the minor unit even for whole amounts. */
  paise?: boolean;
  /** Render in this currency instead of the viewer's (a group's own currency). */
  currency?: string | null;
}

/**
 * Formats an amount with its symbol and the grouping its locale expects.
 *
 * Whole amounts drop the minor unit (₹1,250 / $1,250) but fractional ones are
 * padded to the currency's precision, because "$42.5" reads like a typo where
 * "$42.50" reads like money. Currencies with no minor unit (¥, ₩) never show one.
 */
export function money(n: number, opts: MoneyOptions = {}): string {
  const { sign = false, paise = false, currency } = opts;
  const format = currency ? currencyFormat(currency) : active;
  const abs = Math.abs(n);
  const fractional = format.decimals > 0 && (paise || Math.abs(abs % 1) > Number.EPSILON);

  const body = abs.toLocaleString(format.locale, {
    minimumFractionDigits: fractional ? format.decimals : 0,
    maximumFractionDigits: format.decimals,
  });

  const prefix = sign ? (n < 0 ? '−' : '+') : n < 0 ? '−' : '';
  return `${prefix}${format.symbol}${body}`;
}

/**
 * Compact format for large figures. The thresholds are the currency's own: an
 * Indian reader expects ₹4.5L and ₹1.2Cr, everyone else $450K and $1.2M.
 */
export function moneyCompact(n: number, currency?: string | null): string {
  const format = currency ? currencyFormat(currency) : active;
  const abs = Math.abs(n);
  const neg = n < 0 ? '−' : '';

  for (const { value, suffix } of format.compact) {
    if (abs >= value) {
      const scaled = abs / value;
      // One decimal unless it lands exactly on the unit (₹4.5L, but ₹5L not ₹5.0L).
      const digits = abs % value === 0 ? 0 : 1;
      return `${neg}${format.symbol}${scaled.toFixed(digits)}${suffix}`;
    }
  }
  return money(n, { currency });
}

/**
 * Just the number, grouped for the currency's locale — for hero layouts that draw
 * the symbol separately at a different size. Beats `money().replace('₹','')`,
 * which quietly stopped working the moment the symbol wasn't a rupee.
 */
export function moneyAmount(n: number, opts: Omit<MoneyOptions, 'sign'> = {}): string {
  return money(Math.abs(n), opts).replace(
    (opts.currency ? currencyFormat(opts.currency) : active).symbol,
    '',
  );
}

/** The viewer's currency symbol, for input prefixes and bare labels. */
export function currencySymbol(currency?: string | null): string {
  return (currency ? currencyFormat(currency) : active).symbol;
}
