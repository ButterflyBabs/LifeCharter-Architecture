import { createServerClient } from "@/lib/supabase/server";
import { occurrences, toBill, type Bill, type BillRow } from "@/lib/finance/billDates";
import { formatMoney, formatTotals, sumByCurrency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";

export * from "@/lib/finance/billDates";

export async function loadBills(masterPlanId: string, businessId?: number | null): Promise<Bill[]> {
  let q = createServerClient()
    .from("finance_bills")
    .select("id, name, vendor, amount, currency, category, cadence, next_due, autopay, notes, last_paid_on")
    .eq("master_plan_id", masterPlanId)
    .eq("active", true);
  if (businessId) q = q.eq("business_id", businessId);
  const { data } = await q.order("next_due");
  return ((data || []) as BillRow[]).map(toBill);
}

// For the assistant: bills due in the next two weeks, and anything overdue.
export async function billsKnowledge(masterPlanId: string): Promise<string> {
  const bills = await loadBills(masterPlanId);
  if (!bills.length) return "";
  // Each amount in its own currency; the 14-day total is kept per currency, never added together (task 1520).
  const home = await homeCurrency(masterPlanId);
  const money = (b: Bill) => formatMoney(b.amount, b.currency, { home, cents: false });
  const today = new Date().toISOString().slice(0, 10);
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const overdue = bills.filter((b) => b.nextDue < today);
  const soon = occurrences(bills, today, in14);
  const parts: string[] = [];
  if (overdue.length) parts.push(`Overdue bills: ${overdue.map((b) => `${b.name}${b.amount ? ` ${money(b)}` : ""} (was due ${b.nextDue})`).join("; ")}.`);
  if (soon.length) {
    const total = sumByCurrency(soon, (o) => o.bill.amount || 0, (o) => o.bill.currency);
    parts.push(`Bills due in the next 14 days (${formatTotals(total, home, { cents: false })} total): ${soon.slice(0, 12).map((o) => `${o.bill.name}${o.bill.amount ? ` ${money(o.bill)}` : ""} on ${o.date}${o.bill.autopay ? " (autopay)" : ""}`).join("; ")}.`);
  }
  return parts.join(" ");
}
