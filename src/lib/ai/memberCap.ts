import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveActor } from "@/lib/authz";

// Per-member monthly AI cap (cs184). Team members run AI on the account owner's
// OpenAI key, so the owner can cap how many AI requests each member makes a
// month (workspace_members.ai_monthly_cap; null = no cap). Every member AI
// request is counted in ai_member_usage, capped or not, so the Team screen can
// show usage. The owner's own requests are never counted or limited.

export const AI_CAP_MESSAGE = "You've reached this month's AI limit set by your account owner.";

/** 'YYYY-MM' in UTC: the month a request counts toward. */
export const usageMonth = (d = new Date()) => d.toISOString().slice(0, 7);

/**
 * Count one AI request for the signed-in team member. Returns a friendly 429
 * response when they're over their cap, or null to go ahead. Pass the key the
 * request would use: with no key nothing runs, so nothing is counted.
 * Never blocks on its own failure.
 */
export async function memberAiGate(key?: string | null): Promise<NextResponse | null> {
  if (key !== undefined && !key) return null;
  try {
    const actor = await resolveActor();
    if (actor.kind !== "member" || !actor.memberId) return null;
    const db = createServerClient();
    const { data: m } = await db.from("workspace_members").select("ai_monthly_cap").eq("id", actor.memberId).maybeSingle();
    const raw = m?.ai_monthly_cap;
    const cap = raw === null || raw === undefined ? null : Math.max(0, Number(raw));
    const { data, error } = await db.rpc("bump_member_ai_usage", { p_member: actor.memberId, p_month: usageMonth(), p_cap: cap });
    if (error) {
      console.error("bump_member_ai_usage:", error.message);
      return null;
    }
    if (Number(data) === -1) return NextResponse.json({ error: AI_CAP_MESSAGE, aiLimitReached: true }, { status: 429 });
    return null;
  } catch (e) {
    console.error("memberAiGate:", e);
    return null;
  }
}
