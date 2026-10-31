import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// What the account has in the bank, as the owner last typed it. The Finance dimension's runway reads it (lib/scoring/gather.ts).
//   GET  → { amount, at }   (null until set)
//   POST { amount }         (a blank amount clears it)
type Meta = { cash_in_bank?: { amount?: number; at?: string } } & Record<string, unknown>;

export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await createServerClient().from("client_master_plans").select("metadata").eq("id", planId).maybeSingle();
  const cash = (data?.metadata as Meta | null)?.cash_in_bank;
  return NextResponse.json({ amount: typeof cash?.amount === "number" ? cash.amount : null, at: cash?.at ?? null }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { amount?: unknown };
  const blank = body.amount === null || body.amount === "" || body.amount === undefined;
  const amount = Number(body.amount);
  if (!blank && (!Number.isFinite(amount) || amount < 0)) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  const db = createServerClient();
  const { data } = await db.from("client_master_plans").select("metadata").eq("id", planId).maybeSingle();
  const metadata = { ...((data?.metadata as Meta | null) ?? {}) };
  const at = new Date().toISOString();
  if (blank) delete metadata.cash_in_bank;
  else metadata.cash_in_bank = { amount, at };
  const { error } = await db.from("client_master_plans").update({ metadata }).eq("id", planId);
  if (error) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  return NextResponse.json({ ok: true, amount: blank ? null : amount, at: blank ? null : at });
}
