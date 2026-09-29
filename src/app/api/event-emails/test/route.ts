import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ALIGNMENT_ARCHITECT_EMAIL, isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { housePlanId } from "@/lib/housePlan";
import { sendRendered } from "@/lib/sequences/engine";
import { EVENT_SENDERS, eventTemplates, isEmailKind, isEventKey, renderEventEmail } from "@/lib/eventEmails";
import { incubatorMeetingId, isZoomConfigured, masterclassMeetingId, nextOccurrence } from "@/lib/zoom";

export const dynamic = "force-dynamic";

// Owner-only: POST { event_key, kind } → sends that template (live or not) to
// Babs with first name "Babs", a placeholder join link, the next session's
// time (or a sample time if Zoom can't be reached), and "[Test] " on the subject.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as { event_key?: unknown; kind?: unknown };
  const ev = b.event_key;
  const kind = b.kind;
  if (!isEventKey(ev) || !isEmailKind(kind)) return NextResponse.json({ error: "Pick an event (masterclass / incubator) and a kind (confirm / day_before / hour_before)." }, { status: 400 });
  const db = createServerClient();
  const tpl = (await eventTemplates(db, ev)).find((t) => t.kind === kind);
  if (!tpl) return NextResponse.json({ error: "That template doesn't exist yet." }, { status: 404 });

  let start: string | null = null;
  if (isZoomConfigured()) {
    const meetingId = ev === "incubator" ? incubatorMeetingId() : masterclassMeetingId();
    start = (await nextOccurrence(meetingId).catch(() => null))?.start ?? null;
  }
  if (!start) {
    // Sample: next Thursday at noon Mountain (18:00 UTC during daylight time).
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + ((4 - d.getUTCDay() + 7) % 7 || 7));
    d.setUTCHours(18, 0, 0, 0);
    start = d.toISOString();
  }

  // Her own contact in her account (for a working unsubscribe link), if there is one.
  const plan = await housePlanId(db);
  const { data: me } = plan ? await db.from("seq_contacts").select("id").eq("master_plan_id", plan).eq("email", ALIGNMENT_ARCHITECT_EMAIL).maybeSingle() : { data: null };
  const contactId = (me?.id as string) || "00000000-0000-0000-0000-000000000000";

  const mail = renderEventEmail({ event: ev, template: tpl, occurrenceStart: start, joinUrl: "https://zoom.us/j/test", contact: { id: contactId, first_name: "Babs" } });
  const r = await sendRendered(EVENT_SENDERS[ev], ALIGNMENT_ARCHITECT_EMAIL, contactId, { ...mail, subject: `[Test] ${mail.subject}` });
  if (!r.ok) return NextResponse.json({ error: r.error || "Couldn't send the test." }, { status: 502 });
  return NextResponse.json({ ok: true, to: ALIGNMENT_ARCHITECT_EMAIL, subject: `[Test] ${mail.subject}`, occurrence: start });
}
