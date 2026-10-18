import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { senderProfile, senderVerdict, SENDING_SETUP_PATH } from "@/lib/email/accountSender";
import { isValidTz } from "@/lib/sequences/engine";
import { eventUrl, sendReplay, slugify, type EventRow } from "@/lib/events";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Clients & Sales › Events (task 1149): live events and challenges for every account.
//   GET               -> every event with its registration count
//   GET ?id=<event>   -> one event: registrations, challenge days, campaigns for the follow-up, email-sending check
//   POST { action, ... }
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const link = (v: unknown) => (/^https?:\/\//i.test(str(v, 1000)) ? str(v, 1000) : null);

export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    const [{ data: evs }, { data: regs }] = await Promise.all([
      db.from("events").select("id, kind, slug, title, starts_at, starts_on, days, status").eq("master_plan_id", a.planId).order("created_at", { ascending: false }),
      db.from("event_registrations").select("event_id").eq("master_plan_id", a.planId),
    ]);
    const count = new Map<string, number>();
    for (const r of (regs ?? []) as { event_id: string }[]) count.set(r.event_id, (count.get(r.event_id) ?? 0) + 1);
    return NextResponse.json({ events: ((evs ?? []) as { id: string }[]).map((e) => ({ ...e, registrations: count.get(e.id) ?? 0 })) }, { headers: { "Cache-Control": "no-store" } });
  }
  const { data: e } = await db.from("events").select("*").eq("id", id).eq("master_plan_id", a.planId).maybeSingle();
  if (!e) return NextResponse.json({ error: "That event could not be found." }, { status: 404 });
  const [{ data: regs }, { data: days }, { data: seqs }, profile] = await Promise.all([
    db.from("event_registrations").select("id, email, first_name, attended, created_at, last_day_sent, replay_sent_at, contact_id").eq("event_id", id).order("created_at", { ascending: false }),
    db.from("event_days").select("day, title, body, video_url, url, action").eq("event_id", id).order("day"),
    db.from("sequences").select("key, name").eq("master_plan_id", a.planId).order("name"),
    senderProfile(a.planId, db),
  ]);
  const v = senderVerdict(profile, false);
  return NextResponse.json({
    event: e,
    url: eventUrl((e as EventRow).slug),
    registrations: regs ?? [],
    days: days ?? [],
    campaigns: seqs ?? [],
    sender: { ok: v.ok, reason: v.ok ? null : v.reason, setupPath: SENDING_SETUP_PATH },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const now = new Date().toISOString();
  if (b.action === "create") {
    const title = str(b.title, 160);
    if (!title) return NextResponse.json({ error: "Give the event a title." }, { status: 400 });
    const kind = b.kind === "challenge" ? "challenge" : "live";
    const base = slugify(title) || "event";
    let slug = base;
    for (let i = 2; i < 50; i++) {
      const { data: taken } = await db.from("events").select("id").eq("slug", slug).maybeSingle();
      if (!taken) break;
      slug = `${base}-${i}`;
    }
    const { data, error } = await db.from("events").insert({ master_plan_id: a.planId, kind, title, slug, days: kind === "challenge" ? 5 : null }).select("id").single();
    return error || !data ? NextResponse.json({ error: "Couldn't create it." }, { status: 500 }) : NextResponse.json({ ok: true, id: data.id });
  }
  const { data: ev } = await db.from("events").select("*").eq("id", str(b.id, 60)).eq("master_plan_id", a.planId).maybeSingle();
  if (!ev) return NextResponse.json({ error: "That event could not be found." }, { status: 404 });
  const e = ev as EventRow;
  const ok = NextResponse.json({ ok: true });

  switch (b.action) {
    case "update": {
      const p: Record<string, unknown> = { updated_at: now };
      if (b.title !== undefined) p.title = str(b.title, 160) || e.title;
      if (b.subtitle !== undefined) p.subtitle = str(b.subtitle, 240) || null;
      if (b.description !== undefined) p.description = str(b.description, 8000) || null;
      if (b.hostName !== undefined) p.host_name = str(b.hostName, 120) || null;
      if (b.accent !== undefined) p.accent = /^#[0-9a-fA-F]{6}$/.test(str(b.accent, 7)) ? str(b.accent, 7) : null;
      if (b.slug !== undefined) {
        const s = slugify(str(b.slug, 60));
        if (s && s !== e.slug) {
          const { data: taken } = await db.from("events").select("id").eq("slug", s).maybeSingle();
          if (taken) return NextResponse.json({ error: "That web address is taken. Try another." }, { status: 400 });
          p.slug = s;
        }
      }
      if (b.startsAt !== undefined) p.starts_at = Number.isFinite(Date.parse(str(b.startsAt, 40))) ? new Date(str(b.startsAt, 40)).toISOString() : null;
      if (b.durationMin !== undefined) p.duration_min = Math.min(600, Math.max(5, Math.floor(Number(b.durationMin) || 60)));
      if (b.timezone !== undefined && isValidTz(str(b.timezone, 60))) p.timezone = str(b.timezone, 60);
      if (b.joinUrl !== undefined) p.join_url = link(b.joinUrl);
      if (b.days !== undefined) p.days = Math.min(60, Math.max(1, Math.floor(Number(b.days) || 5)));
      if (b.startsOn !== undefined) p.starts_on = /^\d{4}-\d{2}-\d{2}$/.test(str(b.startsOn, 10)) ? str(b.startsOn, 10) : null;
      if (b.sendHour !== undefined) p.send_hour = Math.min(23, Math.max(0, Math.floor(Number(b.sendHour) || 7)));
      if (b.capacity !== undefined) p.capacity = Number(b.capacity) > 0 ? Math.floor(Number(b.capacity)) : null;
      if (Array.isArray(b.tags)) p.tags = (b.tags as unknown[]).map((t) => str(t, 60).toLowerCase()).filter(Boolean).slice(0, 10);
      if (b.followUpKey !== undefined) {
        const k = str(b.followUpKey, 80);
        const { data: sq } = k ? await db.from("sequences").select("key").eq("master_plan_id", a.planId).eq("key", k).maybeSingle() : { data: null };
        p.follow_up_key = (sq?.key as string) ?? null;
      }
      if (b.replayUrl !== undefined) p.replay_url = link(b.replayUrl);
      if (b.replayHours !== undefined) p.replay_hours = Number(b.replayHours) > 0 ? Math.min(720, Math.floor(Number(b.replayHours))) : null;
      await db.from("events").update(p).eq("id", e.id);
      return ok;
    }
    case "status": {
      const status = ["draft", "published", "ended"].includes(String(b.status)) ? String(b.status) : null;
      if (!status) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
      if (status === "published") {
        if (e.kind === "live" && !e.starts_at) return NextResponse.json({ error: "Set the date and time first." }, { status: 400 });
        if (e.kind === "challenge" && !e.days) return NextResponse.json({ error: "Set the number of days first." }, { status: 400 });
      }
      await db.from("events").update({ status, updated_at: now }).eq("id", e.id);
      return ok;
    }
    case "days": {
      // The whole challenge content at once: [{ day, title, body, videoUrl, url, action }].
      const rows = (Array.isArray(b.days) ? (b.days as Record<string, unknown>[]) : [])
        .map((d) => ({ event_id: e.id, day: Math.floor(Number(d.day)), title: str(d.title, 200), body: str(d.body, 8000) || null, video_url: link(d.videoUrl), url: link(d.url), action: str(d.action, 500) || null }))
        .filter((d) => d.day >= 1 && d.day <= 60 && d.title);
      await db.from("event_days").delete().eq("event_id", e.id);
      if (rows.length) await db.from("event_days").insert(rows);
      return ok;
    }
    case "attended": {
      const { data: r } = await db.from("event_registrations").select("id, contact_id").eq("id", str(b.regId, 60)).eq("event_id", e.id).maybeSingle();
      if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const attended = b.attended === null ? null : Boolean(b.attended);
      await db.from("event_registrations").update({ attended }).eq("id", r.id);
      if (r.contact_id && attended !== null) {
        const { data: c } = await db.from("seq_contacts").select("tags").eq("id", r.contact_id).maybeSingle();
        const tag = attended ? `attended-${e.slug}` : `missed-${e.slug}`;
        const other = attended ? `missed-${e.slug}` : `attended-${e.slug}`;
        const tags = Array.from(new Set([...(((c?.tags as string[]) ?? []).filter((t) => t !== other)), tag]));
        await db.from("seq_contacts").update({ tags, tag_source: `event:${e.slug}`, updated_at: now }).eq("id", r.contact_id);
      }
      return ok;
    }
    case "send-replay": {
      try {
        const n = await sendReplay(db, { ...e, replay_url: link(b.replayUrl) ?? e.replay_url });
        return NextResponse.json({ ok: true, sent: n });
      } catch (x) {
        return NextResponse.json({ error: x instanceof Error ? x.message : "The replay didn't send." }, { status: 400 });
      }
    }
    case "delete": {
      const { count } = await db.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", e.id);
      if ((count ?? 0) > 0) return NextResponse.json({ error: "People have registered, so it can't be deleted. Mark it Ended instead." }, { status: 400 });
      await db.from("events").delete().eq("id", e.id);
      return ok;
    }
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
