import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";
import { saveInsight } from "@/lib/ai/planKnowledge";
import { createServerClient } from "@/lib/supabase/server";
import { DIMENSION_KEYS, DIMENSION_LABEL, type DimensionKey } from "@/lib/scoring/dimensionModel";
import { memberAiGate } from "@/lib/ai/memberCap";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Show me how": a short, personal lesson on running one business dimension
// better, written by the client's own assistant from what it knows about them.
// The latest one per dimension is kept, so reopening doesn't cost another call.
//   GET ?dimension=key   → the saved lesson (if any)
//   POST { dimension }   → write a fresh one

const isDim = (v: unknown): v is DimensionKey => typeof v === "string" && (DIMENSION_KEYS as readonly string[]).includes(v);

export async function GET(request: Request) {
  const dim = new URL(request.url).searchParams.get("dimension");
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId || !isDim(dim)) return NextResponse.json({ lesson: null });
  const { data } = await createServerClient()
    .from("planning_insights")
    .select("content, created_at")
    .eq("master_plan_id", masterPlanId)
    .eq("area", "lesson")
    .eq("content->>dimension", dim)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return NextResponse.json({ lesson: data ? { ...(data.content as Record<string, unknown>), createdAt: data.created_at } : null });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!isDim(body.dimension)) return NextResponse.json({ error: "Unknown area." }, { status: 400 });
  const dimension: DimensionKey = body.dimension;
  const masterPlanId = await resolveMasterPlanId();
  const a = await planningAssistant();
  if (!masterPlanId || !a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  if (!a.key) return NextResponse.json({ needsKey: true });
  const overCap = await memberAiGate();
  if (overCap) return overCap;
  const label = DIMENSION_LABEL[dimension];
  const sys = planningSystem(
    a,
    `teaching them how to run the ${label} part of their business better.`,
    'Return STRICT JSON: {"title":"a short lesson title","why":"2 sentences: why this area is holding them back, from their own scores and answers","principles":["3 short principles for running this part well"],"steps":["4-6 concrete steps to strengthen it, in order, specific to their business"],"firstAction":"the one thing to do this week (max 120 chars)"}. ' +
      "Plain, warm and practical. Tie every point to their real situation; no generic filler."
  );
  const out = await runJson(a, sys, `AREA: ${label}`, 900);
  if (!out) return NextResponse.json({ error: "Couldn't write the lesson just now." }, { status: 502 });
  const lesson = {
    dimension,
    title: String(out.title || `Running ${label} well`).slice(0, 160),
    why: String(out.why || "").slice(0, 600),
    principles: (Array.isArray(out.principles) ? out.principles : []).map((x) => String(x).slice(0, 300)).slice(0, 4),
    steps: (Array.isArray(out.steps) ? out.steps : []).map((x) => String(x).slice(0, 400)).slice(0, 6),
    firstAction: String(out.firstAction || "").slice(0, 200),
    summary: `${label} lesson: ${String(out.firstAction || "").slice(0, 160)}`,
  };
  await saveInsight(masterPlanId, "lesson", a.name, lesson).catch(() => {});
  return NextResponse.json({ lesson });
}
