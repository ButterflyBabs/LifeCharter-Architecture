import { createServerClient } from "@/lib/supabase/server";
import { zonedToUtcISO } from "@/lib/tz";
import { EMPTY_GOALS, buildReport, guidance, type AdRow, type Goals, type Guidance, type Outcomes, type Report } from "@/lib/metaAdsReport";

type Db = ReturnType<typeof createServerClient>;

type StatRow = {
  ad_name: string; campaign_name: string | null; period_start: string; period_end: string; spend: number | string; impressions: number;
  reach: number | null; link_clicks: number; leads: number; frequency: number | string | null; delivery: string | null;
};

const toRow = (r: StatRow): AdRow => ({
  adName: r.ad_name,
  campaign: r.campaign_name,
  periodStart: r.period_start,
  periodEnd: r.period_end,
  spend: Number(r.spend),
  impressions: r.impressions,
  reach: r.reach,
  linkClicks: r.link_clicks,
  leads: r.leads,
  frequency: r.frequency == null ? null : Number(r.frequency),
  delivery: r.delivery,
});

export async function loadGoals(db: Db, planId: string): Promise<Goals> {
  const { data } = await db.from("meta_ad_goals").select("target_cpl, daily_budget, customer_value, goal_leads, goal_by, monthly_limit, event_anchor, cycle_days, cycle_hour, answers").eq("master_plan_id", planId).maybeSingle();
  if (!data) return EMPTY_GOALS;
  const n = (v: unknown) => (v == null ? null : Number(v));
  return {
    targetCpl: n(data.target_cpl),
    dailyBudget: n(data.daily_budget),
    customerValue: n(data.customer_value),
    goalLeads: n(data.goal_leads),
    goalBy: (data.goal_by as string) ?? null,
    monthlyLimit: n(data.monthly_limit),
    eventAnchor: (data.event_anchor as string) ?? null,
    cycleDays: n(data.cycle_days),
    cycleHour: n(data.cycle_hour),
    answers: (data.answers as Record<string, string>) ?? {},
  };
}

// Tags the Suite puts on people as they move through a lead's journey. Test and older-event tags are left out.
const attendedTag = (t: string) => /attended/.test(t) && !/test|sneak-peek/.test(t);
const bookedTag = (t: string) => /^booked-/.test(t) && !/test/.test(t);
const soldTag = (t: string) => ["lccs-paying-client", "command-suite-customer", "customer"].includes(t);

/** What happened to the people Meta sent in during a period, from the Suite's own contacts. */
export async function loadOutcomes(db: Db, planId: string, start: string, end: string): Promise<Outcomes> {
  const { data: leads } = await db
    .from("meta_leads")
    .select("email, status, ad_name")
    .eq("master_plan_id", planId)
    .or("source.is.null,source.neq.linkedin")
    .gte("created_at", zonedToUtcISO(start, "00:00", "America/Denver"))
    .lte("created_at", zonedToUtcISO(end, "23:59", "America/Denver"))
    .not("status", "in", "(test,failed)")
    .limit(5000);
  const got = (leads ?? []) as { email: string | null; ad_name: string | null }[];
  const emails = Array.from(new Set(got.map((l) => (l.email || "").toLowerCase()).filter(Boolean)));
  const named = got.filter((l) => (l.ad_name || "").trim()).length;
  if (!emails.length) return { registered: 0, attended: 0, booked: 0, sold: 0, suiteLeads: 0, named: 0 };
  const { data: contacts } = await db.from("seq_contacts").select("email, tags").eq("master_plan_id", planId).in("email", emails);
  const people = (contacts ?? []) as { email: string; tags: string[] | null }[];
  const has = (f: (t: string) => boolean) => people.filter((p) => (p.tags ?? []).some(f)).length;
  return { suiteLeads: emails.length, named, registered: people.length, attended: has(attendedTag), booked: has(bookedTag), sold: has(soldTag) };
}

/** When each Meta lead reached the Suite (test and failed ones left out), for counting sign-ups by event. */
export async function loadSignupTimes(db: Db, planId: string): Promise<Date[]> {
  const { data } = await db.from("meta_leads").select("created_at, status").eq("master_plan_id", planId).or("source.is.null,source.neq.linkedin").not("status", "in", "(test,failed)").order("created_at", { ascending: false }).limit(5000);
  return ((data ?? []) as { created_at: string }[]).map((r) => new Date(r.created_at));
}

export type ReportBundle = { report: Report; guidance: Guidance[]; goals: Goals; ageDays: number };

/** The newest report this account has, built from the newest uploaded period and the one before it. */
export async function loadReport(db: Db, planId: string, today = new Date()): Promise<ReportBundle | null> {
  const { data } = await db.from("meta_ad_stats").select("*").eq("master_plan_id", planId).order("period_end", { ascending: false }).limit(400);
  const all = ((data ?? []) as StatRow[]).map(toRow);
  if (!all.length) return null;
  const latestEnd = all[0].periodEnd;
  const latest = all.filter((r) => r.periodEnd === latestEnd);
  const start = latest.reduce((m, r) => (r.periodStart < m ? r.periodStart : m), latest[0].periodStart);
  const prior = all.filter((r) => r.periodEnd < start);
  const priorEnd = prior[0]?.periodEnd;
  const priorRows = priorEnd ? prior.filter((r) => r.periodEnd === priorEnd) : [];
  const goals = await loadGoals(db, planId);
  const outcomes = await loadOutcomes(db, planId, start, latestEnd);
  const signups = await loadSignupTimes(db, planId);
  const report = buildReport({ rows: latest, priorRows, goals, outcomes, signups, allRows: all, now: today });
  if (!report) return null;
  const ageDays = Math.max(0, Math.floor((today.getTime() - Date.parse(`${latestEnd}T23:59:59Z`)) / 86_400_000));
  return { report, guidance: guidance(goals, report), goals, ageDays };
}

export async function saveRows(db: Db, planId: string, rows: AdRow[], source = "upload"): Promise<void> {
  const records = rows.map((r) => ({
    master_plan_id: planId,
    ad_name: r.adName,
    campaign_name: r.campaign ?? null,
    period_start: r.periodStart,
    period_end: r.periodEnd,
    spend: r.spend,
    impressions: r.impressions,
    reach: r.reach,
    link_clicks: r.linkClicks,
    leads: r.leads,
    frequency: r.frequency,
    delivery: r.delivery ?? null,
    source,
  }));
  if (records.length) await db.from("meta_ad_stats").upsert(records, { onConflict: "master_plan_id,ad_name,period_start,period_end" });
}

/** Keep a copy of the report as it stood, one per period, so last week's can still be opened. */
export async function snapshot(db: Db, planId: string): Promise<ReportBundle | null> {
  const b = await loadReport(db, planId);
  if (!b) return null;
  await db.from("meta_ad_reports").upsert({ master_plan_id: planId, week_start: b.report.periodStart, payload: { report: b.report, guidance: b.guidance } }, { onConflict: "master_plan_id,week_start" });
  return b;
}
