import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { book, cancelBooking, hashToken, type Calendar } from "@/lib/booking/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The invitee's private link (from their confirmation email).
//   GET → the booking · POST { action: "cancel", reason } | { action: "reschedule", start, timezone }
async function load(token: string) {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const db = createServerClient();
  const { data: b } = await db.from("bookings").select("*").eq("manage_token_hash", hashToken(token)).maybeSingle();
  if (!b) return null;
  const [{ data: cal }, { data: host }] = await Promise.all([
    db.from("booking_calendars").select("*").eq("id", b.calendar_id).maybeSingle(),
    db.from("booking_hosts").select("name").eq("id", b.host_id).maybeSingle(),
  ]);
  return cal ? { b, cal: cal as Calendar, hostName: (host?.name as string) || "" } : null;
}

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const x = await load(params.token);
  if (!x) return NextResponse.json({ error: "We couldn't find that booking." }, { status: 404 });
  const { b, cal, hostName } = x;
  return NextResponse.json({
    booking: { status: b.status, start: b.start_at, end: b.end_at, name: b.invitee_name, timezone: b.invitee_timezone, meetingUrl: b.status === "confirmed" ? b.meeting_url : null },
    calendar: { name: cal.name, slug: cal.slug, duration: cal.duration_min },
    hostName,
  });
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const x = await load(params.token);
  if (!x) return NextResponse.json({ error: "We couldn't find that booking." }, { status: 404 });
  const { b, cal } = x;
  if (b.status !== "confirmed") return NextResponse.json({ error: "This meeting is no longer active." }, { status: 409 });
  if (Date.parse(b.start_at) < Date.now()) return NextResponse.json({ error: "This meeting has already started." }, { status: 409 });
  const body = await request.json().catch(() => ({}));
  if (body.action === "cancel") {
    await cancelBooking(b.id, typeof body.reason === "string" ? body.reason.trim() : "", "invitee");
    return NextResponse.json({ ok: true });
  }
  if (body.action === "reschedule") {
    const r = await book(cal, {
      startISO: String(body.start || ""),
      name: b.invitee_name,
      email: b.invitee_email,
      phone: b.invitee_phone,
      timezone: typeof body.timezone === "string" ? body.timezone : b.invitee_timezone,
      answers: b.answers || {},
      rescheduleOf: b.id,
    });
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 409 });
    await cancelBooking(b.id, "Rescheduled", "invitee", { notify: false, status: "rescheduled" });
    return NextResponse.json({ ok: true, manage: `/book/manage/${r.manageToken}` });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
