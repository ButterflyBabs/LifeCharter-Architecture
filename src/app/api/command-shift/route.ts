import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { crossOriginBlocked } from "@/lib/security";
import { COMMAND_SHIFT_OUTPUTS, COMMAND_SHIFT_TYPE, challengeAnswers, importCommandShift, savedAnswers } from "@/lib/commandShift";

export const dynamic = "force-dynamic";

// The Challenge work always belongs to the account owner (the client), even when a team
// member is the one looking, so everything here reads the owner's login from their plan.
async function accountOwner(): Promise<{ masterPlanId: string; ownerId: string } | null> {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return null;
  const { data } = await createServerClient().from("client_master_plans").select("user_id").eq("id", masterPlanId).maybeSingle();
  return data?.user_id ? { masterPlanId, ownerId: data.user_id as string } : null;
}

// GET: is there Challenge work to bring in, and what's already here?
export async function GET() {
  const acct = await accountOwner();
  if (!acct) return NextResponse.json({ available: 0, imported: false, answers: [] });
  const [fromChallenge, saved] = await Promise.all([challengeAnswers(acct.ownerId), savedAnswers(acct.masterPlanId)]);
  return NextResponse.json({ available: fromChallenge.length, imported: saved.length > 0, answers: saved });
}

// POST: bring the Challenge answers in (one tap). Safe to repeat: it only adds what's missing.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const acct = await accountOwner();
  if (!acct) return NextResponse.json({ error: "No account found." }, { status: 400 });
  try {
    const result = await importCommandShift(acct.ownerId, acct.masterPlanId);
    return NextResponse.json({ ok: true, ...result, answers: await savedAnswers(acct.masterPlanId) });
  } catch (e) {
    console.error("command-shift import:", (e as Error).message);
    return NextResponse.json({ error: "Couldn't bring your Command Shift work in. Please try again." }, { status: 500 });
  }
}

// PATCH: edit one answer in the Alignment Profile.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const acct = await accountOwner();
  if (!acct) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key : "";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 4000) : "";
  if (!COMMAND_SHIFT_OUTPUTS.some((o) => o.key === key)) return NextResponse.json({ error: "Unknown answer." }, { status: 400 });
  const { error } = await createServerClient()
    .from("unified_client_responses")
    .update({ answer_text: text, updated_at: new Date().toISOString() })
    .eq("master_plan_id", acct.masterPlanId)
    .eq("assessment_type", COMMAND_SHIFT_TYPE)
    .eq("question_id", key);
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
