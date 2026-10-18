import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { brandFor } from "@/lib/portal";
import { register, type EventRow } from "@/lib/events";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// A public event page (task 1149): GET the details, POST { firstName, lastName?, email, timezone, _hp } to sign up.
async function eventBySlug(slug: string) {
  const db = createServerClient();
  const { data } = await db.from("events").select("*").eq("slug", slug).maybeSingle();
  return { db, e: data as EventRow | null };
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const { db, e } = await eventBySlug(params.slug);
  if (!e || e.status === "draft") return NextResponse.json({ error: "This event isn't available." }, { status: 404 });
  const [brand, { count }] = await Promise.all([brandFor(db, e.master_plan_id), db.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", e.id)]);
  return NextResponse.json({
    brand,
    event: { kind: e.kind, title: e.title, subtitle: e.subtitle, description: e.description, host: e.host_name || brand.name, accent: e.accent, startsAt: e.starts_at, durationMin: e.duration_min, timezone: e.timezone, days: e.days, startsOn: e.starts_on, status: e.status, full: Boolean(e.capacity && (count ?? 0) >= e.capacity), past: e.kind === "live" && Boolean(e.starts_at) && Date.parse(e.starts_at!) + e.duration_min * 60_000 < Date.now() },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { db, e } = await eventBySlug(params.slug);
  if (!e) return NextResponse.json({ error: "This event isn't available." }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof b._hp === "string" && b._hp.trim()) return NextResponse.json({ ok: true });
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const r = await register(db, e, { email: s(b.email), firstName: s(b.firstName), lastName: s(b.lastName), timezone: s(b.timezone) || null });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, already: r.already, challenge: e.kind === "challenge" ? `/e/${e.slug}/c/${r.token}` : null });
}
