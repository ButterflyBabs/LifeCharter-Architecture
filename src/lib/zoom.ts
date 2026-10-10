// Zoom Server-to-Server OAuth client, used by the MasterClass registrant
// sync cron. Account-level app — no per-user consent, one token per call.
//
//   ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET   app credentials
//   ZOOM_MASTERCLASS_MEETING_ID                             defaults below

export const DEFAULT_MASTERCLASS_MEETING_ID = "89905406248";
// The Nov 12, 2026 LifeCharter Incubator (registration on Zoom; created 2026-09-28).
export const DEFAULT_INCUBATOR_MEETING_ID = "86873557607";
// Founder's Half Hour with Babs: the free weekly public call (Tuesdays, registration on Zoom).
export const DEFAULT_FOUNDERS_HALF_HOUR_MEETING_ID = "85690260050";
export function foundersHalfHourMeetingId(): string {
  return process.env.ZOOM_FOUNDERS_HALF_HOUR_MEETING_ID || DEFAULT_FOUNDERS_HALF_HOUR_MEETING_ID;
}
export function incubatorMeetingId(): string {
  return process.env.ZOOM_INCUBATOR_MEETING_ID || DEFAULT_INCUBATOR_MEETING_ID;
}

export function isZoomConfigured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET
  );
}

export function masterclassMeetingId(): string {
  return process.env.ZOOM_MASTERCLASS_MEETING_ID || DEFAULT_MASTERCLASS_MEETING_ID;
}

async function getAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
  });
  if (!res.ok) {
    throw new Error(`Zoom token request failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface ZoomRegistrant {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  joinUrl: string; // this registrant's own join link
  createTime: string; // ISO, when they registered ("" if Zoom didn't say)
}

// All approved registrants for the recurring MasterClass meeting (register
// once, attend any occurrence — Zoom's default for a fixed-time recurring
// meeting). Paginated defensively even though this list should stay small.
export async function listMasterclassRegistrants(meetingId: string = masterclassMeetingId()): Promise<ZoomRegistrant[]> {
  const token = await getAccessToken();
  const registrants: ZoomRegistrant[] = [];
  let nextPageToken = "";

  do {
    const url = new URL(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}/registrants`);
    url.searchParams.set("status", "approved");
    url.searchParams.set("page_size", "100");
    if (nextPageToken) url.searchParams.set("next_page_token", nextPageToken);

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      throw new Error(`Zoom registrants request failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as {
      next_page_token?: string;
      registrants?: Array<{ id: string; email: string; first_name?: string; last_name?: string; join_url?: string; create_time?: string }>;
    };
    for (const r of data.registrants || []) {
      registrants.push({
        id: r.id,
        email: r.email,
        firstName: r.first_name || "",
        lastName: r.last_name || "",
        joinUrl: r.join_url || "",
        createTime: r.create_time || "",
      });
    }
    nextPageToken = data.next_page_token || "";
  } while (nextPageToken);

  return registrants;
}

// ---------- Occurrences (upcoming sessions) ----------

export interface ZoomOccurrence {
  start: string; // ISO (UTC)
  duration: number; // minutes
}
export interface ZoomSchedule {
  occurrences: ZoomOccurrence[]; // every non-deleted occurrence, oldest first (past ones included)
  next: ZoomOccurrence | null; // the next one that hasn't ended yet
}

// A recurring meeting's occurrences (GET /meetings/{id} → occurrences[], past
// ones included via show_previous_occurrences), or a single meeting's own
// start_time. `next` is the first whose start + duration is still ahead.
export async function meetingSchedule(meetingId: string, now: Date = new Date()): Promise<ZoomSchedule> {
  const token = await getAccessToken();
  const url = new URL(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`);
  url.searchParams.set("show_previous_occurrences", "true");
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Zoom meeting request failed: ${res.status} ${await res.text()}`);
  const m = (await res.json()) as {
    start_time?: string;
    duration?: number;
    occurrences?: Array<{ start_time?: string; duration?: number; status?: string }>;
  };
  const base = m.duration || 60;
  const list: ZoomOccurrence[] = (m.occurrences?.length ? m.occurrences : m.start_time ? [{ start_time: m.start_time, duration: base }] : [])
    .filter((o) => o.start_time && (o.status || "available") !== "deleted")
    .map((o) => ({ start: new Date(o.start_time!).toISOString(), duration: o.duration || base }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const next = list.find((o) => new Date(o.start).getTime() + o.duration * 60_000 > now.getTime()) ?? null;
  return { occurrences: list, next };
}

/** The next occurrence of a meeting that hasn't ended (start + duration > now), or null. */
export async function nextOccurrence(meetingId: string, cache?: Map<string, Promise<ZoomSchedule>>): Promise<ZoomOccurrence | null> {
  return (await cachedSchedule(meetingId, cache)).next;
}

/** meetingSchedule, fetched once per cron run when the caller passes the same Map. */
export function cachedSchedule(meetingId: string, cache?: Map<string, Promise<ZoomSchedule>>): Promise<ZoomSchedule> {
  if (!cache) return meetingSchedule(meetingId);
  let p = cache.get(meetingId);
  if (!p) {
    p = meetingSchedule(meetingId);
    cache.set(meetingId, p);
  }
  return p;
}

// ---------- Attendance (past occurrences) ----------
// Needs the Server-to-Server app scopes meeting:read:list_past_instances:admin and
// meeting:read:list_past_participants:admin (added in the Zoom App Marketplace).

export interface ZoomPastInstance {
  uuid: string;
  startTime: string; // ISO
}

/** The occurrences of the recurring MasterClass meeting that have already happened. */
export async function listMasterclassPastInstances(meetingId: string = masterclassMeetingId()): Promise<ZoomPastInstance[]> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.zoom.us/v2/past_meetings/${encodeURIComponent(meetingId)}/instances`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Zoom past instances request failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { meetings?: Array<{ uuid: string; start_time: string }> };
  return (data.meetings || []).map((m) => ({ uuid: m.uuid, startTime: m.start_time }));
}

