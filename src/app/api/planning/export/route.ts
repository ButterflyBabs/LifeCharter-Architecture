import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { buildForecast } from "@/lib/planning/forecastData";

export const dynamic = "force-dynamic";

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const PLAN_TITLES: Record<string, string> = {
  business: "Business Plan",
  marketing: "Marketing Plan",
  sales: "Sales Plan",
};

// GET — one combined Markdown export of all plans + finance + forecast + reviews.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "no workspace" }, { status: 400 });

  const out: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  out.push(`# Strategic Plan — LifeCharter`, ``, `_Exported ${today}_`, ``);

  // Plans + goals.
  const { data: plans } = await supabase
    .from("client_plans")
    .select("id, plan_type, status, title, summary, updated_at")
    .eq("master_plan_id", masterPlanId)
    .eq("status", "active");
  const planList = (plans || []) as {
    id: string;
    plan_type: string;
    status: string | null;
    title: string | null;
    summary: string | null;
    updated_at: string | null;
  }[];

  for (const type of ["business", "marketing", "sales"]) {
    const p = planList.find((x) => x.plan_type === type);
    out.push(`## ${PLAN_TITLES[type]}`, ``);
    if (!p) {
      out.push(`_Not created yet._`, ``);
      continue;
    }
    if (p.title) out.push(`**${p.title}**`, ``);
    if (p.summary) out.push(p.summary, ``);
    const { data: goals } = await supabase
      .from("client_plan_goals")
      .select("title, detail, target, status")
      .eq("plan_id", p.id)
      .order("sort_order", { ascending: true });
    const gl = (goals || []) as { title: string | null; detail: string | null; target: string | null; status: string | null }[];
    if (gl.length) {
      out.push(`### Goals`, ``);
      for (const g of gl) {
        const mark = g.status === "done" || g.status === "complete" ? "x" : " ";
        out.push(`- [${mark}] ${g.title || ""}${g.target ? ` — target: ${g.target}` : ""}${g.detail ? ` — ${g.detail}` : ""}`);
      }
      out.push(``);
    }
    if (p.updated_at) out.push(`_Last updated ${new Date(p.updated_at).toISOString().slice(0, 10)}_`, ``);
  }

  // Finance snapshot.
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
    const amt = Number(e.amount ?? 0);
    if (e.type === "income") inc += amt;
    else exp += amt;
  }
  out.push(`## Finance (year to date)`, ``);
  out.push(`- Income: ${usd(inc)}`, `- Expenses: ${usd(exp)}`, `- Net: ${usd(inc - exp)}`, ``);

  // Forecast.
  try {
    const f = await buildForecast(masterPlanId);
    out.push(`## Financial Forecast (${f.assumptions.horizonMonths} months)`, ``);
    out.push(
      `Base monthly revenue ${usd(f.baseMonthlyRevenue)} · expense ratio ${f.derivedExpenseRatio}% · ` +
        `growth ${f.assumptions.monthlyGrowthPct}%/mo · pipeline close ${f.assumptions.pipelineClosePct}%`,
      ``
    );
    out.push(`| Scenario | Projected revenue | Projected net |`, `| --- | --- | --- |`);
    for (const s of f.scenarios) {
      out.push(`| ${s.label} | ${usd(s.totalRevenue)} | ${usd(s.totalNet)} |`);
    }
    out.push(``);
  } catch {
    /* forecast optional */
  }

  // Review schedule.
  const { data: reviews } = await supabase
    .from("planning_reviews")
    .select("title, scheduled_for, status, completed_at")
    .eq("master_plan_id", masterPlanId);
  const rv = (reviews || []) as { title: string; scheduled_for: string | null; status: string | null; completed_at: string | null }[];
  const upcoming = rv.filter((r) => r.status !== "completed").sort((a, b) => (a.scheduled_for || "9999").localeCompare(b.scheduled_for || "9999"));
  if (upcoming.length) {
    out.push(`## Upcoming Reviews`, ``);
    for (const r of upcoming) out.push(`- ${r.title}${r.scheduled_for ? ` — ${r.scheduled_for}` : ""}`);
    out.push(``);
  }
  const history = rv.filter((r) => r.status === "completed");
  if (history.length) {
    out.push(`## Review History`, ``);
    for (const r of history) out.push(`- ${r.title}${r.completed_at ? ` — completed ${new Date(r.completed_at).toISOString().slice(0, 10)}` : ""}`);
    out.push(``);
  }

  const md = out.join("\n");
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="strategic-plan-${today}.md"`,
      "Cache-Control": "no-store",
    },
  });
}
