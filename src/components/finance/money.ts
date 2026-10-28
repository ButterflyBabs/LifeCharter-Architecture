"use client";

import { formatMoney, otherCurrency, toCurrency, type Currency } from "@/lib/currency";
import { useHomeCurrency } from "@/components/money/useHomeCurrency";

// Finance pages and money in two currencies (task 1520). Totals from the finance APIs are in the account's home
// currency; when the other currency has money, responses carry it separately as `other` (null or absent otherwise).
// Nothing here adds the two together.

/** The `other` block a finance response carries: `{ currency, mtd: {...}, ytd: {...}, ... }`, or null/absent. */
export type OtherBlock = ({ currency?: string } & Record<string, unknown>) | null | undefined;

/** The home currency, whether USD/CAD pickers show, and a formatter (whole dollars unless cents is true). */
export function useMoney() {
  const { currency: home, canChoose } = useHomeCurrency();
  const money = (n: number | string | null | undefined, currency: Currency | string = home, cents = false) =>
    formatMoney(Number(n ?? 0) || 0, currency, { home, cents });
  return { home, canChoose, money };
}

/** The other block's currency (the non-home one when the block does not say). */
export function otherCur(other: OtherBlock, home: Currency): Currency {
  return toCurrency(other?.currency, otherCurrency(home));
}

/** A number inside the other block by dotted path ("mtd.income"); the first path that holds a number wins. */
export function otherNum(other: OtherBlock, ...paths: string[]): number | null {
  if (!other) return null;
  for (const p of paths) {
    let v: unknown = other;
    for (const k of p.split(".")) v = v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined;
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return null;
}

/** The other currency's amount at that path, formatted ("CA$300"), or null when it is zero or missing. */
export function otherText(other: OtherBlock, home: Currency, paths: string | string[], opts: { cents?: boolean; signed?: boolean } = {}): string | null {
  const n = otherNum(other, ...(Array.isArray(paths) ? paths : [paths]));
  if (n === null || n === 0) return null;
  const s = formatMoney(opts.signed ? Math.abs(n) : n, otherCur(other, home), { home, cents: opts.cents ?? false });
  return opts.signed ? `${n >= 0 ? "+" : "−"}${s}` : s;
}

/** "CA$300 in · CA$120 out" for a period block in the other currency ("mtd", "ytd", "month"), or null. */
export function otherInOut(other: OtherBlock, home: Currency, period: string | string[], cents = false): string | null {
  const ps = Array.isArray(period) ? period : [period];
  const inc = otherText(other, home, ps.map((p) => `${p}.income`), { cents });
  const exp = otherText(other, home, ps.map((p) => `${p}.expense`), { cents });
  if (!inc && !exp) return null;
  return [inc && `${inc} in`, exp && `${exp} out`].filter(Boolean).join(" · ");
}
