import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { logActivity } from "@/lib/activity";
import { planSegmentIds, planBusinessIds } from "@/lib/planScope";
import { currentBusiness, businessMoneyFilter } from "@/lib/businessScope";
import { periodRange } from "@/lib/finance/period";
import { loadIncomeGoals } from "@/lib/finance/goals";
import { nextAfter, type BillCadence } from "@/lib/finance/billDates";
import { formatMoney, isCurrency, toCurrency, type Currency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";
import { addFlow, inHome, otherBlock, zeroFlow } from "@/lib/finance/money";
import { parseProvTax, parseTax } from "@/lib/finance/gstReport";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  type: string;
  amount: number | string | null;
  currency?: string | null;
  category: string | null;
  description: string | null;
  occurred_on: string;
  source: string | null;
  segment_id: string | number | null;
  vendor?: string | null;
  payment_type?: string | null;
  frequency?: string | null;
  renewal?: string | null;
  receipt_path?: string | null;
  tax_amount?: number | string | null;
  tax_province?: string | null;
  prov_tax_amount?: number | string | null;
};

function serialize(r: Row) {
  return {
    id: r.id,
    type: r.type === "income" ? "income" : "expense",
    amount: Number(r.amount ?? 0),
    currency: toCurrency(r.currency),
    category: r.category || "",
    description: r.description || "",
    occurredOn: r.occurred_on,
    source: r.source || "manual",
    segmentId: r.segment_id || null,
    vendor: r.vendor || "",
    paymentType: r.payment_type === "recurring" ? "recurring" : "one_time",
    frequency: r.frequency || null,
    renewal: r.renewal || null,
    hasReceipt: Boolean(r.receipt_path),
    // GST/HST (task 1520 follow-up): kept apart from the amount, which is before tax.
    taxAmount: Number(r.tax_amount ?? 0) || 0,
    taxProvince: r.tax_province || null,
    // QST / PST / RST, also kept apart from the amount.
    provTaxAmount: Number(r.prov_tax_amount ?? 0) || 0,
  };
}

// The current year/month in the given tz (dates carry no time, so this only
// matters for "what month is it now").
function nowParts(tz: string): { year: number; month: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date());
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return { year: get("year"), month: get("month") };
  } catch {
    const d = new Date();
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  }
}

