import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { FROM_2027, TIERS, isSwitched } from "@/lib/pricing";
import { loadPricingSettings, todayMountain } from "@/lib/pricingServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily, early morning: on and after the switch day (January 1, 2027 unless app_settings pricing_switch_day says
// otherwise) the plans table, which the Billing tab, the sign-up page and the Terms fee table read, is changed to the
// new price list ONCE. The cached Stripe price ids on the plan rows are cleared so no old price is reused. Clients
// already subscribed keep the Stripe prices they are on, so nothing changes for them. Same CRON_SECRET convention.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const settings = await loadPricingSettings(db);
  const today = todayMountain();
  if (!isSwitched(today, settings)) return NextResponse.json({ ok: true, switched: false, switchDay: settings.switchDay, today });
  const { data: done } = await db.from("app_settings").select("value").eq("key", "pricing_2027_applied").maybeSingle();
  if (String(done?.value ?? "") === "true") return NextResponse.json({ ok: true, switched: true, alreadyApplied: true });
  const now = new Date().toISOString();
  const updated: string[] = [];
  for (const t of TIERS) {
    const p = FROM_2027[t];
    const { error } = await db
      .from("plans")
      .update({ price_monthly: p.monthlyCents, onboarding_fee: p.implementationCents, price_yearly: p.annualCents, stripe_price_id: null, stripe_product_id: null })
      .eq("id", t);
    if (error) return NextResponse.json({ ok: false, error: error.message, updated }, { status: 500 });
    updated.push(t);
  }
  await db.from("app_settings").upsert({ key: "pricing_2027_applied", value: "true" }, { onConflict: "key" });
  console.log(`[apply-pricing] plans switched to the 2027 price list at ${now}`);
  return NextResponse.json({ ok: true, switched: true, applied: true, updated });
}
