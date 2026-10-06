import { createServerClient } from "@/lib/supabase/server";
import { upsertContact, logEvent } from "@/lib/crm";
import { enrolContact } from "@/lib/sequences/engine";
import { advanceCards, type AutoStageKey } from "@/lib/dmPipeline";
import { ownerMasterPlanId } from "@/lib/housePlan";
import type { ZoomOccurrence } from "@/lib/zoom";

type Db = ReturnType<typeof createServerClient>;

// What happens after each Command Shift MasterClass (Babs approved 2026-10-05):
//   1. Attendance comes in from Zoom → every registrant for that session is tagged
//      masterclass-attended or masterclass-no-show in Contacts (once, via the ledger).
//   2. Babs releases the replay (pastes the Vimeo link on MasterClass Results) → the link goes
//      into the campaign buttons, attendees start "MasterClass replay: attended", no-shows start
//      "MasterClass replay: missed it", and everyone starts the follow-up series.
//   3. Anyone who books an Executive Consultation stops receiving the follow-up series.
// Nobody is emailed before step 2, so a replay email can never go out without its link.

export const SEQ_ATTENDED = "masterclass-replay-attended";
export const SEQ_MISSED = "masterclass-replay-missed";
export const SEQ_FOLLOW_UP = "masterclass-follow-up";
// No-shows get their own series once it exists and is switched on; until then they share the one above.
export const SEQ_FOLLOW_UP_MISSED = "masterclass-follow-up-missed";
export const TAG_ATTENDED = "masterclass-attended";
export const TAG_NO_SHOW = "masterclass-no-show";
// Sessions before this one are never tagged or emailed after the fact.
const FOLLOW_UP_FROM = "2026-10-08";
// A real replay link, not the stand-in the drafts were written with.
const STAND_IN = /REPLACE-WITH-REPLAY-LINK/i;
// People whose attendance arrives after the release still get the replay, inside this window (the replay stays up 72 hours).
const LATE_ENROLL_MS = 48 * 3600_000;
const CONSULT_SLUG = "executive-consultation";

// The LifeCharter Incubator (monthly, from Nov 12, 2026) runs on the same machinery with its own
// campaigns, tags and pipeline stages. Its series stops on the tag lifecharter-program-enrolled
// (the campaigns' own "Skip anyone tagged" rule), not on a consultation booking.
export type FollowEvent = "masterclass" | "incubator";
export const isFollowEvent = (v: unknown): v is FollowEvent => v === "masterclass" || v === "incubator";
interface EventCfg {
  title: string;
  prefix: string; // session tags: <prefix>-oct-8-attended
  from: string; // sessions before this day are never tagged or emailed
  seqAttended: string;
  seqMissed: string;
  seqFollowUp: string;
  seqFollowUpMissed: string;
  tagAttended: string;
  tagNoShow: string;
  stage: { registered: AutoStageKey; attended: AutoStageKey; noShow: AutoStageKey };
}
const EVENTS: Record<FollowEvent, EventCfg> = {
  masterclass: { title: "Command Shift MasterClass", prefix: "lcmc", from: FOLLOW_UP_FROM, seqAttended: SEQ_ATTENDED, seqMissed: SEQ_MISSED, seqFollowUp: SEQ_FOLLOW_UP, seqFollowUpMissed: SEQ_FOLLOW_UP_MISSED, tagAttended: TAG_ATTENDED, tagNoShow: TAG_NO_SHOW, stage: { registered: "registered", attended: "attended", noShow: "no_show" } },
  incubator: { title: "LifeCharter Incubator", prefix: "lci", from: "2026-11-12", seqAttended: "incubator-replay-attended", seqMissed: "incubator-replay-missed", seqFollowUp: "incubator-follow-up", seqFollowUpMissed: "incubator-follow-up-missed", tagAttended: "incubator-attended", tagNoShow: "incubator-no-show", stage: { registered: "lci_registered", attended: "lci_attended", noShow: "lci_no_show" } },
};
export const eventStage = (event: FollowEvent, what: "registered" | "attended" | "noShow") => EVENTS[event].stage[what];