export interface ZoomParticipant {
  email: string;
  name: string;
  joinTime: string;
  durationSeconds: number;
}

/** Everyone who joined one past occurrence (one entry per join; people who rejoin appear more than once). */
export async function listPastParticipants(meetingUuid: string): Promise<ZoomParticipant[]> {
  const token = await getAccessToken();
  // UUIDs that start with "/" or contain "//" must be double-encoded.
  const id = meetingUuid.startsWith("/") || meetingUuid.includes("//") ? encodeURIComponent(encodeURIComponent(meetingUuid)) : encodeURIComponent(meetingUuid);
  const out: ZoomParticipant[] = [];
  let next = "";
  do {
    const url = new URL(`https://api.zoom.us/v2/past_meetings/${id}/participants`);
    url.searchParams.set("page_size", "300");
    if (next) url.searchParams.set("next_page_token", next);
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Zoom participants request failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as {
      next_page_token?: string;
      participants?: Array<{ user_email?: string; name?: string; join_time?: string; duration?: number }>;
    };
    for (const p of data.participants || []) {
      out.push({ email: (p.user_email || "").toLowerCase(), name: p.name || "", joinTime: p.join_time || "", durationSeconds: p.duration || 0 });
    }
    next = data.next_page_token || "";
  } while (next);
  return out;
}

// ── Booking-link meetings ────────────────────────────────────────────────────
// Needs the app's meeting:write:admin (or meeting:write:meeting:admin) scope.
// The token response lists the granted scopes, so the Calendars screen can say
// plainly when the scope is missing instead of failing a real booking.

export async function zoomScopes(): Promise<string> {
  if (!isZoomConfigured()) return "";
  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const basic = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
  });
  if (!res.ok) return "";
  const data = (await res.json()) as { scope?: string };
  return data.scope || "";
}

export async function canCreateZoomMeetings(): Promise<boolean> {
  const s = await zoomScopes();
  return /meeting:write(:admin|:meeting:admin|:meeting)?\b/.test(s) || s.includes("meeting:write");
}

