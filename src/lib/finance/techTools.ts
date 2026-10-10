import { createServerClient } from "@/lib/supabase/server";

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
  /** The Paid to vendor when the tool was grouped by it. */
  vendor?: string;
  /** Recurring + renewal details from how the expense was entered. */
  frequency?: string | null;
  renewal?: string | null;
}

/** Tech/subscription spend this year. Grouped by the Paid to vendor when there is one, else the note or category. */
export async function techTools(masterPlanId: string | null) {
  const supabase = createServerClient();
  const year = new Date().getFullYear();
  const monthsElapsed = new Date().getMonth() + 1;
  const { data } = await supabase
    .from("finance_entries")
    .select("amount, category, description, vendor, payment_type, frequency, renewal")
    .eq("master_plan_id", masterPlanId)
    .eq("type", "expense")
    .gte("occurred_on", `${year}-01-01`);

  const rows = (data || []) as {
    amount: number | string | null;
    category: string | null;
    description: string | null;
    vendor: string | null;
    payment_type: string | null;
    frequency: string | null;
    renewal: string | null;
  }[];
  const agg: Record<string, { label: string; ytd: number; vendor?: string; frequency?: string | null; renewal?: string | null }> = {};
  for (const r of rows) {
    const cat = (r.category || "").trim();
    const desc = (r.description || "").trim();
    const vendor = (r.vendor || "").trim();
    // Recurring payments are tools by nature; otherwise fall back to the wording check.
    if (!(r.payment_type === "recurring" || isTech(cat, desc) || (vendor && isTech(cat, vendor)))) continue;
    const name = vendor || desc || cat || "Software";
    const key = name.toLowerCase();
    const cur = agg[key] ?? { label: name, ytd: 0 };
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
      vendor: v.vendor,
      frequency: v.frequency ?? null,
      renewal: v.renewal ?? null,
    }))
    .sort((a, b) => b.ytd - a.ytd);
  const totalYtd = tools.reduce((s, t) => s + t.ytd, 0);
  return { tools, totalYtd, totalMonthly: Math.round(totalYtd / monthsElapsed), monthsElapsed };
}
