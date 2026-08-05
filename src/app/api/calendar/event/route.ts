import { NextResponse } from "next/server";
import * as microsoft from "@/lib/microsoft";
import * as google from "@/lib/google";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Create a calendar event (a follow-up "time block"). Microsoft has calendar
// write today; Google is currently read-only, so for a Google-only mailbox we
// report that a reconnect (broader scope) is needed rather than failing.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const startISO = typeof body.startISO === "string" ? body.startISO : "";
  const durationMin = Number(body.durationMin) > 0 ? Number(body.durationMin) : 30;
  if (!subject || !startISO) {
    return NextResponse.json({ error: "subject and startISO are required" }, { status: 400 });
  }
  const start = new Date(startISO);
  if (isNaN(start.getTime())) {
    return NextResponse.json({ error: "invalid start time" }, { status: 400 });
  }
  const endISO = new Date(start.getTime() + durationMin * 60000).toISOString();

  const msToken = await microsoft.getValidAccessToken().catch(() => null);
  if (msToken) {
    try {
      const id = await microsoft.createEvent(msToken, { subject, startISO, endISO, body: body.note || "" });
      return NextResponse.json({ ok: true, provider: "microsoft", eventId: id });
    } catch (e) {
      console.error("calendar event (ms):", e);
      return NextResponse.json({ error: "Couldn't create the calendar event." }, { status: 502 });
    }
  }

  // Google: write if the connection granted the calendar.events scope; otherwise
  // ask the user to reconnect to add it.
  const gToken = await google.getValidAccessToken().catch(() => null);
  if (gToken) {
    const canWrite = await google.hasCalendarWriteScope().catch(() => false);
    if (!canWrite) {
      return NextResponse.json(
        {
          error:
            "Reconnect Google to grant calendar access — then events will be added automatically.",
          needsScope: true,
        },
        { status: 400 }
      );
    }
    try {
      const tz = typeof body.timeZone === "string" && body.timeZone ? body.timeZone : "UTC";
      const id = await google.createEvent(gToken, { subject, startISO, endISO, note: body.note || "", timeZone: tz });
      return NextResponse.json({ ok: true, provider: "google", eventId: id });
    } catch (e) {
      console.error("calendar event (google):", e);
      return NextResponse.json({ error: "Couldn't create the Google Calendar event." }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "No calendar connected." }, { status: 400 });
}
