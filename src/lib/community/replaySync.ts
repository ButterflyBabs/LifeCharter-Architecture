import type { SupabaseClient } from "@supabase/supabase-js";
import { isZoomConfigured, listAccountRecordings } from "@/lib/zoom";
import { sessionsBetween } from "@/lib/community/events";

// Attaches each recent Collective session's recording as its replay (Events → Past &
// replays). Zoom tells us which session a recording belongs to: its room (the meeting
// number in the event's join link) and start time, so calls that share a room (the
// Tuesday Dimension Calls) each get their own. The link members get is the VIMEO copy
// (Zoom recordings import into Vimeo on their own), never a direct Zoom link (Babs,
// 2026-10-02). Until the Vimeo copy exists the session simply waits. A replay someone
// added by hand is never replaced. Safe to run as often as you like.

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const meetingIdOf = (joinUrl: string | null) => joinUrl?.match(/zoom\.us\/(?:j|w|s)\/(\d{9,12})/)?.[1] ?? null;

interface VimeoVideo { uri: string; name: string; created_time: string; link: string; status: string }

// The account's newest Vimeo videos (the Zoom imports among them).
async function recentVimeoVideos(token: string): Promise<VimeoVideo[]> {
  const res = await fetch("https://api.vimeo.com/me/videos?per_page=100&sort=date&direction=desc&fields=uri,name,created_time,link,status", {
    headers: { Authorization: `bearer ${token}`, Accept: "application/vnd.vimeo.*+json;version=3.4" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Vimeo videos request failed: ${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return (((await res.json()) as { data?: VimeoVideo[] }).data ?? []).filter((v) => v.status === "available");
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// The Vimeo copy of one Zoom recording: imported after the call began (within two days)
// and named after the meeting. The closest in time wins.
function vimeoCopy(videos: VimeoVideo[], topic: string, beganMs: number): VimeoVideo | undefined {
  const t = words(topic);
  return videos
    .filter((v) => {
      const made = new Date(v.created_time).getTime();
      const n = words(v.name);
      return made >= beganMs && made - beganMs < 48 * 3_600_000 && t.length > 3 && (n.includes(t) || t.includes(n));
    })
    .sort((a, b) => new Date(a.created_time).getTime() - new Date(b.created_time).getTime())[0];
}

export interface ReplaySyncResult {
  ok: boolean;
  error?: string;
  recordings: number;
  added: { event: string; date: string }[];
  waiting: string[]; // still processing in Zoom, or not in Vimeo yet
  unmatched: string[]; // recordings with no Collective session at that time
}

export async function syncCollectiveReplays(db: SupabaseClient, days = 7): Promise<ReplaySyncResult> {
  const out: ReplaySyncResult = { ok: true, recordings: 0, added: [], waiting: [], unmatched: [] };
  if (!isZoomConfigured()) return { ...out, ok: false, error: "Zoom isn't connected." };
  const vimeoToken = process.env.VIMEO_ACCESS_TOKEN?.trim().replace(/^bearer\s+/i, "");
  if (!vimeoToken) return { ...out, ok: false, error: "Vimeo isn't connected (VIMEO_ACCESS_TOKEN isn't set), so no replays were attached." };

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

  let videos: VimeoVideo[];
  try {
    videos = await recentVimeoVideos(vimeoToken);
  } catch (e) {
    return { ...out, ok: false, error: String(e instanceof Error ? e.message : e).slice(0, 400) };
  }

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
    const video = vimeoCopy(videos, r.topic, began);
    if (!video) {
      out.waiting.push(`${label}: not in Vimeo yet`);
      continue;
    }
    const { error } = await db.from("cm_event_replays").insert({ event_id: match.event.id, occurs_on: match.date, url: video.link, notes: "Added automatically from the recording." });
    if (!error) out.added.push({ event: match.event.title, date: match.date });
    else if (error.code !== "23505") console.error("[collective-replays] insert:", error.message);
  }
  return out;
}
