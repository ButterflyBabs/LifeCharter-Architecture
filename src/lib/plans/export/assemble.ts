import { createServerClient } from "@/lib/supabase/server";
import { PLAN_KINDS, getBlueprint, type PlanKind } from "@/lib/plans/blueprints";
import { loadIncomeGoals } from "@/lib/finance/goals";
import { buildForecast } from "@/lib/planning/forecastData";
import { textToBlocks, VERSION_LABEL, templateLetter, type Block, type Part, type PlanDoc, type Version } from "./model";

type Db = ReturnType<typeof createServerClient>;

export interface PlanProgress {
  kind: PlanKind;
  label: string;
  total: number;
  complete: number; // sections marked Complete
  sections: { key: string; title: string; status: string; hasText: boolean }[];
  ready: boolean; // every section has text and is marked Complete
}

const APPENDIX_ORDER: PlanKind[] = ["marketing", "sales", "forecasting"];

export async function planProgress(db: Db, planId: string): Promise<Record<string, PlanProgress>> {
  const { data } = await db.from("plan_sections").select("plan_type, section_key, content, status").eq("master_plan_id", planId);
  const rows = (data || []) as { plan_type: string; section_key: string; content: string | null; status: string | null }[];
  const out: Record<string, PlanProgress> = {};
  for (const kind of PLAN_KINDS) {
    const bp = getBlueprint(kind)!;
    const sections = bp.sections.map((s) => {
      const r = rows.find((x) => x.plan_type === kind && x.section_key === s.key);
      return { key: s.key, title: s.title, status: r?.status || "empty", hasText: !!(r?.content || "").trim() };
    });
    const complete = sections.filter((s) => s.status === "done" && s.hasText).length;
    out[kind] = { kind, label: bp.label, total: sections.length, complete, sections, ready: complete === sections.length };
  }
  return out;
}

export async function defaultNames(db: Db, planId: string): Promise<{ business: string; preparedBy: string }> {
  const [{ data: ws }, { data: plan }] = await Promise.all([
    db.from("workspaces").select("name").eq("master_plan_id", planId).order("is_default", { ascending: false }).order("sort_order", { ascending: true }).limit(1),
    db.from("client_master_plans").select("client_email").eq("id", planId).maybeSingle(),
  ]);
  let preparedBy = "";
  const email = (plan as { client_email?: string } | null)?.client_email;
  if (email) {
    const { data: prof } = await db.from("profiles").select("full_name").eq("email", email).maybeSingle();
    preparedBy = ((prof as { full_name?: string } | null)?.full_name || "").trim();
  }
  return { business: ((ws?.[0] as { name?: string } | undefined)?.name || "").trim(), preparedBy };
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const monthName = (ym: string) => new Date(`${ym}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

async function financeBlocks(db: Db, planId: string): Promise<Block[]> {
  const blocks: Block[] = [];
  const now = new Date();
  const yearStart = `${now.getUTCFullYear()}-01-01`;
  const [{ data: fin }, goals] = await Promise.all([
    db.from("finance_entries").select("type, amount").eq("master_plan_id", planId).gte("occurred_on", yearStart),
    loadIncomeGoals(planId, db),
  ]);
  let inc = 0;
  let exp = 0;
  for (const e of (fin || []) as { type: string; amount: number | string | null }[]) {
    const a = Number(e.amount ?? 0);
    if (e.type === "income") inc += a;
    else exp += a;
  }
  blocks.push({ t: "h2", text: `Year to date (${now.getUTCFullYear()})` });
  blocks.push({ t: "table", head: ["", "Amount"], rows: [["Income", usd(inc)], ["Expenses", usd(exp)], ["Net", usd(inc - exp)]], widths: [3, 2] });

  const months: string[][] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const g = goals.forMonth(ym);
    if (g) months.push([monthName(ym), usd(g)]);
  }
  if (months.length) {
    blocks.push({ t: "h2", text: "Income goals, next 12 months" });
    blocks.push({ t: "table", head: ["Month", "Income goal"], rows: [...months, ["Total", usd(months.reduce((a, r) => a + Number(r[1].replace(/[^0-9]/g, "")), 0))]], widths: [3, 2] });
  }

  try {
    const f = await buildForecast(planId);
    blocks.push({ t: "h2", text: `Forecast, next ${f.assumptions.horizonMonths} months` });
    blocks.push({
      t: "note",
      text: `Based on recent actual income (about ${usd(f.baseMonthlyRevenue)} a month), ${f.assumptions.monthlyGrowthPct}% monthly growth and ${f.assumptions.pipelineClosePct}% of the open pipeline closing. Projections, not guarantees.`,
    });
    blocks.push({
      t: "table",
      head: ["Scenario", "Revenue", "Expenses", "Net"],
      rows: f.scenarios.map((s) => [s.label, usd(s.totalRevenue), usd(s.totalExpenses), usd(s.totalNet)]),
      widths: [3, 2, 2, 2],
    });
  } catch {
    /* forecast is optional */
  }
  return blocks;
}

export interface ExportOptions {
  version: Version;
  business: string;
  preparedBy: string;
  recipient: string;
  organization: string;
  ask: string;
  letter: string[] | null;
  appendices: string[];
  includeFinance: boolean;
}

export async function assembleDoc(db: Db, planId: string, o: ExportOptions): Promise<PlanDoc> {
  const kinds: PlanKind[] = ["business", ...APPENDIX_ORDER.filter((k) => o.appendices.includes(k))];
  const { data } = await db.from("plan_sections").select("plan_type, section_key, content").eq("master_plan_id", planId).in("plan_type", kinds);
  const rows = (data || []) as { plan_type: string; section_key: string; content: string | null }[];
  const textOf = (kind: string, key: string) => (rows.find((r) => r.plan_type === kind && r.section_key === key)?.content || "").trim();

  const parts: Part[] = [];
  const biz = getBlueprint("business")!;
  biz.sections.forEach((s, i) => {
    const text = textOf("business", s.key);
    if (text) parts.push({ title: `${i + 1}. ${s.title}`, level: 1, blocks: textToBlocks(text) });
  });
  if (o.includeFinance) {
    const fb = await financeBlocks(db, planId);
    if (fb.length) parts.push({ title: "Financial Overview", level: 1, pageBreakBefore: true, blocks: fb });
  }
  let letterIdx = 0;
  for (const k of APPENDIX_ORDER) {
    if (!kinds.includes(k)) continue;
    const bp = getBlueprint(k)!;
    const letter = String.fromCharCode(65 + letterIdx++);
    parts.push({ title: `Appendix ${letter}: ${bp.label}`, level: 1, pageBreakBefore: true, blocks: [{ t: "note", text: bp.tagline }] });
    for (const s of bp.sections) {
      const text = textOf(k, s.key);
      if (text) parts.push({ title: s.title, level: 2, blocks: textToBlocks(text) });
    }
  }

  const letter =
    o.version === "general" && !o.letter
      ? null
      : o.letter && o.letter.length
        ? o.letter
        : o.version === "general"
          ? null
          : templateLetter(o.version, { business: o.business, recipient: o.recipient, organization: o.organization, ask: o.ask, vision: textOf("business", "vision_mission") });

  return {
    label: "Business Plan",
    tagline: VERSION_LABEL[o.version],
    business: o.business,
    preparedBy: o.preparedBy,
    preparedFor: [o.recipient, o.organization].map((s) => s.trim()).filter(Boolean).join(", "),
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    letter,
    letterSignoff: o.preparedBy,
    parts,
  };
}
