// The decisions behind affiliate crediting and refunds, kept free of any database or Stripe call so they can be
// tested on their own (tests/affiliates.test.ts). affiliates.ts and affiliateStripe.ts apply them.

// The Command Suite implementation fee prices (Starter, Growth, VIP). Lines are also recognised by name,
// so a Payment Link made from another price still counts.
import { IMPLEMENTATION_PRICE_IDS } from "@/lib/stripeCatalog";
export { IMPLEMENTATION_PRICE_IDS };

const money = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------------------------
// 1. What a link earns on one payment
// ---------------------------------------------------------------------------------------------

// An affiliate link either earns on every credited payment ("all") or on the implementation fee only
// ("implementation"). Later subscription payments carry no implementation fee, so an implementation-only
// link earns nothing on them. Returns the amount the commission is worked out on, or credit: false.
export type CreditBasis = { credit: true; amount: number } | { credit: false; why: string };
export function creditBasis(commissionOn: string | null | undefined, amount: number, implementationAmount?: number | null): CreditBasis {
  if (commissionOn === "implementation") {
    if (!implementationAmount || !(implementationAmount > 0)) return { credit: false, why: "This link earns on the implementation fee only, and this payment has none." };
    // Never more than what was actually paid (a partly refunded payment credits its net).
    return { credit: true, amount: amount > 0 ? Math.min(implementationAmount, amount) : implementationAmount };
  }
  return { credit: true, amount };
}

// ---------------------------------------------------------------------------------------------
// 2. Recognising the implementation fee on a Stripe invoice or Checkout line
// ---------------------------------------------------------------------------------------------

type PriceRef = string | { id?: string | null; product?: string | { name?: string | null } | null } | null | undefined;
export type PaymentLine = {
  amount?: number | null; // invoice line: before discounts
  amount_total?: number | null; // Checkout line: what was paid for it
  description?: string | null;
  discount_amounts?: { amount?: number | null }[] | null;
  price?: PriceRef;
  pricing?: { price_details?: { price?: PriceRef } | null } | null;
};

const priceIdOf = (p: PriceRef): string | null => (typeof p === "string" ? p : p && typeof p === "object" ? p.id ?? null : null);
const productNameOf = (p: PriceRef): string => {
  const prod = p && typeof p === "object" ? p.product : null;
  return prod && typeof prod === "object" ? prod.name ?? "" : "";
};

export function isImplementationLine(line: PaymentLine): boolean {
  const ids = [priceIdOf(line.price), priceIdOf(line.pricing?.price_details?.price)].filter(Boolean) as string[];
  if (ids.some((id) => IMPLEMENTATION_PRICE_IDS.includes(id))) return true;
  const name = `${line.description ?? ""} ${productNameOf(line.price)} ${productNameOf(line.pricing?.price_details?.price)}`;
  return /implementation/i.test(name);
}

// What was paid toward the implementation fee on a set of lines, in dollars (after discounts), or null when none.
export function implementationFromLines(lines: PaymentLine[] | null | undefined): number | null {
  let cents = 0;
  let found = false;
  for (const l of lines ?? []) {
    if (!isImplementationLine(l)) continue;
    found = true;
    const discount = (l.discount_amounts ?? []).reduce((t, d) => t + (d?.amount ?? 0), 0);
    cents += l.amount_total != null ? l.amount_total : (l.amount ?? 0) - discount;
  }
  return found && cents > 0 ? money(cents / 100) : null;
}

// ---------------------------------------------------------------------------------------------
// 3. Dedupe: one sale per payment
// ---------------------------------------------------------------------------------------------

// The first invoice of a subscription bought through Checkout is credited under the Checkout session id (what the
// checkout handler uses), so the invoice event and the session event land on the same stripe_ref. Every later invoice
// is credited under its own invoice id, one sale per payment.
export function invoiceCreditRef(invoiceId: string, billingReason: string | null | undefined, sessionId: string | null | undefined): string {
  return billingReason === "subscription_create" && sessionId ? sessionId : invoiceId;
}

export const uniqueRefs = (refs: (string | null | undefined)[]): string[] => Array.from(new Set(refs.filter((r): r is string => typeof r === "string" && r.length > 0)));

// True when any of the ids that identify this payment is already on a credited sale.
export function alreadyCredited(refs: (string | null | undefined)[], existing: Iterable<string | null | undefined>): boolean {
  const have = new Set(Array.from(existing).filter(Boolean));
  return uniqueRefs(refs).some((r) => have.has(r));
}

// ---------------------------------------------------------------------------------------------
// 4. Refunds: void inside the hold, flag otherwise
// ---------------------------------------------------------------------------------------------

export type SaleForRefund = {
  status: string; // review | owed | paid | void
  payable_on: string | null; // first day the commission can be paid (null: no hold)
  refund_ref?: string | null;
  refund_note?: string | null;
};
export type RefundInfo = {
  id: string; // Stripe refund id
  date: string; // YYYY-MM-DD the refund was made
  full: boolean; // the whole payment is now refunded
  amount: number; // dollars refunded by this refund
};
export type RefundOutcome = { action: "none"; why: string } | { action: "void"; reason: string } | { action: "flag"; note: string };

// A refund made before the payable day happened inside the hold (the hold is the days before payable_on).
export const insideHold = (payableOn: string | null | undefined, refundDate: string): boolean => !!payableOn && refundDate < payableOn;

export function refundDecision(sale: SaleForRefund, refund: RefundInfo): RefundOutcome {
  if (sale.status === "void") return { action: "none", why: "Already void." };
  if (sale.refund_ref === refund.id || (sale.refund_note ?? "").includes(refund.id)) return { action: "none", why: "This refund was already handled." };
  const amt = `$${refund.amount.toFixed(2)}`;
  const tag = `Stripe refund ${refund.id}`;
  if (sale.status === "paid") {
    return { action: "flag", note: `Refunded after this commission was paid: the customer got ${amt} back on ${refund.date} (${tag}). The sale is unchanged; decide whether to recover or offset the commission.` };
  }
  if (insideHold(sale.payable_on, refund.date)) {
    if (refund.full) return { action: "void", reason: `The customer was refunded in full on ${refund.date} (${tag}), inside the payout hold, so no commission is due.` };
    return { action: "flag", note: `The customer was partly refunded ${amt} on ${refund.date} (${tag}), inside the payout hold. The commission is unchanged; adjust the amount or mark it void if needed.` };
  }
  const why = sale.payable_on ? "after the payout hold had ended" : "and no payout hold was set on this sale";
  return { action: "flag", note: `The customer was refunded ${amt} on ${refund.date} (${tag}), ${why}. It has not been paid yet; review it and mark it void if no commission is due.` };
}

export const mergeNote = (existing: string | null | undefined, note: string): string => (existing ? `${existing} | ${note}` : note).slice(0, 1000);
