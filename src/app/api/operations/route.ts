import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { OPERATIONS_PILLARS, PILLAR_STATUSES, type PillarStatus } from "@/lib/operations";

export const dynamic = "force-dynamic";

// GET — the 8 operational pillars merged with this client's saved status/notes.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const { data } = await supabase
    .from("operations_pillars")
    .select("pillar_key, status, notes")
    .eq("master_plan_id", masterPlanId);

  const saved = new Map(
    ((data || []) as { pillar_key: string; status: string; notes: string | null }[]).map((r) => [
      r.pillar_key,
      r,
    ])
  );

  const pillars = OPERATIONS_PILLARS.map((p) => {
    const s = saved.get(p.key);
    return {
      key: p.key,
      name: p.name,
      description: p.description,
      status: (s?.status as PillarStatus) || "not_started",
      notes: s?.notes || "",
    };
  });

  const counts = pillars.reduce<Record<string, number>>((m, p) => {
    m[p.status] = (m[p.status] || 0) + 1;
    return m;
  }, {});

  return NextResponse.json({ pillars, counts });
}

// POST — update a pillar's status and/or notes.
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
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.status === "string" && PILLAR_STATUSES.includes(body.status as PillarStatus)) {
    update.status = body.status;
  }
  if (typeof body.notes === "string") update.notes = body.notes;

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
    const { error } = await supabase
      .from("operations_pillars")
      .insert({ master_plan_id: masterPlanId, pillar_key: pillarKey, ...update });
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
