// Loading events as sessions: one-off events plus every session of a
// recurring series that falls in the requested window.
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any>;
import { occurrences, type Occurrence } from "./recurrence";
import type { CommunityEvent, EventReplay } from "./types";

export type Session = Occurrence<CommunityEvent>;

export const replayKey = (eventId: string, date: string) => `${eventId}|${date}`;

// Per-session replays for these events, keyed by replayKey(event, date).
// RLS only returns rows for events the member can see.
export async function replaysFor(supabase: Db, eventIds: string[]): Promise<Record<string, EventReplay>> {
  if (!eventIds.length) return {};
  const { data } = await supabase.from("cm_event_replays").select("*").in("event_id", eventIds).limit(2000);
  const out: Record<string, EventReplay> = {};
  for (const r of (data as EventReplay[]) ?? []) out[replayKey(r.event_id, r.occurs_on)] = r;
  return out;
}

export async function sessionsBetween(supabase: Db, from: Date, to: Date, spaceId?: string): Promise<Session[]> {
  // One-offs that start in (or just before) the window or are still running
  // in it (multi-day events), plus any series that began before it ends.
  let q = supabase
    .from("cm_events")
    .select("*")
    .is("deleted_at", null)
    .lt("starts_at", to.toISOString())
    .or(`recur_freq.not.is.null,starts_at.gte.${new Date(from.getTime() - 2 * 86_400_000).toISOString()},ends_at.gt.${from.toISOString()}`)
    .limit(500);
  if (spaceId) q = q.contains("space_ids", [spaceId]);
  const { data } = await q;
  const today = from.toISOString().slice(0, 10);
  const out: Session[] = [];
  for (const e of (data as CommunityEvent[]) ?? []) {
    if (e.recur_freq && e.recur_until && e.recur_until < today) continue;
    out.push(...occurrences(e, from, to));
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Upcoming, one entry per event: a series shows once, at its next session.
export async function upcomingEvents(supabase: Db, opts: { spaceId?: string; days?: number; limit?: number } = {}): Promise<Session[]> {
  const now = new Date();
  const from = new Date(now.getTime() - 2 * 3600_000);
  const to = new Date(now.getTime() + (opts.days ?? 400) * 86_400_000);
  const all = await sessionsBetween(supabase, from, to, opts.spaceId);
  const seen = new Set<string>();
  const out: Session[] = [];
  for (const s of all) {
    if (s.end.getTime() < now.getTime() - 2 * 3600_000 || seen.has(s.event.id)) continue;
    seen.add(s.event.id);
    out.push(s);
    if (opts.limit && out.length >= opts.limit) break;
  }
  return out;
}
