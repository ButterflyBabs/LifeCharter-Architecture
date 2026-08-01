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
