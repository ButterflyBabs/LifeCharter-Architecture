import { createServerClient } from "@/lib/supabase/server";
import { loadTaxSettings, type TaxSettings } from "@/lib/salesTaxServer";
import { buildGstReport, buildProvSection, pickPeriod, provRegistered, shiftPeriod, type GstReport, type GstRow, type ProvSection } from "@/lib/finance/gstReport";
import { periodOf, type Period, type ProvTaxProvince } from "@/lib/salesTax";

type Db = ReturnType<typeof createServerClient>;

// The GST/HST report's reads (task 1520 follow-up): one account's finance entries for a period, every currency
// (USD rows are shown apart, never added in). Used by /api/finance/gst-hst, the alerts and the assistant.

export async function loadGstRows(db: Db, planId: string, from: string, to: string): Promise<GstRow[]> {
  const { data, error } = await db
    .from("finance_entries")
    .select("id, type, amount, currency, category, description, vendor, occurred_on, tax_amount, tax_province, prov_tax_amount")
    .eq("master_plan_id", planId)
    .gte("occurred_on", from)
    .lte("occurred_on", to)
    .order("occurred_on", { ascending: true })
    .limit(20000);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    type: r.type === "income" ? "income" : "expense",
    amount: Number(r.amount ?? 0) || 0,
    currency: (r.currency as string) || "usd",
    category: (r.category as string) || null,
    description: (r.description as string) || null,
    vendor: (r.vendor as string) || null,
    occurred_on: String(r.occurred_on),
    tax_amount: Number(r.tax_amount ?? 0) || 0,
    tax_province: (r.tax_province as string) || null,
    prov_tax_amount: Number(r.prov_tax_amount ?? 0) || 0,
  }));
}

export type GstSummary = {
  settings: TaxSettings;
  registered: boolean;
  report: GstReport | null;
  prev: Period | null;
  next: Period | null;
  rows: GstRow[];
};

/** The account's registration and, when registered, the report for the period starting `start` (else today's). */
export async function gstSummary(planId: string, opts: { start?: string | null; today?: string; db?: Db } = {}): Promise<GstSummary> {
  const db = opts.db ?? createServerClient();
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const settings = await loadTaxSettings(planId, db);
  if (!settings.registered) return { settings, registered: false, report: null, prev: null, next: null, rows: [] };
  const period = pickPeriod(settings.frequency, today, opts.start);
  const rows = await loadGstRows(db, planId, period.start, period.end);
  return {
    settings,
    registered: true,
    report: buildGstReport(rows, period),
    prev: shiftPeriod(settings.frequency, period, -1),
    next: shiftPeriod(settings.frequency, period, 1),
    rows,
  };
}

export type ProvSummary = { section: ProvSection; rows: GstRow[] };

/**
 * Each provincial registration's section (QST, PST, RST), each in its own filing period: `starts` names a period
 * start per province (else the one today falls in). Empty when the account has no provincial registration.
 */
export async function provSummaries(
  planId: string,
  opts: { starts?: Partial<Record<ProvTaxProvince, string | null>>; today?: string; db?: Db; settings?: TaxSettings } = {},
): Promise<ProvSummary[]> {
  const db = opts.db ?? createServerClient();
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const settings = opts.settings ?? (await loadTaxSettings(planId, db));
  const out: ProvSummary[] = [];
  for (const code of provRegistered(settings.provincial)) {
    const freq = settings.provincial[code]!.frequency;
    const period = pickPeriod(freq, today, opts.starts?.[code]);
    const rows = await loadGstRows(db, planId, period.start, period.end);
    out.push({ section: buildProvSection(rows, settings.provincial, code, today, period.start), rows });
  }
  return out;
}

/** The provincial lines for the period a day falls in, for the assistant (each registration's own period). */
export async function provLinesFor(planId: string, day: string, db: Db = createServerClient(), settings?: TaxSettings): Promise<ProvSection[]> {
  const s = settings ?? (await loadTaxSettings(planId, db));
  const starts: Partial<Record<ProvTaxProvince, string>> = {};
  for (const code of provRegistered(s.provincial)) starts[code] = periodOf(s.provincial[code]!.frequency, day).start;
  return (await provSummaries(planId, { starts, db, settings: s })).map((x) => x.section);
}