// Each session gets its own tags, e.g. lcmc-oct-8-registered, lcmc-oct-8-attended, lcmc-oct-8-no-show
// (matching the invite tag lcmc-oct-8-invite), next to the general masterclass-... ones.
export const sessionTag = (startIso: string, what: "registered" | "attended" | "no-show", event: FollowEvent = "masterclass") => {
  const d = new Date(startIso);
  const mon = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", month: "short" }).format(d).toLowerCase();
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", day: "numeric" }).format(d);
  return `${EVENTS[event].prefix}-${mon}-${day}-${what}`;
};

export const isReplayUrl = (v: unknown): v is string => typeof v === "string" && /^https:\/\/\S+$/i.test(v.trim()) && !STAND_IN.test(v) && v.trim().length <= 600;
const dayMT = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date(iso));
const longDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

// The scheduled session a Zoom past instance belongs to, or null when the meeting was only
// opened for a test or a tech check (which must never produce no-shows).
export function scheduledSession(instanceStart: string, occurrences: ZoomOccurrence[]): { occurrence: ZoomOccurrence; previous: ZoomOccurrence | null } | null {
  const t = new Date(instanceStart).getTime();
  const sorted = [...occurrences].sort((a, b) => a.start.localeCompare(b.start));
  const i = sorted.findIndex((o) => Math.abs(new Date(o.start).getTime() - t) <= 90 * 60_000);
  return i < 0 ? null : { occurrence: sorted[i], previous: i > 0 ? sorted[i - 1] : null };
}

// Step 1. Tags everyone for one finished session. Safe to re-run: the ledger row is the claim.
export async function tagSession(db: Db, housePlan: string, occ: ZoomOccurrence, previous: ZoomOccurrence | null, now = new Date(), event: FollowEvent = "masterclass"): Promise<{ session: string; attended: number; noShows: number; skipped?: string }> {
  const cfg = EVENTS[event];
  const session = dayMT(occ.start);
  const start = new Date(occ.start).getTime();
  const end = start + occ.duration * 60_000;
  if (session < cfg.from) return { session, attended: 0, noShows: 0, skipped: "before follow-up began" };
  if (now.getTime() < end + 45 * 60_000) return { session, attended: 0, noShows: 0, skipped: "session not over yet" };

  const prevStart = previous ? new Date(previous.start).getTime() : 0;
  const [{ data: att }, { data: regs }, { data: ledger }] = await Promise.all([
    db.from("masterclass_attendance").select("email, name, minutes").eq("session_date", session).eq("event_key", event),
    db.from("zoom_registrant_syncs").select("email, registered_at, synced_at").eq("event_key", event),
    db.from("masterclass_followups").select("email, outcome, enrolled_at").eq("session_date", session).eq("event_key", event),
  ]);
  // Registered for this session = signed up after the previous one started, up to the end of this one.
  const everRegistered = new Set<string>();
  const registered = new Set<string>();
  for (const r of (regs ?? []) as { email: string; registered_at: string | null; synced_at: string | null }[]) {
    const e = r.email.trim().toLowerCase();
    everRegistered.add(e);
    const t = new Date(r.registered_at || r.synced_at || 0).getTime();
    if (t >= prevStart && t <= end) registered.add(e);
  }
  // Nobody at all in Zoom's report means the report isn't in yet (or the session didn't run): tag no one.
  if (!(att ?? []).length) return { session, attended: 0, noShows: 0, skipped: "no attendance from Zoom yet" };
  // Only registrants count as attendees, so the host and the team in the room are never tagged or emailed.
  const came = new Map<string, string | null>();
  for (const a of (att ?? []) as { email: string; name: string | null; minutes: number }[]) {
    const e = (a.email || "").trim().toLowerCase();
    if (everRegistered.has(e) && a.minutes >= 1) came.set(e, a.name);
  }

  const known = new Map(((ledger ?? []) as { email: string; outcome: string; enrolled_at: string | null }[]).map((l) => [l.email, l]));
  const want = new Map<string, "attended" | "no_show">();
  for (const e of Array.from(came.keys())) want.set(e, "attended");
  for (const e of Array.from(registered)) if (!want.has(e)) want.set(e, "no_show");

  let attended = 0;
  let noShows = 0;
  for (const [email, outcome] of Array.from(want.entries())) {
    const prior = known.get(email);
    // Late Zoom data can turn a no-show into an attendee, but only before they were emailed.
    const upgrade = prior && prior.outcome === "no_show" && outcome === "attended" && !prior.enrolled_at;
    if (prior && !upgrade) continue;
    const [first, ...rest] = (came.get(email) || "").trim().split(/\s+/);
    const contact = await upsertContact({ masterPlanId: housePlan, email, firstName: first || null, lastName: rest.join(" ") || null, source: `zoom:${event}`, tags: [outcome === "attended" ? cfg.tagAttended : cfg.tagNoShow, sessionTag(occ.start, outcome === "attended" ? "attended" : "no-show", event)] }, db).catch(() => null);
    if (!contact) continue;
    const row = { session_date: session, email, outcome, contact_id: contact.id, tagged_at: now.toISOString(), event_key: event };
    const { error } = upgrade
      ? await db.from("masterclass_followups").update({ outcome, tagged_at: row.tagged_at }).eq("session_date", session).eq("email", email)
      : await db.from("masterclass_followups").insert(row);
    if (error) continue; // another run has it
    await logEvent(housePlan, contact.id, "tag", outcome === "attended" ? `Attended the ${cfg.title} (${longDay(session)})` : `Registered for the ${cfg.title} (${longDay(session)}) and did not attend`, { session, outcome }, db).catch(() => {});
    // Their card on the MasterClass Pipeline moves to Attended or No-show by itself.
    await advanceCards(db, housePlan, { contactId: contact.id, email }, outcome === "attended" ? cfg.stage.attended : cfg.stage.noShow).catch((e) => console.error("[masterclass-follow-up] card move:", e));
    if (outcome === "attended") attended++;
    else noShows++;
  }
  return { session, attended, noShows };
}

