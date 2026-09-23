import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { FOUNDING_SPOTS, PLUS_MONTHLY_AI_CAP, collectiveAiFor, plusUsageThisMonth } from "@/lib/community/ai";

export const dynamic = "force-dynamic";

// Everything the Plus page needs: founding spots left, this member's plan,
// and how much of this month's Mariposa allowance they've used.
export async function GET() {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const supabase = createServerClient();
  const [{ data: taken }, { data: sub }, ai, used] = await Promise.all([
    supabase.rpc("cm_plus_founding_taken"),
    supabase.from("cm_plus_subscriptions").select("status, plan, founding, current_period_end, cancel_at_period_end, stripe_customer_id").eq("user_id", user.id).maybeSingle(),
    collectiveAiFor(user),
    plusUsageThisMonth(user.id),
  ]);
  return NextResponse.json({
    foundingLeft: Math.max(0, FOUNDING_SPOTS - (typeof taken === "number" ? taken : FOUNDING_SPOTS)),
    subscription: sub ? { status: sub.status, plan: sub.plan, founding: sub.founding, currentPeriodEnd: sub.current_period_end, cancelAtPeriodEnd: sub.cancel_at_period_end, canManage: Boolean(sub.stripe_customer_id) } : null,
    plus: ai.plus,
    aiSource: ai.source,
    usage: { used, cap: PLUS_MONTHLY_AI_CAP },
  });
}
