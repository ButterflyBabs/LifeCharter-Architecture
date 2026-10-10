import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { loadFinanceSettings } from "@/lib/finance/overview";

export const dynamic = "force-dynamic";

// GET — this account's finance preferences (the tax set-aside rate).
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ taxRate: 25 });
  return NextResponse.json(await loadFinanceSettings(masterPlanId));
}

// PUT — { taxRate } saves the rate the Tax Preparation set-aside uses.
export async function PUT(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const rate = Number(body.taxRate);
  if (!isFinite(rate) || rate < 0 || rate > 70) return NextResponse.json({ error: "Enter a rate between 0 and 70." }, { status: 400 });
  const { error } = await createServerClient()
    .from("finance_settings")
    .upsert({ master_plan_id: masterPlanId, tax_rate: rate, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id" });
  if (error) {
    console.error("PUT /api/finance/settings:", error.message);
    return NextResponse.json({ error: "Couldn't save the rate." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, taxRate: rate });
}