// Step 2b. Starts the campaigns for everyone tagged and not yet started. Does nothing until the
// replay for that session has been released, and stops picking up latecomers after 48 hours.
export async function enrollPending(db: Db, housePlan: string, session: string, now = new Date(), event: FollowEvent = "masterclass"): Promise<{ started: number; note?: string }> {
  const cfg = EVENTS[event];
  const { data: rel } = await db.from("masterclass_replays").select("replay_url, released_at").eq("session_date", session).eq("event_key", event).maybeSingle();
  if (!rel || !isReplayUrl(rel.replay_url)) return { started: 0, note: "replay not released" };
  if (now.getTime() - new Date(rel.released_at as string).getTime() > LATE_ENROLL_MS) return { started: 0, note: "release window closed" };
  const { data: rows } = await db.from("masterclass_followups").select("email, outcome").eq("session_date", session).eq("event_key", event).is("enrolled_at", null);
  const { data: missedSeries } = await db.from("sequences").select("active").eq("master_plan_id", housePlan).eq("key", cfg.seqFollowUpMissed).maybeSingle();
  const missedLive = missedSeries?.active === true;
  let started = 0;
  for (const r of (rows ?? []) as { email: string; outcome: string }[]) {
    // Claim first, so two runs can never start the same person twice.
    const { data: claim } = await db.from("masterclass_followups").update({ enrolled_at: now.toISOString() }).eq("session_date", session).eq("email", r.email).is("enrolled_at", null).select("email");
    if (!claim?.length) continue;
    const base = { masterPlanId: housePlan, email: r.email, source: event, sourceRef: session };
    await enrolContact({ ...base, sequenceKey: r.outcome === "attended" ? cfg.seqAttended : cfg.seqMissed }).catch((e) => console.error("[masterclass-follow-up] replay enrol:", e));
    await enrolContact({ ...base, sequenceKey: r.outcome !== "attended" && missedLive ? cfg.seqFollowUpMissed : cfg.seqFollowUp }).catch((e) => console.error("[masterclass-follow-up] series enrol:", e));
    started++;
  }
  return { started };
}

