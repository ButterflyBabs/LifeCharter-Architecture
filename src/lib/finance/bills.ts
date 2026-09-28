import { createServerClient } from "@/lib/supabase/server";
import { occurrences, toBill, type Bill, type BillRow } from "@/lib/finance/billDates";

export * from "@/lib/finance/billDates";

export async function loadBills(masterPlanId: string): Promise<Bill[]> {
  const { data } = await createServerClient()
    .from("finance_bills")
    .select("id, name, amount, category, cadence, next_due, autopay, notes, last_paid_on")
    .eq("master_plan_id", masterPlanId)
    .eq("active", true)
    .order("next_due");
  return ((data || []) as BillRow[]).map(toBill);
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// For the assistant: bills due in the next two weeks, and anything overdue.
export async function billsKnowledge(masterPlanId: string): Promise<string> {
  const bills = await loadBills(masterPlanId);
  if (!bills.length) return "";
  const today = new Date().toISOString().slice(0, 10);
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const overdue = bills.filter((b) => b.nextDue < today);
  const soon = occurrences(bills, today, in14);
  const parts: string[] = [];
  if (overdue.length) parts.push(`Overdue bills: ${overdue.map((b) => `${b.name}${b.amount ? ` ${usd(b.amount)}` : ""} (was due ${b.nextDue})`).join("; ")}.`);
  if (soon.length) {
    const total = soon.reduce((s, o) => s + (o.bill.amount || 0), 0);
    parts.push(`Bills due in the next 14 days (${usd(total)} total): ${soon.slice(0, 12).map((o) => `${o.bill.name}${o.bill.amount ? ` ${usd(o.bill.amount)}` : ""} on ${o.date}${o.bill.autopay ? " (autopay)" : ""}`).join("; ")}.`);
  }
  return parts.join(" ");
}
