import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { periodRange, type Period } from "@/lib/finance/period";
import { otherCurrency, toCurrency, type Currency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";

export const dynamic = "force-dynamic";

const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

// CSV export of ledger transactions for a period (week/month/quarter/year).
// Accountant-friendly: Date, Type, Category, Description, Amount, Currency, plus totals.
// Totals are kept per currency (task 1520): USD and CAD are never added together.
export async function GET(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const url = new URL(request.url);
  const tz = url.searchParams.get("tz") || "UTC";
  const period = (url.searchParams.get("period") || "month") as Period;

  const range = periodRange(period, {
    tz,
    year: Number(url.searchParams.get("year")) || undefined,
    index: Number(url.searchParams.get("index")) || undefined,
    start: url.searchParams.get("start") || undefined,
    end: url.searchParams.get("end") || undefined,
  });

  const { data, error } = await supabase
    .from("finance_entries")
    .select("occurred_on, type, category, description, amount, currency, vendor, payment_type, frequency, renewal")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", range.startStr)
    .lt("occurred_on", range.endStr)
    .order("occurred_on", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Couldn't export." }, { status: 500 });
  }

  const rows = (data || []) as {
    occurred_on: string;
    type: string;
    category: string | null;
    description: string | null;
    amount: number | string | null;
    currency: string | null;
    vendor: string | null;
    payment_type: string | null;
    frequency: string | null;
    renewal: string | null;
  }[];

  const totals: Record<Currency, { income: number; expense: number }> = { usd: { income: 0, expense: 0 }, cad: { income: 0, expense: 0 } };
  const lines = [["Date", "Type", "Category", "Description", "Amount", "Currency", "Paid to", "Payment type", "How often", "Renewal"].join(",")];
  for (const r of rows) {
    const amt = Number(r.amount ?? 0);
    const cur = toCurrency(r.currency);
    if (r.type === "income") totals[cur].income += amt;
    else totals[cur].expense += amt;
    lines.push(
      [
        r.occurred_on,
        r.type,
        esc(r.category || ""),
        esc(r.description || ""),
        amt.toFixed(2),
        cur.toUpperCase(),
        esc(r.vendor || ""),
        r.payment_type === "recurring" ? "Recurring" : "One-time",
        r.frequency || "",
        r.renewal === "auto" ? "Auto-renews" : r.renewal === "manual" ? "Renew manually" : "",
      ].join(",")
    );
  }
  // One block of totals per currency that has money, home first (always at least the home currency).
  const home = await homeCurrency(masterPlanId, supabase);
  const used = [home, otherCurrency(home)].filter((c, i) => i === 0 || totals[c].income || totals[c].expense);
  for (const c of used) {
    const { income, expense } = totals[c];
    const C = c.toUpperCase();
    lines.push("");
    lines.push(["", "", "", "Total Income", income.toFixed(2), C].join(","));
    lines.push(["", "", "", "Total Expenses", expense.toFixed(2), C].join(","));
    lines.push(["", "", "", "Net", (income - expense).toFixed(2), C].join(","));
  }

  const csv = lines.join("\n");
  const fname = `finance-${range.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "no-store",
    },
  });
}