// GET — this client's entries for the current year + MTD/YTD aggregates and a
// 12-month income/expense series.
export async function GET(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const tz = new URL(request.url).searchParams.get("tz") || "UTC";
  const { year, month } = nowParts(tz);
  const yearStart = `${year}-01-01`;
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  // Header business switcher: only that business's money (tagged to it, or to one of its segments).
  const scope = masterPlanId ? await currentBusiness(masterPlanId) : null;
  const home = await homeCurrency(masterPlanId, supabase);
  let entriesQ = supabase
    .from("finance_entries")
    .select("id, type, amount, currency, category, description, occurred_on, source, segment_id, vendor, payment_type, frequency, renewal, receipt_path, tax_amount, tax_province, prov_tax_amount")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", yearStart);
  if (scope) entriesQ = entriesQ.or(businessMoneyFilter(scope));
  const { data, error } = await entriesQ.order("occurred_on", { ascending: false }).order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/finance/entries:", error.message);
    return NextResponse.json(
      { entries: [], mtd: zero(), ytd: zero(), monthly: [], currency: home, other: null, error: error.message },
      { status: 200 }
    );
  }

  const all = ((data || []) as Row[]).map(serialize);
  // Every total below is the home currency only (task 1520); the other currency is totalled apart in `other`.
  const entries = all.filter((e) => inHome(e, home));
  const otherMtd = zeroFlow();
  const otherYtd = zeroFlow();
  const otherWtd = zeroFlow();

  const mtd = zero();
  const ytd = zero();
  const wtd = zero();
  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));
  const catMtd: Record<string, number> = {};
  const catYtd: Record<string, number> = {};
  const week = periodRange("week", { tz });
  for (const e of all) {
    if (inHome(e, home)) continue;
    addFlow(otherYtd, e.type, e.amount);
    if (e.occurredOn.startsWith(monthPrefix)) addFlow(otherMtd, e.type, e.amount);
    if (e.occurredOn >= week.startStr && e.occurredOn < week.endStr) addFlow(otherWtd, e.type, e.amount);
  }

  for (const e of entries) {
    const bucket = e.type === "income" ? "income" : "expense";
    ytd[bucket] += e.amount;
    const m = Number(e.occurredOn.slice(5, 7));
    if (m >= 1 && m <= 12) monthly[m - 1][bucket] += e.amount;
    const inMonth = e.occurredOn.startsWith(monthPrefix);
    if (inMonth) mtd[bucket] += e.amount;
    if (e.occurredOn >= week.startStr && e.occurredOn < week.endStr) wtd[bucket] += e.amount;
    const key = `${bucket}:${(e.category || "").toLowerCase()}`;
    catYtd[key] = (catYtd[key] || 0) + e.amount;
    if (inMonth) catMtd[key] = (catMtd[key] || 0) + e.amount;
  }
  mtd.net = mtd.income - mtd.expense;
  ytd.net = ytd.income - ytd.expense;
  wtd.net = wtd.income - wtd.expense;

  // Budgets + budget-vs-actual + a simple, honest health score.
  const { data: bdata } = await supabase
    .from("finance_budgets")
    .select("type, category, amount")
    .eq("master_plan_id", masterPlanId);
  const budgets = ((bdata || []) as { type: string; category: string | null; amount: number | string | null }[]).map(
    (b) => ({
      type: b.type === "income" ? "income" : "expense",
      category: b.category || "",
      amount: Number(b.amount ?? 0),
    })
  );
  const overall = (t: string) => budgets.find((b) => b.type === t && b.category === "")?.amount ?? null;
  const cats = (t: string) => budgets.filter((b) => b.type === t && b.category !== "");
  const sumCats = (t: string) => cats(t).reduce((s, b) => s + b.amount, 0);
  const monthlyExpenseBudget = overall("expense") ?? (cats("expense").length ? sumCats("expense") : 0);
  // This month's income goal: the month's own goal if set (a ramp), else the general monthly goal.
  const incGoals = await loadIncomeGoals(masterPlanId as string, supabase);
  const thisMonthKey = `${year}-${String(month).padStart(2, "0")}`;
  const generalIncomeTarget = overall("income") ?? (cats("income").length ? sumCats("income") : 0);
  const monthlyIncomeTarget = incGoals.months.get(thisMonthKey) ?? generalIncomeTarget;

  const byCategory = cats("expense").map((b) => ({
    category: b.category,
    monthly: b.amount,
    mtdActual: catMtd[`expense:${b.category.toLowerCase()}`] || 0,
    ytdActual: catYtd[`expense:${b.category.toLowerCase()}`] || 0,
  }));

  const budgetSummary = {
    expense: {
      monthly: monthlyExpenseBudget,
      mtdBudget: monthlyExpenseBudget,
      mtdActual: mtd.expense,
      ytdBudget: monthlyExpenseBudget * month,
      ytdActual: ytd.expense,
    },
    income: {
      monthly: monthlyIncomeTarget,
      generalMonthly: generalIncomeTarget, // the default for months without their own goal
      monthKey: thisMonthKey,
      monthOwn: incGoals.months.has(thisMonthKey),
      mtdBudget: monthlyIncomeTarget,
      mtdActual: mtd.income,
      ytdBudget: monthlyIncomeTarget * month,
      ytdActual: ytd.income,
    },
    byCategory,
  };

  const margin = ytd.income > 0 ? ytd.net / ytd.income : 0;
  const profitSignal = Math.max(0, Math.min(100, Math.round(60 + margin * 100)));
  let budgetSignal: number | null = null;
  if (monthlyExpenseBudget > 0) {
    const ytdBudget = monthlyExpenseBudget * month;
    budgetSignal =
      ytd.expense <= ytdBudget
        ? 100
        : Math.max(0, Math.round(100 - ((ytd.expense - ytdBudget) / ytdBudget) * 100));
  }
  const hasData = entries.length > 0;
  const score = !hasData
    ? null
    : budgetSignal !== null
    ? Math.round((profitSignal + budgetSignal) / 2)
    : profitSignal;
  const health = { score, profitSignal, budgetSignal, hasBudget: monthlyExpenseBudget > 0 };

  // Profit by business segment (YTD).
  const segAgg: Record<string, { income: number; expense: number }> = {};
  for (const e of entries) {
    const sid = e.segmentId || "unassigned";
    if (!segAgg[sid]) segAgg[sid] = { income: 0, expense: 0 };
    segAgg[sid][e.type === "income" ? "income" : "expense"] += e.amount;
  }
  const segIds = Object.keys(segAgg).filter((id) => id !== "unassigned");
  const nameMap: Record<string, string> = {};
  if (segIds.length) {
    const { data: segRows } = await supabase.from("segments").select("id, name").in("id", segIds);
    for (const s of (segRows || []) as { id: string; name: string }[]) nameMap[s.id] = s.name;
  }
  const bySegment = Object.entries(segAgg)
    .map(([sid, v]) => ({
      segmentId: sid === "unassigned" ? null : sid,
      name: sid === "unassigned" ? "Unassigned" : nameMap[sid] || "Segment",
      income: v.income,
      expense: v.expense,
      net: v.income - v.expense,
    }))
    .sort((a, b) => b.net - a.net);

  // Uncategorized expenses this year (for tax accuracy alerts), in any currency.
  const uncategorizedExpenses = all.filter(
    (e) => e.type === "expense" && !(e.category || "").trim()
  ).length;

  return NextResponse.json({
    entries: all.slice(0, 100),
    currency: home,
    other: otherBlock(home, { mtd: otherMtd, ytd: otherYtd, wtd: otherWtd }),
    mtd,
    ytd,
    wtd,
    weekLabel: week.label,
    monthly,
    year,
    month,
    budgets,
    budgetSummary,
    health,
    bySegment,
    uncategorizedExpenses,
  });
}

