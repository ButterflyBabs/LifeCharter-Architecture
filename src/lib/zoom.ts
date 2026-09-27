// Zoom Server-to-Server OAuth client, used by the MasterClass registrant
// sync cron. Account-level app — no per-user consent, one token per call.
//
//   ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET   app credentials
//   ZOOM_MASTERCLASS_MEETING_ID                             defaults below

export const DEFAULT_MASTERCLASS_MEETING_ID = "89905406248";

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
}

// All approved registrants for the recurring MasterClass meeting (register
// once, attend any occurrence — Zoom's default for a fixed-time recurring
// meeting). Paginated defensively even though this list should stay small.
export async function listMasterclassRegistrants(): Promise<ZoomRegistrant[]> {
  const token = await getAccessToken();
  const meetingId = masterclassMeetingId();
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
      registrants?: Array<{ id: string; email: string; first_name?: string; last_name?: string }>;
    };
    for (const r of data.registrants || []) {
      registrants.push({
        id: r.id,
        email: r.email,
        firstName: r.first_name || "",
        lastName: r.last_name || "",
      });
    }
    nextPageToken = data.next_page_token || "";
  } while (nextPageToken);

  return registrants;
}

// ---------- Attendance (past occurrences) ----------
// Needs the Server-to-Server app scopes meeting:read:list_past_instances:admin and
// meeting:read:list_past_participants:admin (added in the Zoom App Marketplace).

export interface ZoomPastInstance {
  uuid: string;
  startTime: string; // ISO
}

/** The occurrences of the recurring MasterClass meeting that have already happened. */
export async function listMasterclassPastInstances(): Promise<ZoomPastInstance[]> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.zoom.us/v2/past_meetings/${encodeURIComponent(masterclassMeetingId())}/instances`, {
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
