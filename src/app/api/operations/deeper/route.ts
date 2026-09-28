import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { OPERATIONS_PILLARS } from "@/lib/operations";
import { cleanAnswers, DEEPER_QUESTIONS, type DeeperAnswers } from "@/lib/operationsDeeper";

export const dynamic = "force-dynamic";

// "Go deeper" for one operational pillar: its questions and this account's saved answers.
export async function GET(request: Request) {
  const pillar = new URL(request.url).searchParams.get("pillar") || "";
  const def = OPERATIONS_PILLARS.find((p) => p.key === pillar);
  if (!def) return NextResponse.json({ error: "unknown pillar" }, { status: 404 });
  const masterPlanId = await resolveMasterPlanId();
  let answers: DeeperAnswers = {};
  let updatedAt: string | null = null;
  if (masterPlanId) {
    const { data } = await createServerClient().from("operations_pillars").select("answers, answers_updated_at").eq("master_plan_id", masterPlanId).eq("pillar_key", pillar).maybeSingle();
    answers = (data?.answers as DeeperAnswers) || {};
    updatedAt = (data?.answers_updated_at as string) ?? null;
  }
  return NextResponse.json({ pillar: def, questions: DEEPER_QUESTIONS[pillar] ?? [], answers, updatedAt });
}

// PUT { pillar, answers }: save the answers (only this pillar's questions are kept).
export async function PUT(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const pillar = typeof body.pillar === "string" ? body.pillar : "";
  if (!OPERATIONS_PILLARS.some((p) => p.key === pillar)) return NextResponse.json({ error: "unknown pillar" }, { status: 400 });
  const answers = cleanAnswers(pillar, body.answers);
  const now = new Date().toISOString();
  const supabase = createServerClient();
  const { data: existing } = await supabase.from("operations_pillars").select("id").eq("master_plan_id", masterPlanId).eq("pillar_key", pillar).maybeSingle();
  const { error } = existing?.id
    ? await supabase.from("operations_pillars").update({ answers, answers_updated_at: now, updated_at: now }).eq("id", existing.id)
    : await supabase.from("operations_pillars").insert({ master_plan_id: masterPlanId, pillar_key: pillar, answers, answers_updated_at: now });
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true, answers, updatedAt: now });
}
