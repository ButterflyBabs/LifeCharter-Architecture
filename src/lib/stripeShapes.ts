import type Stripe from "stripe";

// Stripe moves fields between API versions. Events and objects are shaped by the version a webhook endpoint (or the
// account) is on, which is not the version the SDK is pinned to, so every reader here accepts both the old and the new
// place:
//   - an invoice's subscription id: `invoice.subscription` (old) or `invoice.parent.subscription_details.subscription` (new)
//   - a subscription's billing period: `subscription.current_period_start/end` (old) or the same fields on its items (new)

type Loose = Record<string, unknown>;

const idOf = (v: unknown): string | null =>
  typeof v === "string" && v ? v : v && typeof v === "object" && typeof (v as Loose).id === "string" ? ((v as Loose).id as string) : null;

export function invoiceSubscriptionId(invoice: Stripe.Invoice | Loose): string | null {
  const inv = invoice as Loose;
  const parent = inv.parent as { subscription_details?: { subscription?: unknown } } | null | undefined;
  return idOf(inv.subscription) ?? idOf(parent?.subscription_details?.subscription);
}

const toDate = (n: unknown): Date | null => (typeof n === "number" && Number.isFinite(n) && n > 0 ? new Date(n * 1000) : null);

export function subscriptionPeriod(sub: Stripe.Subscription | Loose): { start: Date | null; end: Date | null } {
  const s = sub as Loose;
  let start = toDate(s.current_period_start);
  let end = toDate(s.current_period_end);
  if (!start || !end) {
    const items = ((s.items as { data?: Loose[] } | undefined)?.data ?? []) as Loose[];
    const starts = items.map((i) => toDate(i.current_period_start)).filter((d): d is Date => !!d);
    const ends = items.map((i) => toDate(i.current_period_end)).filter((d): d is Date => !!d);
    if (!start && starts.length) start = new Date(Math.min(...starts.map((d) => d.getTime())));
    if (!end && ends.length) end = new Date(Math.max(...ends.map((d) => d.getTime())));
  }
  return { start, end };
}