function zero() {
  return { income: 0, expense: 0, net: 0 };
}

// POST — add an income or expense entry.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));

  const type = body.type === "income" ? "income" : "expense";
  const amount = Number(body.amount);
  if (!isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter an amount greater than zero." }, { status: 400 });
  }
  const occurredOn =
    typeof body.occurredOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.occurredOn)
      ? body.occurredOn
      : new Date().toISOString().slice(0, 10);

  // Who was paid, and (for expenses) whether it repeats and how it renews.
  const vendor = typeof body.vendor === "string" ? body.vendor.trim().slice(0, 120) || null : null;
  const FREQS: BillCadence[] = ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"];
  const recurring = type === "expense" && body.paymentType === "recurring" && FREQS.includes(body.frequency);
  const frequency = recurring ? (body.frequency as BillCadence) : null;
  const renewal = recurring ? (body.renewal === "manual" ? "manual" : "auto") : null;
  const category = typeof body.category === "string" ? body.category.trim() : null;
  const description = typeof body.description === "string" ? body.description.trim() : null;
  // Its currency: the one posted (USD or CAD), else the account's home currency (task 1520).
  const home = await homeCurrency(masterPlanId, supabase);
  const currency: Currency = isCurrency(body.currency) ? toCurrency(body.currency) : home;
  // The business it belongs to: one named in the request (must be this account's own), else the one chosen in the header.
  const named = Number(body.businessId);
  const businessId: number | null =
    masterPlanId && Number.isFinite(named) && named > 0 && (await planBusinessIds(masterPlanId)).includes(named)
      ? named
      : masterPlanId
        ? (await currentBusiness(masterPlanId))?.businessId ?? null
        : null;

  // GST/HST charged (income) or paid (expense), kept apart from the amount, and where the customer is.
  const tax = parseTax(body);
  if ("error" in tax) return NextResponse.json({ error: tax.error }, { status: 400 });
  // QST, PST or RST charged (income), or QST paid (expense), also kept apart.
  const prov = parseProvTax(body);
  if ("error" in prov) return NextResponse.json({ error: prov.error }, { status: 400 });

  // A receipt photo the assistant read (task 1150): the new expense keeps it.
  const receiptId = typeof body.receiptId === "string" && /^[0-9a-f-]{36}$/i.test(body.receiptId) ? body.receiptId : null;
  const { data: receipt } = receiptId && masterPlanId
    ? await supabase.from("finance_receipts").select("id, path, file_name").eq("id", receiptId).eq("master_plan_id", masterPlanId).maybeSingle()
    : { data: null };

  // A recurring expense also becomes a bill, so its next renewal shows on the Bills & cash calendar
  // (auto-renew shows as autopay; manual renew is something you mark paid yourself).
  let billId: string | null = null;
  if (recurring && frequency) {
    const next = nextAfter(occurredOn, frequency);
    if (next) {
      const { data: bill, error: billErr } = await supabase
        .from("finance_bills")
        .insert({
          master_plan_id: masterPlanId,
          name: (vendor || category || description || "Recurring expense").slice(0, 120),
          vendor,
          amount,
          currency,
          category: category || null,
          cadence: frequency,
          next_due: next,
          autopay: renewal === "auto",
          notes: description || null,
          last_paid_on: occurredOn,
          business_id: businessId,
        })
        .select("id")
        .single();
      if (billErr) console.error("POST /api/finance/entries (bill):", billErr.message);
      else billId = bill?.id as string;
    }
  }

  const { data, error } = await supabase
    .from("finance_entries")
    .insert({
      master_plan_id: masterPlanId,
      type,
      amount,
      currency,
      category,
      description,
      occurred_on: occurredOn,
      source: "manual",
      segment_id: (await validSegment(masterPlanId, body.segmentId)) ?? null,
      business_id: businessId,
      vendor,
      payment_type: recurring ? "recurring" : "one_time",
      frequency,
      renewal,
      bill_id: billId,
      tax_amount: tax.taxAmount,
      tax_province: tax.taxProvince,
      prov_tax_amount: prov.provTaxAmount,
      ...(receipt ? { receipt_path: receipt.path, receipt_name: receipt.file_name } : {}),
    })
    .select("id, type, amount, currency, category, description, occurred_on, source, segment_id, vendor, payment_type, frequency, renewal, receipt_path, tax_amount, tax_province, prov_tax_amount")
    .single();

  if (!error && receipt && data?.id) await supabase.from("finance_receipts").update({ status: "saved", entry_id: data.id }).eq("id", receipt.id);
  if (error) {
    console.error("POST /api/finance/entries:", error.message);
    if (billId) await supabase.from("finance_bills").delete().eq("id", billId);
    return NextResponse.json({ error: "Couldn't save the entry." }, { status: 500 });
  }
  const what = [vendor, category, description].filter(Boolean).join(": ");
  await logActivity({
    masterPlanId,
    action: "created",
    entityType: type,
    entityId: data?.id as string | number | undefined,
    summary: `Added ${type} ${formatMoney(amount, currency, { home, cents: true })}${what ? ` (${what.slice(0, 80)})` : ""}`,
  });
  // A one-time expense that looks like an upcoming bill (same name, close to its due date and amount): offer to
  // link them so the bill is rolled forward and the same money isn't counted twice.
  let billMatch: { id: string; name: string; nextDue: string; amount: number | null; currency: Currency } | null = null;
  if (type === "expense" && !recurring && masterPlanId) {
    billMatch = await findMatchingBill(supabase, masterPlanId, { vendor, category, description, amount, currency, occurredOn }).catch(() => null);
  }
  return NextResponse.json({ entry: serialize(data as Row), billMatch });
}

