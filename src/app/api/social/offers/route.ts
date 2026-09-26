import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { socialContext, isYmd, str } from "@/lib/social/server";

export const dynamic = "force-dynamic";

// Offers and dated events share this route: { type: "offer" | "event", ... }.
// Reads come with the rest of the settings (GET /api/social/settings).

const KINDS = ["event", "always-open", "invite-only", "private"];

const slug = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "offer";

function offerRow(b: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  if (typeof b.name === "string") row.name = str(b.name, 200);
  if (typeof b.link === "string") row.link = str(b.link, 2000);
  if (typeof b.kind === "string" && KINDS.includes(b.kind)) row.kind = b.kind;
  if (typeof b.rules === "string") row.rules = str(b.rules, 4000);
  if (Number.isFinite(Number(b.sortOrder))) row.sort_order = Number(b.sortOrder);
  return row;
}

function eventRow(b: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  if (b.offerKey === null || typeof b.offerKey === "string") row.offer_key = b.offerKey || null;
  if (typeof b.title === "string") row.title = str(b.title, 200);
  if (isYmd(b.date)) row.event_date = b.date;
  if (b.startTime === null || b.startTime === "") row.start_time = null;
  else if (typeof b.startTime === "string" && /^\d{2}:\d{2}$/.test(b.startTime)) row.start_time = b.startTime;
  if (typeof b.timezone === "string" && b.timezone) row.timezone = str(b.timezone, 60);
  if (b.firstMentionOn === null || b.firstMentionOn === "") row.first_mention_on = null;
  else if (isYmd(b.firstMentionOn)) row.first_mention_on = b.firstMentionOn;
  if (typeof b.notes === "string") row.notes = str(b.notes, 4000);
  return row;
}

const table = (t: unknown) => (t === "event" ? "social_events" : t === "offer" ? "social_offers" : null);

// POST — add an offer or event.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const body = await request.json().catch(() => ({}));

  if (body.type === "offer") {
    const row = offerRow(body);
    if (!row.name) return NextResponse.json({ error: "Give the offer a name." }, { status: 400 });
    // Unique key per account, from the name.
    const base = slug(String(row.name));
    const { data: taken } = await ctx.supabase.from("social_offers").select("key").eq("master_plan_id", ctx.masterPlanId).like("key", `${base}%`);
    const used = new Set((taken || []).map((r) => r.key as string));
    let key = base;
    for (let n = 2; used.has(key); n++) key = `${base}-${n}`;
    const { data, error } = await ctx.supabase
      .from("social_offers")
      .insert({ ...row, key, master_plan_id: ctx.masterPlanId })
      .select("id, key")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id, key: data.key });
  }

  if (body.type === "event") {
    const row = eventRow(body);
    if (!row.event_date) return NextResponse.json({ error: "An event needs a date." }, { status: 400 });
    const { data, error } = await ctx.supabase
      .from("social_events")
      .insert({ ...row, master_plan_id: ctx.masterPlanId })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id });
  }

  return NextResponse.json({ error: "Unknown type." }, { status: 400 });
}

// PATCH — update { type, id, ...fields }.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const body = await request.json().catch(() => ({}));
  const t = table(body.type);
  if (!t || typeof body.id !== "string") return NextResponse.json({ error: "Missing type or id." }, { status: 400 });
  const row = body.type === "offer" ? offerRow(body) : eventRow(body);
  const { error } = await ctx.supabase
    .from(t)
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("master_plan_id", ctx.masterPlanId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — ?type=offer|event&id=...
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const url = new URL(request.url);
  const t = table(url.searchParams.get("type"));
  const id = url.searchParams.get("id") || "";
  if (!t || !id) return NextResponse.json({ error: "Missing type or id." }, { status: 400 });
  const { error } = await ctx.supabase.from(t).delete().eq("id", id).eq("master_plan_id", ctx.masterPlanId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