// Creates a scheduled meeting hosted by `hostEmail` (a user on the Zoom
// account). Returns the join link and meeting id, or null if Zoom said no.
export async function createZoomMeeting(o: { hostEmail: string; topic: string; startISO: string; durationMin: number; timezone: string; agenda?: string }): Promise<{ id: string; joinUrl: string } | null> {
  if (!isZoomConfigured()) return null;
  const token = await getAccessToken();
  const res = await fetch(`https://api.zoom.us/v2/users/${encodeURIComponent(o.hostEmail)}/meetings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: o.topic.slice(0, 200),
      type: 2,
      start_time: o.startISO.replace(/\.\d{3}Z$/, "Z"),
      duration: o.durationMin,
      timezone: o.timezone,
      agenda: (o.agenda || "").slice(0, 1900),
      settings: { join_before_host: false, waiting_room: true, meeting_authentication: false },
    }),
  });
  if (!res.ok) {
    console.error("zoom create meeting:", res.status, await res.text().catch(() => ""));
    return null;
  }
  const m = (await res.json()) as { id: number; join_url: string };
  return { id: String(m.id), joinUrl: m.join_url };
}

export async function deleteZoomMeeting(id: string): Promise<void> {
  if (!isZoomConfigured() || !id) return;
  const token = await getAccessToken();
  await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
}

// Cloud recordings across the account in a date range (UTC days, at most a month).
// Needs the Server-to-Server app scope cloud_recording:read:list_account_recordings:admin
// (shown as recording:read:admin on older apps).
export interface ZoomRecording {
  meetingId: string;
  uuid: string;
  topic: string;
  startTime: string; // ISO
  durationMin: number;
  shareUrl: string; // viewer link with the viewing passcode built in
  ready: boolean; // every file has finished processing
}

export async function listAccountRecordings(fromYmd: string, toYmd: string): Promise<ZoomRecording[]> {
  const token = await getAccessToken();
  const out: ZoomRecording[] = [];
  let next = "";
  do {
    const url = new URL("https://api.zoom.us/v2/accounts/me/recordings");
    url.searchParams.set("from", fromYmd);
    url.searchParams.set("to", toYmd);
    url.searchParams.set("page_size", "300");
    if (next) url.searchParams.set("next_page_token", next);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Zoom recordings request failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as {
      next_page_token?: string;
      meetings?: Array<{ id: number | string; uuid: string; topic?: string; start_time: string; duration?: number; share_url?: string; recording_play_passcode?: string; recording_files?: Array<{ status?: string }> }>;
    };
    for (const m of data.meetings || []) {
      if (!m.share_url) continue;
      const pwd = m.recording_play_passcode ? `${m.share_url.includes("?") ? "&" : "?"}pwd=${encodeURIComponent(m.recording_play_passcode)}` : "";
      out.push({
        meetingId: String(m.id),
        uuid: m.uuid,
        topic: m.topic || "",
        startTime: m.start_time,
        durationMin: Number(m.duration) || 0,
        shareUrl: m.share_url + pwd,
        ready: (m.recording_files || []).length > 0 && (m.recording_files || []).every((f) => !f.status || f.status === "completed"),
      });
    }
    next = data.next_page_token || "";
  } while (next);
  return out;
}

// Registers someone for the (register-once) MasterClass meeting, exactly as if they had filled in Zoom's own
// form: Zoom emails them their confirmation and personal join link. Zoom returns the same registrant when the
// email is already registered. Needs the app scope meeting:write:registrant:admin.
export async function addMeetingRegistrant(meetingId: string, r: { email: string; firstName: string; lastName: string }): Promise<{ id: string; joinUrl: string }> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}/registrants`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: r.email, first_name: r.firstName, last_name: r.lastName || "-" }),
  });
  if (!res.ok) throw new Error(`Zoom add registrant failed: ${res.status} ${await res.text()}`);
  const d = (await res.json()) as { registrant_id?: string; id?: string; join_url?: string };
  return { id: d.registrant_id || d.id || "", joinUrl: d.join_url || "" };
}

// ---------- Diagnostics (owner-only /api/zoom-check) ----------

type Probe = { call: string; status: number | "error"; detail: string };

/**
 * What the Suite's Zoom app can actually see, probed meeting by meeting (the account-wide user list needs a
 * scope the app does not have). For each id: the meeting itself, its past instances, and the participant report.
 */
