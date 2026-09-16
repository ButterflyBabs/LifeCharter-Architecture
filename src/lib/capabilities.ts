import { createServerClient } from "@/lib/supabase/server";
import { authEnabled, sessionUser } from "@/lib/authz";

/**
 * Plan-capability enforcement for metered AI actions.
 *
 * A "heavy" AI action = a plan build or a full re-score (the operations that
 * cost real model spend). The conversational AI guide is intentionally NOT
 * metered. Limits live on the plan catalog (capabilities.ai_actions_per_month);
 * -1 means unlimited.
 *
 * When auth is OFF (single-user owner), everything is unlimited. When on, the
 * DB functions check_capability / increment_capability_usage do the accounting.
 */

const CAP = "ai_actions_per_month";

// Is the current user allowed to spend one AI action right now?
export async function aiActionAllowed(): Promise<boolean> {
  if (!authEnabled()) return true; // owner / single-user
  const user = await sessionUser();
  if (!user) return false;
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.rpc("check_capability", {
      p_user_id: user.id,
      p_capability: CAP,
      p_amount: 1,
    });
    if (error) {
      console.error("aiActionAllowed:", error.message);
      return true; // fail open: never block a paying client on an accounting error
    }
    return data === true;
  } catch (e) {
    console.error("aiActionAllowed:", e);
    return true;
  }
}

// Record one consumed AI action (no-op for the owner / unlimited plans still
// records usage harmlessly). Call only after the action succeeds.
export async function recordAiAction(): Promise<void> {
  if (!authEnabled()) return;
  const user = await sessionUser();
  if (!user) return;
  try {
    const supabase = createServerClient();
    await supabase.rpc("increment_capability_usage", {
      p_user_id: user.id,
      p_capability: CAP,
      p_amount: 1,
    });
  } catch (e) {
    console.error("recordAiAction:", e);
  }
}

// Standard 402 body when a client is over their monthly AI-action limit.
export const AI_LIMIT_BODY = {
  error: "You've reached your plan's monthly limit for AI plan builds and re-scores. Upgrade your plan to keep going.",
  limitReached: true,
};

/**
 * Standing-count capability enforcement (workspaces, seats) — separate from
 * the metered AI-action accounting above. These are plain counts against a
 * limit, not a monthly-resetting usage table, since a workspace or a seat
 * doesn't expire at the end of the month the way an AI action does.
 */

export type StandingCapability = "workspaces" | "seats";

// The plan capabilities for whoever owns this master plan: master plan ->
// its user -> their active subscription -> that plan's capabilities. Returns
// null when unlimited, comped/no-auth, or undeterminable for any reason —
// callers should treat null as "allow," matching aiActionAllowed's fail-open
// philosophy (never block a legitimate action on an accounting gap).
async function planCapabilities(masterPlanId: string | null): Promise<Record<string, unknown> | null> {
  if (!authEnabled()) return null; // owner / single-user — unlimited
  if (!masterPlanId) return null;
  try {
    const supabase = createServerClient();
    const { data: plan } = await supabase
      .from("client_master_plans")
      .select("user_id")
      .eq("id", masterPlanId)
      .maybeSingle();
    if (!plan?.user_id) return null;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", plan.user_id)
      .eq("status", "active")
      .gt("current_period_end", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.plan_id) return null;

    const { data: planRow } = await supabase
      .from("plans")
      .select("capabilities")
      .eq("id", sub.plan_id)
      .maybeSingle();
    return (planRow?.capabilities as Record<string, unknown>) ?? null;
  } catch (e) {
    console.error("planCapabilities:", e);
    return null;
  }
}

// Would adding one more of `kind` (given `currentCount` that already exist)
// stay within the plan's limit? A missing capability or -1 means unlimited.
export async function withinStandingLimit(
  kind: StandingCapability,
  masterPlanId: string | null,
  currentCount: number
): Promise<{ allowed: boolean; limit: number | null }> {
  const caps = await planCapabilities(masterPlanId);
  const raw = caps?.[kind];
  const limit = typeof raw === "number" ? raw : null;
  if (limit === null || limit < 0) return { allowed: true, limit };
  return { allowed: currentCount < limit, limit };
}
