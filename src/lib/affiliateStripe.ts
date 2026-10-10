import type Stripe from "stripe";
import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/sequences/engine";
import { anySaleCredited, applyRefundToSales, creditSale } from "@/lib/affiliates";
import { implementationFromLines, invoiceCreditRef, uniqueRefs, type PaymentLine } from "@/lib/affiliateRules";

// Stripe-facing side of affiliate crediting: recurring (invoice) payments and refunds. Only GET calls are made to
// Stripe (read-only). The rules (what earns, what voids) are in affiliateRules.ts. Every entry point here is
// written never to throw, so it can sit inside the webhook without being able to break it.

const API = "https://api.stripe.com/v1";
const STRIPE_VERSION = "2026-06-24.dahlia"; // the version the Suite's Stripe SDK is pinned to

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
export type StripeRead = (path: string, params?: Record<string, string>) => Promise<Json>;

// A read-only reader for one Stripe account's key (the Suite's own key, or a client's restricted key).
export function stripeReader(key: string): StripeRead {
  return async (path, params = {}) => {
    const url = new URL(`${API}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${key}`, "Stripe-Version": STRIPE_VERSION }, cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error?.message || `Stripe error ${res.status}`);
    return body;
  };
}

const day = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 10);
const idOf = (v: unknown): string | null => (typeof v === "string" ? v : v && typeof v === "object" && typeof (v as { id?: unknown }).id === "string" ? (v as { id: string }).id : null);

// Everything that identifies one payment, so a sale credited under any of its ids (the charge, the payment intent, the
// invoice, or the Checkout session that took it) can be found. Each lookup fails soft.
export type PaymentContext = { refs: string[]; invoice: Json | null; sessionIds: string[] };
export async function paymentContext(read: StripeRead, charge: Json): Promise<PaymentContext> {
  const refs: string[] = [charge.id];
  const sessionIds: string[] = [];
  let invoice: Json | null = null;
  const pi = idOf(charge.payment_intent);
  if (pi) {
    refs.push(pi);
    try {
      const s = await read("/checkout/sessions", { payment_intent: pi, limit: "5" });
      for (const x of s.data ?? []) sessionIds.push(x.id);
    } catch {
      /* the key may not read Checkout sessions */
    }
    try {
      const ip = await read("/invoice_payments", { "payment[type]": "payment_intent", "payment[payment_intent]": pi, limit: "1" });
      const invId = idOf(ip.data?.[0]?.invoice);
      if (invId) {
        refs.push(invId);
        invoice = await read(`/invoices/${invId}`);
      }
    } catch {
      /* one-off payments have no invoice */
    }
  }
  // The first invoice of a Checkout subscription is credited under the session id, so find that session too.
  const sub = idOf(invoice?.parent?.subscription_details?.subscription) ?? idOf(invoice?.subscription);
  if (invoice?.billing_reason === "subscription_create" && sub) {
    try {
      const s = await read("/checkout/sessions", { subscription: sub, limit: "3" });
      for (const x of s.data ?? []) sessionIds.push(x.id);
    } catch {
      /* ignore */
    }
  }
  return { refs: uniqueRefs([...refs, ...sessionIds]), invoice, sessionIds: uniqueRefs(sessionIds) };
}

// The implementation fee inside one payment, in dollars (null when there is none): from its invoice lines, else its
// Checkout line items, else a charge description that says "implementation". Only called for implementation-only links.
export async function implementationForPayment(read: StripeRead, ctx: PaymentContext, charge: Json, netDollars: number): Promise<number | null> {
  if (ctx.invoice) return implementationFromLines((ctx.invoice.lines?.data ?? []) as PaymentLine[]);
  if (ctx.sessionIds[0]) {
    try {
      const items = await read(`/checkout/sessions/${ctx.sessionIds[0]}/line_items`, { limit: "20", "expand[]": "data.price.product" });
      return implementationFromLines((items.data ?? []) as PaymentLine[]);
    } catch {
      /* fall through to the description */
    }
  }
  return /implementation/i.test(String(charge.description ?? "")) && netDollars > 0 ? netDollars : null;
}

// The newest refund that went through on a charge (null when it can't be read).
export async function latestRefund(read: StripeRead, chargeId: string): Promise<Json | null> {
  try {
    const list = await read("/refunds", { charge: chargeId, limit: "10" });
    return ((list.data ?? []) as Json[]).filter((x) => x.status !== "failed" && x.status !== "canceled").sort((a, b) => b.created - a.created)[0] ?? null;
  } catch {
    return null;
  }
}

// The id a charge's refunds are recorded under when Stripe's refund id can't be read.
export const fallbackRefundId = (chargeId: string, refundedCents: number) => `charge-refund:${chargeId}:${refundedCents}`;

