import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { BUSINESS_COOKIE, currentBusiness } from "@/lib/businessScope";

export const dynamic = "force-dynamic";

// GET: the account's businesses for the header switcher, and which one is chosen (null = all).
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ businesses: [], current: null });
  const [{ data }, scope] = await Promise.all([
    createServerClient().from("businesses").select("id, name, color, active, sort_order").eq("master_plan_id", masterPlanId).order("sort_order").order("id"),
    currentBusiness(masterPlanId),
  ]);
  const businesses = ((data ?? []) as { id: number; name: string; color: string | null; active: boolean | null }[])
    .filter((b) => b.active !== false)
    .map((b) => ({ id: b.id, name: b.name, color: b.color }));
  return NextResponse.json({ businesses, current: scope?.businessId ?? null });
}

// POST { businessId: number | null }: choose a business (or all of them) on this device.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const res = NextResponse.json({ ok: true });
  const id = Number(body.businessId);
  if (!body.businessId || !Number.isInteger(id)) {
    res.cookies.set(BUSINESS_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }
  const { data } = await createServerClient().from("businesses").select("id").eq("id", id).eq("master_plan_id", masterPlanId).maybeSingle();
  if (!data) return NextResponse.json({ error: "That business isn't in this account." }, { status: 404 });
  res.cookies.set(BUSINESS_COOKIE, String(id), { path: "/", sameSite: "lax", httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 365 });
  return res;
}
