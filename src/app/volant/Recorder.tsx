"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, X } from "lucide-react";

const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#c9a227] px-3.5 py-1.5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/15 disabled:opacity-50";
const clock = (s: number) => `${Math.floor(s / 3600) ? `${Math.floor(s / 3600)}:` : ""}${String(Math.floor((s % 3600) / 60)).padStart(Math.floor(s / 3600) ? 2 : 1, "0")}:${String(s % 60).padStart(2, "0")}`;

// The best format this browser can record: Opus in WebM (Chrome, Edge, Firefox) or AAC in MP4 (Safari).
function pickType(): { mime: string; ext: string } {
  const tries = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  ];
  for (const t of tries) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t.mime)) return t;
  return { mime: "", ext: "webm" };
}

// Record a conversation right in the Suite: the microphone, and (for an online call in another browser tab) that
// tab's sound too. When you stop, it uploads and transcribes like any recording. Nothing is kept on this device.
export default function Recorder({ consent, busy, onDone, setMsg }: { consent: boolean; busy: boolean; onDone: (f: File) => void; setMsg: (m: string) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "paused">("idle");
  const [secs, setSecs] = useState(0);
  const [withTab, setWithTab] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streams = useRef<MediaStream[]>([]);
  const ctx = useRef<AudioContext | null>(null);
  const discard = useRef(false);
  const supported = typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

  // Count while recording; warn before leaving the page mid-recording.
  useEffect(() => {
    if (state !== "recording") return;
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [state]);
  useEffect(() => {
    if (state === "idle") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state]);
  useEffect(() => () => cleanup(), []);

  function cleanup() {
    streams.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streams.current = [];
    void ctx.current?.close().catch(() => {});
    ctx.current = null;
  }

  async function start() {
    setMsg("");
    if (!consent) return setMsg("Tick the box above to confirm everyone agreed to be recorded, then press Record.");
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streams.current = [mic];
      let stream: MediaStream = mic;
      if (withTab) {
        const tab = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).catch(() => null);
        if (tab && tab.getAudioTracks().length) {
          streams.current.push(tab);
          const ac = new AudioContext();
          ctx.current = ac;
          const out = ac.createMediaStreamDestination();
          ac.createMediaStreamSource(mic).connect(out);
          ac.createMediaStreamSource(new MediaStream(tab.getAudioTracks())).connect(out);
          stream = out.stream;
        } else {
          tab?.getTracks().forEach((t) => t.stop());
          setMsg("No tab sound was shared, so only your microphone is being recorded. To include the call, choose the call's tab and tick Share tab audio.");
        }
      }
      const { mime, ext } = pickType();
      const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined);
      chunks.current = [];
      discard.current = false;
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        cleanup();
        setState("idle");
        if (discard.current || !chunks.current.length) return;
        const blob = new Blob(chunks.current, { type: mime.split(";")[0] || "audio/webm" });
        const stamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).replace(/[/:,]/g, "-");
        onDone(new File([blob], `Recorded in the Suite ${stamp}.${ext}`, { type: blob.type }));
      };
      r.start(1000);
      rec.current = r;
      setSecs(0);
      setState("recording");
    } catch {
      cleanup();
      setMsg("The microphone couldn't be used. Allow microphone access for this site in your browser, then press Record again.");
    }
  }
  function pause() {
    rec.current?.pause();
    setState("paused");
  }
  function resume() {
    rec.current?.resume();
    setState("recording");
  }
  function stop(throwAway = false) {
    discard.current = throwAway;
    rec.current?.stop();
  }

  if (!supported) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {state === "idle" ? (
        <>
          <button className={btn} disabled={busy} onClick={() => void start()}><Mic className="h-4 w-4" />Record now</button>
          <label className="flex items-center gap-1.5 text-xs text-[#5a6472] dark:text-[#b8c2cf]">
            <input type="checkbox" checked={withTab} onChange={(e) => setWithTab(e.target.checked)} />
            Also record an online call in another browser tab (Chrome or Edge)
          </label>
        </>
      ) : (
        <>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${state === "recording" ? "bg-[#A4523C]/10 text-[#8a2f2f]" : "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${state === "recording" ? "animate-pulse bg-[#c0392b]" : "bg-[#7a8a99]"}`} />
            {state === "recording" ? "Recording" : "Paused"} {clock(secs)}
          </span>
          {state === "recording" ? <button className={btn} onClick={pause}><Pause className="h-4 w-4" />Pause</button> : <button className={btn} onClick={resume}><Play className="h-4 w-4" />Resume</button>}
          <button className={btn} onClick={() => stop(false)}><Square className="h-4 w-4" />Stop and transcribe</button>
          <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#8a2f2f] hover:underline" onClick={() => stop(true)}><X className="h-3 w-3" />Discard</button>
          <span className="w-full text-xs text-[#7a8a99]">Keep this page open while you record. Nothing is saved until you press Stop and transcribe.</span>
        </>
      )}
    </div>
  );
}
