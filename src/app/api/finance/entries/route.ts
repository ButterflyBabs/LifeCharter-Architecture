import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  type: string;
  amount: number | string | null;
  category: string | null;
  description: string | null;
  occurred_on: string;
  source: string | null;
};

function serialize(r: Row) {
  return {
    id: r.id,
    type: r.type === "income" ? "income" : "expense",
    amount: Number(r.amount ?? 0),
    category: r.category || "",
    description: r.description || "",
    occurredOn: r.occurred_on,
    source: r.source || "manual",
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

  const { data, error } = await supabase
    .from("finance_entries")
    .select("id, type, amount, category, description, occurred_on, source")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", yearStart)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/finance/entries:", error.message);
    return NextResponse.json(
      { entries: [], mtd: zero(), ytd: zero(), monthly: [], error: error.message },
      { status: 200 }
    );
  }

  const entries = ((data || []) as Row[]).map(serialize);

  const mtd = zero();
  const ytd = zero();
  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));

  for (const e of entries) {
    const bucket = e.type === "income" ? "income" : "expense";
    ytd[bucket] += e.amount;
    const m = Number(e.occurredOn.slice(5, 7));
    if (m >= 1 && m <= 12) monthly[m - 1][bucket] += e.amount;
    if (e.occurredOn.startsWith(monthPrefix)) mtd[bucket] += e.amount;
  }
  mtd.net = mtd.income - mtd.expense;
  ytd.net = ytd.income - ytd.expense;

  return NextResponse.json({ entries: entries.slice(0, 100), mtd, ytd, monthly, year, month });
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

  const { data, error } = await supabase
    .from("finance_entries")
    .insert({
      master_plan_id: masterPlanId,
      type,
      amount,
      category: typeof body.category === "string" ? body.category.trim() : null,
      description: typeof body.description === "string" ? body.description.trim() : null,
      occurred_on: occurredOn,
      source: "manual",
    })
    .select("id, type, amount, category, description, occurred_on, source")
    .single();

  if (error) {
    console.error("POST /api/finance/entries:", error.message);
    return NextResponse.json({ error: "Couldn't save the entry." }, { status: 500 });
  }
  return NextResponse.json({ entry: serialize(data as Row) });
}
