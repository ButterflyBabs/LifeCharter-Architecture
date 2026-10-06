"use client";

import { useEffect, useState } from "react";

interface Session {
  event?: "masterclass" | "incubator";
  date: string;
  attended: number;
  noShows: number;
  waiting: number;
  replayUrl: string | null;
  releasedAt: string | null;
}

const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/Denver", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// After each MasterClass: paste the Vimeo link once and the replay and follow-up emails start.
export default function ReplayRelease() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [url, setUrl] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/masterclass/replay", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

  const send = async (date: string, event: string) => {
    setBusy(date);
    setNote((n) => ({ ...n, [date]: "" }));
    const res = await fetch("/api/masterclass/replay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionDate: date, url: url[date] || "", event }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setBusy("");
    setConfirm("");
    if (!res?.ok) return setNote((n) => ({ ...n, [date]: d.error || "Couldn't send. Try again." }));
    setSessions(d.sessions ?? []);
    setNote((n) => ({ ...n, [date]: `Sent. ${d.started} ${d.started === 1 ? "person" : "people"} started.` }));
  };

  return (
    <section className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
      <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Replay and follow-up</h2>
      <p className="mt-1 max-w-3xl text-sm text-[#5b5f73] dark:text-[#b8a898]">
        After a MasterClass or an Incubator, everyone is tagged attended or no-show in Contacts. Paste the Vimeo replay link here and press Send: attendees get the thank-you replay email, no-shows get the &ldquo;we missed you&rdquo; one, and everyone starts the follow-up series. Nothing is emailed until you press Send. Anyone who books an Executive Consultation stops receiving the series.
      </p>
      {sessions === null ? (
        <p className="mt-4 text-sm text-[#7b6b8d]">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="mt-4 text-sm text-[#7b6b8d] dark:text-[#b8a898]">No session is ready yet. Attendance arrives from Zoom the evening of each MasterClass or Incubator and again the next morning.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {sessions.map((s) => {
            const total = s.attended + s.noShows;
            return (
              <li key={s.date} className="rounded-xl border border-[#1a2b4a]/10 p-4 dark:border-white/10">
                <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.event === "incubator" ? "LifeCharter Incubator" : "MasterClass"} · {day(s.date)}</p>
                <p className="text-sm text-[#5b5f73] dark:text-[#b8a898]">
                  {s.attended} attended · {s.noShows} registered and did not come
                  {s.releasedAt ? ` · replay sent ${when(s.releasedAt)} MT` : ""}
                  {s.releasedAt && s.waiting ? ` · ${s.waiting} still to start` : ""}
                </p>
                {s.releasedAt ? (
                  <p className="mt-1 break-all text-xs text-[#7b6b8d] dark:text-[#b8a898]">{s.replayUrl}</p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`replay-${s.date}`}>Vimeo replay link for {day(s.date)}</label>
                    <input id={`replay-${s.date}`} type="url" inputMode="url" placeholder="https://vimeo.com/…" value={url[s.date] || ""} onChange={(e) => { setUrl({ ...url, [s.date]: e.target.value }); setConfirm(""); }} className="min-w-0 flex-1 rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]" />
                    {confirm === s.date ? (
                      <>
                        <button onClick={() => send(s.date, s.event || "masterclass")} disabled={busy === s.date} className="rounded-lg bg-[#8a2f2f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy === s.date ? "Sending…" : `Yes, email ${total} ${total === 1 ? "person" : "people"}`}</button>
                        <button onClick={() => setConfirm("")} className="rounded-lg border border-[#1a2b4a]/20 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirm(s.date)} disabled={!(url[s.date] || "").trim() || total === 0} className="rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Send the replay emails</button>
                    )}
                  </div>
                )}
                {note[s.date] && <p role="status" className="mt-2 text-sm text-[#2E7C83]">{note[s.date]}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
