import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { housePlanId } from "@/lib/housePlan";
import { sendRendered } from "@/lib/sequences/engine";
import { EVENT_SENDERS, eventTemplates, isEmailKind, isEventKey, registrantOccurrence, renderEventEmail } from "@/lib/eventEmails";
import { foundersHalfHourMeetingId, incubatorMeetingId, isZoomConfigured, masterclassMeetingId, meetingSchedule, nextOccurrence } from "@/lib/zoom";
import { logEvent } from "@/lib/crm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KIND_LABEL = { confirm: "confirmation", day_before: "day-before reminder", hour_before: "hour-before reminder" } as const;

// Owner-only: POST { event_key, kind, email } sends that one event email (confirmation, day-before or hour-before)
// to one registrant right now, with their own Zoom join link and their session's date and time. It is a one-off:
// the automatic schedule and its "already sent" ledger are not touched, so the person is not emailed twice by it.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as { event_key?: unknown; kind?: unknown; email?: unknown };
  const ev = b.event_key;
  const kind = b.kind;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!isEventKey(ev) || !isEmailKind(kind)) return NextResponse.json({ error: "Pick an event and which email." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Type or pick the person's email address." }, { status: 400 });

  const db = createServerClient();
  const tpl = (await eventTemplates(db, ev)).find((t) => t.kind === kind);
  if (!tpl) return NextResponse.json({ error: "That email doesn't exist yet." }, { status: 404 });

  const { data: reg } = await db
    .from("zoom_registrant_syncs")
    .select("email, join_url, registered_at, synced_at")
    .eq("event_key", ev)
    .ilike("email", email)
    .order("registered_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!reg) return NextResponse.json({ error: "That person hasn't registered for this event, so there's no join link to send." }, { status: 404 });
  if (!reg.join_url) return NextResponse.json({ error: "There's no Zoom join link saved for them yet." }, { status: 409 });

  const plan = await housePlanId(db);
  if (!plan) return NextResponse.json({ error: "No house account." }, { status: 500 });
  const { data: contact } = await db.from("seq_contacts").select("id, first_name, unsubscribed_at").eq("master_plan_id", plan).ilike("email", email).maybeSingle();
  if (!contact) return NextResponse.json({ error: "They aren't in your Contacts yet." }, { status: 404 });
  if (contact.unsubscribed_at) return NextResponse.json({ error: "They've unsubscribed, so they can't be emailed." }, { status: 400 });

  // Their session: the one they registered for if it is still ahead, otherwise the next one.
  let start: string | null = null;
  if (isZoomConfigured()) {
    const meetingId = ev === "incubator" ? incubatorMeetingId() : ev === "founders-half-hour" ? foundersHalfHourMeetingId() : masterclassMeetingId();
    try {
      const schedule = await meetingSchedule(meetingId);
      start = registrantOccurrence(schedule, (reg.registered_at as string | null) || (reg.synced_at as string | null))?.start ?? (await nextOccurrence(meetingId).catch(() => null))?.start ?? null;
    } catch {
      start = null;
    }
  }
  if (!start) return NextResponse.json({ error: "Couldn't find the session's date from Zoom just now. Please try again in a minute." }, { status: 502 });

  const mail = renderEventEmail({ event: ev, template: tpl, occurrenceStart: start, joinUrl: reg.join_url as string, contact: { id: contact.id as string, first_name: (contact.first_name as string | null) ?? null } });
  const r = await sendRendered(EVENT_SENDERS[ev], email, contact.id as string, mail);
  if (!r.ok) return NextResponse.json({ error: r.error || "Couldn't send." }, { status: 502 });
  await logEvent(plan, contact.id as string, "email", `${EVENT_SENDERS[ev].title} ${KIND_LABEL[kind]} resent: “${mail.subject}”`, { event: ev, kind, occurrence: start, resend: true }, db).catch(() => {});
  return NextResponse.json({ ok: true, to: email, subject: mail.subject, occurrence: start });
}
