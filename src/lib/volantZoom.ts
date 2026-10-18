import { createHmac, timingSafeEqual } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { isHousePlan } from "@/lib/housePlan";
import { isZoomConfigured, zoomAccountToken, zoomScopes } from "@/lib/zoom";
import { submitAudioUrl, transcriptionKey } from "@/lib/volantRecordingServer";
import { RECORDING_BUCKET } from "@/lib/volantRecording";

// LC Volant + Zoom: find an account's Zoom cloud recordings and hand the audio to the transcription service.
//  - The house account (Babs) uses the Suite's own Zoom app (ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET),
//    which already reads the account's cloud recordings.
//  - Every other account connects its own Zoom with "Connect Zoom" (a Zoom sign-in through the Suite's OAuth app,
//    ZOOM_OAUTH_CLIENT_ID / ZOOM_OAUTH_CLIENT_SECRET). Tokens are kept encrypted in Vault (set_zoom_tokens).
// The recording stays in Zoom untouched; the Suite never stores or deletes it, and AssemblyAI's copy is deleted
// once the transcript is saved (as for uploads).

type Db = ReturnType<typeof createServerClient>;
const SITE = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
export const ZOOM_REDIRECT = `${SITE}/api/volant/zoom/callback`;

export const zoomOauthConfigured = () => Boolean(process.env.ZOOM_OAUTH_CLIENT_ID && process.env.ZOOM_OAUTH_CLIENT_SECRET);
const basic = () => Buffer.from(`${process.env.ZOOM_OAUTH_CLIENT_ID}:${process.env.ZOOM_OAUTH_CLIENT_SECRET}`).toString("base64");

// ── Connect (OAuth) ──────────────────────────────────────────────────────────
const stateKey = () => `volant-zoom:${process.env.ZOOM_OAUTH_CLIENT_SECRET || ""}`;
export function oauthState(planId: string): string {
  const ts = Date.now().toString(36);
  const sig = createHmac("sha256", stateKey()).update(`${planId}.${ts}`).digest("hex").slice(0, 32);
  return `${planId}.${ts}.${sig}`;
}
/** The account the state was made for, if it is genuine and under an hour old. */
export function readState(state: string): string | null {
  const [planId, ts, sig] = (state || "").split(".");
  if (!planId || !ts || !sig) return null;
  const want = createHmac("sha256", stateKey()).update(`${planId}.${ts}`).digest("hex").slice(0, 32);
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  if (Date.now() - parseInt(ts, 36) > 3600_000) return null;
  return planId;
}
export function authorizeUrl(planId: string): string {
  const u = new URL("https://zoom.us/oauth/authorize");
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", process.env.ZOOM_OAUTH_CLIENT_ID || "");
  u.searchParams.set("redirect_uri", ZOOM_REDIRECT);
  u.searchParams.set("state", oauthState(planId));
  return u.toString();
}

type Tokens = { access_token: string; refresh_token: string; expires_at: number };

