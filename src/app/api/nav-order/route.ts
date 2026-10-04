import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { sessionUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

// The left-menu order for this account (the order of the sections, and of the pages inside each one).
// Saved on the account, so it is the same on every device and for the account's team, and still changed
// by dragging. The public demo never saves one.
//   GET           → { has, sectionOrder, itemOrder }
//   PUT { sectionOrder, itemOrder }
//   DELETE        → back to the standard order
const demo = () => {
  try {
    return cookies().get("lc_demo")?.value === "1";
  } catch {
    return false;
  }
};

const cleanList = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 120)).slice(0, max) : []);

export async function GET() {
  if (demo()) return NextResponse.json({ has: false });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ has: false });
  const { data } = await createServerClient().from("nav_preferences").select("section_order, item_order").eq("master_plan_id", planId).maybeSingle();
  if (!data) return NextResponse.json({ has: false });
  return NextResponse.json({ has: true, sectionOrder: data.section_order ?? [], itemOrder: data.item_order ?? {} });
}

export async function PUT(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (demo()) return NextResponse.json({ error: "The demo is view-only." }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const b = await request.json().catch(() => ({}));
  const itemOrder: Record<string, string[]> = {};
  if (b.itemOrder && typeof b.itemOrder === "object" && !Array.isArray(b.itemOrder)) {
    for (const [k, v] of Object.entries(b.itemOrder as Record<string, unknown>).slice(0, 30)) itemOrder[k.slice(0, 80)] = cleanList(v, 120);
  }
  const { error } = await createServerClient()
    .from("nav_preferences")
    .upsert({ master_plan_id: planId, section_order: cleanList(b.sectionOrder, 40), item_order: itemOrder, updated_by: (await sessionUser())?.email ?? null, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id" });
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (demo()) return NextResponse.json({ error: "The demo is view-only." }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  await createServerClient().from("nav_preferences").delete().eq("master_plan_id", planId);
  return NextResponse.json({ ok: true });
}
