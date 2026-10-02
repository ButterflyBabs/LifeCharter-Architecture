import type { SupabaseClient } from "@supabase/supabase-js";
import { isZoomConfigured, listAccountRecordings } from "@/lib/zoom";
import { sessionsBetween } from "@/lib/community/events";

// Finds the Zoom cloud recording of each recent Collective session and attaches it as
// that session's replay (Events → Past & replays). A session is matched by its Zoom
// room (the meeting number in the event's join link) and its start time, so calls that
// share a room (the Tuesday Dimension Calls) each get their own. A replay someone added
// by hand is never replaced. Safe to run as often as you like.

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const meetingIdOf = (joinUrl: string | null) => joinUrl?.match(/zoom\.us\/(?:j|w|s)\/(\d{9,12})/)?.[1] ?? null;

export interface ReplaySyncResult {
  ok: boolean;
  error?: string;
  recordings: number;
  added: { event: string; date: string }[];
  waiting: string[]; // recordings Zoom is still processing
  unmatched: string[]; // recordings with no Collective session at that time
}

export async function syncCollectiveReplays(db: SupabaseClient, days = 7): Promise<ReplaySyncResult> {
  const out: ReplaySyncResult = { ok: true, recordings: 0, added: [], waiting: [], unmatched: [] };
  if (!isZoomConfigured()) return { ...out, ok: false, error: "Zoom isn't connected." };

  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  let recordings;
  try {
    recordings = await listAccountRecordings(ymd(from), ymd(new Date(to.getTime() + 86_400_000)));
  } catch (e) {
    // Most likely the Zoom app is missing permission to read cloud recordings.
    return { ...out, ok: false, error: String(e instanceof Error ? e.message : e).slice(0, 400) };
  }
  out.recordings = recordings.length;
  if (!recordings.length) return out;

  const sessions = (await sessionsBetween(db, new Date(from.getTime() - 86_400_000), to)).filter((s) => meetingIdOf(s.event.join_url));

  for (const r of recordings) {
    const label = `${r.topic} (${r.startTime.slice(0, 10)})`;
    if (r.durationMin < 5) continue; // a test or a false start
    if (!r.ready) {
      out.waiting.push(label);
      continue;
    }
    const began = new Date(r.startTime).getTime();
    // The session in that Zoom room closest to when recording began (hosts open early or run late).
    const match = sessions
      .filter((s) => meetingIdOf(s.event.join_url) === r.meetingId && Math.abs(s.start.getTime() - began) < 3 * 3_600_000)
      .sort((a, b) => Math.abs(a.start.getTime() - began) - Math.abs(b.start.getTime() - began))[0];
    if (!match) {
      out.unmatched.push(label);
      continue;
    }
    const { data: existing } = await db.from("cm_event_replays").select("id").eq("event_id", match.event.id).eq("occurs_on", match.date).maybeSingle();
    if (existing) continue;
    const { error } = await db.from("cm_event_replays").insert({ event_id: match.event.id, occurs_on: match.date, url: r.shareUrl, notes: "Added automatically from the Zoom recording." });
    if (!error) out.added.push({ event: match.event.title, date: match.date });
    else if (error.code !== "23505") console.error("[collective-replays] insert:", error.message);
  }
  return out;
}
