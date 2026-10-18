// LC Volant Phase 2: recordings. Pure helpers (no database or network) for the file rules, the who-said-what
// transcript and the speaker names, so they can be tested. The server side is in volantRecordingServer.ts.

export const RECORDING_BUCKET = "volant-recordings";
export const RECORDING_MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB: about two hours of Zoom video
/** Hours of recordings each account can transcribe a month (the Suite pays the transcription service). */
export const RECORDING_MONTHLY_HOURS = 10;

const EXT: Record<string, string> = {
  mp4: "video", mov: "video", m4v: "video", webm: "video", mkv: "video", avi: "video",
  mp3: "audio", m4a: "audio", wav: "audio", aac: "audio", ogg: "audio", oga: "audio", flac: "audio", wma: "audio", amr: "audio",
};
export const RECORDING_ACCEPT = Object.keys(EXT).map((e) => `.${e}`).join(",") + ",audio/*,video/*";

/** "video" | "audio" for a file we can transcribe, or null. */
export function recordingKind(name: string, type = ""): "video" | "audio" | null {
  const ext = name.includes(".") ? (name.split(".").pop() || "").toLowerCase() : "";
  if (EXT[ext]) return EXT[ext] as "video" | "audio";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return null;
}

export function safeFileBase(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "recording"
  );
}

export function recordingExt(name: string): string {
  const ext = name.includes(".") ? (name.split(".").pop() || "").toLowerCase() : "";
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : "bin";
}

export interface Utterance { speaker: string; start_ms: number; end_ms: number; text: string }

/** Keep only what the transcription service sent that we need, with sane types and lengths. */
export function cleanUtterances(raw: unknown): Utterance[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 20000)
    .map((u) => {
      const r = (u ?? {}) as Record<string, unknown>;
      return {
        speaker: String(r.speaker ?? "A").slice(0, 8) || "A",
        start_ms: Math.max(0, Math.round(Number(r.start) || 0)),
        end_ms: Math.max(0, Math.round(Number(r.end) || 0)),
        text: String(r.text ?? "").trim().slice(0, 20000),
      };
    })
    .filter((u) => u.text);
}

/** The voices in a recording in the order they first speak, with a sample line to recognise each one. */
export function speakersOf(utts: Utterance[]): { speaker: string; sample: string; lines: number }[] {
  const seen = new Map<string, { speaker: string; sample: string; lines: number }>();
  for (const u of utts) {
    const s = seen.get(u.speaker);
    if (s) s.lines += 1;
    else seen.set(u.speaker, { speaker: u.speaker, sample: u.text.slice(0, 140), lines: 1 });
  }
  return Array.from(seen.values());
}

export function cleanSpeakerNames(raw: unknown, utts: Utterance[]): Record<string, string> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const { speaker } of speakersOf(utts)) {
    const n = typeof r[speaker] === "string" ? (r[speaker] as string).trim().slice(0, 60) : "";
    if (n) out[speaker] = n;
  }
  return out;
}

const clock = (ms: number) => {
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
};

/** The name typed for a voice (trimmed), or "Speaker A". */
const voiceName = (speaker: string, names: Record<string, string>) => (names[speaker] || "").trim() || `Speaker ${speaker}`;

/** The transcript as text, one line per turn, using the names the person gave each voice. */
export function transcriptText(utts: Utterance[], names: Record<string, string> = {}, withTimes = false): string {
  return utts.map((u) => `${withTimes ? `[${clock(u.start_ms)}] ` : ""}${voiceName(u.speaker, names)}: ${u.text}`).join("\n");
}

/** A caption file (.srt) from the turns: long turns are split into short timed lines. */
export function toSrt(utts: Utterance[], names: Record<string, string> = {}, withNames = false): string {
  const stamp = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const r = ms % 1000;
    const p = (n: number, w = 2) => String(n).padStart(w, "0");
    return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
  };
  const cues: string[] = [];
  let n = 0;
  for (const u of utts) {
    const words = u.text.split(/\s+/);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += 12) chunks.push(words.slice(i, i + 12).join(" "));
    const span = Math.max(1, u.end_ms - u.start_ms);
    chunks.forEach((c, i) => {
      const a = u.start_ms + Math.round((span * i) / chunks.length);
      const b = u.start_ms + Math.round((span * (i + 1)) / chunks.length);
      const who = withNames && i === 0 ? `${voiceName(u.speaker, names)}: ` : "";
      cues.push(`${++n}\n${stamp(a)} --> ${stamp(b)}\n${who}${c}`);
    });
  }
  return cues.join("\n\n") + "\n";
}
