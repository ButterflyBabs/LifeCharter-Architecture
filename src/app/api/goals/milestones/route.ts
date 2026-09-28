import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { planningAssistant, planningSystem, runJson, cleanList } from "@/lib/ai/planningAi";
import { saveInsight } from "@/lib/ai/planKnowledge";
import { gatherAndCompute } from "@/lib/scoring/gather";
import { DIMENSION_LABEL, type DimensionKey } from "@/lib/scoring/dimensionModel";
import { currentBusiness } from "@/lib/businessScope";
import { currentStart } from "@/lib/goalLadder";
import { isDimension, milestoneQuestions, type ProposedMilestone } from "@/lib/milestoneAssessment";

export const dynamic = "force-dynamic";

// Milestone assessment for one dimension.
//   GET ?dimension=key                                   → last proposal, year goals it can support, what's already added
//   POST { action: "assess", dimension, answers }        → the client's assistant proposes 3-5 quarter milestones (saved as an insight)
//   POST { action: "accept", dimension, periodStart, parentId?, items: [{ title, target, firstStep?, addTask? }] }
//        → saves them as quarter goals (client_plan_goals), and optionally a first-step task each

const QUARTER_START = /^\d{4}-(01|04|07|10)-01$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function activePlans(masterPlanId: string) {
  const { data } = await createServerClient().from("client_plans").select("id, plan_type").eq("master_plan_id", masterPlanId).eq("status", "active");
  return (data ?? []) as { id: string; plan_type: string }[];
}

async function latestProposal(masterPlanId: string, dimension: DimensionKey) {
  const { data } = await createServerClient()
    .from("planning_insights")
    .select("assistant, content, created_at")
    .eq("master_plan_id", masterPlanId)
    .eq("area", "milestones")
    .eq("content->>dimension", dimension)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { ...(data.content as Record<string, unknown>), assistant: data.assistant as string, createdAt: data.created_at as string } : null;
}

export async function GET(request: Request) {
  const dim = new URL(request.url).searchParams.get("dimension");
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId || !isDimension(dim)) return NextResponse.json({ latest: null, yearGoals: [], quarterGoals: [] });
  const [latest, ai, plans] = await Promise.all([latestProposal(masterPlanId, dim), resolveAiConfig(), activePlans(masterPlanId)]);
  const ids = plans.map((p) => p.id);
  const { data: goals } = ids.length
    ? await createServerClient().from("client_plan_goals").select("id, plan_id, period, period_start, title, dimension_key").in("plan_id", ids).in("period", ["year", "quarter"])
    : { data: [] };
  const rows = (goals ?? []) as { id: string; plan_id: string; period: string; period_start: string | null; title: string; dimension_key: string | null }[];
  const typeOf = new Map(plans.map((p) => [p.id, p.plan_type]));
  return NextResponse.json({
    assistantName: ai.name,
    hasKey: Boolean(ai.key),
    hasPlan: plans.length > 0,
    latest,
    yearGoals: rows.filter((g) => g.period === "year").map((g) => ({ id: g.id, title: g.title, dimension_key: g.dimension_key, plan_type: typeOf.get(g.plan_id) ?? "" })),
    quarterGoals: rows.filter((g) => g.period === "quarter" && g.dimension_key === dim).map((g) => ({ id: g.id, title: g.title, period_start: g.period_start })),
  });
}

