// Receipt photos and 1099 totals (task 1150 part 1), the pure parts.

import { isCurrency, toCurrency, type Currency } from "@/lib/currency";

/** currency: USD or CAD only when the receipt prints it (a bare "$" says nothing), else null = use the home currency. */
/** tax: the GST/HST printed on the receipt (absent when none is shown or it wasn't asked for); amount stays the TOTAL. */
/** provTax: the QST (TVQ) printed on the receipt, read only for a Quebec QST registrant (absent otherwise). */
export interface ReceiptRead { vendor: string; date: string; amount: number; tax?: number; provTax?: number; currency: Currency | null; category: string; description: string; confident: boolean }

/** What the assistant read, made safe: a real date (else today), a positive amount (else 0), short text. */
export function cleanReceiptRead(raw: unknown, today: string): ReceiptRead {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const date = str(r.date, 10);
  const okDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && date <= today && date >= "2000-01-01";
  const amount = Number(String(r.amount ?? "").replace(/[^0-9.]/g, ""));
  const total = Number.isFinite(amount) && amount > 0 && amount < 1_000_000 ? Math.round(amount * 100) / 100 : 0;
  const tax = Number(String(r.tax ?? "").replace(/[^0-9.]/g, ""));
  // Only a tax smaller than the total makes sense; anything else is dropped rather than guessed.
  const okTax = Number.isFinite(tax) && tax > 0 && tax < total;
  const ptax = Number(String(r.provTax ?? "").replace(/[^0-9.]/g, ""));
  // The QST too must leave something of the total once both taxes are taken off.
  const okProv = Number.isFinite(ptax) && ptax > 0 && ptax + (okTax ? tax : 0) < total;
  return {
    vendor: str(r.vendor, 120),
    date: okDate ? date : today,
    amount: total,
    ...(okTax ? { tax: Math.round(tax * 100) / 100 } : {}),
    ...(okProv ? { provTax: Math.round(ptax * 100) / 100 } : {}),
    currency: isCurrency(r.currency) ? toCurrency(r.currency) : null,
    category: str(r.category, 60),
    description: str(r.description, 200),
    confident: r.confident === true && okDate && amount > 0,
  };
}

/** The same payee however it was typed: "Jane Doe Design, LLC" and "jane doe design llc" match. */
export const payeeKey = (name: string) => name.toLowerCase().replace(/[.,]/g, "").replace(/\b(llc|inc|co|corp|ltd)\b/g, "").replace(/\s+/g, " ").trim();

/** The IRS 1099-NEC/MISC reporting threshold for payments made in a year: $600 through 2025, $2,000 from 2026
 *  (One Big Beautiful Bill Act; adjusted for inflation from 2027, so later years show $2,000 marked "check"). */
export function threshold1099(year: number): { amount: number; check: boolean } {
  if (year <= 2025) return { amount: 600, check: false };
  return { amount: 2000, check: year >= 2027 };
}