export async function zoomDiagnostics(ids: string[]): Promise<{ configured: boolean; probes: Probe[]; meetings: { id: string; topic: string; type: number | null; hostEmail: string; pastInstances: number | null }[] }> {
  const probes: Probe[] = [];
  const meetings: { id: string; topic: string; type: number | null; hostEmail: string; pastInstances: number | null }[] = [];
  if (!isZoomConfigured()) return { configured: false, probes, meetings };
  let token: string;
  try {
    token = await getAccessToken();
    probes.push({ call: "token", status: 200, detail: "ok" });
  } catch (e) {
    probes.push({ call: "token", status: "error", detail: String(e).slice(0, 200) });
    return { configured: true, probes, meetings };
  }
  const get = async (call: string, url: string) => {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      probes.push({ call, status: res.status, detail: res.ok ? "ok" : String((body as { message?: string }).message || "").slice(0, 160) });
      return res.ok ? (body as Record<string, unknown>) : null;
    } catch (e) {
      probes.push({ call, status: "error", detail: String(e).slice(0, 200) });
      return null;
    }
  };
  for (const id of ids.slice(0, 12)) {
    const m = await get(`GET /meetings/${id}`, `https://api.zoom.us/v2/meetings/${id}`);
    const past = m ? await get(`GET /past_meetings/${id}/instances`, `https://api.zoom.us/v2/past_meetings/${id}/instances`) : null;
    const inst = ((past?.meetings as { uuid: string }[]) || []);
    if (inst.length) await get(`GET /past_meetings/<latest>/participants`, `https://api.zoom.us/v2/past_meetings/${encodeURIComponent(encodeURIComponent(inst[inst.length - 1].uuid))}/participants?page_size=5`);
    meetings.push({
      id,
      topic: String(m?.topic ?? ""),
      type: typeof m?.type === "number" ? (m.type as number) : null,
      hostEmail: String(m?.host_email ?? ""),
      pastInstances: past ? inst.length : null,
    });
  }
  return { configured: true, probes, meetings };
}

// ---------- Past sessions and who attended (coaching calls, Founder's Half Hour) ----------

export interface PastInstance {
  uuid: string;
  start: string; // ISO
}
export interface Attendee {
  email: string;
  name: string;
  minutes: number; // total across every time they joined
}

/** The sessions a meeting (or recurring meeting) has already held. */
export async function listPastInstances(meetingId: string): Promise<PastInstance[]> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.zoom.us/v2/past_meetings/${encodeURIComponent(meetingId)}/instances`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Zoom instances request failed: ${res.status}`);
  const data = (await res.json()) as { meetings?: { uuid: string; start_time: string }[] };
  return (data.meetings ?? []).map((m) => ({ uuid: m.uuid, start: m.start_time }));
}

/** Everyone who joined one past session, merged by email, with the total minutes they were there. Anyone without an email is skipped. */
export async function listPastAttendees(uuid: string): Promise<Attendee[]> {
  const token = await getAccessToken();
  const byEmail = new Map<string, Attendee>();
  let next = "";
  do {
    const url = new URL(`https://api.zoom.us/v2/past_meetings/${encodeURIComponent(encodeURIComponent(uuid))}/participants`);
    url.searchParams.set("page_size", "300");
    if (next) url.searchParams.set("next_page_token", next);
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Zoom participants request failed: ${res.status}`);
    const data = (await res.json()) as { next_page_token?: string; participants?: { name?: string; user_email?: string; duration?: number }[] };
    for (const p of data.participants ?? []) {
      const email = (p.user_email || "").trim().toLowerCase();
      if (!email) continue;
      const cur = byEmail.get(email);
      const mins = Math.round((p.duration ?? 0) / 60);
      if (cur) cur.minutes += mins;
      else byEmail.set(email, { email, name: (p.name || "").trim(), minutes: mins });
    }
    next = data.next_page_token || "";
  } while (next);
  return Array.from(byEmail.values());
}

/** A meeting's name as set in Zoom, without the "· LifeCharter Command Suite" brand suffix. */
export async function meetingTopic(meetingId: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return "";
  const m = (await res.json()) as { topic?: string };
  return (m.topic || "").split("·")[0].trim();
}
