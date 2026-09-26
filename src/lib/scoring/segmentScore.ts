import { createServerClient } from "@/lib/supabase/server";
import { gatherAndCompute } from "@/lib/scoring/gather";
import { DIMENSION_KEYS, DIMENSION_LABEL, type DimensionKey } from "@/lib/scoring/dimensionModel";
import { planBusinessIds } from "@/lib/planScope";

// Segment scores from EVIDENCE, not opinion.
//
// A segment starts from the business-wide score for each dimension (what the
// assessments established) and moves with what is actually tied to THAT segment:
//   • income and expenses tagged to it        → Finance (margin, target, trend)
//   • sales activity logged for it            → Sales (volume, outcomes)
//   • plan goals assigned to it               → the goal's dimension (met / slipped…)
//   • tasks assigned to it                    → the task's dimension (done vs overdue)
// Tasks are placed in a dimension by their tags, else by what the title is about.
// With little tagged activity a segment simply keeps the business-wide score and
// says so; the more that's tied to it, the more its own score can diverge.
// Weekly snapshots turn the scores into progress. A coach's manual override wins.

const DAY = 86400000;
const WINDOW_DAYS = 90;

export interface DimResult {
  score: number | null;
  source: "activity" | "business" | "coach" | "none";
  evidence: { tasks: number; goals: number; ledger: number; sales: number };
  needs: string[];
  wins: string[];
  delta: number | null;
}
export interface SegmentResult {
  id: number;
  businessId: number;
  name: string;
  overall: number | null;
  overallDelta: number | null;
  coverage: { tasks: number; goals: number; ledger: number; sales: number; total: number };
  scoredOnActivity: boolean;
  dims: Record<string, DimResult>;
  needs: { dimension: string; label: string; score: number; why: string[] }[];
  progress: { dimension: string; label: string; delta: number | null; why: string[] }[];
}

// What a task title is about, when it wasn't tagged to a dimension.
const KEYWORDS: Record<DimensionKey, RegExp> = {
  marketing: /\b(post|content|social|newsletter|email list|blog|campaign|ads?|seo|brand|launch|webinar|instagram|linkedin|facebook|video|podcast|lead magnet|funnel|reel)\b/i,
  sales: /\b(call|follow[- ]?up|proposal|pitch|prospect|close|deal|discovery|quote|sales|outreach|dms?|demo|leads?)\b/i,
  finance: /\b(invoice|budget|tax(es)?|payroll|bookkeep\w*|expenses?|payment|billing|cash|revenue|pricing|profit)\b/i,
  operations: /\b(process|deliver\w*|schedule|fulfil\w*|ship\w*|onboard\w*|logistics?|inventory|vendor|operations?)\b/i,
  team: /\b(hire|hiring|team|staff|contractors?|assistant|training|recruit\w*|1:1)\b/i,
  systems: /\b(systems?|automat\w+|crm|zapier|software|tools?|sops?|templates?|workflows?|integrat\w+|tech|website|domain|app)\b/i,
  leadership: /\b(strategy|planning|quarterly|delegat\w+|decision|review|goals?)\b/i,
  vision: /\b(vision|mission|purpose|values|legacy)\b/i,
  product: /\b(product|offer|program|course|curriculum|package|workbook|module)\b/i,
  customer_experience: /\b(client|customer|feedback|testimonial|survey|support|retention|welcome)\b/i,
  legal: /\b(contract|legal|trademark|llc|compliance|insurance|terms|privacy|licen[sc]e|nda)\b/i,
  sustainability: /\b(rest|health|burnout|boundar\w+|vacation|self[- ]care|wellbeing|balance)\b/i,
};

interface TaskRow {
  segment_id: number; title: string; status: string; due_at: string | null; due_date: string | null; completed_at: string | null; created_at: string;
  [flag: string]: unknown;
}

