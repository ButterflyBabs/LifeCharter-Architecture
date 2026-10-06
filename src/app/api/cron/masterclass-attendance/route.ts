import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { incubatorMeetingId, isZoomConfigured, listMasterclassPastInstances, listPastParticipants, masterclassMeetingId, meetingSchedule } from "@/lib/zoom";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { enrollPending, scheduledSession, tagSession, type FollowEvent } from "@/lib/masterclass/followUp";

export const dynamic = "force-dynamic";

/**
 * Twice a day (vercel.json; one run lands on Thursday evening Mountain time): for every MasterClass and Incubator occurrence in the last 14 days, pull Zoom's list of
 * who attended and store one row per person per session in masterclass_attendance (their joins
 * summed). Re-running is safe: rows are upserted. People who joined without an email (phone
 * dial-in, guests) are counted under their name so the show rate stays honest.
 *
 * Then the follow-up (src/lib/masterclass/followUp.ts): each scheduled session's registrants are
 * tagged attended or no-show in Contacts, and, once Babs has released that session's replay, the
 * replay and follow-up campaigns start for anyone not yet started.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isZoomConfigured()) return NextResponse.json({ error: "Zoom not configured" }, { status: 500 });

  const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const events: { key: FollowEvent; meetingId: string }[] = [
    { key: "masterclass", meetingId: masterclassMeetingId() },
    { key: "incubator", meetingId: incubatorMeetingId() },
  ];
  const cutoff = Date.now() - 14 * 86400_000;
  const summary: { event: string; session: string; attendees: number }[] = [];
  const followUp: unknown[] = [];
  let checked = 0;
  const housePlan = await ownerMasterPlanId().catch(() => null);

  for (const ev of events) {
    let instances;
    try {
      instances = await listMasterclassPastInstances(ev.meetingId);
    } catch (err) {
      // MasterClass: most likely the Zoom app is missing the past-meeting scopes. Incubator: Zoom
      // answers with an error until its first session has run, which is not a failure.
      if (ev.key === "masterclass") {
        console.error("[masterclass-attendance] instances:", err);
        return NextResponse.json({ error: "Zoom past-meeting lookup failed", detail: String(err) }, { status: 502 });
      }
      continue;
    }
    const recent = instances.filter((i) => new Date(i.startTime).getTime() >= cutoff);
    checked += recent.length;

    for (const inst of recent) {
      const sessionDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date(inst.startTime));
      let participants;
      try {
        participants = await listPastParticipants(inst.uuid);
      } catch (err) {
        console.error("[masterclass-attendance] participants", inst.uuid, err);
        continue;
      }
      const byPerson = new Map<string, { name: string; seconds: number; first: string }>();
      for (const p of participants) {
        const key = p.email || `name:${p.name.trim().toLowerCase()}`;
        if (key === "name:") continue;
        const cur = byPerson.get(key) ?? { name: p.name, seconds: 0, first: p.joinTime };
        cur.seconds += p.durationSeconds;
        if (p.joinTime && (!cur.first || p.joinTime < cur.first)) cur.first = p.joinTime;
        byPerson.set(key, cur);
      }
      const rows = Array.from(byPerson.entries()).map(([email, v]) => ({
        session_date: sessionDate,
        email,
        name: v.name || null,
        minutes: Math.round(v.seconds / 60),
        first_joined_at: v.first || null,
        zoom_meeting_uuid: inst.uuid,
        updated_at: new Date().toISOString(),
        event_key: ev.key,
      }));
      if (rows.length) {
        const { error } = await supabase.from("masterclass_attendance").upsert(rows, { onConflict: "session_date,email" });
        if (error) console.error("[masterclass-attendance] upsert:", error.message);
      }
      summary.push({ event: ev.key, session: sessionDate, attendees: rows.length });
    }

    // Follow-up. A failure here never loses the attendance saved above.
    try {
      const schedule = await meetingSchedule(ev.meetingId);
      const seen = new Set<string>();
      for (const inst of recent) {
        const match = scheduledSession(inst.startTime, schedule.occurrences); // null = a test or tech-check start
        if (!housePlan || !match || seen.has(match.occurrence.start)) continue;
        seen.add(match.occurrence.start);
        const tagged = await tagSession(supabase, housePlan, match.occurrence, match.previous, new Date(), ev.key);
        const started = tagged.skipped ? { started: 0 } : await enrollPending(supabase, housePlan, tagged.session, new Date(), ev.key);
        followUp.push({ event: ev.key, ...tagged, ...started });
      }
    } catch (err) {
      console.error("[masterclass-attendance] follow-up:", err);
      followUp.push({ event: ev.key, error: String(err) });
    }
  }

  return NextResponse.json({ checked, summary, followUp });
}
