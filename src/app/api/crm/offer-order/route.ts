import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../guard";

export const dynamic = "force-dynamic";

// The order of the offer sections in Campaigns & Broadcasts, saved to the account.
//   GET → { order: string[] }      POST { order: string[] } → saves it
export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const { data } = await createServerClient().from("crm_offer_order").select("offers").eq("master_plan_id", a.planId).maybeSingle();
  return NextResponse.json({ order: (data?.offers as string[]) ?? [] });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const order = Array.isArray(b.order) ? Array.from(new Set((b.order as unknown[]).filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 80)).filter(Boolean))).slice(0, 100) : [];
  const { error } = await createServerClient().from("crm_offer_order").upsert({ master_plan_id: a.planId, offers: order, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id" });
  return error ? NextResponse.json({ error: "Couldn't save the order." }, { status: 500 }) : NextResponse.json({ ok: true, order });
}
