import { createServerClient } from "@/lib/supabase/server";
import { loadBills } from "@/lib/finance/bills";
import { formatMoney, otherCurrency, toCurrency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";
import { addFlow, hasFlow, zeroFlow } from "@/lib/finance/money";

// The client's own ledger, summarized for their assistant's Finance reads:
// this month and the last three, year to date by category, what's
// uncategorized, and tax dates coming up. Only their own entries.
// Currency (task 1520): every total is the home currency only; the other currency gets its own line, never added in.

const pad = (n: number) => String(n).padStart(2, "0");

export async function financeReadData(masterPlanId: string): Promise<string> {
  const db = createServerClient();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const from = `${m <= 3 ? y - 1 : y}-${pad(m <= 3 ? m + 9 : m - 3)}-01`;
  const start = from < `${y}-01-01` ? from : `${y}-01-01`;
  const { data } = await db
    .from("finance_entries")
    .select("type, amount, currency, category, occurred_on")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", start)
    .limit(20000);
  const all = (data ?? []) as { type: string; amount: number | string | null; currency: string | null; category: string | null; occurred_on: string }[];
  if (!all.length) return "LEDGER: nothing recorded yet this year.";
  const home = await homeCurrency(masterPlanId, db);
  const other = otherCurrency(home);
  const usd = (n: number) => formatMoney(Math.round(n), home, { home, cents: false });
  const rows = all.filter((r) => toCurrency(r.currency) === home);
  const otherYtd = zeroFlow();
  for (const r of all) if (toCurrency(r.currency) !== home && r.occurred_on >= `${y}-01-01`) addFlow(otherYtd, r.type, Number(r.amount ?? 0));
  let otherUncategorized = 0;
  for (const r of all) if (toCurrency(r.currency) !== home && r.occurred_on >= `${y}-01-01` && r.type !== "income" && !r.category?.trim()) otherUncategorized++;

  const byMonth = new Map<string, { inc: number; exp: number }>();
  const ytdCat = new Map<string, { type: string; total: number }>();
  let uncategorized = 0;
  let ytdInc = 0;
  let ytdExp = 0;
  for (const r of rows) {
    const amt = Number(r.amount ?? 0);
    const mk = r.occurred_on.slice(0, 7);
    const b = byMonth.get(mk) ?? { inc: 0, exp: 0 };
    if (r.type === "income") b.inc += amt;
    else b.exp += amt;
    byMonth.set(mk, b);
    if (r.occurred_on >= `${y}-01-01`) {
      if (r.type === "income") ytdInc += amt;
      else ytdExp += amt;
      const cat = (r.category || "").trim() || "(uncategorized)";
      if (!r.category?.trim() && r.type !== "income") uncategorized++;
      const key = `${r.type}:${cat}`;
      ytdCat.set(key, { type: r.type, total: (ytdCat.get(key)?.total ?? 0) + amt });
    }
  }
  const months = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 4);
  const cats = (type: string) =>
    Array.from(ytdCat.entries())
      .filter(([, v]) => v.type === type)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([k, v]) => `${k.split(":").slice(1).join(":")} ${usd(v.total)}`)
      .join("; ");

  const bills = await loadBills(masterPlanId).catch(() => []);
  const taxDates = bills.filter((b) => /tax/i.test(`${b.name} ${b.category}`)).map((b) => `${b.name} ${b.nextDue}${b.amount ? ` (${formatMoney(Math.round(b.amount), b.currency, { home, cents: false })})` : ""}`);
  const otherMoney = (n: number) => formatMoney(Math.round(n), other, { home, cents: false });

  return [
    `LEDGER (their own entries; every total below is in ${home.toUpperCase()}):`,
    `By month (newest first): ${months.map(([k, v]) => `${k}: income ${usd(v.inc)}, expenses ${usd(v.exp)}, net ${usd(v.inc - v.exp)}`).join(" | ")}.`,
    `Year to date: income ${usd(ytdInc)}, expenses ${usd(ytdExp)}, net ${usd(ytdInc - ytdExp)}${ytdInc > 0 ? `, margin ${Math.round(((ytdInc - ytdExp) / ytdInc) * 100)}%` : ""}.`,
    `Income by category YTD: ${cats("income") || "none"}.`,
    `Expenses by category YTD: ${cats("expense") || "none"}.`,
    `Uncategorized expenses this year: ${uncategorized + otherUncategorized}.`,
    ...(hasFlow(otherYtd) ? [`Also, in ${other.toUpperCase()} (a separate currency: NOT included in the totals above, never add or convert): year to date income ${otherMoney(otherYtd.income)}, expenses ${otherMoney(otherYtd.expense)}.`] : []),
    taxDates.length ? `Tax dates on their Bills calendar: ${taxDates.join("; ")}.` : "No estimated-tax dates on their Bills calendar yet.",
  ].join("\n");
}
