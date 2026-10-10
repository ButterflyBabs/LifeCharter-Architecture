import { createServerClient } from "@/lib/supabase/server";
import { loadBills, occurrences, CADENCE_LABEL } from "@/lib/finance/bills";
import { nowParts, fmt } from "@/lib/finance/period";
import { techTools } from "@/lib/finance/techTools";
import { isTaxPayment } from "@/lib/finance/taxRules";

export { isTaxPayment, TAX_PAID_RE } from "@/lib/finance/taxRules";

// The one place that answers "how are the Finance cards connected?". Every Finance page reads the same
// ledger (finance_entries), budgets (finance_budgets) and bills (finance_bills); this joins them so each card
// can show what the others know: spend against budget, what is already committed by bills, the tax set-aside
// and the software spend.

function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return fmt(new Date(Date.UTC(y, m - 1, d + n)));
}
const num = (v: unknown) => Number(v ?? 0) || 0;

// Next US estimated-tax deadline on/after today (Apr 15, Jun 15, Sep 15, Jan 15).
export function nextTaxDeadline(today: string) {
  const y = Number(today.slice(0, 4));
  const c = [`${y}-01-15`, `${y}-04-15`, `${y}-06-15`, `${y}-09-15`, `${y + 1}-01-15`];
  return c.find((d) => d >= today) || c[4];
}

export async function loadFinanceSettings(masterPlanId: string) {
  const { data } = await createServerClient().from("finance_settings").select("tax_rate").eq("master_plan_id", masterPlanId).maybeSingle();
  return { taxRate: data?.tax_rate !== undefined && data?.tax_rate !== null ? num(data.tax_rate) : 25 };
}

export interface CategoryLine {
  category: string;
  budget: number;
  spent: number;
  committed: number; // bills still to come this month in this category
  left: number;
}

export async function financeOverview(masterPlanId: string, tz: string) {
  const db = createServerClient();
  const { year, month, day } = nowParts(tz);
  const today = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = fmt(new Date(Date.UTC(year, month, 0)));
  const yearStart = `${year}-01-01`;

  const [entriesRes, budgetsRes, bills, settings, tech] = await Promise.all([
    db.from("finance_entries").select("type, amount, category, occurred_on").eq("master_plan_id", masterPlanId).gte("occurred_on", yearStart).limit(20000),
    db.from("finance_budgets").select("type, category, amount").eq("master_plan_id", masterPlanId),
    loadBills(masterPlanId),
    loadFinanceSettings(masterPlanId),
    techTools(masterPlanId),
  ]);

  const entries = (entriesRes.data || []) as { type: string; amount: number | string | null; category: string | null; occurred_on: string }[];
  let incomeMtd = 0, expenseMtd = 0, incomeYtd = 0, expenseYtd = 0, taxesPaidYtd = 0, uncategorized = 0;
  const spentByCat: Record<string, number> = {};
  for (const e of entries) {
    const a = num(e.amount);
    const inMonth = e.occurred_on >= monthStart && e.occurred_on <= monthEnd;
    if (e.type === "income") {
      incomeYtd += a;
      if (inMonth) incomeMtd += a;
    } else {
      expenseYtd += a;
      if (inMonth) {
        expenseMtd += a;
        const k = (e.category || "").trim().toLowerCase();
        spentByCat[k] = (spentByCat[k] || 0) + a;
      }
      if (isTaxPayment(e.category)) taxesPaidYtd += a;
      if (!(e.category || "").trim()) uncategorized += 1;
    }
  }

  // Budgets (overall expense cap, per-category caps).
  const budgets = (budgetsRes.data || []) as { type: string; category: string | null; amount: number | string | null }[];
  const expBudgets = budgets.filter((b) => b.type === "expense");
  const overallBudget = num(expBudgets.find((b) => !(b.category || "").trim())?.amount);
  const catBudgets = expBudgets.filter((b) => (b.category || "").trim());
  const monthlyExpenseBudget = overallBudget || catBudgets.reduce((s, b) => s + num(b.amount), 0);

  // Bills: overdue, next 7 and 14 days, and what is still to come this month.
  const horizon = addDays(today, 14);
  const overdue = bills.filter((b) => b.nextDue < today);
  const dueSoon = occurrences(bills, today, horizon);
  const dueWeek = dueSoon.filter((o) => o.date <= addDays(today, 7));
  const restOfMonth = occurrences(bills, today, monthEnd);
  const billAmount = (o: { bill: { amount: number | null } }) => o.bill.amount ?? 0;
  const committedByCat: Record<string, number> = {};
  for (const o of restOfMonth) {
    const k = (o.bill.category || "").trim().toLowerCase();
    committedByCat[k] = (committedByCat[k] || 0) + billAmount(o);
  }
  const committedTotal = restOfMonth.reduce((s, o) => s + billAmount(o), 0);

  const categories: CategoryLine[] = catBudgets.map((b) => {
    const k = (b.category || "").trim().toLowerCase();
    const budget = num(b.amount);
    const spent = spentByCat[k] || 0;
    const committed = committedByCat[k] || 0;
    return { category: (b.category || "").trim(), budget, spent, committed, left: budget - spent - committed };
  });

  // Tax: the set-aside uses income less deductible expenses (taxes you paid are not deductions).
  const deductible = Math.max(0, expenseYtd - taxesPaidYtd);
  const taxable = Math.max(0, incomeYtd - deductible);
  const setAside = Math.round((taxable * settings.taxRate) / 100);

  return {
    today,
    month: { income: incomeMtd, expense: expenseMtd, net: incomeMtd - expenseMtd },
    ytd: { income: incomeYtd, expense: expenseYtd, net: incomeYtd - expenseYtd },
    budget: {
      monthlyExpense: monthlyExpenseBudget,
      spentMtd: expenseMtd,
      committed: committedTotal,
      left: monthlyExpenseBudget ? monthlyExpenseBudget - expenseMtd - committedTotal : null,
      categories,
    },
    bills: {
      count: bills.length,
      overdueCount: overdue.length,
      overdueTotal: overdue.reduce((s, b) => s + (b.amount ?? 0), 0),
      next7Count: dueWeek.length,
      next7Total: dueWeek.reduce((s, o) => s + billAmount(o), 0),
      next14: dueSoon.slice(0, 6).map((o) => ({
        name: o.bill.vendor || o.bill.name,
        date: o.date,
        amount: o.bill.amount,
        cadence: CADENCE_LABEL[o.bill.cadence],
        autopay: o.bill.autopay,
      })),
      next14Total: dueSoon.reduce((s, o) => s + billAmount(o), 0),
      restOfMonthTotal: committedTotal,
    },
    tax: {
      rate: settings.taxRate,
      setAside,
      perQuarter: Math.round(setAside / 4),
      taxesPaid: taxesPaidYtd,
      deadline: nextTaxDeadline(today),
    },
    tech: { monthly: tech.totalMonthly, count: tech.tools.length, ytd: tech.totalYtd, names: tech.tools.slice(0, 40).map((t) => t.name.toLowerCase()) },
    uncategorizedExpenses: uncategorized,
  };
}

export type FinanceOverview = Awaited<ReturnType<typeof financeOverview>>;
