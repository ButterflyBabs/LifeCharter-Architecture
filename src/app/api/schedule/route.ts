import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import type { ScheduleEvent } from "@/lib/google";

export const dynamic = "force-dynamic";

type MergedEvent = ScheduleEvent & { account: string };

// Today's events merged across every connected calendar (Google + Microsoft 365).
export async function GET() {
  const [gToken, mToken] = await Promise.all([
    google.getValidAccessToken(),
    microsoft.getValidAccessToken(),
  ]);

  const events: MergedEvent[] = [];
  let connected = false;

  if (gToken) {
    connected = true;
    try {
      const g = await google.fetchTodayEvents(gToken);
      events.push(...g.map((e) => ({ ...e, account: "Gmail" })));
    } catch (e) {
      console.error("schedule google:", e);
    }
  }
  if (mToken) {
    connected = true;
    const mEmail = (await microsoft.connectedEmail()) ?? "Microsoft 365";
    try {
      const m = await microsoft.fetchTodayEvents(mToken);
      events.push(...m.map((e) => ({ ...e, account: mEmail })));
    } catch (e) {
      console.error("schedule microsoft:", e);
    }
  }

  events.sort((a, b) => {
    const ta = a.start ? new Date(a.start).getTime() : Infinity;
    const tb = b.start ? new Date(b.start).getTime() : Infinity;
    return ta - tb;
  });

  return NextResponse.json({ connected, events });
}
