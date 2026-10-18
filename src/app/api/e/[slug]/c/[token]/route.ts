import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { brandFor } from "@/lib/portal";
import { challengeDay, type EventRow, type RegRow } from "@/lib/events";
import { dayInTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

// A person's private challenge page (task 1149): days up to today are open; POST { day, done } ticks one off.
async function load(slug: string, token: string) {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return null;
  const db = createServerClient();
  const { data: r } = await db.from("event_registrations").select("*").eq("token", token).maybeSingle();
  if (!r) return null;
  const { data: e } = await db.from("events").select("*").eq("id", (r as RegRow).event_id).eq("slug", slug).maybeSingle();
  if (!e || (e as EventRow).kind !== "challenge" || (e as EventRow).status === "draft") return null;
  return { db, r: r as RegRow, e: e as EventRow };
}

export async function GET(_req: Request, { params }: { params: { slug: string; token: string } }) {
  const ctx = await load(params.slug, params.token);
  if (!ctx) return NextResponse.json({ error: "This link isn't active." }, { status: 404 });
  const { db, r, e } = ctx;
  const today = challengeDay(r.challenge_start || dayInTz(new Date(), e.timezone), dayInTz(new Date(), e.timezone));
  const [brand, { data: days }, { data: done }] = await Promise.all([
    brandFor(db, e.master_plan_id),
    db.from("event_days").select("day, title, body, video_url, url, action").eq("event_id", e.id).order("day"),
    db.from("event_day_done").select("day").eq("registration_id", r.id),
  ]);
  const doneSet = new Set(((done ?? []) as { day: number }[]).map((d) => d.day));
  const total = e.days ?? 0;
  return NextResponse.json({
    brand,
    event: { title: e.title, subtitle: e.subtitle, host: e.host_name || brand.name, accent: e.accent, days: total, start: r.challenge_start },
    firstName: r.first_name,
    today,
    days: Array.from({ length: total }, (_, i) => i + 1).map((n) => {
      const d = ((days ?? []) as { day: number; title: string; body: string | null; video_url: string | null; url: string | null; action: string | null }[]).find((x) => x.day === n);
      const open = n <= today;
      return { day: n, open, title: d?.title || `Day ${n}`, body: open ? d?.body ?? null : null, videoUrl: open ? d?.video_url ?? null : null, url: open ? d?.url ?? null : null, action: open ? d?.action ?? null : null, done: doneSet.has(n) };
    }),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: { slug: string; token: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await load(params.slug, params.token);
  if (!ctx) return NextResponse.json({ error: "This link isn't active." }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as { day?: number; done?: boolean };
  const n = Math.floor(Number(b.day));
  const today = challengeDay(ctx.r.challenge_start || dayInTz(new Date(), ctx.e.timezone), dayInTz(new Date(), ctx.e.timezone));
  if (!(n >= 1 && n <= (ctx.e.days ?? 0) && n <= today)) return NextResponse.json({ error: "That day isn't open yet." }, { status: 400 });
  if (b.done) await ctx.db.from("event_day_done").upsert({ registration_id: ctx.r.id, day: n }, { onConflict: "registration_id,day" });
  else await ctx.db.from("event_day_done").delete().eq("registration_id", ctx.r.id).eq("day", n);
  return NextResponse.json({ ok: true });
}
