import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import type { ScheduleEvent } from "@/lib/google";
import { createServerClient } from "@/lib/supabase/server";
import { resolveAiAccount } from "@/lib/ai/config";
import { openMailboxes } from "@/lib/mailboxes";

export const dynamic = "force-dynamic";

type MergedEvent = ScheduleEvent & { account: string };

// Today's events merged across every connected calendar (Google + Microsoft 365).
export async function GET(request: Request) {
  // Anchor "today" and displayed times to the viewer's timezone. Priority:
  // their saved Settings choice (profiles.timezone), then the auto-detected
  // tz the client sends (?tz=), then UTC.
  const queryTz = new URL(request.url).searchParams.get("tz") || "";
  let timeZone = queryTz || "UTC";
  try {
    const { profileId, canEdit } = await resolveAiAccount();
    if (profileId && canEdit) {
      const { data: prof } = await createServerClient().from("profiles").select("timezone, timezone_chosen").eq("id", profileId).maybeSingle();
      const profileTz = prof?.timezone_chosen ? (prof?.timezone as string | null)?.trim() : "";
      if (profileTz) timeZone = profileTz;
    }
  } catch {
    /* fall back to the query tz */
  }

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
