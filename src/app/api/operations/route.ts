import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { OPERATIONS_PILLARS } from "@/lib/operations";
import { gatherAndCompute } from "@/lib/scoring/gather";

export const dynamic = "force-dynamic";

// GET: the 8 operational pillars, each SCORED (0-100) from the same kinds of input as the 12 dimensions
// plus the pillar's own questions, with this client's notes. Nothing here is set by hand.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ pillars: [], counts: {} });
  const [{ data }, scored] = await Promise.all([
    supabase.from("operations_pillars").select("pillar_key, notes").eq("master_plan_id", masterPlanId),
    gatherAndCompute(masterPlanId),
  ]);
  const notes = new Map(((data || []) as { pillar_key: string; notes: string | null }[]).map((r) => [r.pillar_key, r.notes || ""]));
  const pillars = scored.pillars.map((p) => ({ ...p, notes: notes.get(p.key) || "" }));
  const counts = pillars.reduce<Record<string, number>>((m, p) => {
    const k = p.phase ?? "Not scored";
    m[k] = (m[k] || 0) + 1;
    return m;
  }, {});
  return NextResponse.json({ pillars, counts, operationsScore: scored.domains.find((d) => d.key === "operations")?.score ?? null });
}

// POST: save a pillar's notes. (Status is no longer chosen: it is scored.)
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));

  const pillarKey = typeof body.pillarKey === "string" ? body.pillarKey : "";
  if (!OPERATIONS_PILLARS.some((p) => p.key === pillarKey)) {
    return NextResponse.json({ error: "unknown pillar" }, { status: 400 });
  }
  if (typeof body.notes !== "string") return NextResponse.json({ error: "nothing to save" }, { status: 400 });
  const update = { notes: body.notes.slice(0, 3000), updated_at: new Date().toISOString() };

  const { data: existing } = await supabase
    .from("operations_pillars")
    .select("id")
    .eq("master_plan_id", masterPlanId)
    .eq("pillar_key", pillarKey)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("operations_pillars").update(update).eq("id", existing.id);
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  } else {
    const { error } = await supabase.from("operations_pillars").insert({ master_plan_id: masterPlanId, pillar_key: pillarKey, ...update });
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
