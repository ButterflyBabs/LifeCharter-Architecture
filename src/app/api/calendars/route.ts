import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { cleanFields } from "../crm/forms/clean";
import { cancelBooking } from "@/lib/booking/engine";
import { isValidTz } from "@/lib/sequences/engine";
import { logEvent, EMAIL_RE } from "@/lib/crm";
import { canCreateZoomMeetings, isZoomConfigured } from "@/lib/zoom";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The account's booking calendars, hosts and bookings (owner screen /calendars).
//   GET → everything for the screen
//   POST { action, ... } → create-host | update-host | connection | remove-connection |
//        new-connect-key | create-calendar | update-calendar | booking-status | cancel-booking

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const int = (v: unknown, lo: number, hi: number) => (Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi ? (v as number) : undefined);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function cleanWeekly(v: unknown): Record<string, [string, string][]> | undefined {
  if (!v || typeof v !== "object") return undefined;
  const out: Record<string, [string, string][]> = {};
  for (const d of DAYS) {
    const ranges = (v as Record<string, unknown>)[d];
    if (!Array.isArray(ranges)) continue;
    const ok = ranges.filter((r): r is [string, string] => Array.isArray(r) && TIME.test(r[0]) && TIME.test(r[1]) && r[0] < r[1]).slice(0, 6);
    if (ok.length) out[d] = ok;
  }
  return out;
}

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const [{ data: calendars }, { data: hosts }, { data: bookings }] = await Promise.all([
    db.from("booking_calendars").select("*").eq("master_plan_id", a.planId).order("created_at"),
    db.from("booking_hosts").select("id, name, email, zoom_email, timezone, weekly, connect_key, active").eq("master_plan_id", a.planId).order("created_at"),
    db
      .from("bookings")
      .select("id, calendar_id, host_id, start_at, end_at, invitee_name, invitee_email, invitee_phone, answers, status, meeting_url, contact_id, cancel_reason")
      .eq("master_plan_id", a.planId)
      .gte("start_at", new Date(Date.now() - 30 * 86_400_000).toISOString())
      .order("start_at")
      .limit(500),
  ]);
  const hostIds = (hosts ?? []).map((h) => h.id as string);
  const { data: conns } = hostIds.length
    ? await db.from("booking_connections").select("id, host_id, provider, email, check_busy, add_events").in("host_id", hostIds).order("created_at")
    : { data: [] };
  const zoom = isZoomConfigured() ? { configured: true, canCreate: await canCreateZoomMeetings().catch(() => false) } : { configured: false, canCreate: false };
  return NextResponse.json({ calendars: calendars ?? [], hosts: (hosts ?? []).map((h) => ({ ...h, connections: (conns ?? []).filter((c) => c.host_id === h.id) })), bookings: bookings ?? [], zoom });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const db = createServerClient();
  const now = new Date().toISOString();
  const ownHost = async (id: unknown) => {
    const { data } = await db.from("booking_hosts").select("id").eq("id", str(id, 60)).eq("master_plan_id", a.planId).maybeSingle();
    return data?.id as string | undefined;
  };
  const ownConnection = async (id: unknown) => {
    const { data } = await db.from("booking_connections").select("id, host_id, booking_hosts!inner(master_plan_id)").eq("id", str(id, 60)).eq("booking_hosts.master_plan_id", a.planId).maybeSingle();
    return data as { id: string; host_id: string } | null;
  };

  switch (b.action) {
    case "create-host": {
      const email = str(b.email, 200).toLowerCase();
      if (!str(b.name, 120) || !EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a name and a valid email." }, { status: 400 });
      const { data, error } = await db
        .from("booking_hosts")
        .insert({ master_plan_id: a.planId, name: str(b.name, 120), email, zoom_email: str(b.zoomEmail, 200).toLowerCase() || null, timezone: isValidTz(str(b.timezone, 60)) ? str(b.timezone, 60) : "America/Denver" })
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.code === "23505" ? "That person is already a host." : "Couldn't add them." }, { status: 400 });
      return NextResponse.json({ id: data.id });
    }
    case "update-host": {
      const id = await ownHost(b.id);
      if (!id) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const patch: Record<string, unknown> = { updated_at: now };
      if (str(b.name, 120)) patch.name = str(b.name, 120);
      if (EMAIL_RE.test(str(b.email, 200))) patch.email = str(b.email, 200).toLowerCase();
      if (b.zoomEmail !== undefined) patch.zoom_email = str(b.zoomEmail, 200).toLowerCase() || null;
      if (isValidTz(str(b.timezone, 60))) patch.timezone = str(b.timezone, 60);
      const weekly = cleanWeekly(b.weekly);
      if (weekly) patch.weekly = weekly;
      if (typeof b.active === "boolean") patch.active = b.active;
      await db.from("booking_hosts").update(patch).eq("id", id);
      return NextResponse.json({ ok: true });
    }
    case "connection": {
      const c = await ownConnection(b.id);
      if (!c) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (typeof b.checkBusy === "boolean") await db.from("booking_connections").update({ check_busy: b.checkBusy, updated_at: now }).eq("id", c.id);
      if (b.addEvents === true) {
        await db.from("booking_connections").update({ add_events: false }).eq("host_id", c.host_id);
        await db.from("booking_connections").update({ add_events: true, updated_at: now }).eq("id", c.id);
      }
      return NextResponse.json({ ok: true });
    }
    case "remove-connection": {
      const c = await ownConnection(b.id);
      if (!c) return NextResponse.json({ error: "Not found." }, { status: 404 });
      await db.from("booking_connections").delete().eq("id", c.id);
      return NextResponse.json({ ok: true });
    }
    case "new-connect-key": {
      const id = await ownHost(b.id);
      if (!id) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const key = Array.from(crypto.getRandomValues(new Uint8Array(24)), (x) => x.toString(16).padStart(2, "0")).join("");
      await db.from("booking_hosts").update({ connect_key: key, updated_at: now }).eq("id", id);
      return NextResponse.json({ ok: true });
    }
    case "create-calendar": {
      const name = str(b.name, 120);
      const slug = (str(b.slug, 60) || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!name || !slug) return NextResponse.json({ error: "Give the calendar a name." }, { status: 400 });
      const { data, error } = await db.from("booking_calendars").insert({ master_plan_id: a.planId, name, slug, tags: [slug] }).select("id").single();
      if (error) return NextResponse.json({ error: error.code === "23505" ? "That link is already taken. Try another." : "Couldn't create it." }, { status: 400 });
      return NextResponse.json({ id: data.id });
    }
    case "update-calendar": {
      const { data: cal } = await db.from("booking_calendars").select("id").eq("id", str(b.id, 60)).eq("master_plan_id", a.planId).maybeSingle();
      if (!cal) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const p: Record<string, unknown> = { updated_at: now };
      if (str(b.name, 120)) p.name = str(b.name, 120);
      if (b.slug !== undefined) {
        const slug = str(b.slug, 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (slug) p.slug = slug;
      }
      if (b.description !== undefined) p.description = str(b.description, 2000) || null;
      for (const [k, col, lo, hi] of [
        ["duration", "duration_min", 5, 480],
        ["step", "slot_step_min", 5, 240],
        ["bufferBefore", "buffer_before_min", 0, 240],
        ["bufferAfter", "buffer_after_min", 0, 240],
        ["minNotice", "min_notice_hours", 0, 720],
        ["maxDays", "max_days_ahead", 1, 365],
      ] as const) {
        const v = int(b[k], lo, hi);
        if (v !== undefined) p[col] = v;
      }
      if (b.dailyCap !== undefined) p.daily_cap = int(b.dailyCap, 1, 50) ?? null;
      if (b.assignment === "single" || b.assignment === "round_robin") p.assignment = b.assignment;
      if (Array.isArray(b.hostIds)) {
        const { data: valid } = await db.from("booking_hosts").select("id").eq("master_plan_id", a.planId).in("id", b.hostIds.map((x: unknown) => str(x, 60)).filter(Boolean));
        const ok = new Set((valid ?? []).map((h) => h.id as string));
        p.host_ids = b.hostIds.filter((x: string) => ok.has(x));
      }
      if (Array.isArray(b.ccEmails)) p.cc_emails = b.ccEmails.map((e: unknown) => str(e, 200).toLowerCase()).filter((e: string) => EMAIL_RE.test(e)).slice(0, 10);
      if (["zoom", "phone", "custom"].includes(b.location)) p.location = b.location;
      if (b.locationDetail !== undefined) p.location_detail = str(b.locationDetail, 500) || null;
      if (b.questions !== undefined) p.questions = (cleanFields(b.questions) ?? []).filter((q) => q.name !== "email");
      if (Array.isArray(b.tags)) p.tags = b.tags.map((t: unknown) => str(t, 60).toLowerCase()).filter(Boolean);
      if (b.sequenceKey !== undefined) p.sequence_key = str(b.sequenceKey, 60) || null;
      if (b.confirmationNote !== undefined) p.confirmation_note = str(b.confirmationNote, 1000) || null;
      if (typeof b.active === "boolean") p.active = b.active;
      const { error } = await db.from("booking_calendars").update(p).eq("id", cal.id);
      if (error) return NextResponse.json({ error: error.code === "23505" ? "That link is already taken." : "Couldn't save." }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    case "booking-status": {
      if (!["completed", "no_show"].includes(b.status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
      const { data: bk } = await db.from("bookings").select("id, contact_id, calendar_id, status").eq("id", str(b.id, 60)).eq("master_plan_id", a.planId).maybeSingle();
      if (!bk) return NextResponse.json({ error: "Not found." }, { status: 404 });
      await db.from("bookings").update({ status: b.status }).eq("id", bk.id);
      if (bk.contact_id) {
        const { data: cal } = await db.from("booking_calendars").select("name, slug").eq("id", bk.calendar_id).maybeSingle();
        await logEvent(a.planId, bk.contact_id, "booking", `${b.status === "no_show" ? "Missed" : "Attended"} ${cal?.name ?? "meeting"}`, { booking: bk.id });
        const { data: c } = await db.from("seq_contacts").select("tags").eq("id", bk.contact_id).maybeSingle();
        const tag = `${b.status === "no_show" ? "no-show" : "attended"}-${cal?.slug ?? "meeting"}`;
        await db.from("seq_contacts").update({ tags: Array.from(new Set([...((c?.tags as string[]) ?? []), tag])) }).eq("id", bk.contact_id);
      }
      return NextResponse.json({ ok: true });
    }
    case "cancel-booking": {
      const { data: bk } = await db.from("bookings").select("id").eq("id", str(b.id, 60)).eq("master_plan_id", a.planId).maybeSingle();
      if (!bk) return NextResponse.json({ error: "Not found." }, { status: 404 });
      await cancelBooking(bk.id as string, str(b.reason, 500), "owner");
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
