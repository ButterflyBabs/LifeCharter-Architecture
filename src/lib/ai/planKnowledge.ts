import { createServerClient } from "@/lib/supabase/server";
import { BLUEPRINTS, PLAN_KINDS, sectionQuestions } from "@/lib/plans/blueprints";
import { buildForecast } from "@/lib/planning/forecastData";

// What a client's Strategic Planning work says — their four plans, the goals
// under them, the latest reviews, budgets, forecast, sales targets and pipeline,
// and what their assistant last concluded about each area — as plain text for
// their assistant. This is what makes the plans *inform* the rest of the Suite:
// the chat assistant, Daily Compass insights, Quick Wins, Scripts and content
// drafting all read it. Everything is scoped to one client's plan.

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trim()}…` : s.trim());
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export type InsightArea = "hub" | "forecast" | "finance" | "sales" | "alignment" | "progress" | "profile" | "segments" | "reviews" | "operations";

// The latest thing this client's assistant concluded about an area.
export async function latestInsight(masterPlanId: string, area: InsightArea) {
  const { data } = await createServerClient()
    .from("planning_insights")
    .select("assistant, content, created_at")
    .eq("master_plan_id", masterPlanId)
    .eq("area", area)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { assistant: (data.assistant as string) || "", content: data.content as Record<string, unknown>, createdAt: data.created_at as string } : null;
}

// Keeps the last few per area (older ones are pruned) so history stays small.
export async function saveInsight(masterPlanId: string, area: InsightArea, assistant: string, content: Record<string, unknown>) {
  const db = createServerClient();
  await db.from("planning_insights").insert({ master_plan_id: masterPlanId, area, assistant, content });
  const { data } = await db.from("planning_insights").select("id").eq("master_plan_id", masterPlanId).eq("area", area).order("created_at", { ascending: false }).range(10, 200);
  const stale = (data ?? []).map((r) => r.id as string);
  if (stale.length) await db.from("planning_insights").delete().in("id", stale);
}

export async function planningKnowledge(masterPlanId: string): Promise<string> {
  const db = createServerClient();
  const parts: string[] = [];

  // The four plans: what's written, and how far along.
  try {
    const [{ data: secs }, { data: plans }, { data: reviews }] = await Promise.all([
      db.from("plan_sections").select("plan_type, section_key, content, answers").eq("master_plan_id", masterPlanId),
      db.from("client_plans").select("id, plan_type, title, summary").eq("master_plan_id", masterPlanId).eq("status", "active"),
      db.from("plan_reviews").select("plan_type, report, created_at").eq("master_plan_id", masterPlanId).order("created_at", { ascending: false }).limit(12),
    ]);
    const goalsByPlan = new Map<string, { title: string; target: string | null; status: string | null }[]>();
    const planIds = ((plans ?? []) as { id: string }[]).map((p) => p.id);
    if (planIds.length) {
      const { data: goals } = await db.from("client_plan_goals").select("plan_id, title, target, status").in("plan_id", planIds).order("sort_order");
      for (const g of (goals ?? []) as { plan_id: string; title: string; target: string | null; status: string | null }[]) {
        goalsByPlan.set(g.plan_id, [...(goalsByPlan.get(g.plan_id) ?? []), g]);
      }
    }
    for (const kind of PLAN_KINDS) {
      const bp = BLUEPRINTS[kind];
      const written = ((secs ?? []) as { plan_type: string; section_key: string; content: string | null; answers: Record<string, unknown> | null }[]).filter(
        (r) => r.plan_type === kind
      );
      const lines: string[] = [];
      for (const s of bp.sections) {
        const r = written.find((w) => w.section_key === s.key);
        if (!r) continue;
        const text = (r.content || "").trim();
        const firstAnswer = sectionQuestions(s)
          .map((q) => r.answers?.[q.id])
          .find((a): a is string => typeof a === "string" && a.trim().length > 0);
        const body = text || firstAnswer || "";
        if (body) lines.push(`  • ${s.title}: ${clip(oneLine(body), 220)}`);
        if (lines.length >= 7) break;
      }
      const plan = ((plans ?? []) as { id: string; plan_type: string; title: string | null; summary: string | null }[]).find((p) => p.plan_type === kind);
      const goals = plan ? goalsByPlan.get(plan.id) ?? [] : [];
      const review = ((reviews ?? []) as { plan_type: string; report: { focus?: string; summary?: string }; created_at: string }[]).find((r) => r.plan_type === kind);
      if (!lines.length && !plan && !review) {
        parts.push(`${bp.label}: not started.`);
        continue;
      }
      const head = `${bp.label}${lines.length ? ` — ${lines.length} of ${bp.sections.length} sections written` : ""}${plan?.summary ? `. Summary: ${clip(oneLine(plan.summary), 260)}` : ""}`;
      const goalLine = goals.length ? `\n  Goals: ${goals.slice(0, 6).map((g) => `${clip(g.title, 70)}${g.target ? ` (target: ${clip(g.target, 60)})` : ""} [${(g.status || "not_started").replace(/_/g, " ")}]`).join("; ")}` : "";
      const reviewLine = review?.report?.focus ? `\n  Latest review — focus before the next one: ${clip(oneLine(review.report.focus), 200)}` : "";
      parts.push(`${head}${lines.length ? "\n" + lines.join("\n") : ""}${goalLine}${reviewLine}`);
    }
  } catch {
    /* optional */
  }

  // Money plans: monthly budgets and the forecast.
  try {
    const { data: budgets } = await db.from("finance_budgets").select("type, category, amount").eq("master_plan_id", masterPlanId);
    const rows = (budgets ?? []) as { type: string; category: string | null; amount: number | string | null }[];
    if (rows.length) {
      const inc = rows.find((b) => b.type === "income" && !(b.category || "").trim());
      const exp = rows.filter((b) => b.type === "expense").sort((a, b) => Number(b.amount) - Number(a.amount));
      parts.push(
        `Budgets (monthly): ${inc ? `income goal ${usd(Number(inc.amount))}` : "no income goal set"}` +
          (exp.length ? `; expenses — ${exp.slice(0, 6).map((b) => `${b.category || "overall"} ${usd(Number(b.amount))}`).join(", ")}` : "") +
          "."
      );
    } else {
      parts.push("Budgets: none set yet.");
    }
    const f = await buildForecast(masterPlanId);
    const by = (k: string) => f.scenarios.find((s) => s.key === k);
    const cons = by("conservative");
    const exp2 = by("expected");
    const opt = by("optimistic");
    if (exp2 && f.baseMonthlyRevenue > 0) {
      parts.push(
        `Forecast (${f.assumptions.horizonMonths} months, ${f.assumptions.monthlyGrowthPct}% monthly growth, ${f.assumptions.pipelineClosePct}% of pipeline closes): starting from ${usd(f.baseMonthlyRevenue)}/month revenue, expected net ${usd(exp2.totalNet)}` +
          (cons && opt ? ` (conservative ${usd(cons.totalNet)}, optimistic ${usd(opt.totalNet)})` : "") +
          "."
      );
    } else {
      parts.push("Forecast: not enough income history yet to project.");
    }
  } catch {
    /* optional */
  }

  // Sales: weekly activity targets and the pipeline.
  try {
    const [{ data: goals }, { data: acts }] = await Promise.all([
      db.from("sales_goals").select("activity_type, weekly_target").eq("master_plan_id", masterPlanId),
      db.from("sales_activities").select("estimated_value, outcome").eq("master_plan_id", masterPlanId),
    ]);
    const g = (goals ?? []) as { activity_type: string; weekly_target: number }[];
    let pipeline = 0;
    let open = 0;
    for (const a of (acts ?? []) as { estimated_value: number | string | null; outcome: string | null }[]) {
      if (a.outcome === "won" || a.outcome === "lost") continue;
      pipeline += Number(a.estimated_value ?? 0);
      open += 1;
    }
    parts.push(
      `Sales: weekly targets — ${g.length ? g.map((x) => `${x.activity_type} ${x.weekly_target}`).join(", ") : "none set"}; open pipeline ${usd(pipeline)} across ${open} opportunit${open === 1 ? "y" : "ies"}.`
    );
  } catch {
    /* optional */
  }

  // What their assistant last concluded (so it stays consistent with itself).
  try {
    for (const [area, label] of [["hub", "Planning briefing"], ["forecast", "Forecast read"], ["finance", "Finance read"]] as const) {
      const i = await latestInsight(masterPlanId, area);
      const summary = typeof i?.content?.summary === "string" ? i.content.summary : "";
      if (summary) parts.push(`${label} (${i!.createdAt.slice(0, 10)}): ${clip(oneLine(summary), 260)}`);
    }
  } catch {
    /* optional */
  }

  return parts.length ? `STRATEGIC PLANNING —\n${parts.join("\n")}` : "";
}
