// Server-only: Collective Plus billing — turns Stripe subscriptions into the
// member's cm_plus_subscriptions row. Plus subscriptions are tagged
// metadata.flow = "collective_plus" (+ cmUserId) so the shared Stripe webhook
// can tell them apart from Command Suite plans.
import type Stripe from "stripe";
import { createServerClient } from "@/lib/supabase/server";

export const PLUS_FLOW = "collective_plus";

export function isPlusSubscription(sub: { metadata?: Stripe.Metadata | null } | null | undefined): boolean {
  return sub?.metadata?.flow === PLUS_FLOW;
}

const STATUS_MAP: Record<string, string> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  unpaid: "past_due",
  incomplete: "past_due",
  canceled: "canceled",
  incomplete_expired: "canceled",
  paused: "canceled",
};

export async function syncPlusSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.cmUserId;
  if (!userId) {
    console.warn(`Plus subscription ${sub.id} has no cmUserId`);
    return;
  }
  const item = sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined;
  const periodEnd = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const row = {
    user_id: userId,
    status: STATUS_MAP[sub.status] ?? "canceled",
    plan: sub.metadata?.plan === "annual" ? "annual" : "monthly",
    founding: sub.metadata?.founding === "true",
    ...(sub.metadata?.cmEmail ? { email: sub.metadata.cmEmail.toLowerCase() } : {}),
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
    stripe_subscription_id: sub.id,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    updated_at: new Date().toISOString(),
  };
  const { error } = await createServerClient().from("cm_plus_subscriptions").upsert(row, { onConflict: "user_id" });
  if (error) console.error("syncPlusSubscription:", error.message);
}

// Moving up to Command Suite: one month of Plus (what they last paid per
// month) is credited against the implementation fee. Returns cents, or 0.
export async function plusCreditFor(email: string): Promise<number> {
  const { data } = await createServerClient()
    .from("cm_plus_subscriptions")
    .select("plan, founding, status")
    .eq("email", email.trim().toLowerCase())
    .in("status", ["active", "past_due", "canceled"])
    .maybeSingle();
  if (!data || data.plan === "comp") return 0;
  const monthly = data.founding ? 700 : 999;
  const annualMonthly = Math.round((data.founding ? 7000 : 9900) / 12);
  return data.plan === "annual" ? annualMonthly : monthly;
}
