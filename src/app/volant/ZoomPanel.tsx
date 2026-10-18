"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Video } from "lucide-react";

type ZRec = { uuid: string; topic: string; startTime: string; durationMin: number; ready: boolean; hasAudio: boolean; picked: { id: string; status: string } | null };
type Z = { connected: boolean; canConnect: boolean; kind?: "account" | "user"; email?: string; auto: boolean; match: string; recordings?: ZRec[]; error?: string };

const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#c9a227] px-3.5 py-1.5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/15 disabled:opacity-50";
const small = "inline-flex items-center gap-1 text-xs font-semibold text-[#2E7C83] hover:underline disabled:opacity-50";
const field = "w-full rounded-lg border border-[#d9d2c0] dark:border-[#34405f] bg-white dark:bg-[#141b33] px-3 py-1.5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] focus:outline-none focus:border-[#c9a227]";
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

async function post(body: unknown) {
  const r = await fetch("/api/volant/zoom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, d: await r.json().catch(() => ({})) };
}

// Zoom cloud recordings: connect Zoom, transcribe any recent recording with one press, or have new ones picked up
// automatically (every 30 minutes). The recording stays in Zoom; only the transcript comes into the Suite.
export default function ZoomPanel({ consent, onImported, setMsg }: { consent: boolean; onImported: () => void; setMsg: (m: string) => void }) {
  const [z, setZ] = useState<Z | null>(null);
  const [busy, setBusy] = useState("");
  const [all, setAll] = useState(false);
  const [auto, setAuto] = useState(false);
  const [match, setMatch] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/volant/zoom", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!d) return;
    setZ(d);
    setAuto(d.auto === true);
    setMatch(d.match || "");
  }, []);
  useEffect(() => {
    void load();
    const q = new URLSearchParams(window.location.search).get("zoom");
    if (q === "connected") setMsg("Zoom is connected. Your recent cloud recordings are listed below.");
    if (q === "failed") setMsg("Zoom didn't connect. Try Connect Zoom again.");
  }, [load, setMsg]);

  if (!z || (!z.connected && !z.canConnect)) return null;

  async function connect() {
    setBusy("connect");
    const { ok, d } = await post({ action: "connect" });
    if (!ok || !d.url) {
      setBusy("");
      return setMsg(d.error || "Couldn't start connecting Zoom.");
    }
    window.location.href = d.url;
  }
  async function transcribe(r: ZRec) {
    if (!consent) return setMsg("Tick the box above to confirm everyone agreed to be recorded, then press Transcribe.");
    setBusy(r.uuid);
    setMsg("");
    const { ok, d } = await post({ action: "import", uuid: r.uuid });
    setBusy("");
    if (!ok) return setMsg(d.error || "That recording couldn't be sent.");
    setMsg("Transcribing your Zoom recording. The bell will tell you when it's ready.");
    await load();
    onImported();
  }
  async function saveAuto() {
    setBusy("settings");
    const { ok, d } = await post({ action: "settings", auto, match });
    setBusy("");
    setMsg(ok ? (auto ? "Saved. New Zoom recordings will be picked up within 30 minutes of being ready." : "Saved. Zoom recordings won't be picked up automatically.") : d.error || "Couldn't save that.");
  }
  async function disconnect() {
    setBusy("disconnect");
    await post({ action: "disconnect" });
    setBusy("");
    await load();
  }

  return (
    <div className="mt-3 rounded-lg border border-[#2E7C83]/30 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><Video className="h-4 w-4 text-[#2E7C83]" />Zoom cloud recordings</p>
        {z.connected ? (
          <span className="text-xs text-[#7a8a99]">
            {z.kind === "account" ? "Your Zoom account is connected." : `Connected${z.email ? ` as ${z.email}` : ""}.`}{" "}
            {z.kind === "user" && <button className={small} disabled={busy === "disconnect"} onClick={() => void disconnect()}>Disconnect</button>}
          </span>
        ) : (
          <button className={btn} disabled={busy === "connect"} onClick={() => void connect()}>{busy === "connect" ? "Opening Zoom…" : "Connect Zoom"}</button>
        )}
      </div>
      {!z.connected && <p className="mt-1 text-xs text-[#7a8a99]">Connect your Zoom account and your cloud recordings show up here to transcribe with one press, or automatically. They stay in your Zoom; only the transcript comes into the Suite.</p>}

      {z.connected && (
        <>
          {z.error && <p className="mt-1 text-xs text-[#8a2f2f]">{z.error}</p>}
          <div className="mt-2 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
            <label className="flex items-center gap-1.5 text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              Pick up new recordings automatically
            </label>
            <input className={field} value={match} onChange={(e) => setMatch(e.target.value)} maxLength={300} placeholder="Only meetings whose name includes… (optional, e.g. coaching, session)" aria-label="Only meetings whose name includes" />
            <button className={btn} disabled={busy === "settings"} onClick={() => void saveAuto()}>Save</button>
          </div>
          <p className="mt-1 text-xs text-[#7a8a99]">Turn this on only for meetings where everyone agrees to be recorded. Recordings of 3 minutes or more are picked up within 30 minutes of Zoom finishing them, and count toward your monthly hours.</p>

          {(z.recordings ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-[#7a8a99]">No cloud recordings in the last 30 days.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[#1a2b4a]/10">
              {(all ? z.recordings! : z.recordings!.slice(0, 6)).map((r) => (
                <li key={r.uuid} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{r.topic}</p>
                    <p className="text-xs text-[#7a8a99]">{when(r.startTime)} · {r.durationMin} min</p>
                  </div>
                  {r.picked && r.picked.status === "failed" ? (
                    <button className={small} disabled={busy === r.uuid} onClick={() => void transcribe(r)}>{busy === r.uuid ? "Sending…" : "Didn't work: try again"}</button>
                  ) : r.picked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7C83]">{r.picked.status === "transcribing" ? <><Loader2 className="h-3 w-3 animate-spin" />Transcribing</> : r.picked.status === "failed" ? "Couldn't transcribe" : <><Check className="h-3 w-3" />Transcribed</>}</span>
                  ) : !r.ready ? (
                    <span className="text-xs text-[#7a8a99]">Zoom is still processing</span>
                  ) : !r.hasAudio ? (
                    <span className="text-xs text-[#7a8a99]">No sound file</span>
                  ) : (
                    <button className={small} disabled={busy === r.uuid} onClick={() => void transcribe(r)}>{busy === r.uuid ? "Sending…" : "Transcribe"}</button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {(z.recordings ?? []).length > 6 && <button className={`${small} mt-1`} onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${z.recordings!.length}`}</button>}
        </>
      )}
    </div>
  );
}
