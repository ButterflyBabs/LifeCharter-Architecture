import { createServerClient } from "@/lib/supabase/server";
import { occurrences, type RecurringEventFields } from "@/lib/community/recurrence";
import { logEvent } from "@/lib/crm";
import { dayInTz } from "@/lib/tz";

// New clients (Executive Consultation and self-serve Starter alike) book a 1:1 Welcome Call with Babs; the moment they do,
// they are invited to the next New Client Launch Call (every other Thursday, 1:00 PM MT, 90 minutes, Zoom). The call is a
// Collective event with a repeat rule, so its dates (and any skipped date, such as a holiday) come from that event.
// Rule (Babs, 2026-10-17): the cut-off for joining a Launch Call is the day before it (Wednesday, Mountain time). A client
// who books their Welcome Call on or before that Wednesday is invited to that Thursday's call; after it, to the next one.
// The call must also start after their Welcome Call, so they meet Babs first.

const LAUNCH_CALL_EVENT_ID = "98803b0a-d494-47ea-a8cc-5e29e2eaa04f";
const FROM = "AmiLynne Carroll <hello@lccommandsuite.com>";
const REPLY_TO = "support@lccommandsuite.com";
const ORGANIZER_EMAIL = "amilynne@amilynnecarroll.com";
const COPY_TO = "amilynne@amilynnecarroll.com";

interface LaunchEvent extends RecurringEventFields {
  title: string;
  description: string | null;
  join_url: string | null;
}

export interface LaunchCallDate {
  start: Date;
  end: Date;
  date: string; // YYYY-MM-DD in Mountain time
  title: string;
  description: string;
  joinUrl: string;
}

export async function nextLaunchCall(after: Date): Promise<LaunchCallDate | null> {
  const { data: ev } = await createServerClient().from("cm_events").select("id, title, description, starts_at, ends_at, timezone, join_url, recur_freq, recur_until, recur_exdates").eq("id", LAUNCH_CALL_EVENT_ID).is("deleted_at", null).maybeSingle();
  if (!ev?.join_url) return null;
  const e = ev as LaunchEvent;
  const now = new Date();
  const today = dayInTz(now, "America/Denver"); // YYYY-MM-DD in Mountain time
  const from = new Date(Math.max(after.getTime(), now.getTime()));
  // Cut-off: still today <= the day before the call, i.e. strictly before the call's own date.
  const next = occurrences(e, from, new Date(from.getTime() + 120 * 24 * 3_600_000), 8).find((o) => o.start > from && today < o.date);
  if (!next) return null;
  return { start: next.start, end: next.end, date: next.date, title: e.title, description: e.description ?? "", joinUrl: e.join_url! };
}

const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => (line.length <= 73 ? line : line.match(/.{1,73}/g)!.join("\r\n "));

// A calendar invitation (.ics) with the Zoom link, so it lands on their calendar with one click.
export function launchCallIcs(c: LaunchCallDate, attendee: { name: string; email: string }): string {
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//LifeCharter Command Suite//Launch Call//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:launch-call-${c.date}@lccommandsuite.com`,
      `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(c.start)}`,
      `DTEND:${icsStamp(c.end)}`,
      `SUMMARY:${icsText(c.title)}`,
      `DESCRIPTION:${icsText(`${c.description}\n\nJoin on Zoom: ${c.joinUrl}`)}`,
      `LOCATION:${icsText(c.joinUrl)}`,
      `URL:${c.joinUrl}`,
      `ORGANIZER;CN=AmiLynne Carroll:mailto:${ORGANIZER_EMAIL}`,
      `ATTENDEE;CN=${icsText(attendee.name)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${attendee.email}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      "DESCRIPTION:New Client Launch Call starts in 30 minutes",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Emails the client their Launch Call invitation (date, Zoom link, calendar file attached). Once per client per Launch Call date.
 * `after` is when their Welcome Call starts. Never throws; returns whether an email went out.
 */
export async function inviteToLaunchCall(i: { masterPlanId: string; contactId?: string | null; name: string; email: string; after: Date }): Promise<boolean> {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) return false;
    const email = i.email.trim().toLowerCase();
    const call = await nextLaunchCall(i.after);
    if (!call) return false;
    const db = createServerClient();
    if (i.contactId) {
      const { data: seen } = await db.from("crm_events").select("id").eq("contact_id", i.contactId).eq("detail->>launchCall", call.date).limit(1);
      if (seen?.length) return false;
    }
    const when = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(call.start);
    const first = i.name.trim().split(/\s+/)[0] || "";
    const p = 'style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#2E3A46"';
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#0F1A38">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B8923A;font-weight:bold">LifeCharter Command Suite</p>
<h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#0F1A38">You're invited to the New Client Launch Call</h1>
<p ${p}>${first ? `Hi ${esc(first)}, ` : ""}after your Welcome Call with me, your next step is the New Client Launch Call. It is a live group session for clients in their first 30 days: getting set up, working through your First 30 Days, and making the Suite how you run your business.</p>
<p style="margin:0 0 4px;font-size:18px;font-weight:bold;color:#0F1A38">${esc(when)}</p>
<p style="margin:0 0 14px;font-size:14px;color:#2E3A46">90 minutes on Zoom. A calendar invitation is attached to this email.</p>
<p style="margin:22px 0"><a href="${esc(call.joinUrl)}" style="display:inline-block;background:#0F1A38;color:#E9D7A9;font-weight:bold;font-size:16px;padding:14px 26px;border-radius:999px;text-decoration:none">Join on Zoom</a></p>
<p ${p}>Open the attached invitation to add it to your calendar. The Launch Call happens every other Thursday at 1:00 PM Mountain, and every Command Suite client is welcome at any of them, so if this date doesn't work you can join the next one.</p>
<p ${p}>Questions? Reply to this email or write to support@lccommandsuite.com.</p>
<p ${p}>Head up - Wings out<br>Babs 🦋</p></div>`;
    const text = [
      `${first ? `Hi ${first}, ` : ""}after your Welcome Call with me, your next step is the New Client Launch Call: a live group session for clients in their first 30 days.`,
      `${when}\n90 minutes on Zoom. A calendar invitation is attached.`,
      `Join on Zoom: ${call.joinUrl}`,
      "The Launch Call happens every other Thursday at 1:00 PM Mountain, and every Command Suite client is welcome at any of them, so if this date doesn't work you can join the next one.",
      "Questions? Reply to this email or write to support@lccommandsuite.com.",
      "Head up - Wings out\nBabs 🦋",
    ].join("\n\n");
    const ics = launchCallIcs(call, { name: i.name.trim() || email, email });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: email,
        ...(email === COPY_TO ? {} : { bcc: [COPY_TO] }),
        reply_to: REPLY_TO,
        subject: `You're invited: New Client Launch Call, ${new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", month: "long", day: "numeric" }).format(call.start)}`,
        html,
        text,
        attachments: [{ filename: "New-Client-Launch-Call.ics", content: Buffer.from(ics).toString("base64"), content_type: "text/calendar; method=REQUEST; charset=UTF-8" }],
      }),
    }).catch(() => null);
    if (!res?.ok) {
      console.error("launch call invite failed:", res?.status, await res?.text().catch(() => ""));
      return false;
    }
    if (i.contactId) await logEvent(i.masterPlanId, i.contactId, "note", `Invited to the New Client Launch Call on ${when}`, { launchCall: call.date, welcomeCallAfter: i.after.toISOString() }, db).catch(() => {});
    return true;
  } catch (e) {
    console.error("launch call invite:", (e as Error).message);
    return false;
  }
}
