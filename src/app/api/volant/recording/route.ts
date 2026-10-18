import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { volantAccount } from "@/lib/volantServer";
import {
  cleanSpeakerNames, cleanUtterances, RECORDING_BUCKET, RECORDING_MAX_BYTES, RECORDING_MONTHLY_HOURS, recordingExt, recordingKind, safeFileBase, speakersOf,
} from "@/lib/volantRecording";
import { deleteRecording, secondsThisMonth, settleRecording, submitTranscription, transcriptionKey } from "@/lib/volantRecordingServer";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// LC Volant recordings (audio and video from any device).
//   GET                -> { recordings (newest 20, without the transcript), usage }   (checks any still transcribing)
//   GET ?id=           -> { recording (with the who-said-what turns) }
//   POST { action }    -> start {name, size, type, consent} -> { id, uploadUrl }   (the browser uploads straight to storage)
//                         uploaded {id}                      -> hands it to the transcription service
//                         speakers {id, names}               -> the person's names for each voice
//                         delete {id}
const LIST = "id, file_name, size_bytes, status, duration_seconds, error, speakers, used_at, created_at, updated_at";
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function GET(request: Request) {
  const a = await volantAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    await settleRecording(db, id).catch(() => {});
    const { data } = await db.from("volant_recordings").select(`${LIST}, utterances`).eq("id", id).eq("master_plan_id", a.planId).maybeSingle();
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    const utts = cleanUtterances(data.utterances);
    return NextResponse.json({ recording: { ...data, utterances: utts, voices: speakersOf(utts) } });
  }
  // Anything still transcribing for more than a minute gets checked here too, in case a webhook was missed.
  const { data: waiting } = await db.from("volant_recordings").select("id, updated_at").eq("master_plan_id", a.planId).eq("status", "transcribing").limit(5);
  for (const w of waiting ?? []) if (Date.now() - Date.parse(w.updated_at as string) > 60_000) await settleRecording(db, w.id as string).catch(() => {});
  const [{ data }, usage] = await Promise.all([
    db.from("volant_recordings").select(LIST).eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(20),
    secondsThisMonth(db, a.planId),
  ]);
  return NextResponse.json(
    { recordings: data ?? [], usage: { hours: Math.round((usage.seconds / 3600) * 10) / 10, limit: RECORDING_MONTHLY_HOURS }, ready: Boolean(transcriptionKey()) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const a = await volantAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = str(b.action, 20);
  const db = createServerClient();
  const now = new Date().toISOString();

  if (action === "start") {
    if (!transcriptionKey()) return NextResponse.json({ error: "Recording transcription isn't switched on yet. For now, upload a transcript file or paste the text." }, { status: 503 });
    if (b.consent !== true) return NextResponse.json({ error: "Tick the box to confirm everyone agreed to be recorded." }, { status: 400 });
    const name = str(b.name, 200) || "recording";
    const size = Number(b.size);
    if (!recordingKind(name, str(b.type, 100))) return NextResponse.json({ error: "Upload an audio or video file (for example .mp4, .mov, .mp3, .m4a or .wav)." }, { status: 400 });
    if (!Number.isFinite(size) || size <= 0) return NextResponse.json({ error: "That file looks empty." }, { status: 400 });
    if (size > RECORDING_MAX_BYTES) return NextResponse.json({ error: "That file is over 2 GB. Upload the audio only (.m4a or .mp3), or a shorter recording." }, { status: 400 });
    const usage = await secondsThisMonth(db, a.planId);
    if (usage.seconds >= RECORDING_MONTHLY_HOURS * 3600) return NextResponse.json({ error: `You've transcribed ${RECORDING_MONTHLY_HOURS} hours of recordings this month, the monthly limit. You can still upload transcript files.` }, { status: 429 });
    if (usage.pending >= 3) return NextResponse.json({ error: "Three recordings are already uploading or transcribing. Wait for one to finish." }, { status: 429 });

    const path = `${a.planId}/${randomUUID()}-${safeFileBase(name)}.${recordingExt(name)}`;
    const { data: up, error } = await db.storage.from(RECORDING_BUCKET).createSignedUploadUrl(path);
    if (error || !up?.signedUrl) {
      console.error("POST /api/volant/recording start:", error?.message);
      return NextResponse.json({ error: "Couldn't start the upload. Try again." }, { status: 500 });
    }
    const who = await sessionUser().catch(() => null);
    const { data: row, error: insErr } = await db
      .from("volant_recordings")
      .insert({ master_plan_id: a.planId, file_name: name, size_bytes: Math.round(size), storage_path: path, status: "uploading", consent_at: now, created_by: who?.id ?? null })
      .select("id")
      .single();
    if (insErr || !row) return NextResponse.json({ error: "Couldn't start the upload. Try again." }, { status: 500 });
    return NextResponse.json({ id: row.id, uploadUrl: up.signedUrl });
  }

  const id = str(b.id, 60);
  const { data: rec } = await db.from("volant_recordings").select("id, status, storage_path, utterances").eq("id", id).eq("master_plan_id", a.planId).maybeSingle();
  if (!rec) return NextResponse.json({ error: "That recording could not be found." }, { status: 404 });

  if (action === "uploaded") {
    if (rec.status !== "uploading" || !rec.storage_path) return NextResponse.json({ ok: true });
    try {
      const providerId = await submitTranscription(db, { id: rec.id as string, storage_path: rec.storage_path as string });
      await db.from("volant_recordings").update({ status: "transcribing", provider_id: providerId, updated_at: now }).eq("id", rec.id);
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("POST /api/volant/recording uploaded:", e instanceof Error ? e.message : e);
      await db.storage.from(RECORDING_BUCKET).remove([rec.storage_path as string]).catch(() => {});
      await db.from("volant_recordings").update({ status: "failed", error: "The recording couldn't be sent for transcription. Delete it and try again.", storage_path: null, updated_at: now }).eq("id", rec.id);
      return NextResponse.json({ error: "The recording couldn't be sent for transcription. Try again." }, { status: 502 });
    }
  }

  if (action === "speakers") {
    const names = cleanSpeakerNames(b.names, cleanUtterances(rec.utterances));
    const { error } = await db.from("volant_recordings").update({ speakers: names, updated_at: now }).eq("id", rec.id);
    return error ? NextResponse.json({ error: "Couldn't save the names." }, { status: 500 }) : NextResponse.json({ ok: true, speakers: names });
  }

  if (action === "delete") {
    return (await deleteRecording(db, a.planId, rec.id as string)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Couldn't delete it." }, { status: 500 });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