// What the app itself knows about this one area: its score and what feeds it,
// the goals already set for it, and the tasks tagged to it.
async function dimensionFacts(masterPlanId: string, dimension: DimensionKey): Promise<string> {
  const label = DIMENSION_LABEL[dimension];
  const lines: string[] = [];
  try {
    const scores = await gatherAndCompute(masterPlanId);
    const d = scores.domains.find((x) => x.key === dimension);
    if (d) {
      lines.push(`${label} score: ${d.score === null ? "not measured yet" : `${d.score}/100`}${d.partial ? " (partial evidence)" : ""}.`);
      const src = d.sources.filter((s) => s.subScore !== null).map((s) => `${s.kind} ${s.subScore}${s.fresh ? "" : " (stale)"}`);
      if (src.length) lines.push(`What feeds it: ${src.join(", ")}.`);
      const others = scores.domains.filter((x) => x.score !== null && x.key !== dimension).sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
      if (others.length) lines.push(`Their other areas, weakest first: ${others.slice(0, 5).map((x) => `${x.label} ${x.score}`).join(", ")}.`);
    }
  } catch {
    /* scores are optional */
  }
  const db = createServerClient();
  try {
    const plans = await activePlans(masterPlanId);
    const ids = plans.map((p) => p.id);
    if (ids.length) {
      const { data } = await db.from("client_plan_goals").select("title, target, period, period_start, status").in("plan_id", ids).eq("dimension_key", dimension).limit(20);
      const g = (data ?? []) as { title: string; target: string | null; period: string; period_start: string | null; status: string | null }[];
      if (g.length) lines.push(`Goals already set for ${label}: ${g.map((x) => `"${x.title}" (${x.period}${x.period_start ? ` from ${x.period_start}` : ""}, ${x.status || "not_started"}${x.target ? `, target: ${x.target}` : ""})`).join("; ")}.`);
      else lines.push(`No goals set for ${label} yet.`);
    }
  } catch {
    /* optional */
  }
  try {
    const { data } = await db
      .from("tasks")
      .select("title, status, completed_at")
      .eq("master_plan_id", masterPlanId)
      .eq(`dimension_${dimension}`, true)
      .order("created_at", { ascending: false })
      .limit(15);
    const t = (data ?? []) as { title: string; status: string; completed_at: string | null }[];
    const done = t.filter((x) => x.status === "done");
    const open = t.filter((x) => x.status !== "done");
    if (open.length) lines.push(`Open ${label} tasks: ${open.map((x) => `"${x.title.slice(0, 80)}"`).join(", ")}.`);
    if (done.length) lines.push(`Recently finished ${label} tasks: ${done.map((x) => `"${x.title.slice(0, 80)}"`).join(", ")}.`);
  } catch {
    /* optional */
  }
  return lines.join("\n");
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  if (!isDimension(body.dimension)) return NextResponse.json({ error: "Unknown area." }, { status: 400 });
  const dimension: DimensionKey = body.dimension;
  const label = DIMENSION_LABEL[dimension];

  if (body.action === "assess") {
    const questions = milestoneQuestions(dimension, label);
    const raw = body.answers && typeof body.answers === "object" ? (body.answers as Record<string, unknown>) : {};
    const answers = Object.fromEntries(questions.map((q) => [q.id, str(raw[q.id], 800)]));
    if (!Object.values(answers).some(Boolean)) return NextResponse.json({ error: "Answer at least one question first." }, { status: 400 });

    const a = await planningAssistant();
    if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
    if (!a.key) return NextResponse.json({ needsKey: true });

    const facts = await dimensionFacts(masterPlanId, dimension);
    const sys = planningSystem(
      a,
      `helping them set this quarter's milestones for the ${label} part of their business.`,
      'Return STRICT JSON: {"summary":"2 sentences on where ' +
        label +
        ' stands for them and what this quarter should focus on","milestones":[{"title":"a specific, measurable milestone they can reach this quarter (max 90 chars)","target":"how they\'ll know it\'s met (short)","why":"one sentence tying it to their own answers, scores or activity","firstStep":"the first concrete action, doable this week (max 100 chars)"}]} ' +
        "with 3 to 5 milestones, most important first. Fit them to the time they said they have. Don't repeat goals they've already set; build on them. Use their real offers, numbers and plans."
    );
    const ask =
      `AREA: ${label}\n\nWHAT THE APP MEASURES FOR THIS AREA:\n${facts || "(nothing measured yet)"}\n\nTHEIR ANSWERS TODAY:\n` +
      questions.map((q) => `- ${q.q}\n  ${answers[q.id] || "(skipped)"}`).join("\n");
    const out = await runJson(a, sys, ask, 1100);
    const milestones = cleanList(out?.milestones, 5, ["title", "target", "why", "firstStep"]).filter((m) => m.title) as unknown as ProposedMilestone[];
    if (!out || milestones.length < 1) return NextResponse.json({ error: "Couldn't propose milestones just now. Try again." }, { status: 502 });
    const content = { dimension, answers, summary: str(out.summary, 600), milestones, summaryLine: `${label} milestones: ${milestones.map((m) => m.title).join("; ").slice(0, 300)}` };
    await saveInsight(masterPlanId, "milestones", a.name, content).catch(() => {});
    return NextResponse.json({ latest: { ...content, assistant: a.name, createdAt: new Date().toISOString() } });
  }

  if (body.action === "accept") {
    const items = (Array.isArray(body.items) ? body.items : [])
      .slice(0, 5)
      .map((x: Record<string, unknown>) => ({ title: str(x?.title, 200), target: str(x?.target, 200), firstStep: str(x?.firstStep, 200), addTask: x?.addTask === true }))
      .filter((x: { title: string }) => x.title);
    if (!items.length) return NextResponse.json({ error: "Choose at least one milestone to add." }, { status: 400 });
    const periodStart = typeof body.periodStart === "string" && QUARTER_START.test(body.periodStart) ? body.periodStart : currentStart("quarter");

    const plans = await activePlans(masterPlanId);
    if (!plans.length) return NextResponse.json({ error: "Build your Business Plan first. Milestones are saved under it." }, { status: 400 });
    const db = createServerClient();
    let planId = (plans.find((p) => p.plan_type === "business") ?? plans[0]).id;
    let parentId: string | null = null;
    if (typeof body.parentId === "string" && body.parentId) {
      const { data: parent } = await db.from("client_plan_goals").select("id, plan_id, period").eq("id", body.parentId).maybeSingle();
      if (!parent || parent.period !== "year" || !plans.some((p) => p.id === parent.plan_id)) return NextResponse.json({ error: "That year goal wasn't found." }, { status: 404 });
      planId = parent.plan_id as string;
      parentId = parent.id as string;
    }

    const { data: goals, error } = await db
      .from("client_plan_goals")
      .insert(
        items.map((it: { title: string; target: string }, i: number) => ({
          plan_id: planId,
          parent_id: parentId,
          period: "quarter",
          period_start: periodStart,
          title: it.title,
          target: it.target || null,
          dimension_key: dimension,
          status: "not_started",
          sort_order: i,
        }))
      )
      .select("id, title, period_start");
    if (error) {
      console.error("milestones accept:", error.message);
      return NextResponse.json({ error: "Couldn't save those milestones." }, { status: 500 });
    }

    const withTask = items.filter((it: { addTask: boolean; firstStep: string }) => it.addTask && it.firstStep);
    let tasksAdded = 0;
    if (withTask.length) {
      const businessId = (await currentBusiness(masterPlanId))?.businessId ?? null;
      const { data: tasks, error: tErr } = await db
        .from("tasks")
        .insert(
          withTask.map((it: { title: string; firstStep: string }) => ({
            master_plan_id: masterPlanId,
            title: it.firstStep,
            description: `First step toward the ${label} milestone: ${it.title}`,
            status: "backlog",
            priority: "medium",
            energy: "medium",
            business_id: businessId,
            [`dimension_${dimension}`]: true,
          }))
        )
        .select("id");
      if (tErr) console.error("milestones tasks:", tErr.message);
      tasksAdded = tasks?.length ?? 0;
    }
    return NextResponse.json({ goals: goals ?? [], tasksAdded });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
