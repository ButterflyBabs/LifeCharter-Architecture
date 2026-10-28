import { createServerClient } from "@/lib/supabase/server";
import { otherCurrency, toCurrency, type Currency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";

// Expenses that look like software / subscriptions / SaaS. A recurring expense, or one with a
// "Paid to" vendor in a software-ish category, is also treated as a tool.
const TECH_WORDS = [
  "software", "subscription", "saas", "app", "tool", "hosting", "domain", "license", "licence", "api",
  "platform", "membership", "seat", "cloud", "plan", "crm", "email", "automation", "analytics", "website",
];

export function isTech(category: string, description: string): boolean {
  const hay = `${category} ${description}`.toLowerCase();
  return TECH_WORDS.some((w) => hay.includes(w));
}

export interface TechTool {
  name: string;
  ytd: number;
  monthly: number;
  /** The currency of this tool's payments (a tool paid in both currencies is listed once per currency). */
  currency: Currency;
  /** The Paid to vendor when the tool was grouped by it. */
  vendor?: string;
  /** Recurring + renewal details from how the expense was entered. */
  frequency?: string | null;
  renewal?: string | null;
}

/** Tech/subscription spend this year. Grouped by the Paid to vendor when there is one, else the note or category.
 *  totalYtd/totalMonthly are the home currency only; `other` holds the other currency's totals (task 1520). */
export async function techTools(masterPlanId: string | null) {
  const supabase = createServerClient();
  const year = new Date().getFullYear();
  const monthsElapsed = new Date().getMonth() + 1;
  const { data } = await supabase
    .from("finance_entries")
    .select("amount, currency, category, description, vendor, payment_type, frequency, renewal")
    .eq("master_plan_id", masterPlanId)
    .eq("type", "expense")
    .gte("occurred_on", `${year}-01-01`);

  const rows = (data || []) as {
    amount: number | string | null;
    currency: string | null;
    category: string | null;
    description: string | null;
    vendor: string | null;
    payment_type: string | null;
    frequency: string | null;
    renewal: string | null;
  }[];
  const home = await homeCurrency(masterPlanId, supabase);
  const agg: Record<string, { label: string; ytd: number; currency: Currency; vendor?: string; frequency?: string | null; renewal?: string | null }> = {};
  for (const r of rows) {
    const cat = (r.category || "").trim();
    const desc = (r.description || "").trim();
    const vendor = (r.vendor || "").trim();
    // Recurring payments are tools by nature; otherwise fall back to the wording check.
    if (!(r.payment_type === "recurring" || isTech(cat, desc) || (vendor && isTech(cat, vendor)))) continue;
    const name = vendor || desc || cat || "Software";
    const currency = toCurrency(r.currency);
    const key = `${currency}:${name.toLowerCase()}`;
    const cur = agg[key] ?? { label: name, ytd: 0, currency };
    cur.ytd += Number(r.amount ?? 0);
    if (vendor) cur.vendor = vendor;
    if (r.frequency) cur.frequency = r.frequency;
    if (r.renewal) cur.renewal = r.renewal;
    agg[key] = cur;
  }
  const tools: TechTool[] = Object.values(agg)
    .map((v) => ({
      name: v.label || "Software",
      ytd: v.ytd,
      monthly: Math.round(v.ytd / monthsElapsed),
      currency: v.currency,
      vendor: v.vendor,
      frequency: v.frequency ?? null,
      renewal: v.renewal ?? null,
    }))
    .sort((a, b) => b.ytd - a.ytd);
  const totalYtd = tools.filter((t) => t.currency === home).reduce((s, t) => s + t.ytd, 0);
  const otherYtd = tools.filter((t) => t.currency !== home).reduce((s, t) => s + t.ytd, 0);
  return {
    tools,
    totalYtd,
    totalMonthly: Math.round(totalYtd / monthsElapsed),
    monthsElapsed,
    currency: home,
    other: otherYtd ? { currency: otherCurrency(home), totalYtd: otherYtd, totalMonthly: Math.round(otherYtd / monthsElapsed) } : null,
  };
}