async function findMatchingBill(
  supabase: ReturnType<typeof createServerClient>,
  masterPlanId: string,
  e: { vendor: string | null; category: string | null; description: string | null; amount: number; currency: Currency; occurredOn: string }
) {
  const names = [e.vendor, e.description, e.category].map((v) => (v || "").trim().toLowerCase()).filter(Boolean);
  if (!names.length) return null;
  const day = (iso: string, n: number) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
  };
  const { data } = await supabase
    .from("finance_bills")
    .select("id, name, vendor, amount, next_due")
    .eq("master_plan_id", masterPlanId)
    .eq("currency", e.currency) // only a bill in the same currency
    .eq("active", true)
    .gte("next_due", day(e.occurredOn, -10))
    .lte("next_due", day(e.occurredOn, 21));
  const rows = (data || []) as { id: string; name: string; vendor: string | null; amount: number | string | null; next_due: string }[];
  const hit = rows.find((b) => {
    const label = [b.vendor, b.name].map((v) => (v || "").trim().toLowerCase()).filter(Boolean);
    const sameName = label.some((l) => names.some((n) => n === l || n.includes(l) || l.includes(n)));
    if (!sameName) return false;
    const amt = b.amount === null || b.amount === "" ? null : Number(b.amount);
    return amt === null || amt <= 0 || Math.abs(amt - e.amount) / amt <= 0.25;
  });
  return hit ? { id: hit.id, name: hit.vendor || hit.name, nextDue: hit.next_due, amount: hit.amount === null ? null : Number(hit.amount), currency: e.currency } : null;
}

// A segment id is only accepted if it belongs to THIS client's own account.
async function validSegment(masterPlanId: string | null, raw: unknown): Promise<number | null> {
  const id = Number(raw);
  if (!masterPlanId || !Number.isFinite(id) || id <= 0) return null;
  return (await planSegmentIds(masterPlanId)).includes(id) ? id : null;
}