async function tokenRequest(body: string): Promise<Tokens> {
  const res = await fetch("https://zoom.us/oauth/token", { method: "POST", headers: { Authorization: `Basic ${basic()}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
  const d = (await res.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; expires_in?: number; reason?: string };
  if (!res.ok || !d.access_token || !d.refresh_token) throw new Error(`zoom token ${res.status}: ${d.reason || ""}`);
  return { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Date.now() + (d.expires_in || 3600) * 1000 };
}

/** Finish "Connect Zoom": swap the code for tokens, store them encrypted, note whose Zoom it is. */
export async function connectZoom(db: Db, planId: string, code: string): Promise<{ email: string }> {
  const t = await tokenRequest(`grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(ZOOM_REDIRECT)}`);
  const me = await fetch("https://api.zoom.us/v2/users/me", { headers: { Authorization: `Bearer ${t.access_token}` } }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})) as { id?: string; email?: string };
  const { error } = await db.rpc("set_zoom_tokens", { p_plan: planId, p_tokens: JSON.stringify(t) });
  if (error) throw new Error(`store tokens: ${error.message}`);
  await db.from("zoom_connections").update({ zoom_user_id: me.id ?? null, zoom_email: me.email ?? null, connected_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("master_plan_id", planId);
  return { email: me.email || "" };
}

export async function disconnectZoom(db: Db, planId: string): Promise<void> {
  const raw = (await db.rpc("get_zoom_tokens", { p_plan: planId })).data as string | null;
  if (raw && zoomOauthConfigured()) {
    try {
      const t = JSON.parse(raw) as Tokens;
      await fetch("https://zoom.us/oauth/revoke", { method: "POST", headers: { Authorization: `Basic ${basic()}`, "Content-Type": "application/x-www-form-urlencoded" }, body: `token=${encodeURIComponent(t.access_token)}` });
    } catch {
      /* the connection is removed either way */
    }
  }
  await db.rpc("set_zoom_tokens", { p_plan: planId, p_tokens: "" });
}

// ── Access ───────────────────────────────────────────────────────────────────
export type ZoomAccess = { kind: "account" | "user"; token: string; email: string };

/** A working Zoom token for this account, or null when it has no Zoom to read. */
export async function zoomAccess(db: Db, planId: string): Promise<ZoomAccess | null> {
  if (isZoomConfigured() && (await isHousePlan(planId, db))) {
    return { kind: "account", token: await zoomAccountToken(), email: "" };
  }
  if (!zoomOauthConfigured()) return null;
  const raw = (await db.rpc("get_zoom_tokens", { p_plan: planId })).data as string | null;
  if (!raw) return null;
  let t: Tokens;
  try {
    t = JSON.parse(raw) as Tokens;
  } catch {
    return null;
  }
  if (Date.now() > t.expires_at - 120_000) {
    try {
      t = await tokenRequest(`grant_type=refresh_token&refresh_token=${encodeURIComponent(t.refresh_token)}`);
      await db.rpc("set_zoom_tokens", { p_plan: planId, p_tokens: JSON.stringify(t) });
    } catch (e) {
      console.error("zoom refresh:", e instanceof Error ? e.message : e);
      return null; // the person has to connect again
    }
  }
  const { data: c } = await db.from("zoom_connections").select("zoom_email").eq("master_plan_id", planId).maybeSingle();
  return { kind: "user", token: t.access_token, email: (c?.zoom_email as string) || "" };
}

// ── Recordings ───────────────────────────────────────────────────────────────
export interface ZoomCloudRecording {
  uuid: string;
  topic: string;
  startTime: string;
  durationMin: number;
  ready: boolean;
  file: { url: string; size: number; type: string } | null; // the smallest file with the sound (audio-only when there is one)
}

/** Cloud recordings in the last `days` days (newest first). */
export async function listZoomRecordings(access: ZoomAccess, days = 30): Promise<ZoomCloudRecording[]> {
  const to = new Date();
  const from = new Date(Date.now() - days * 86_400_000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const out: ZoomCloudRecording[] = [];
  let next = "";
  do {
    const url = new URL(`https://api.zoom.us/v2/${access.kind === "account" ? "accounts/me" : "users/me"}/recordings`);
    url.searchParams.set("from", ymd(from));
    url.searchParams.set("to", ymd(to));
    url.searchParams.set("page_size", "100");
    if (next) url.searchParams.set("next_page_token", next);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${access.token}` } });
    if (!res.ok) throw new Error(`zoom recordings ${res.status}: ${await res.text().catch(() => "")}`);
    const d = (await res.json()) as {
      next_page_token?: string;
      meetings?: Array<{ uuid: string; topic?: string; start_time: string; duration?: number; recording_files?: Array<{ status?: string; file_type?: string; recording_type?: string; file_size?: number; download_url?: string }> }>;
    };
    for (const m of d.meetings || []) {
      const files = m.recording_files || [];
      const sound = files.filter((f) => f.download_url && (f.file_type === "M4A" || f.file_type === "MP4"));
      const pick = sound.find((f) => f.file_type === "M4A") || sound.sort((a, b) => (a.file_size || 0) - (b.file_size || 0))[0];
      out.push({
        uuid: m.uuid,
        topic: m.topic || "Zoom meeting",
        startTime: m.start_time,
        durationMin: Number(m.duration) || 0,
        ready: files.length > 0 && files.every((f) => !f.status || f.status === "completed"),
        file: pick ? { url: pick.download_url!, size: pick.file_size || 0, type: pick.file_type || "" } : null,
      });
    }
    next = d.next_page_token || "";
  } while (next && out.length < 300);
  return out.sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime));
}

/** Does a meeting's topic match the account's pickup words ("coaching, session")? Blank words match everything. */
export function topicMatches(topic: string, words: string | null | undefined): boolean {
  const list = (words || "").split(/[,\n]/).map((w) => w.trim().toLowerCase()).filter(Boolean);
  if (!list.length) return true;
  const t = topic.toLowerCase();
  return list.some((w) => t.includes(w));
}

export function zoomFileName(r: Pick<ZoomCloudRecording, "topic" | "startTime">): string {
  const d = new Date(r.startTime);
  const day = Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Denver" });
  return `${r.topic}${day ? ` (${day})` : ""}`.slice(0, 200);
}

/**
 * Start transcribing one Zoom recording for an account. Returns the new recording id, or null when it was already
 * picked up. The Zoom download link carries a short-lived token so AssemblyAI can fetch the audio itself.
 */
export async function importZoomRecording(db: Db, planId: string, access: ZoomAccess, r: ZoomCloudRecording, createdBy: string | null): Promise<string | null> {
  if (!r.file || !r.ready) throw new Error("not-ready");
  if (!transcriptionKey()) throw new Error("no-key");
  // A recording that failed before can be tried again: clear the failed attempt first.
  await db.from("volant_recordings").delete().eq("master_plan_id", planId).eq("zoom_uuid", r.uuid).eq("status", "failed");
  const { data: row, error } = await db
    .from("volant_recordings")
    .insert({ master_plan_id: planId, file_name: zoomFileName(r), size_bytes: r.file.size, storage_path: null, status: "transcribing", source: "zoom", zoom_uuid: r.uuid, created_by: createdBy, consent_at: null })
    .select("id")
    .single();
  if (error) {
    if (/duplicate|unique/i.test(error.message)) return null;
    throw new Error(error.message);
  }
  try {
    const audioUrl = await zoomAudioLink(db, planId, row.id as string, r.file, access.token, r.uuid);
    const providerId = await submitAudioUrl(row.id as string, audioUrl.url);
    await db.from("volant_recordings").update({ provider_id: providerId, storage_path: audioUrl.storagePath, updated_at: new Date().toISOString() }).eq("id", row.id);
    return row.id as string;
  } catch (e) {
    let detail = e instanceof Error ? e.message : String(e);
    const denied = /zoom-download (401|403)/.test(detail);
    // Say which permissions the Suite's Zoom app actually has, so a missing one is plain to see.
    if (denied && access.kind === "account") detail += ` | app scopes: ${(await zoomScopes().catch(() => "")) || "(none read)"}`;
    await db
      .from("volant_recordings")
      .update({
        status: "failed",
        error: denied ? "Zoom didn't allow the Suite to download this recording. Reconnect Zoom (or ask support) and try again." : "This Zoom recording couldn't be sent for transcription. Delete it and try again.",
        error_detail: detail.slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    throw e;
  }
}

/** Zoom's webhook signature check (x-zm-signature = v0=HMAC(secret, "v0:{timestamp}:{body}")). */
export function zoomSignatureOk(body: string, ts: string | null, sig: string | null): boolean {
  const secret = process.env.ZOOM_OAUTH_WEBHOOK_SECRET || "";
  if (!secret || !ts || !sig) return false;
  const want = `v0=${createHmac("sha256", secret).update(`v0:${ts}:${body}`).digest("hex")}`;
  return want.length === sig.length && timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}
export const zoomValidationToken = (plain: string) => createHmac("sha256", process.env.ZOOM_OAUTH_WEBHOOK_SECRET || "").update(plain).digest("hex");

/**
 * A link AssemblyAI can fetch the Zoom audio from. Zoom wants the token in an Authorization header (not in the
 * address), so the Suite asks Zoom itself: Zoom normally answers with a redirect to a signed, short-lived file link,
 * which is handed on as it is (nothing passes through the Suite). If Zoom sends the file directly instead, it is
 * copied into the private recordings bucket and a private link to that copy is used (deleted after transcription).
 */
async function zoomAudioLink(db: Db, planId: string, recId: string, file: { url: string; type: string }, token: string, uuid: string): Promise<{ url: string; storagePath: string | null }> {
  // Zoom's own route for downloading through the API: the meeting's recordings with a download pass
  // (download_access_token, valid for hours), which is added to the file's download link.
  const id = uuid.startsWith("/") || uuid.includes("//") ? encodeURIComponent(encodeURIComponent(uuid)) : encodeURIComponent(uuid);
  let target = file.url;
  let headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const meta = await fetch(`https://api.zoom.us/v2/meetings/${id}/recordings?include_fields=download_access_token&ttl=21600`, { headers });
  if (meta.ok) {
    const m = (await meta.json().catch(() => ({}))) as { download_access_token?: string; recording_files?: Array<{ file_type?: string; file_size?: number; download_url?: string }> };
    const files = (m.recording_files || []).filter((f) => f.download_url && (f.file_type === "M4A" || f.file_type === "MP4"));
    const pick = files.find((f) => f.file_type === "M4A") || files.sort((a, b) => (a.file_size || 0) - (b.file_size || 0))[0];
    if (pick?.download_url && m.download_access_token) {
      target = `${pick.download_url}${pick.download_url.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(m.download_access_token)}`;
      headers = {};
    }
  } else {
    console.error("zoom meeting recordings:", meta.status, (await meta.text().catch(() => "")).slice(0, 200));
  }
  const res = await fetch(target, { headers, redirect: "manual" });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    if (!loc) throw new Error(`zoom-download ${res.status} without a location`);
    return { url: new URL(loc, target).toString(), storagePath: null };
  }
  if (!res.ok) throw new Error(`zoom-download ${res.status}${headers.Authorization ? " (header)" : " (download pass)"}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const ext = file.type === "M4A" ? "m4a" : "mp4";
  const path = `${planId}/zoom-${recId}.${ext}`;
  const up = await db.storage.from(RECORDING_BUCKET).upload(path, bytes, { contentType: ext === "m4a" ? "audio/mp4" : "video/mp4", upsert: true });
  if (up.error) throw new Error(`zoom copy to storage: ${up.error.message}`);
  const { data: link, error } = await db.storage.from(RECORDING_BUCKET).createSignedUrl(path, 6 * 3600);
  if (error || !link?.signedUrl) throw new Error(`signed url: ${error?.message || "none"}`);
  return { url: link.signedUrl, storagePath: path };
}
