import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { currentBusiness } from "@/lib/businessScope";

export const dynamic = "force-dynamic";

// Money that belongs to no business yet (no business and no segment). With a business chosen in the header,
//   GET  → how many entries and bills are unassigned
//   POST → assign every unassigned entry and bill to the chosen business
// Only the signed-in account's own rows are ever touched.
async function counts(masterPlanId: string) {
  const db = createServerClient();
  const [e, b] = await Promise.all([
    db.from("finance_entries").select("id", { count: "exact", head: true }).eq("master_plan_id", masterPlanId).is("business_id", null).is("segment_id", null),
    db.from("finance_bills").select("id", { count: "exact", head: true }).eq("master_plan_id", masterPlanId).eq("active", true).is("business_id", null),
  ]);
  return { entries: e.count ?? 0, bills: b.count ?? 0 };
}

export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ business: null, entries: 0, bills: 0 });
  const scope = await currentBusiness(masterPlanId);
  if (!scope) return NextResponse.json({ business: null, entries: 0, bills: 0 });
  return NextResponse.json({ business: { id: scope.businessId, name: scope.name }, ...(await counts(masterPlanId)) });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const scope = await currentBusiness(masterPlanId);
  if (!scope) return NextResponse.json({ error: "Choose a business at the top of the page first." }, { status: 400 });
  const db = createServerClient();
  const [e, b] = await Promise.all([
    db.from("finance_entries").update({ business_id: scope.businessId }).eq("master_plan_id", masterPlanId).is("business_id", null).is("segment_id", null).select("id"),
    db.from("finance_bills").update({ business_id: scope.businessId }).eq("master_plan_id", masterPlanId).eq("active", true).is("business_id", null).select("id"),
  ]);
  if (e.error || b.error) return NextResponse.json({ error: "Couldn't assign them." }, { status: 500 });
  return NextResponse.json({ ok: true, entries: e.data?.length ?? 0, bills: b.data?.length ?? 0, business: scope.name });
}
