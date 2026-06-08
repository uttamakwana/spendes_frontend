/**
 * Indian-rupee money formatting (lakh/crore grouping) with tabular figures.
 * The backend sends amounts in major units (rupees, 2dp) — no paise integers.
 */

const RUPEE = '₹';

function fmtAbs(n: number, paise: boolean): string {
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const s = String(whole);
  let grouped: string;
  if (s.length <= 3) {
    grouped = s;
  } else {
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    grouped = rest + ',' + last3;
  }
  if (paise) {
    const dec = abs.toFixed(2).split('.')[1];
    grouped += '.' + dec;
  }
  return grouped;
}

export interface MoneyOptions {
  /** Prefix with +/− instead of just − for negatives. */
  sign?: boolean;
  /** Show two decimal places. */
  paise?: boolean;
}

/** Format a number as ₹ with Indian grouping. */
export function money(n: number, opts: MoneyOptions = {}): string {
  const { sign = false, paise = false } = opts;
  const neg = n < 0;
  const body = fmtAbs(n, paise);
  const prefix = sign ? (neg ? '−' : '+') : neg ? '−' : '';
  return prefix + RUPEE + body;
}

/** Compact format for large figures (e.g. ₹4.5L, ₹1.2Cr). */
export function moneyCompact(n: number): string {
  const abs = Math.abs(n);
  const neg = n < 0 ? '−' : '';
  if (abs >= 1e7) return `${neg}${RUPEE}${(abs / 1e7).toFixed(abs % 1e7 === 0 ? 0 : 1)}Cr`;
  if (abs >= 1e5) return `${neg}${RUPEE}${(abs / 1e5).toFixed(abs % 1e5 === 0 ? 0 : 1)}L`;
  if (abs >= 1e3) return `${neg}${RUPEE}${(abs / 1e3).toFixed(abs % 1e3 === 0 ? 0 : 1)}k`;
  return money(n);
}

export { RUPEE };
