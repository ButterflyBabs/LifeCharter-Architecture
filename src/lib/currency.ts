/**
 * Money in more than one currency (task 1520). Each account has a home currency (USD or CAD, Settings), and every
 * priced or money row carries its own currency. Amounts in different currencies are never added together and never
 * converted: totals are kept per currency. Stored values are lowercase ("usd", "cad") to match Stripe.
 *
 * Display: an account whose home is USD sees "$1,200" and "CA$1,200"; a CAD account sees "$1,200" and "US$1,200".
 */

export type Currency = "usd" | "cad";
export const CURRENCIES: Currency[] = ["usd", "cad"];
export const CURRENCY_NAMES: Record<Currency, string> = { usd: "US dollars (USD)", cad: "Canadian dollars (CAD)" };

/** Babs only until the Eloise test passed (2026-10-28); now every account can pick CAD. */
export const MULTI_CURRENCY_OPEN_TO_ALL = true;

/** Any stored or posted value → a known currency ("CAD"/"cad" → cad; anything else → the fallback). */
export function toCurrency(v: unknown, fallback: Currency = "usd"): Currency {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  return (CURRENCIES as string[]).includes(s) ? (s as Currency) : fallback;
}

/** True when the value is a currency the Suite supports (for validating input). */
export function isCurrency(v: unknown): v is Currency {
  return typeof v === "string" && (CURRENCIES as string[]).includes(v.toLowerCase());
}

export function otherCurrency(home: Currency): Currency {
  return home === "cad" ? "usd" : "cad";
}

export type MoneyOpts = {
  /** The account's home currency; decides which currency gets the plain "$". Default USD. */
  home?: Currency;
  /** true = always 2 decimals, false = whole dollars, undefined = decimals only when there are cents. */
  cents?: boolean;
};

/** The one money formatter: an amount in dollars (not cents) in its own currency. */
export function formatMoney(n: number | string | null | undefined, currency: Currency | string = "usd", opts: MoneyOpts = {}): string {
  const v = typeof n === "string" ? Number(n) : n;
  if (v === null || v === undefined || !Number.isFinite(v)) return "";
  const cur = toCurrency(currency);
  const locale = (opts.home ?? "usd") === "cad" ? "en-CA" : "en-US";
  const decimals = opts.cents === true ? 2 : opts.cents === false ? 0 : Math.round(v * 100) % 100 === 0 ? 0 : 2;
  return v.toLocaleString(locale, { style: "currency", currency: cur.toUpperCase(), minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Same as formatMoney, for amounts stored in cents. */
export function formatCents(cents: number | null | undefined, currency: Currency | string = "usd", opts: MoneyOpts = {}): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "";
  return formatMoney(cents / 100, currency, opts);
}

/** Amounts kept apart by currency. */
export type Totals = Partial<Record<Currency, number>>;

export function sumByCurrency<T>(rows: T[], amount: (r: T) => number, currency: (r: T) => unknown): Totals {
  const out: Totals = {};
  for (const r of rows) {
    const a = Number(amount(r));
    if (!Number.isFinite(a)) continue;
    const c = toCurrency(currency(r));
    out[c] = (out[c] ?? 0) + a;
  }
  return out;
}

/** The currencies that have an amount, home first. */
export function totalsCurrencies(t: Totals, home: Currency = "usd"): Currency[] {
  return [home, otherCurrency(home)].filter((c) => (t[c] ?? 0) !== 0);
}

/** "$1,200 + CA$300": each currency on its own, home first; "$0" when empty. Never one combined number. */
export function formatTotals(t: Totals, home: Currency = "usd", opts: Omit<MoneyOpts, "home"> = {}): string {
  const cs = totalsCurrencies(t, home);
  if (!cs.length) return formatMoney(0, home, { ...opts, home });
  return cs.map((c) => formatMoney(t[c] ?? 0, c, { ...opts, home })).join(" + ");
}
