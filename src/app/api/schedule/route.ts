import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import type { ScheduleEvent } from "@/lib/google";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { openMailboxes } from "@/lib/mailboxes";

export const dynamic = "force-dynamic";

type MergedEvent = ScheduleEvent & { account: string };

// Today's events merged across every connected calendar (Google + Microsoft 365).
export async function GET(request: Request) {
  // Anchor "today" and displayed times to the viewer's time zone: their chosen
  // zone, else the auto-detected one the client sends (?tz=), else UTC.
  const timeZone = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));

  const boxes = await openMailboxes();
  const events: MergedEvent[] = [];
  const connected = boxes.length > 0;

  await Promise.all(
    boxes.map(async (box) => {
      try {
        const rows =
          box.provider === "google"
            ? await google.fetchTodayEvents(box.token, timeZone)
            : await microsoft.fetchTodayEvents(box.token, timeZone);
        events.push(...rows.map((e) => ({ ...e, account: box.label })));
      } catch (e) {
        console.error(`schedule ${box.provider}:`, e);
      }
    })
  );

  events.sort((a, b) => {
    const ta = a.start ? new Date(a.start).getTime() : Infinity;
    const tb = b.start ? new Date(b.start).getTime() : Infinity;
    return ta - tb;
  });

  return NextResponse.json({ connected, events });
}
