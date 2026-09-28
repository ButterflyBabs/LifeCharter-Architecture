import { NextResponse } from "next/server";
import { availableSlots, book, calendarBySlug } from "@/lib/booking/engine";
import { createServerClient } from "@/lib/supabase/server";
import { browserContext, sendMetaEvent } from "@/lib/metaCapi";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Public booking page data.
//   GET ?from=ISO&to=ISO → the calendar's public details + open start times
//   POST { start, name, email, phone, timezone, answers } → books it
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const cal = await calendarBySlug(params.slug);
  if (!cal || !cal.active) return NextResponse.json({ error: "This booking page isn't available." }, { status: 404 });
  const u = new URL(request.url);
  const from = u.searchParams.get("from") || new Date().toISOString();
  const to = u.searchParams.get("to") || new Date(Date.now() + 14 * 86_400_000).toISOString();
  if (Date.parse(to) - Date.parse(from) > 45 * 86_400_000) return NextResponse.json({ error: "Range too long." }, { status: 400 });
  const { data: hosts } = await createServerClient().from("booking_hosts").select("name").in("id", cal.host_ids.length ? cal.host_ids : ["00000000-0000-0000-0000-000000000000"]);
  const plan = await availableSlots(cal, from, to);
  return NextResponse.json({
    calendar: {
      name: cal.name,
      description: cal.description,
      duration: cal.duration_min,
      location: cal.location,
      maxDaysAhead: cal.max_days_ahead,
      questions: cal.questions,
      hostName: cal.assignment === "single" ? (hosts ?? [])[0]?.name ?? null : null,
    },
    slots: plan.slots.map((s) => s.start),
  });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const cal = await calendarBySlug(params.slug);
  if (!cal || !cal.active) return NextResponse.json({ error: "This booking page isn't available." }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  if (typeof b._hp === "string" && b._hp.trim()) return NextResponse.json({ ok: true });
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const r = await book(cal, {
    startISO: str(b.start),
    name: str(b.name),
    email: str(b.email),
    phone: str(b.phone) || null,
    timezone: str(b.timezone) || null,
    answers: b.answers && typeof b.answers === "object" ? (b.answers as Record<string, string>) : {},
  });
  if (r.ok) {
    // Schedule → Meta Conversions API. Reschedules (the manage page) aren't new bookings.
    const [firstName, ...rest] = str(b.name).trim().split(/\s+/);
    await sendMetaEvent({
      eventName: "Schedule",
      eventId: `booking-${r.bookingId}`,
      email: str(b.email),
      phone: str(b.phone) || null,
      firstName: firstName || null,
      lastName: rest.join(" ") || null,
      contentName: `booking:${cal.slug}`,
      ...browserContext(request),
    });
  }
  return r.ok ? NextResponse.json({ ok: true, manage: `/book/manage/${r.manageToken}` }) : NextResponse.json({ error: r.error }, { status: 409 });
}
