"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Captions, Check, Film, Loader2, Trash2, Upload, Users } from "lucide-react";
import Recorder from "./Recorder";
import ZoomPanel from "./ZoomPanel";
import { RECORDING_ACCEPT, RECORDING_MAX_BYTES, recordingKind, toSrt, transcriptText, type Utterance } from "@/lib/volantRecording";

type Rec = { id: string; file_name: string; size_bytes: number; status: "uploading" | "transcribing" | "ready" | "failed"; duration_seconds: number | null; error: string | null; speakers: Record<string, string>; used_at: string | null; created_at: string };
type Voice = { speaker: string; sample: string; lines: number };

const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#c9a227] px-3.5 py-1.5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/15 disabled:opacity-50";
const btnGold = "inline-flex items-center gap-1.5 rounded-full bg-[#1a2b4a] dark:bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#F8F5F0] dark:text-[#14203a] hover:opacity-90 disabled:opacity-50";
const small = "inline-flex items-center gap-1 text-xs font-semibold text-[#2E7C83] hover:underline disabled:opacity-50";
const field = "w-full rounded-lg border border-[#d9d2c0] dark:border-[#34405f] bg-white dark:bg-[#141b33] px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] focus:outline-none focus:border-[#c9a227]";
const mins = (s: number | null) => (s ? (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min` : `${Math.max(1, Math.round(s / 60))} min`) : "");
const mb = (b: number) => (b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(1)} GB` : `${Math.max(1, Math.round(b / 1024 ** 2))} MB`);

// Upload a file straight to storage with the signed URL (same request shape as supabase-js uploadToSignedUrl).
function putFile(uploadUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("x-upsert", "false");
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anon) {
      xhr.setRequestHeader("apikey", anon);
      xhr.setRequestHeader("Authorization", `Bearer ${anon}`);
    }
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.status === 413 ? "too-big" : `status ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(form);
  });
}

async function post(body: unknown) {
  const r = await fetch("/api/volant/recording", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, d: await r.json().catch(() => ({})) };
}

// LC Volant recordings: upload audio or video from any device, follow it while it transcribes, name the voices,
// then use the transcript for a report (or download captions). The recording itself is deleted once transcribed.
export default function Recordings({ consent, onUse }: { consent: boolean; onUse: (text: string, recordingId: string, fileName: string) => void }) {
  const [recs, setRecs] = useState<Rec[] | null>(null);
  const [usage, setUsage] = useState<{ hours: number; limit: number } | null>(null);
  const [on, setOn] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [openId, setOpenId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const d = await fetch("/api/volant/recording", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!d) return;
    setRecs(d.recordings ?? []);
    setUsage(d.usage ?? null);
    setOn(d.ready !== false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  // While something is uploading or transcribing, check every 15 seconds.
  const busy = (recs ?? []).some((r) => r.status === "uploading" || r.status === "transcribing");
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [busy, load]);

  async function upload(file: File | undefined, source: "upload" | "browser" = "upload") {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setMsg("");
    if (!consent) return setMsg("Tick the box above to confirm everyone agreed to be recorded, then upload.");
    if (!recordingKind(file.name, file.type)) return setMsg("Upload an audio or video file (for example .mp4, .mov, .mp3, .m4a or .wav).");
    if (file.size > RECORDING_MAX_BYTES) return setMsg("That file is over 2 GB. Upload the audio only (.m4a or .mp3), or a shorter recording.");
    const { ok, d } = await post({ action: "start", name: file.name, size: file.size, type: file.type, consent: true, source });
    if (!ok) return setMsg(d.error || "Couldn't start the upload.");
    setProgress(0);
    await load();
    try {
      await putFile(d.uploadUrl, file, setProgress);
    } catch (e) {
      setProgress(null);
      await post({ action: "delete", id: d.id });
      await load();
      return setMsg(e instanceof Error && e.message === "too-big" ? "That file is bigger than storage currently allows. Upload the audio only (.m4a or .mp3) for now." : "The upload stopped. Check your connection and try again.");
    }
    setProgress(null);
    const s = await post({ action: "uploaded", id: d.id });
    if (!s.ok) setMsg(s.d.error || "The recording couldn't be sent for transcription.");
    else setMsg("Uploaded. It's transcribing now: you can leave this page, and the bell will tell you when it's ready.");
    await load();
  }

  async function remove(id: string) {
    const { ok, d } = await post({ action: "delete", id });
    if (!ok) return setMsg(d.error || "Couldn't delete it.");
    if (openId === id) setOpenId("");
    await load();
  }

  const shown = (recs ?? []).filter((r) => !r.used_at || r.id === openId);

  return (
    <div className="mb-3 rounded-xl border border-dashed border-[#c9a227]/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button className={btn} disabled={progress !== null || !on} onClick={() => fileRef.current?.click()}><Film className="h-4 w-4" />{progress !== null ? `Uploading… ${progress}%` : "Upload a recording (audio or video)"}</button>
        <input ref={fileRef} type="file" accept={RECORDING_ACCEPT} className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
        <span className="text-xs text-[#7a8a99]">
          {on ? <>From Zoom, your phone, a camera or any recorder. Up to 2 GB. The recording is deleted once it&apos;s transcribed.{usage ? ` ${usage.hours} of ${usage.limit} hours used this month.` : ""}</> : "Recording transcription isn't switched on yet. Upload a transcript file or paste the text for now."}
        </span>
      </div>
      {on && <Recorder consent={consent} busy={progress !== null} onDone={(file) => void upload(file, "browser")} setMsg={setMsg} />}
      {progress !== null && <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className="h-full bg-[#2E7C83] transition-all" style={{ width: `${progress}%` }} /></div>}
      {on && <ZoomPanel consent={consent} onImported={() => void load()} setMsg={setMsg} />}
      {msg && <p className="mt-2 text-sm text-[#1F5E63]" role="status">{msg}</p>}

      {shown.length > 0 && (
        <ul className="mt-3 space-y-2">
          {shown.map((r) => (
            <li key={r.id} className="rounded-lg bg-white/60 p-2 dark:bg-[#141b33]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{r.file_name}</p>
                  <p className="text-xs text-[#7a8a99]">
                    {mb(r.size_bytes)}
                    {r.duration_seconds ? ` · ${mins(r.duration_seconds)}` : ""} ·{" "}
                    {r.status === "uploading" ? "Uploading…" : r.status === "transcribing" ? <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Transcribing (a few minutes for an hour of recording)</span> : r.status === "ready" ? <span className="text-[#2E7C83]">Transcribed{r.used_at ? " · used" : ""}</span> : <span className="text-[#8a2f2f]">{r.error || "Couldn't transcribe."}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.status === "ready" && <button className={small} onClick={() => setOpenId(openId === r.id ? "" : r.id)}><Users className="h-3 w-3" />{openId === r.id ? "Close" : "Name the voices and use it"}</button>}
                  <button className={small} onClick={() => void remove(r.id)} aria-label={`Delete ${r.file_name}`}><Trash2 className="h-3 w-3" />Delete</button>
                </div>
              </div>
              {openId === r.id && <Voices id={r.id} fileName={r.file_name} onUse={onUse} setMsg={setMsg} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Voices({ id, fileName, onUse, setMsg }: { id: string; fileName: string; onUse: (text: string, recordingId: string, fileName: string) => void; setMsg: (m: string) => void }) {
  const [utts, setUtts] = useState<Utterance[] | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch(`/api/volant/recording?id=${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.recording) return setMsg("That transcript could not be loaded.");
        setUtts(d.recording.utterances ?? []);
        setVoices(d.recording.voices ?? []);
        setNames(d.recording.speakers ?? {});
      })
      .catch(() => setMsg("That transcript could not be loaded."));
  }, [id, setMsg]);

  async function use() {
    await post({ action: "speakers", id, names });
    onUse(transcriptText(utts ?? [], names), id, fileName);
    setMsg("The transcript is in the box below. Pick a template and write your report.");
  }
  function captions() {
    const blob = new Blob([toSrt(utts ?? [], names)], { type: "application/x-subrip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName.replace(/\.[^.]+$/, "") || "captions"}.srt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  if (!utts) return <p className="mt-2 text-xs text-[#7a8a99]">Loading…</p>;
  return (
    <div className="mt-2 space-y-2 rounded-lg bg-[#c9a227]/10 p-2">
      <p className="text-xs text-[#5a6472] dark:text-[#b8c2cf]">Who is each voice? Their first words are shown to help. Leave a name blank to keep &quot;Speaker A&quot;.</p>
      {voices.map((v) => (
        <div key={v.speaker} className="grid gap-2 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
          <input className={field} value={names[v.speaker] ?? ""} onChange={(e) => setNames({ ...names, [v.speaker]: e.target.value })} maxLength={60} placeholder={`Speaker ${v.speaker}`} aria-label={`Name for speaker ${v.speaker}`} />
          <p className="truncate text-xs italic text-[#5a6472] dark:text-[#b8c2cf]">“{v.sample}” · {v.lines} turn{v.lines === 1 ? "" : "s"}</p>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button className={btnGold} onClick={() => void use()}><Check className="h-4 w-4" />Use this transcript</button>
        <button className={btn} onClick={captions}><Captions className="h-4 w-4" />Download captions (.srt)</button>
        <span className="self-center text-xs text-[#7a8a99]"><Upload className="mr-1 inline h-3 w-3" />Captions work for YouTube, social video and LC Fledge.</span>
      </div>
    </div>
  );
}
