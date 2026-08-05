import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { getBlueprint } from "@/lib/plans/blueprints";
import { getAssessmentContext, contextToText } from "@/lib/plans/assessmentContext";

export const dynamic = "force-dynamic";

const CADENCES: Record<string, string> = {
  monthly: "monthly",
  quarterly: "quarterly",
  semiannual: "semi-annual",
  annual: "annual",
};

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

// GET ?type= — review history for a plan.
export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") || "";
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ reviews: [] });
  const { data } = await supabase
    .from("plan_reviews")
    .select("id, cadence, report, created_at")
    .eq("master_plan_id", masterPlanId)
    .eq("plan_type", type)
    .order("created_at", { ascending: false })
    .limit(24);
  return NextResponse.json({ reviews: data || [] });
}

// POST { type, cadence } — generate an AI review report and store it.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type : "";
  const cadence = CADENCES[body.cadence] ? body.cadence : "quarterly";
  const bp = getBlueprint(type);
  if (!bp) return NextResponse.json({ error: "unknown plan type" }, { status: 400 });

  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "no workspace" }, { status: 400 });
  const { name, key } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  const supabase = createServerClient();

  // Plan sections.
  const { data: secs } = await supabase
    .from("plan_sections")
    .select("section_key, content")
    .eq("master_plan_id", masterPlanId)
    .eq("plan_type", type);
  const sectionText = ((secs || []) as { section_key: string; content: string | null }[])
    .filter((s) => (s.content || "").trim())
    .map((s) => {
      const t = bp.sections.find((x) => x.key === s.section_key)?.title || s.section_key;
      return `## ${t}\n${(s.content || "").slice(0, 600)}`;
    })
    .join("\n\n");

  // Goal progress (from the active client_plans of this type).
  let goalLine = "";
  try {
    const { data: plan } = await supabase
      .from("client_plans")
      .select("id")
      .eq("master_plan_id", masterPlanId)
      .eq("plan_type", type)
      .eq("status", "active")
      .maybeSingle();
    if (plan?.id) {
      const { data: goals } = await supabase.from("client_plan_goals").select("status").eq("plan_id", plan.id);
      const gs = (goals || []) as { status: string | null }[];
      const met = gs.filter((g) => g.status === "met").length;
      const prog = gs.filter((g) => g.status === "in_progress").length;
      const slipped = gs.filter((g) => g.status === "slipped").length;
      goalLine = `Goals: ${gs.length} total — ${met} met, ${prog} in progress, ${slipped} slipped.`;
    }
  } catch {
    /* optional */
  }

  // Money + pipeline reality.
  const now = new Date();
  const yearStart = `${now.getUTCFullYear()}-01-01`;
  const { data: fin } = await supabase
    .from("finance_entries")
    .select("type, amount")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", yearStart);
  let inc = 0;
  let exp = 0;
  for (const e of (fin || []) as { type: string; amount: number | string | null }[]) {
    const a = Number(e.amount ?? 0);
    if (e.type === "income") inc += a;
    else exp += a;
  }
  const { data: acts } = await supabase
    .from("sales_activities")
    .select("estimated_value, outcome")
    .eq("master_plan_id", masterPlanId);
  let pipeline = 0;
  let won = 0;
  for (const a of (acts || []) as { estimated_value: number | string | null; outcome: string | null }[]) {
    const v = Number(a.estimated_value ?? 0);
    if (a.outcome === "won") won += v;
    else if (a.outcome !== "lost") pipeline += v;
  }

  const ctx = await getAssessmentContext(masterPlanId, 16);

  const metrics =
    `YTD income ${usd(inc)}, expenses ${usd(exp)}, net ${usd(inc - exp)}. ` +
    `Open pipeline ${usd(pipeline)}, won ${usd(won)}. ${goalLine}`;

  const sys =
    `You are ${name}, a candid, supportive business advisor doing a ${CADENCES[cadence]} review of a founder's ${bp.label}. ` +
    "These are legacy-minded owners building something lasting — hold them to that standard with warmth. " +
    "Read their plan, their real numbers, and their assessment scores. " +
    'Return STRICT JSON: {"summary":"2-3 sentence honest read on how this plan is tracking",' +
    '"strengths":[{"area":"short","detail":"a specific strength showing up, tied to evidence"}],' +
    '"attention":[{"area":"short","detail":"what needs attention and why","suggestion":"a specific, doable change to get back on track"}],' +
    '"focus":"the single highest-leverage thing to do before the next review"}. ' +
    "2-4 strengths, 2-4 attention items. Be specific and tie to their goals and numbers — never generic.";

  const userText =
    `Cadence: ${CADENCES[cadence]} review of the ${bp.label}.\n\n` +
    `--- THE PLAN ---\n${sectionText || "(few sections written yet)"}\n\n` +
    `--- REAL METRICS ---\n${metrics}\n\n` +
    `--- ASSESSMENT CONTEXT ---\n${contextToText(ctx)}`;

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userText },
      ],
      max_tokens: 1100,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const report = {
      summary: String(parsed.summary || "").trim(),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 6) : [],
      attention: Array.isArray(parsed.attention) ? parsed.attention.slice(0, 6) : [],
      focus: String(parsed.focus || "").trim(),
      cadence,
      generatedAt: new Date().toISOString(),
    };
    if (!report.summary && report.strengths.length === 0) {
      return NextResponse.json({ error: "Couldn't generate the review — try again." }, { status: 502 });
    }

    await supabase.from("plan_reviews").insert({
      master_plan_id: masterPlanId,
      plan_type: type,
      cadence,
      report,
    });

    return NextResponse.json({ report });
  } catch (e) {
    console.error("POST /api/plans/review:", e);
    return NextResponse.json({ error: "Couldn't reach the AI just now — try again." }, { status: 502 });
  }
}