// Step 2a. Babs releases the replay for a session: the link goes into every "replay" button (and
// any place the old link sat in the wording), then the campaigns start.
export async function releaseReplay(db: Db, housePlan: string, session: string, url: string, event: FollowEvent = "masterclass"): Promise<{ ok: true; started: number } | { ok: false; error: string }> {
  const cfg = EVENTS[event];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(session)) return { ok: false, error: "Pick a session." };
  if (!isReplayUrl(url)) return { ok: false, error: "Paste the full Vimeo link, starting with https://" };
  const link = url.trim();
  const { data: seqs } = await db.from("sequences").select("id, key, active").eq("master_plan_id", housePlan).in("key", [cfg.seqAttended, cfg.seqMissed, cfg.seqFollowUp]);
  const list = (seqs ?? []) as { id: string; key: string; active: boolean }[];
  if (list.length < 3 || list.some((s) => !s.active)) return { ok: false, error: `The three ${event === "incubator" ? "Incubator (LCI)" : "MasterClass"} campaigns (both replay emails and the attended follow-up series) need to be on in Campaigns & Broadcasts first.` };
  // The no-show series, when there is one, carries the replay link too.
  const { data: extra } = await db.from("sequences").select("id").eq("master_plan_id", housePlan).eq("key", cfg.seqFollowUpMissed);
  const { data: steps } = await db.from("sequence_steps").select("id, body, button_label, button_url").in("sequence_id", [...list.map((s) => s.id), ...((extra ?? []) as { id: string }[]).map((s) => s.id)]);
  const { data: last } = await db.from("masterclass_replays").select("replay_url").eq("event_key", event).order("released_at", { ascending: false }).limit(1).maybeSingle();
  const olds = ["https://vimeo.com/REPLACE-WITH-REPLAY-LINK", (last?.replay_url as string) || ""].filter((o) => o && o !== link);
  for (const st of (steps ?? []) as { id: string; body: string; button_label: string | null; button_url: string | null }[]) {
    const isReplayButton = /replay/i.test(st.button_label || "") || olds.includes(st.button_url || "");
    let body = st.body;
    for (const o of olds) body = body.split(o).join(link);
    if (!isReplayButton && body === st.body) continue;
    await db.from("sequence_steps").update({ ...(isReplayButton ? { button_url: link } : {}), body, updated_at: new Date().toISOString() }).eq("id", st.id);
  }
  const { error } = await db.from("masterclass_replays").upsert({ session_date: session, replay_url: link, released_at: new Date().toISOString(), event_key: event }, { onConflict: "session_date" });
  if (error) return { ok: false, error: "Couldn't save the replay link." };
  const out = await enrollPending(db, housePlan, session, new Date(), event);
  return { ok: true, started: out.started };
}

// Step 3. Anyone in the follow-up series who has booked an Executive Consultation stops receiving it. That
// includes people who booked in the two weeks before they were added (in the room, from the QR code).
export async function stopBooked(db: Db = createServerClient()): Promise<number> {
  const { data: seqs } = await db.from("sequences").select("id, master_plan_id").in("key", [SEQ_FOLLOW_UP, SEQ_FOLLOW_UP_MISSED]);
  let stopped = 0;
  for (const s of (seqs ?? []) as { id: string; master_plan_id: string }[]) {
    const { data: enrs } = await db.from("sequence_enrollments").select("id, contact_id, enrolled_at").eq("sequence_id", s.id).eq("status", "active").limit(2000);
    const active = (enrs ?? []) as { id: string; contact_id: string; enrolled_at: string }[];
    if (!active.length) continue;
    const { data: cals } = await db.from("booking_calendars").select("id").eq("master_plan_id", s.master_plan_id).ilike("slug", `${CONSULT_SLUG}%`);
    const calIds = ((cals ?? []) as { id: string }[]).map((c) => c.id);
    if (!calIds.length) continue;
    const { data: contacts } = await db.from("seq_contacts").select("id, email").in("id", active.map((e) => e.contact_id));
    const emailOf = new Map(((contacts ?? []) as { id: string; email: string }[]).map((c) => [c.id, c.email.toLowerCase()]));
    const from = (iso: string) => new Date(new Date(iso).getTime() - 14 * 86400_000).toISOString();
    const since = from(active.reduce((m, e) => (e.enrolled_at < m ? e.enrolled_at : m), active[0].enrolled_at));
    const { data: booked } = await db.from("bookings").select("contact_id, invitee_email, created_at").in("calendar_id", calIds).in("status", ["confirmed", "completed"]).gte("created_at", since);
    const rows = (booked ?? []) as { contact_id: string | null; invitee_email: string | null; created_at: string }[];
    for (const e of active) {
      const email = emailOf.get(e.contact_id);
      const hit = rows.some((b) => new Date(b.created_at).getTime() >= new Date(from(e.enrolled_at)).getTime() && (b.contact_id === e.contact_id || (!!email && (b.invitee_email || "").toLowerCase() === email)));
      if (!hit) continue;
      const { data: done } = await db.from("sequence_enrollments").update({ status: "stopped" }).eq("id", e.id).eq("status", "active").select("id");
      if (!done?.length) continue;
      stopped++;
      await logEvent(s.master_plan_id, e.contact_id, "sequence", "Stopped the MasterClass follow-up series: booked an Executive Consultation", { sequence: SEQ_FOLLOW_UP }, db).catch(() => {});
    }
  }
  return stopped;
}

