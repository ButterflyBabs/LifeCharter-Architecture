import type { SupabaseClient } from "@supabase/supabase-js";
import { incubatorMeetingId, isZoomConfigured, listAccountRecordings, masterclassMeetingId } from "@/lib/zoom";
import { recentVimeoVideos, vimeoCopy } from "@/lib/community/replaySync";

// Finds the Vimeo copy of each recent MasterClass (and Incubator) recording and saves it as that
// session's replay link, so MasterClass Results fills the link in by itself. Finding the link never
// emails anyone: releasing the replay (followUp.ts) is still Babs's button. The link is the Vimeo
// copy, never a direct Zoom link. Safe to run as often as you like; a link already found is kept.

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const dayMT = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date(iso));

export interface ReplayLinkResult {
  ok: boolean;
  error?: string;
  added: { event: string; date: string }[];
  waiting: string[];
}

export async function syncMasterclassReplayLinks(db: SupabaseClient, days = 7): Promise<ReplayLinkResult> {
  const out: ReplayLinkResult = { ok: true, added: [], waiting: [] };
  if (!isZoomConfigured()) return { ...out, ok: false, error: "Zoom isn't connected." };
  const vimeoToken = process.env.VIMEO_ACCESS_TOKEN?.trim().replace(/^bearer\s+/i, "");
  if (!vimeoToken) return { ...out, ok: false, error: "VIMEO_ACCESS_TOKEN isn't set." };

  const rooms = new Map<string, string>();
  try { rooms.set(masterclassMeetingId(), "masterclass"); } catch { /* not configured */ }
  try { rooms.set(incubatorMeetingId(), "incubator"); } catch { /* not configured */ }

  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  let recordings;
  try {
    recordings = await listAccountRecordings(ymd(from), ymd(new Date(to.getTime() + 86_400_000)));
  } catch (e) {
    return { ...out, ok: false, error: String(e instanceof Error ? e.message : e).slice(0, 400) };
  }
  const mine = recordings.filter((r) => rooms.has(r.meetingId) && r.durationMin >= 5);
  if (!mine.length) return out;

  let videos;
  try {
    videos = await recentVimeoVideos(vimeoToken);
  } catch (e) {
    return { ...out, ok: false, error: String(e instanceof Error ? e.message : e).slice(0, 400) };
  }

  for (const r of mine) {
    const event = rooms.get(r.meetingId)!;
    const session = dayMT(r.startTime);
    const label = `${event} ${session}`;
    if (!r.ready) { out.waiting.push(`${label}: still processing in Zoom`); continue; }
    const { data: have } = await db.from("masterclass_replay_links").select("session_date").eq("session_date", session).eq("event_key", event).maybeSingle();
    if (have) continue;
    const video = vimeoCopy(videos, r.topic, new Date(r.startTime).getTime());
    if (!video) { out.waiting.push(`${label}: not in Vimeo yet`); continue; }
    const { error } = await db.from("masterclass_replay_links").insert({ session_date: session, event_key: event, url: video.link });
    if (!error) out.added.push({ event, date: session });
    else if (error.code !== "23505") console.error("[masterclass-replay-links] insert:", error.message);
  }
  return out;
}
