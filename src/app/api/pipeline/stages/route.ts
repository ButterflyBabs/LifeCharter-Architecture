import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { ensureStages } from "@/lib/sales/pipeline";
import { salesAccount } from "@/lib/sales/account";

export const dynamic = "force-dynamic";

// PUT { stages: [{ id?, name, kind, probability }], moveTo?: stageId }: rename, reorder, add and
// remove the board's columns in one save. Deals in a removed column move to `moveTo` (or the
// first remaining open column). Needs at least one open column, one Won and one Lost.
export async function PUT(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const list = Array.isArray(body.stages) ? body.stages.slice(0, 20) : [];
  const clean = list.map((s: Record<string, unknown>, i: number) => ({
    id: typeof s.id === "string" ? s.id : null,
    name: typeof s.name === "string" ? s.name.trim().slice(0, 60) : "",
    kind: s.kind === "won" || s.kind === "lost" ? s.kind : "open",
    probability: Math.max(0, Math.min(100, Math.round(Number(s.probability) || 0))),
    sort_order: i,
  }));
  if (clean.some((s: { name: string }) => !s.name)) return NextResponse.json({ error: "Every column needs a name." }, { status: 400 });
  const kinds = new Set(clean.map((s: { kind: string }) => s.kind));
  if (!kinds.has("open") || !kinds.has("won") || !kinds.has("lost")) return NextResponse.json({ error: "Keep at least one open column, plus Won and Lost." }, { status: 400 });

  const existing = await ensureStages(a.supabase, a.masterPlanId);
  const existingIds = new Set(existing.map((s) => s.id));
  const keep = clean.filter((s: { id: string | null }) => s.id && existingIds.has(s.id));
  for (const s of keep) {
    await a.supabase.from("pipeline_stages").update({ name: s.name, kind: s.kind, probability: s.kind === "won" ? 100 : s.kind === "lost" ? 0 : s.probability, sort_order: s.sort_order }).eq("id", s.id).eq("master_plan_id", a.masterPlanId);
  }
  const fresh = clean.filter((s: { id: string | null }) => !s.id || !existingIds.has(s.id));
  if (fresh.length) {
    await a.supabase.from("pipeline_stages").insert(fresh.map((s: { name: string; kind: string; probability: number; sort_order: number }) => ({ master_plan_id: a.masterPlanId, name: s.name, kind: s.kind, probability: s.kind === "won" ? 100 : s.kind === "lost" ? 0 : s.probability, sort_order: s.sort_order })));
  }
  const keptIds = new Set(keep.map((s: { id: string }) => s.id));
  const removed = existing.filter((s) => !keptIds.has(s.id));
  if (removed.length) {
    const after = await ensureStages(a.supabase, a.masterPlanId);
    const target = after.find((s) => s.id === body.moveTo && !removed.some((r) => r.id === s.id)) ?? after.find((s) => s.kind === "open" && !removed.some((r) => r.id === s.id));
    if (!target) return NextResponse.json({ error: "Nowhere to move those deals." }, { status: 400 });
    const ids = removed.map((s) => s.id);
    await a.supabase.from("pipeline_deals").update({ stage_id: target.id, stage_changed_at: new Date().toISOString() }).eq("master_plan_id", a.masterPlanId).in("stage_id", ids);
    await a.supabase.from("pipeline_stages").delete().eq("master_plan_id", a.masterPlanId).in("id", ids);
  }
  return NextResponse.json({ stages: await ensureStages(a.supabase, a.masterPlanId) });
}