export function taskDimensions(t: Pick<TaskRow, "title"> & Record<string, unknown>): DimensionKey[] {
  const flagged = DIMENSION_KEYS.filter((k) => t[`dimension_${k}`] === true);
  if (flagged.length) return flagged;
  return DIMENSION_KEYS.filter((k) => KEYWORDS[k].test(t.title || "")).slice(0, 2);
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const pct = (n: number) => `${Math.round(n * 100)}%`;
const plural = (n: number, w: string) => `${n} ${n === 1 ? w : /y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`}`;

interface Signal { score: number; n: number; w: number; needs: string[]; wins: string[] }

// How well a set of tasks is being carried out.
function taskSignal(list: TaskRow[], now: number, label: string, w: number): Signal | null {
  const since = now - WINDOW_DAYS * DAY;
  const inWindow = list.filter((t) => t.status !== "done" || (t.completed_at && new Date(t.completed_at).getTime() >= since));
  if (!inWindow.length) return null;
  let done = 0, overdue = 0, open = 0;
  for (const t of inWindow) {
    if (t.status === "done") done += 1;
    else {
      const due = t.due_at ? new Date(t.due_at).getTime() : t.due_date ? new Date(`${t.due_date}T23:59:59`).getTime() : null;
      if (due !== null && due < now) overdue += 1;
      else open += 1;
    }
  }
  const denom = done + 1.5 * overdue + 0.4 * open;
  if (denom === 0) return null;
  const score = clamp(25 + 75 * (done / denom));
  return {
    score, n: inWindow.length, w,
    needs: overdue > 0 ? [`${plural(overdue, `overdue ${label} task`)}`] : done === 0 && open >= 3 ? [`${plural(open, `${label} task`)} open and none finished yet`] : [],
    wins: done >= 2 && score >= 75 ? [`${plural(done, `${label} task`)} finished in the last ${WINDOW_DAYS} days`] : [],
  };
}

export async function computeSegmentScores(planId: string): Promise<SegmentResult[]> {
  const db = createServerClient();
  const now = Date.now();
  const bizIds = await planBusinessIds(planId);
  if (!bizIds.length) return [];
  const { data: segRows } = await db.from("segments").select("id, business_id, name, revenue_target").in("business_id", bizIds).eq("active", true).order("sort_order");
  const segs = (segRows ?? []) as { id: number; business_id: number; name: string; revenue_target: number | string | null }[];
  if (!segs.length) return [];
  const segIds = segs.map((s) => s.id);
  const sinceDay = new Date(now - 120 * DAY).toISOString().slice(0, 10);

  const { data: planRows } = await db.from("client_plans").select("id").eq("master_plan_id", planId);
  const planIds = ((planRows ?? []) as { id: string }[]).map((p) => p.id);

  const [base, coachRows, tasks, goals, ledger, sales, snaps] = await Promise.all([
    gatherAndCompute(planId).then((o) => Object.fromEntries((o.domains ?? []).filter((d) => d.score !== null).map((d) => [d.key, Math.round(d.score as number)]))).catch(() => ({} as Record<string, number>)),
    db.from("segment_dimensions").select("segment_id, dimension_key, score").in("segment_id", segIds).eq("updated_by", "coach").then((r) => (r.data ?? []) as { segment_id: number; dimension_key: string; score: number }[]),
    db.from("tasks").select("*").eq("master_plan_id", planId).in("segment_id", segIds).limit(4000).then((r) => (r.data ?? []) as TaskRow[]),
    planIds.length ? db.from("client_plan_goals").select("segment_id, dimension_key, title, status").in("plan_id", planIds).in("segment_id", segIds).then((r) => (r.data ?? []) as { segment_id: number; dimension_key: string | null; title: string; status: string | null }[]) : Promise.resolve([] as { segment_id: number; dimension_key: string | null; title: string; status: string | null }[]),
    db.from("finance_entries").select("segment_id, type, amount, occurred_on").eq("master_plan_id", planId).in("segment_id", segIds).gte("occurred_on", sinceDay).limit(5000).then((r) => (r.data ?? []) as { segment_id: number; type: string; amount: number | string | null; occurred_on: string }[]),
    db.from("sales_activities").select("segment_id, outcome, occurred_on").eq("master_plan_id", planId).in("segment_id", segIds).gte("occurred_on", new Date(now - WINDOW_DAYS * DAY).toISOString().slice(0, 10)).limit(3000).then((r) => (r.data ?? []) as { segment_id: number; outcome: string | null; occurred_on: string }[]),
    db.from("segment_score_snapshots").select("segment_id, domains, overall, created_at").in("segment_id", segIds).order("created_at", { ascending: false }).limit(2000).then((r) => (r.data ?? []) as { segment_id: number; domains: Record<string, number>; overall: number | null; created_at: string }[]),
  ]);
  const coach = new Map(coachRows.map((r) => [`${r.segment_id}:${r.dimension_key}`, r.score]));

  const day30 = new Date(now - 30 * DAY).toISOString().slice(0, 10);
  const day60 = new Date(now - 60 * DAY).toISOString().slice(0, 10);
  const day90 = new Date(now - 90 * DAY).toISOString().slice(0, 10);
  const GOAL_SCORE: Record<string, number> = { met: 100, in_progress: 65, not_started: 45, slipped: 20 };

  return segs.map((seg) => {
    const myTasks = tasks.filter((t) => t.segment_id === seg.id);
    const myGoals = goals.filter((g) => g.segment_id === seg.id);
    const myLedger = ledger.filter((e) => e.segment_id === seg.id && e.occurred_on >= day90);
    const mySales = sales.filter((s) => s.segment_id === seg.id);
    const mySnaps = snaps.filter((s) => s.segment_id === seg.id);
    // The score point closest to four weeks ago (but at least a week old) to measure progress against.
    const ref = mySnaps.filter((s) => now - new Date(s.created_at).getTime() >= 6 * DAY).sort((a, b) => Math.abs(now - 28 * DAY - new Date(a.created_at).getTime()) - Math.abs(now - 28 * DAY - new Date(b.created_at).getTime()))[0];

    // ---- Finance signal (only from what's tagged to this segment) ----
    let finSignal: Signal | null = null;
    if (myLedger.length) {
      const inc = myLedger.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount ?? 0), 0);
      const exp = myLedger.filter((e) => e.type !== "income").reduce((s, e) => s + Number(e.amount ?? 0), 0);
      const parts: number[] = [];
      const needs: string[] = [];
      const wins: string[] = [];
      if (inc > 0) {
        const margin = (inc - exp) / inc;
        const m = margin >= 0.4 ? 92 : margin >= 0.25 ? 82 : margin >= 0.1 ? 70 : margin >= 0 ? 58 : margin >= -0.25 ? 42 : 28;
        parts.push(m);
        if (margin < 0.1) needs.push(`margin is ${pct(margin)} over the last 90 days`);
        else if (margin >= 0.3) wins.push(`healthy ${pct(margin)} margin`);
      } else if (exp > 0) {
        parts.push(25);
        needs.push("expenses recorded but no income yet");
      }
      const target = Number(seg.revenue_target ?? 0);
      if (target > 0) {
        const avg = inc / 3;
        parts.push(clamp(30 + 70 * Math.min(1, avg / target)));
        if (avg / target < 0.7) needs.push(`income is at ${pct(avg / target)} of the ${`$${Math.round(target).toLocaleString("en-US")}`} monthly target`);
        else if (avg / target >= 1) wins.push("meeting its monthly income target");
      }
      const last30 = myLedger.filter((e) => e.type === "income" && e.occurred_on >= day30).reduce((s, e) => s + Number(e.amount ?? 0), 0);
      const prev30 = myLedger.filter((e) => e.type === "income" && e.occurred_on >= day60 && e.occurred_on < day30).reduce((s, e) => s + Number(e.amount ?? 0), 0);
      if (prev30 > 0) {
        const change = (last30 - prev30) / prev30;
        parts.push(clamp(60 + change * 40, 25, 95));
        if (change <= -0.15) needs.push(`income is down ${pct(Math.abs(change))} on the previous 30 days`);
        else if (change >= 0.15) wins.push(`income is up ${pct(change)} on the previous 30 days`);
      }
      if (parts.length) finSignal = { score: parts.reduce((a, b) => a + b, 0) / parts.length, n: myLedger.length, w: 1, needs, wins };
    }

    // ---- Sales signal ----
    let salesSignal: Signal | null = null;
    if (mySales.length) {
      const recent = mySales.filter((s) => s.occurred_on >= day30).length;
      const outcomes = mySales.filter((s) => s.outcome && s.outcome !== "no_answer");
      const positive = outcomes.filter((s) => s.outcome === "won" || s.outcome === "booked" || s.outcome === "connected").length;
      const parts = [clamp(35 + 8 * recent)];
      if (outcomes.length >= 3) parts.push(clamp(30 + 70 * (positive / outcomes.length)));
      salesSignal = {
        score: parts.reduce((a, b) => a + b, 0) / parts.length, n: mySales.length, w: 1,
        needs: recent === 0 ? ["no sales activity in the last 30 days"] : recent < 4 ? [`only ${plural(recent, "sales activity")} in the last 30 days`] : [],
        wins: recent >= 8 ? [`${plural(recent, "sales activity")} in the last 30 days`] : [],
      };
    }

    const tasksByDim = new Map<DimensionKey, TaskRow[]>();
    for (const t of myTasks) for (const d of taskDimensions(t)) tasksByDim.set(d, [...(tasksByDim.get(d) ?? []), t]);
    const allTaskSignal = taskSignal(myTasks, now, "", 0.4);

    const dims: Record<string, DimResult> = {};
    for (const key of DIMENSION_KEYS) {
      const label = DIMENSION_LABEL[key];
      const signals: Signal[] = [];
      const ev = { tasks: 0, goals: 0, ledger: 0, sales: 0 };

      const dimTasks = taskSignal(tasksByDim.get(key) ?? [], now, label, 0.6);
      if (dimTasks) { signals.push(dimTasks); ev.tasks = dimTasks.n; }
      const dimGoals = myGoals.filter((g) => g.dimension_key === key);
      if (dimGoals.length) {
        const s = dimGoals.reduce((a, g) => a + (GOAL_SCORE[g.status || "not_started"] ?? 45), 0) / dimGoals.length;
        signals.push({
          score: s, n: dimGoals.length, w: 0.8,
          needs: dimGoals.filter((g) => g.status === "slipped").slice(0, 2).map((g) => `goal “${g.title.slice(0, 60)}” slipped`),
          wins: dimGoals.filter((g) => g.status === "met").slice(0, 2).map((g) => `goal “${g.title.slice(0, 60)}” met`),
        });
        ev.goals = dimGoals.length;
      }
      if (key === "finance" && finSignal) { signals.push(finSignal); ev.ledger = finSignal.n; }
      if (key === "sales" && salesSignal) { signals.push(salesSignal); ev.sales = salesSignal.n; }
      if (key === "operations" && allTaskSignal) { signals.push({ ...allTaskSignal, needs: allTaskSignal.needs.map((x) => x.replace(/^(\d+) overdue\s+task/, "$1 overdue task")), wins: [] }); ev.tasks = Math.max(ev.tasks, allTaskSignal.n); }

      // Weight each signal by how much there is behind it (3+ items = full weight).
      let W = 0, sum = 0;
      for (const s of signals) { const eff = s.w * Math.min(1, s.n / 3); W += eff; sum += s.score * eff; }
      const evScore = W > 0 ? sum / W : null;
      const baseScore = typeof (base as Record<string, number>)[key] === "number" ? (base as Record<string, number>)[key] : null;
      const alpha = Math.min(0.65, W * 0.65);

      let score: number | null;
      let source: DimResult["source"];
      const coachScore = coach.get(`${seg.id}:${key}`);
      if (typeof coachScore === "number") { score = coachScore; source = "coach"; }
      else if (evScore !== null && baseScore !== null) { score = Math.round(baseScore * (1 - alpha) + evScore * alpha); source = W >= 0.19 ? "activity" : "business"; }
      else if (evScore !== null) { score = Math.round(evScore); source = W >= 0.19 ? "activity" : "none"; }
      else if (baseScore !== null) { score = baseScore; source = "business"; }
      else { score = null; source = "none"; }

      const refScore = ref?.domains?.[key];
      dims[key] = {
        score, source, evidence: ev,
        needs: signals.flatMap((s) => s.needs).slice(0, 3),
        wins: signals.flatMap((s) => s.wins).slice(0, 3),
        delta: score !== null && typeof refScore === "number" ? score - refScore : null,
      };
    }

    const scored = Object.entries(dims).filter(([, d]) => d.score !== null);
    const overall = scored.length ? Math.round(scored.reduce((a, [, d]) => a + (d.score as number), 0) / scored.length) : null;
    const overallDelta = overall !== null && typeof ref?.overall === "number" ? overall - ref.overall : null;

    const needs = scored
      .filter(([, d]) => (d.score as number) < 70)
      .sort((a, b) => (a[1].score as number) - (b[1].score as number))
      .slice(0, 3)
      .map(([k, d]) => ({ dimension: k, label: DIMENSION_LABEL[k as DimensionKey], score: d.score as number, why: d.needs.length ? d.needs : d.source === "business" ? ["business-wide assessment — nothing tagged to this segment yet"] : [] }));
    const progress = scored
      .filter(([, d]) => (d.delta !== null && d.delta >= 3) || d.wins.length > 0)
      .sort((a, b) => (b[1].delta ?? 0) - (a[1].delta ?? 0))
      .slice(0, 3)
      .map(([k, d]) => ({ dimension: k, label: DIMENSION_LABEL[k as DimensionKey], delta: d.delta, why: d.wins }));

    const coverage = { tasks: myTasks.length, goals: myGoals.length, ledger: myLedger.length, sales: mySales.length, total: myTasks.length + myGoals.length + myLedger.length + mySales.length };
    return {
      id: seg.id, businessId: seg.business_id, name: seg.name, overall, overallDelta, coverage,
      scoredOnActivity: Object.values(dims).some((d) => d.source === "activity"),
      dims, needs, progress,
    };
  });
}

const healthFor = (n: number) => (n < 60 ? "at_risk" : n < 80 ? "attention" : "healthy");

// Saves the computed scores where the rest of the Suite reads them (Next Three
// Moves, the Business Alignment view) and drops a weekly snapshot per segment so
// progress can be shown. Coach overrides are never touched. Throttled: at most
// once an hour per account unless forced.
export async function persistSegmentScores(planId: string, results: SegmentResult[], force = false): Promise<void> {
  if (!results.length) return;
  const db = createServerClient();
  const segIds = results.map((r) => r.id);
  if (!force) {
    const { data } = await db.from("segment_dimensions").select("updated_at").in("segment_id", segIds).or("updated_by.is.null,updated_by.neq.coach").order("updated_at", { ascending: false }).limit(1);
    const last = data?.[0]?.updated_at ? new Date(data[0].updated_at as string).getTime() : 0;
    if (Date.now() - last < 3600000) return;
  }
  for (const r of results) {
    await db.from("segment_dimensions").delete().eq("segment_id", r.id).or("updated_by.is.null,updated_by.neq.coach");
    const rows = Object.entries(r.dims)
      .filter(([, d]) => d.score !== null && d.source !== "coach")
      .map(([k, d]) => ({ segment_id: r.id, dimension_key: k, score: d.score as number, health: healthFor(d.score as number), updated_by: "ai" }));
    if (rows.length) await db.from("segment_dimensions").insert(rows);
  }
  // Weekly snapshots.
  const { data: recent } = await db.from("segment_score_snapshots").select("segment_id").in("segment_id", segIds).gte("created_at", new Date(Date.now() - 6 * DAY).toISOString());
  const have = new Set(((recent ?? []) as { segment_id: number }[]).map((s) => s.segment_id));
  const snaps = results
    .filter((r) => r.overall !== null && !have.has(r.id))
    .map((r) => ({ segment_id: r.id, overall: r.overall, domains: Object.fromEntries(Object.entries(r.dims).filter(([, d]) => d.score !== null).map(([k, d]) => [k, d.score])) }));
  if (snaps.length) await db.from("segment_score_snapshots").insert(snaps);
}
