import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// A short record of what happened when a left-menu page was dragged, so a drag that "snaps back" can be diagnosed.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ ok: true });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ ok: true });
  const text = JSON.stringify(body);
  if (text.length > 6000) return NextResponse.json({ ok: true });
  await createServerClient().from("nav_drag_debug").insert({ master_plan_id: planId, data: body });
  return NextResponse.json({ ok: true });
}
