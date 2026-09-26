import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { socialContext, isYmd, type SocialDb } from "@/lib/social/server";
import type { AudienceSnapshot } from "@/lib/social/planner";

export const dynamic = "force-dynamic";

interface SnapRow {
  snap_date: string;
  is_baseline: boolean;
  metrics: AudienceSnapshot["values"] | null;
}

const shape = (r: SnapRow): AudienceSnapshot => ({ date: r.snap_date, baseline: r.is_baseline, values: r.metrics || {} });

function cleanValues(raw: unknown): AudienceSnapshot["values"] {
  const out: AudienceSnapshot["values"] = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [pid, metrics] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[a-z0-9_-]{1,40}$/i.test(pid) || !metrics || typeof metrics !== "object") continue;
    for (const [mid, v] of Object.entries(metrics as Record<string, unknown>)) {
      if (!/^[a-z0-9_-]{1,40}$/i.test(mid) || v === null || v === "") continue;
      const n = Number(v);
      if (Number.isFinite(n)) (out[pid] ||= {})[mid] = n;
    }
  }
  return out;
}

async function clearOtherBaselines(ctx: { supabase: SocialDb; masterPlanId: string }, keep: string) {
  await ctx.supabase
    .from("social_audience_snapshots")
    .update({ is_baseline: false })
    .eq("master_plan_id", ctx.masterPlanId)
    .neq("snap_date", keep);
}

// GET — every snapshot, oldest first.
export async function GET() {
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const { data, error } = await ctx.supabase
    .from("social_audience_snapshots")
    .select("snap_date, is_baseline, metrics")
    .eq("master_plan_id", ctx.masterPlanId)
    .order("snap_date");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ snapshots: ((data || []) as SnapRow[]).map(shape) });
}

// PUT — save a snapshot { date, values, baseline }. One per date.
export async function PUT(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const body = await request.json().catch(() => ({}));
  if (!isYmd(body.date)) return NextResponse.json({ error: "A date is required." }, { status: 400 });

  const baseline = body.baseline === true;
  const { error } = await ctx.supabase.from("social_audience_snapshots").upsert(
    {
      master_plan_id: ctx.masterPlanId,
      snap_date: body.date,
      is_baseline: baseline,
      metrics: cleanValues(body.values),
      logged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "master_plan_id,snap_date" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (baseline) await clearOtherBaselines(ctx, body.date);
  return NextResponse.json({ ok: true });
}

// PATCH — make a snapshot the benchmark { date }.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const body = await request.json().catch(() => ({}));
  if (!isYmd(body.date)) return NextResponse.json({ error: "A date is required." }, { status: 400 });
  const { error } = await ctx.supabase
    .from("social_audience_snapshots")
    .update({ is_baseline: true })
    .eq("master_plan_id", ctx.masterPlanId)
    .eq("snap_date", body.date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await clearOtherBaselines(ctx, body.date);
  return NextResponse.json({ ok: true });
}

// DELETE — remove a snapshot (?date=YYYY-MM-DD).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const date = new URL(request.url).searchParams.get("date");
  if (!isYmd(date)) return NextResponse.json({ error: "A date is required." }, { status: 400 });
  const { error } = await ctx.supabase.from("social_audience_snapshots").delete().eq("master_plan_id", ctx.masterPlanId).eq("snap_date", date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