// Anyone who booked an Executive Consultation in the last few days: their pipeline card moves to
// "Consultation booked". Safe to run every few minutes; a card already there (or closed) is left alone.
export async function moveBookedCards(db: Db = createServerClient()): Promise<number> {
  const planId = await ownerMasterPlanId(db);
  if (!planId) return 0;
  const { data: cals } = await db.from("booking_calendars").select("id").eq("master_plan_id", planId).ilike("slug", `${CONSULT_SLUG}%`);
  const calIds = ((cals ?? []) as { id: string }[]).map((c) => c.id);
  if (!calIds.length) return 0;
  const since = new Date(Date.now() - 3 * 86400_000).toISOString();
  const { data: booked } = await db.from("bookings").select("contact_id, invitee_email, deal_id").in("calendar_id", calIds).in("status", ["confirmed", "completed"]).gte("created_at", since);
  let moved = 0;
  for (const b of (booked ?? []) as { contact_id: string | null; invitee_email: string | null; deal_id: string | null }[]) {
    moved += await advanceCards(db, planId, { contactId: b.contact_id, email: b.invitee_email }, "booked", "America/Denver", b.deal_id).catch(() => 0);
  }
  return moved;
}

// For the MasterClass Results page: recent sessions, who is waiting, and whether the replay went out.
export interface ReplaySession {
  event: FollowEvent;
  date: string;
  attended: number;
  noShows: number;
  waiting: number;
  replayUrl: string | null;
  releasedAt: string | null;
}
export async function replaySessions(db: Db = createServerClient()): Promise<ReplaySession[]> {
  const since = new Date(Date.now() - 35 * 86400_000).toISOString().slice(0, 10);
  const [{ data: rows }, { data: rels }] = await Promise.all([
    db.from("masterclass_followups").select("session_date, outcome, enrolled_at, event_key").gte("session_date", since),
    db.from("masterclass_replays").select("session_date, replay_url, released_at, event_key").gte("session_date", since),
  ]);
  const by = new Map<string, ReplaySession>();
  const get = (d: string, e: string) => by.get(d) ?? by.set(d, { event: isFollowEvent(e) ? e : "masterclass", date: d, attended: 0, noShows: 0, waiting: 0, replayUrl: null, releasedAt: null }).get(d)!;
  for (const r of (rows ?? []) as { session_date: string; outcome: string; enrolled_at: string | null; event_key: string }[]) {
    const s = get(r.session_date, r.event_key);
    if (r.outcome === "attended") s.attended++;
    else s.noShows++;
    if (!r.enrolled_at) s.waiting++;
  }
  for (const r of (rels ?? []) as { session_date: string; replay_url: string; released_at: string; event_key: string }[]) Object.assign(get(r.session_date, r.event_key), { replayUrl: r.replay_url, releasedAt: r.released_at });
  return Array.from(by.values()).sort((a, b) => b.date.localeCompare(a.date));
}
