import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import type { ScheduleEvent } from "@/lib/google";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { openMailboxes } from "@/lib/mailboxes";

export const dynamic = "force-dynamic";

type MergedEvent = ScheduleEvent & { account: string };

// The day's events (today by default) merged across every connected calendar (Google + Microsoft 365).
export async function GET(request: Request) {
  // Anchor "today" and displayed times to the viewer's time zone: their chosen
  // zone, else the auto-detected one the client sends (?tz=), else UTC.
  const url = new URL(request.url);
  const timeZone = await resolveUserTimeZone(url.searchParams.get("tz"));
  // ?day=N pages the schedule forward: 0 is today, 1 tomorrow, up to 60 days out.
  const day = Math.min(60, Math.max(0, Math.floor(Number(url.searchParams.get("day"))) || 0));

  const boxes = await openMailboxes();
  const events: MergedEvent[] = [];
  const connected = boxes.length > 0;

  await Promise.all(
    boxes.map(async (box) => {
      try {
        const rows =
          box.provider === "google"
            ? await google.fetchTodayEvents(box.token, timeZone, day)
            : await microsoft.fetchTodayEvents(box.token, timeZone, day);
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

  // Which calendars are connected, so the page links to the right ones.
  const providers = { google: boxes.some((b) => b.provider === "google"), microsoft: boxes.some((b) => b.provider === "microsoft") };
  return NextResponse.json({ connected, providers, events });
}
