import { createHmac, timingSafeEqual } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { cleanUtterances, RECORDING_BUCKET } from "@/lib/volantRecording";

// LC Volant recordings, server side: talks to AssemblyAI (the transcription service the Suite pays for, key in
// ASSEMBLYAI_API_KEY on Vercel) and tidies up after it. The recording itself is deleted from our storage and from
// AssemblyAI as soon as the transcript is saved, or when the job fails.

type Db = ReturnType<typeof createServerClient>;
const API = "https://api.assemblyai.com/v2";
const SITE = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

export const transcriptionKey = () => (process.env.ASSEMBLYAI_API_KEY || "").trim();

/** The secret AssemblyAI sends back with the webhook for one recording (derived, so nothing extra to configure). */
export function webhookSecret(recordingId: string): string {
  return createHmac("sha256", `volant-webhook:${transcriptionKey()}`).update(recordingId).digest("hex");
}
export function webhookSecretOk(recordingId: string, got: string | null): boolean {
  if (!got || !transcriptionKey()) return false;
  const want = Buffer.from(webhookSecret(recordingId));
  const have = Buffer.from(got);
  return want.length === have.length && timingSafeEqual(want, have);
}

/** Hand the uploaded file to AssemblyAI through a short-lived private link. Returns its job id. */
export async function submitTranscription(db: Db, rec: { id: string; storage_path: string }): Promise<string> {
  const key = transcriptionKey();
  if (!key) throw new Error("no-key");
  const { data: link, error } = await db.storage.from(RECORDING_BUCKET).createSignedUrl(rec.storage_path, 6 * 3600);
  if (error || !link?.signedUrl) throw new Error(`signed url: ${error?.message || "none"}`);
  const res = await fetch(`${API}/transcript`, {
    method: "POST",
    headers: { authorization: key, "content-type": "application/json" },
    body: JSON.stringify({
      audio_url: link.signedUrl,
      speaker_labels: true,
      language_detection: true,
      webhook_url: `${SITE}/api/volant/webhook?rec=${rec.id}`,
      webhook_auth_header_name: "x-volant-secret",
      webhook_auth_header_value: webhookSecret(rec.id),
    }),
  });
  const d = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok || !d.id) throw new Error(`assemblyai submit ${res.status}: ${d.error || ""}`);
  return d.id;
}

async function removeEverywhere(db: Db, rec: { storage_path: string | null; provider_id: string | null }) {
  if (rec.storage_path) await db.storage.from(RECORDING_BUCKET).remove([rec.storage_path]).catch(() => {});
  const key = transcriptionKey();
  if (rec.provider_id && key) await fetch(`${API}/transcript/${rec.provider_id}`, { method: "DELETE", headers: { authorization: key } }).catch(() => {});
}

/**
 * Check one recording with AssemblyAI and finish it when the transcript is ready (save the turns, delete the
 * recording everywhere) or failed. Safe to call from the webhook and from the page's status check; does nothing
 * for a recording that is not transcribing.
 */
export async function settleRecording(db: Db, id: string): Promise<void> {
  const { data: rec } = await db.from("volant_recordings").select("id, status, provider_id, storage_path").eq("id", id).maybeSingle();
  if (!rec || rec.status !== "transcribing" || !rec.provider_id) return;
  const key = transcriptionKey();
  if (!key) return;
  const res = await fetch(`${API}/transcript/${rec.provider_id}`, { headers: { authorization: key } });
  if (!res.ok) return;
  const d = (await res.json().catch(() => ({}))) as { status?: string; error?: string; utterances?: unknown; text?: string; audio_duration?: number };
  const now = new Date().toISOString();
  if (d.status === "completed") {
    let utterances = cleanUtterances(d.utterances);
    if (!utterances.length && d.text) utterances = [{ speaker: "A", start_ms: 0, end_ms: Math.round((d.audio_duration || 0) * 1000), text: String(d.text).slice(0, 200000) }];
    const { error } = await db
      .from("volant_recordings")
      .update({
        status: utterances.length ? "ready" : "failed",
        error: utterances.length ? null : "No speech was found in this recording.",
        utterances,
        duration_seconds: Math.round(d.audio_duration || 0),
        storage_path: null,
        updated_at: now,
      })
      .eq("id", rec.id)
      .eq("status", "transcribing");
    if (!error) await removeEverywhere(db, rec);
  } else if (d.status === "error") {
    await db
      .from("volant_recordings")
      .update({ status: "failed", error: friendlyError(d.error), storage_path: null, updated_at: now })
      .eq("id", rec.id)
      .eq("status", "transcribing");
    await removeEverywhere(db, rec);
  }
}

function friendlyError(e: string | undefined): string {
  const m = (e || "").toLowerCase();
  if (/no spoken audio|no speech|silence/.test(m)) return "No speech was found in this recording.";
  if (/unsupported|format|codec|could not|decode/.test(m)) return "This file's format couldn't be read. Try exporting it as .mp4 or .mp3.";
  if (/duration|too long|too short/.test(m)) return "This recording is too long or too short to transcribe.";
  return "The transcription didn't work. Delete it and try uploading again.";
}

/** Delete a recording row and anything left of the file (used by the page's Delete). */
export async function deleteRecording(db: Db, planId: string, id: string): Promise<boolean> {
  const { data: rec } = await db.from("volant_recordings").select("id, storage_path, provider_id").eq("id", id).eq("master_plan_id", planId).maybeSingle();
  if (!rec) return false;
  await removeEverywhere(db, rec);
  const { error } = await db.from("volant_recordings").delete().eq("id", rec.id).eq("master_plan_id", planId);
  return !error;
}

/** Seconds of recordings this account has transcribed (or is transcribing) this calendar month. */
export async function secondsThisMonth(db: Db, planId: string): Promise<{ seconds: number; pending: number }> {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { data } = await db.from("volant_recordings").select("status, duration_seconds").eq("master_plan_id", planId).gte("created_at", start.toISOString());
  let seconds = 0;
  let pending = 0;
  for (const r of data ?? []) {
    if (r.status === "ready") seconds += Number(r.duration_seconds) || 0;
    if (r.status === "transcribing" || r.status === "uploading") pending += 1;
  }
  return { seconds, pending };
}
