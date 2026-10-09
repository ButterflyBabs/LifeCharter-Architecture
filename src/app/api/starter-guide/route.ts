import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// The Starter Guide's ticks, saved on the client's account so they follow them to every device.
// GET → { has, state }   PUT { state: { <step key>: 1, _q?: "their question" } }
const MAX_BYTES = 20_000;

function clean(v: unknown): Record<string, string | number> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, string | number> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(k)) continue;
    if (k === "_q") out[k] = typeof val === "string" ? val.slice(0, 2000) : "";
    else if (val === 1 || val === true) out[k] = 1;
  }
  return JSON.stringify(out).length <= MAX_BYTES ? out : null;
}

export async function GET() {
  const plan = await resolveMasterPlanId();
  if (!plan) return NextResponse.json({ has: false, state: {} }, { status: 401 });
  const { data } = await createServerClient().from("starter_guide_progress").select("state").eq("master_plan_id", plan).maybeSingle();
  return NextResponse.json({ has: Boolean(data), state: (data?.state as Record<string, unknown>) ?? {} }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const plan = await resolveMasterPlanId();
  if (!plan) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const state = clean((body as { state?: unknown }).state);
  if (!state) return NextResponse.json({ error: "Couldn't save." }, { status: 400 });
  const { error } = await createServerClient().from("starter_guide_progress").upsert({ master_plan_id: plan, state, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id" });
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
