import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { crossOriginBlocked } from "@/lib/security";
import { planBusinessIds, planSegmentIds } from "@/lib/planScope";

export const dynamic = "force-dynamic";

// Multi-business hierarchy for the Segments view:
// businesses -> segments -> 12 dimension health scores.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ businesses: [] });
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, color, icon, sort_order, active, " +
        "segments ( id, name, slug, color, icon, health, sort_order, " +
        "segment_dimensions ( dimension_key, score, health ) )"
    )
    .eq("master_plan_id", masterPlanId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("GET /api/segments:", error.message);
    return NextResponse.json({ businesses: [], error: error.message }, { status: 200 });
  }

  // Sort nested collections deterministically (PostgREST doesn't order embeds).
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const businesses = rows
    .filter((b) => b.active !== false)
    .map((b) => {
      const segments = ((b.segments as Array<Record<string, unknown>>) ?? [])
        .slice()
        .sort((a, c) => Number(a.sort_order ?? 0) - Number(c.sort_order ?? 0));
      return { ...b, segments };
    });

  // What each segment actually earned, from the income and expenses they tagged
  // to it in the Finance Center (this month and year to date).
  const segIds = businesses.flatMap((b) => ((b.segments as Array<Record<string, unknown>>) ?? []).map((s) => Number(s.id)));
  const fin = new Map<number, { mtdIncome: number; ytdIncome: number; ytdNet: number }>();
  if (segIds.length) {
    const now = new Date();
    const yearStart = `${now.getUTCFullYear()}-01-01`;
    const monthStart = `${yearStart.slice(0, 5)}${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
    const { data: entries } = await supabase
      .from("finance_entries")
      .select("segment_id, type, amount, occurred_on")
      .eq("master_plan_id", masterPlanId)
      .in("segment_id", segIds)
      .gte("occurred_on", yearStart);
    for (const e of (entries ?? []) as { segment_id: number; type: string; amount: number | string | null; occurred_on: string }[]) {
      const c = fin.get(e.segment_id) ?? { mtdIncome: 0, ytdIncome: 0, ytdNet: 0 };
      const a = Number(e.amount ?? 0);
      if (e.type === "income") {
        c.ytdIncome += a;
        c.ytdNet += a;
        if (e.occurred_on >= monthStart) c.mtdIncome += a;
      } else c.ytdNet -= a;
      fin.set(e.segment_id, c);
    }
  }
  const withFin = businesses.map((b) => ({
    ...b,
    segments: ((b.segments as Array<Record<string, unknown>>) ?? []).map((s) => ({ ...s, financials: fin.get(Number(s.id)) ?? null })),
  }));

  return NextResponse.json({ businesses: withFin }, { headers: { "Cache-Control": "no-store" } });
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";
const clean = (v: unknown, n = 80) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const COLORS = ["#2E7C83", "#7b6b8d", "#c9a227", "#4a9b9b", "#b06a5a", "#5E3B6C", "#1a2b4a"];

// POST — add a business ({kind:"business", name}) or a segment ({kind:"segment", businessId, name})
// to THIS client's own account. New segments start with the business-wide scores.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const name = clean(b.name);
  if (!name) return NextResponse.json({ error: "Give it a name." }, { status: 400 });
  const supabase = createServerClient();
  const suffix = `${masterPlanId.slice(0, 6)}-${Math.random().toString(36).slice(2, 6)}`; // businesses.slug is unique across all accounts

  if (b.kind === "segment") {
    const bizIds = await planBusinessIds(masterPlanId);
    const businessId = Number(b.businessId);
    if (!bizIds.includes(businessId)) return NextResponse.json({ error: "Unknown business." }, { status: 404 });
    const { count } = await supabase.from("segments").select("id", { count: "exact", head: true }).eq("business_id", businessId);
    const { data, error } = await supabase
      .from("segments")
      .insert({ business_id: businessId, name, slug: `${slugify(name)}-${suffix.slice(-4)}`, color: COLORS[(count ?? 0) % COLORS.length], sort_order: count ?? 0 })
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: "Couldn't add that." }, { status: 500 });
    // Start from the account's latest scores so the segment isn't blank.
    const { data: snap } = await supabase.from("client_score_snapshots").select("domains").eq("master_plan_id", masterPlanId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const domains = (snap?.domains ?? {}) as Record<string, number>;
    const rows = Object.entries(domains).filter(([, v]) => typeof v === "number").map(([k, v]) => ({ segment_id: data.id, dimension_key: k, score: v, health: v < 60 ? "at_risk" : v < 80 ? "attention" : "healthy", updated_by: "ai" }));
    if (rows.length) await supabase.from("segment_dimensions").insert(rows);
    return NextResponse.json({ ok: true, id: data.id });
  }

  const { count } = await supabase.from("businesses").select("id", { count: "exact", head: true }).eq("master_plan_id", masterPlanId);
  const { data, error } = await supabase
    .from("businesses")
    .insert({ master_plan_id: masterPlanId, name, slug: `${slugify(name)}-${suffix}`, color: COLORS[(count ?? 0) % COLORS.length], sort_order: count ?? 0 })
    .select("id")
    .single();
  if (error || !data) return NextResponse.json({ error: "Couldn't add that." }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

// PATCH — rename ({kind, id, name}).
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const name = clean(b.name);
  const id = Number(b.id);
  if (!name || !id) return NextResponse.json({ error: "Give it a name." }, { status: 400 });
  const supabase = createServerClient();
  if (b.kind === "segment") {
    if (!(await planSegmentIds(masterPlanId)).includes(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await supabase.from("segments").update({ name, updated_at: new Date().toISOString() }).eq("id", id);
  } else {
    if (!(await planBusinessIds(masterPlanId)).includes(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await supabase.from("businesses").update({ name, updated_at: new Date().toISOString() }).eq("id", id);
  }
  return NextResponse.json({ ok: true });
}

// DELETE ?kind=&id= — remove one of this client's own businesses or segments
// (its scores go with it; ledger entries and tasks keep their history untagged).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  const supabase = createServerClient();
  if (url.searchParams.get("kind") === "segment") {
    if (!(await planSegmentIds(masterPlanId)).includes(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await supabase.from("finance_entries").update({ segment_id: null }).eq("master_plan_id", masterPlanId).eq("segment_id", id);
    await supabase.from("tasks").update({ segment_id: null }).eq("master_plan_id", masterPlanId).eq("segment_id", id);
    await supabase.from("segments").delete().eq("id", id);
  } else {
    if (!(await planBusinessIds(masterPlanId)).includes(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const segs = (await supabase.from("segments").select("id").eq("business_id", id)).data?.map((s) => s.id as number) ?? [];
    if (segs.length) {
      await supabase.from("finance_entries").update({ segment_id: null }).eq("master_plan_id", masterPlanId).in("segment_id", segs);
      await supabase.from("tasks").update({ segment_id: null }).eq("master_plan_id", masterPlanId).in("segment_id", segs);
    }
    await supabase.from("tasks").update({ business_id: null }).eq("master_plan_id", masterPlanId).eq("business_id", id);
    await supabase.from("businesses").delete().eq("id", id);
  }
  return NextResponse.json({ ok: true });
}