// A refund hit a charge: void or flag the credited sale(s) of this account's plan (see applyRefundToSales).
// charge: a Stripe charge object; refund: the Stripe refund (looked up when not given).
export async function applyRefundForCharge(db: ReturnType<typeof createServerClient>, planId: string, read: StripeRead, charge: Json, refund?: Json | null) {
  const refundedCents = Number(charge.amount_refunded) || 0;
  if (refundedCents <= 0 || !charge.id) return { voided: 0, flagged: 0 };
  const r = refund ?? (await latestRefund(read, charge.id));
  const ctx = await paymentContext(read, charge);
  return applyRefundToSales(db, planId, ctx.refs, {
    id: r?.id || fallbackRefundId(charge.id, refundedCents),
    date: day(Number(r?.created) || Math.floor(Date.now() / 1000)),
    full: !!charge.refunded || refundedCents >= Number(charge.amount),
    amount: (Number(r?.amount) || refundedCents) / 100,
  });
}

// charge.refunded / refund.created / refund.updated from the Suite's own Stripe account (the webhook).
// Never throws.
export async function applyRefundEvent(event: Stripe.Event): Promise<void> {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return;
    const read = stripeReader(key);
    let charge: Json = null;
    let refund: Json = null;
    if (event.type === "charge.refunded") {
      charge = event.data.object;
      const embedded = ((charge.refunds?.data ?? []) as Json[]).sort((a, b) => b.created - a.created)[0];
      refund = embedded ?? null;
    } else if (event.type === "refund.created" || event.type === "refund.updated") {
      refund = event.data.object;
      if (refund.status !== "succeeded") return; // pending or failed refunds change nothing yet
      const chargeId = idOf(refund.charge);
      if (!chargeId) return;
      charge = await read(`/charges/${chargeId}`);
    } else return;
    const planId = await ownerMasterPlanId();
    if (!planId || !charge?.id) return;
    const r = await applyRefundForCharge(createServerClient(), planId, read, charge, refund);
    if (r.voided || r.flagged) console.log(`affiliate refund ${charge.id}: voided ${r.voided}, flagged ${r.flagged}`);
  } catch (e) {
    console.error("affiliate refund:", e);
  }
}

// invoice.payment_succeeded from the Suite's own Stripe account: every paid invoice from a referred person is
// credited once (recurring subscription payments included), under the link's own setting. Never throws.
export async function creditInvoiceForAffiliate(invoice: Stripe.Invoice): Promise<void> {
  try {
    const inv = invoice as unknown as Json;
    const paid = Number(inv.amount_paid) || 0;
    if (!inv.id || paid <= 0 || (inv.status && inv.status !== "paid")) return;
    const key = process.env.STRIPE_SECRET_KEY;
    const planId = await ownerMasterPlanId();
    if (!key || !planId) return;
    const read = stripeReader(key);
    const db = createServerClient();

    // The first invoice of a subscription bought through Checkout shares the session's id with the checkout handler.
    let sessionId: string | null = null;
    let affiliateCode: string | null = null;
    if (inv.billing_reason === "subscription_create") {
      const sub = idOf(inv.parent?.subscription_details?.subscription) ?? idOf(inv.subscription);
      if (sub) {
        const s = await read("/checkout/sessions", { subscription: sub, limit: "1" }); // throws on failure: no credit rather than a double one
        const first = s.data?.[0];
        if (first) {
          sessionId = first.id;
          affiliateCode = first.metadata?.affiliate || null;
        }
      }
    }

    let email = String(inv.customer_email ?? "").trim().toLowerCase();
    if (!email) {
      const cust = idOf(inv.customer);
      if (cust) email = String((await read(`/customers/${cust}`).catch(() => null))?.email ?? "").trim().toLowerCase();
    }
    let contactId: string | null = null;
    if (email) {
      const { data: c } = await db.from("seq_contacts").select("id").eq("master_plan_id", planId).eq("email", email).maybeSingle();
      contactId = (c?.id as string) ?? null;
    }
    if (!contactId && !affiliateCode) return;

    // The same payment may already be credited under its charge id (when the account's own Stripe sync got there first).
    try {
      const ip = await read("/invoice_payments", { invoice: inv.id, limit: "5" });
      const piIds = ((ip.data ?? []) as Json[]).map((p) => idOf(p.payment?.payment_intent)).filter(Boolean) as string[];
      const chargeIds: string[] = [];
      for (const pi of piIds.slice(0, 3)) chargeIds.push(idOf((await read(`/payment_intents/${pi}`)).latest_charge) ?? "");
      if (await anySaleCredited(db, planId, [inv.id, sessionId, ...piIds, ...chargeIds].filter(Boolean) as string[])) return;
    } catch {
      /* fall through: the stripe_ref of the sale itself still stops a repeat */
    }

    const lines = (inv.lines?.data ?? []) as PaymentLine[];
    const first = lines.find((l) => l.description)?.description;
    const paidAt = Number(inv.status_transitions?.paid_at) || Number(inv.created) || Math.floor(Date.now() / 1000);
    await creditSale(db, planId, {
      contactId,
      affiliateCode,
      description: inv.billing_reason === "subscription_create" ? first || "LifeCharter Command Suite" : `Subscription payment${first ? `: ${first}` : ""}`,
      amount: paid / 100,
      implementationAmount: implementationFromLines(lines),
      saleDate: day(paidAt),
      stripeRef: invoiceCreditRef(inv.id, inv.billing_reason, sessionId),
      source: "stripe",
    });
  } catch (e) {
    console.error("affiliate invoice credit:", e);
  }
}
