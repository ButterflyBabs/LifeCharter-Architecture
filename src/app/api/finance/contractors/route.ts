import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { payeeKey, threshold1099 } from "@/lib/finance/receipts";

export const dynamic = "force-dynamic";

// Finance › 1099 contractor totals (task 1150 part 1).
//   GET ?year=2026  -> everyone paid that year (from expenses' "Paid to"), their total, and whether they're a contractor,
//                      have a W-9 on file, or were paid only by card/PayPal (those payments are reported by the card
//                      company, not by you)
//   POST { name, contractor, w9, card, note }  -> save those marks for a payee
export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const now = new Date().getUTCFullYear();
  const y = Number(new URL(request.url).searchParams.get("year"));
  const year = Number.isInteger(y) && y >= 2020 && y <= now ? y : now;
  const db = createServerClient();
  const [{ data: rows }, { data: payees }] = await Promise.all([
    db.from("finance_entries").select("vendor, amount").eq("master_plan_id", planId).eq("type", "expense").gte("occurred_on", `${year}-01-01`).lt("occurred_on", `${year + 1}-01-01`).limit(20000),
    db.from("finance_payees").select("vendor_key, name, contractor, w9_on_file, paid_by_card, note").eq("master_plan_id", planId),
  ]);
  const marks = new Map(((payees ?? []) as { vendor_key: string; name: string; contractor: boolean; w9_on_file: boolean; paid_by_card: boolean; note: string | null }[]).map((p) => [p.vendor_key, p]));
  const totals = new Map<string, { name: string; total: number; count: number }>();
  let unnamed = 0;
  let unnamedCount = 0;
  for (const r of (rows ?? []) as { vendor: string | null; amount: number }[]) {
    const name = (r.vendor || "").trim();
    const amt = Number(r.amount) || 0;
    if (!name) {
      unnamed += amt;
      unnamedCount++;
      continue;
    }
    const k = payeeKey(name);
    const t = totals.get(k) ?? { name, total: 0, count: 0 };
    t.total += amt;
    t.count++;
    totals.set(k, t);
  }
  const th = threshold1099(year);
  const list = Array.from(totals.entries())
    .map(([key, t]) => {
      const m = marks.get(key);
      const total = Math.round(t.total * 100) / 100;
      return { key, name: m?.name || t.name, total, count: t.count, contractor: Boolean(m?.contractor), w9: Boolean(m?.w9_on_file), card: Boolean(m?.paid_by_card), note: m?.note ?? "", needs1099: Boolean(m?.contractor) && !m?.paid_by_card && total >= th.amount };
    })
    .sort((a, b) => Number(b.needs1099) - Number(a.needs1099) || Number(b.contractor) - Number(a.contractor) || b.total - a.total);
  return NextResponse.json({ year, threshold: th.amount, thresholdCheck: th.check, payees: list, unnamed: { total: Math.round(unnamed * 100) / 100, count: unnamedCount } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 120) : "";
  if (!name) return NextResponse.json({ error: "Missing the payee's name." }, { status: 400 });
  const { error } = await createServerClient()
    .from("finance_payees")
    .upsert({ master_plan_id: planId, vendor_key: payeeKey(name), name, contractor: Boolean(b.contractor), w9_on_file: Boolean(b.w9), paid_by_card: Boolean(b.card), note: typeof b.note === "string" ? b.note.trim().slice(0, 300) || null : null, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id,vendor_key" });
  return error ? NextResponse.json({ error: "Couldn't save." }, { status: 500 }) : NextResponse.json({ ok: true });
}
