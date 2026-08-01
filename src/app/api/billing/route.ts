import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { authEnabled, sessionUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

// Real billing state for the settings page: the plan catalog plus the signed-in
// user's current subscription (if any). No mock data.
export async function GET() {
  const supabase = createServerClient();

  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, description, price_monthly, onboarding_fee, capabilities")
    .eq("is_active", true)
    .order("price_monthly", { ascending: true });

  let current: {
    planId: string;
    planName: string | null;
    status: string;
    currentPeriodEnd: string | null;
    comped: boolean;
  } | null = null;

  if (authEnabled()) {
    const user = await sessionUser();
    if (user) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_id, status, current_period_end, stripe_subscription_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("current_period_end", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub) {
        const plan = (plans ?? []).find((p) => p.id === sub.plan_id);
        current = {
          planId: sub.plan_id,
          planName: plan?.name ?? null,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
          comped: !sub.stripe_subscription_id, // no Stripe sub = complimentary/owner-granted
        };
      }
    }
  }

  return NextResponse.json({ plans: plans ?? [], current }, { headers: { "Cache-Control": "no-store" } });
}
