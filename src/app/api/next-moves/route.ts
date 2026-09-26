import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { gatherAndCompute, isMeaningful } from "@/lib/scoring/gather";
import { DIMENSION_LABEL, type DimensionKey } from "@/lib/scoring/dimensionModel";
import { taskDimensions } from "@/lib/scoring/segmentScore";
import { latestInsight } from "@/lib/ai/planKnowledge";

export const dynamic = "force-dynamic";

// "Next 3 Moves" on Business Alignment — built from THIS client's own data.
//   1. If their assistant has written an alignment briefing recently, its three
//      moves are shown (they're anchored to the client's data by construction).
//   2. Otherwise the three weakest dimensions of their assessed alignment, each
//      described with what's really going on there: overdue tasks, slipped goals.
// With no assessed scores yet it returns nothing — the card then asks them to
// start the assessments instead of showing made-up moves.

const ACTION: Partial<Record<DimensionKey, string>> = {
  marketing: "Sharpen demand generation", sales: "Build a repeatable pipeline", operations: "Streamline delivery operations",
  finance: "Tighten cash flow & margins", team: "Clarify roles & capacity", systems: "Document SOPs and automate",
  leadership: "Reclaim founder capacity", vision: "Recommit to strategic priorities", product: "Refine your core offer",
  customer_experience: "Improve the client journey", legal: "Close compliance gaps", sustainability: "Shore up long-term resilience",
};
const HREF: Record<DimensionKey, string> = {
  marketing: "/marketing-plan", sales: "/sales", operations: "/operations", finance: "/finance", team: "/business-plan", systems: "/operations",
  leadership: "/business-plan", vision: "/business-plan", product: "/business-plan", customer_experience: "/marketing-plan", legal: "/business-plan", sustainability: "/business-plan",
};
const FRESH_DAYS = 30;

export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ hasData: false, moves: [] });
  const db = createServerClient();

  // 1. The assistant's own briefing, when it's recent.
  try {
    const i = await latestInsight(planId, "alignment");
    const moves = Array.isArray(i?.content?.moves) ? (i!.content.moves as { title?: string; why?: string; href?: string; task?: string; area?: string }[]) : [];
    if (i && moves.length && Date.now() - new Date(i.createdAt).getTime() < FRESH_DAYS * 86400000) {
      return NextResponse.json({
        hasData: true, source: "assistant", assistant: i.assistant, briefedAt: i.createdAt,
        moves: moves.slice(0, 3).map((m, n) => ({ id: n + 1, title: String(m.title ?? ""), subtitle: String(m.why ?? ""), badge: String(m.area ?? "").replace(/^./, (c) => c.toUpperCase()), impact: null, href: m.href || "/business-alignment", task: String(m.task || m.title || "") })).filter((m) => m.title),
      }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch {
    /* fall through to the data-built moves */
  }

  // 2. Built from their scores, tasks and goals.
  const computed = await gatherAndCompute(planId).catch(() => null);
  const scored = (computed?.domains ?? []).filter((d) => d.score !== null) as { key: DimensionKey; score: number }[];
  if (!computed || !isMeaningful(computed.domains)) return NextResponse.json({ hasData: false, moves: [] }, { headers: { "Cache-Control": "no-store" } });
  const weakest = [...scored].sort((a, b) => a.score - b.score).slice(0, 3);

  const now = Date.now();
  const since = now - 90 * 86400000;
  const [{ data: taskRows }, { data: planRows }] = await Promise.all([
    db.from("tasks").select("*").eq("master_plan_id", planId).limit(2000),
    db.from("client_plans").select("id").eq("master_plan_id", planId).eq("status", "active"),
  ]);
  const planIds = ((planRows ?? []) as { id: string }[]).map((p) => p.id);
  const { data: goalRows } = planIds.length ? await db.from("client_plan_goals").select("dimension_key, title, status").in("plan_id", planIds) : { data: [] };
  const goals = (goalRows ?? []) as { dimension_key: string | null; title: string; status: string | null }[];
  const tasks = ((taskRows ?? []) as Record<string, unknown>[]).map((t) => ({
    open: t.status !== "done",
    done: t.status === "done" && typeof t.completed_at === "string" && new Date(t.completed_at as string).getTime() >= since,
    due: t.due_at ? new Date(t.due_at as string).getTime() : t.due_date ? new Date(`${t.due_date}T23:59:59`).getTime() : null,
    dims: taskDimensions(t as { title: string } & Record<string, unknown>),
  }));

  const moves = weakest.map((w, n) => {
    const label = DIMENSION_LABEL[w.key];
    const mine = tasks.filter((t) => t.dims.includes(w.key));
    const overdue = mine.filter((t) => t.open && t.due !== null && (t.due as number) < now).length;
    const open = mine.filter((t) => t.open).length;
    const slipped = goals.filter((g) => g.dimension_key === w.key && g.status === "slipped");
    const behind = goals.filter((g) => g.dimension_key === w.key && (g.status === "not_started" || g.status === "in_progress"));
    const title = slipped[0] ? `Get “${slipped[0].title.slice(0, 70)}” back on track` : overdue > 0 ? `Clear your overdue ${label} tasks` : ACTION[w.key] ?? `Strengthen ${label}`;
    const facts = [
      `${label} ${Math.round(w.score)}/100`,
      overdue > 0 ? `${overdue} overdue task${overdue === 1 ? "" : "s"}` : open > 0 ? `${open} open task${open === 1 ? "" : "s"}` : null,
      slipped.length ? `${slipped.length} plan goal${slipped.length === 1 ? "" : "s"} slipped` : behind.length ? `${behind.length} plan goal${behind.length === 1 ? "" : "s"} in play` : null,
      !open && !slipped.length && !behind.length ? "nothing tied to this area yet" : null,
    ].filter(Boolean);
    const impact = w.score < 50 || slipped.length || overdue ? "High" : w.score < 70 ? "Medium" : "Low";
    return { id: n + 1, title, subtitle: facts.join(" · "), impact, badge: `${impact} impact`, href: HREF[w.key], task: title };
  });
  return NextResponse.json({ hasData: true, source: "data", moves }, { headers: { "Cache-Control": "no-store" } });
}
