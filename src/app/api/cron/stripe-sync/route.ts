import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { syncStripe } from "@/lib/stripeSync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Every morning: each client's connected Stripe account → their ledger.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data } = await createServerClient().from("client_integrations").select("master_plan_id").eq("provider", "stripe").eq("status", "connected");
  let added = 0;
  for (const r of (data ?? []) as { master_plan_id: string }[]) {
    try {
      added += (await syncStripe(r.master_plan_id)).added;
    } catch (e) {
      console.error("stripe-sync:", r.master_plan_id, e);
    }
  }
  return NextResponse.json({ accounts: (data ?? []).length, added });
}
