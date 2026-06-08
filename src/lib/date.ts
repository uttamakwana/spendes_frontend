/** Today as a `YYYY-MM-DD` string. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` for `months` from today (used for goal deadlines). */
export function monthsFromNowISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
