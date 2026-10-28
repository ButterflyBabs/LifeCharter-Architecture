import { createServerClient } from "@/lib/supabase/server";
import { loadTaxSettings, type TaxSettings } from "@/lib/salesTaxServer";
import { buildGstReport, pickPeriod, shiftPeriod, type GstReport, type GstRow } from "@/lib/finance/gstReport";
import type { Period } from "@/lib/salesTax";

type Db = ReturnType<typeof createServerClient>;

// The GST/HST report's reads (task 1520 follow-up): one account's finance entries for a period, every currency
// (USD rows are shown apart, never added in). Used by /api/finance/gst-hst, the alerts and the assistant.

export async function loadGstRows(db: Db, planId: string, from: string, to: string): Promise<GstRow[]> {
  const { data, error } = await db
    .from("finance_entries")
    .select("id, type, amount, currency, category, description, vendor, occurred_on, tax_amount, tax_province")
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
