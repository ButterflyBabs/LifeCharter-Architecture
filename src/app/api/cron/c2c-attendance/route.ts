import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/housePlan";
import { isZoomConfigured, listPastInstances, listPastParticipants } from "@/lib/zoom";
import { setBookingOutcome } from "@/lib/booking/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Every 15 minutes: for each Call to Close discovery call that has ended and has no outcome yet, read who joined its own
// Zoom meeting. Each booking has its OWN meeting, so anyone who joined besides the host and the consultant for 5 minutes or
// more is the prospect: Attended. If only the host or consultant were there (or nobody started it) the call is a No-show
// once it is 30 minutes past its end. Zoom errors leave the call alone for the next run. Marking it updates the booking,
// the CRM contact (tag, timeline), the no-show email and the consultant's card, exactly as pressing the button would.
const MIN_MINUTES = 5;
const GRACE_MIN = 30;

async function run() {
  if (!isZoomConfigured()) return { error: "Zoom is not configured." };
  const db = createServerClient();
  const plan = await housePlanId(db);
  if (!plan) return { error: "No house account." };
  const { data: cards } = await db.from("dm_cards").select("discovery_booking_id").eq("master_plan_id", plan).not("discovery_booking_id", "is", null).is("discovery_outcome", null);
  const ids = ((cards ?? []) as { discovery_booking_id: string }[]).map((c) => c.discovery_booking_id);
  if (!ids.length) return { checked: 0, attended: 0, noShow: 0 };
  const now = Date.now();
  const { data: bks } = await db.from("bookings").select("id, end_at, zoom_meeting_id, host_id, invitee_name, invitee_email, status").in("id", ids).eq("status", "confirmed").lt("end_at", new Date(now - 10 * 60_000).toISOString()).gt("end_at", new Date(now - 4 * 86400_000).toISOString());
  const out = { checked: 0, attended: 0, noShow: 0 };
  for (const b of (bks ?? []) as { id: string; end_at: string; zoom_meeting_id: string | null; host_id: string; invitee_name: string; invitee_email: string }[]) {
    out.checked++;
    const { data: host } = await db.from("booking_hosts").select("name, email, zoom_email").eq("id", b.host_id).maybeSingle();
    const hostEmails = [host?.email, host?.zoom_email].filter(Boolean).map((e) => String(e).toLowerCase());
    const hostFirst = String(host?.name || "").split(/\s+/)[0].toLowerCase();
    const pastGrace = now > Date.parse(b.end_at) + GRACE_MIN * 60_000;
    try {
      let instances: { uuid: string }[] = [];
      if (b.zoom_meeting_id) {
        try {
          instances = await listPastInstances(b.zoom_meeting_id);
        } catch (e) {
          if (!/ 404/.test(String((e as Error).message))) throw e; // a real Zoom problem: try again next run
        }
      }
      const minutes = new Map<string, number>();
      for (const inst of instances) {
        for (const p of await listPastParticipants(inst.uuid)) {
          const name = p.name.trim().toLowerCase();
          if (hostEmails.includes(p.email)) continue;
          if (hostFirst && (name === hostFirst || name.startsWith(`${hostFirst} `))) continue; // the consultant, joining as a guest
          const k = p.email || name || "guest";
          minutes.set(k, (minutes.get(k) ?? 0) + Math.round(p.durationSeconds / 60));
        }
      }
      if (Array.from(minutes.values()).some((m) => m >= MIN_MINUTES)) {
        await setBookingOutcome(db, plan, b.id, "completed");
        out.attended++;
      } else if (pastGrace) {
        await setBookingOutcome(db, plan, b.id, "no_show");
        out.noShow++;
      }
    } catch (e) {
      console.error("c2c attendance:", b.id, (e as Error).message);
    }
  }
  return out;
}

async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}
export const GET = handle;
export const POST = handle;
