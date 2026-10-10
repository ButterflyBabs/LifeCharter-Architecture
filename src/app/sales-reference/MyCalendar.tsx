"use client";

import { useCallback, useEffect, useState } from "react";

// "My calendar" on the Sales Reference page, for a team member who is a booking host (Marcello, in the LCCS
// Sales view): their upcoming booked calls, the calendar connection, and their own hours and time zone.
// Renders nothing for anyone who is not a host.

interface Booking { id: string; startAt: string; endAt: string; name: string | null; email: string | null; status: string; meetingUrl: string | null; calendar: string | null }
interface Conn { id: string; provider: string; email: string | null; check_busy: boolean; add_events: boolean }
interface Data {
  host: { name: string; timezone: string; weekly: Record<string, [string, string][]>; active: boolean } | null;
  connections: Conn[];
  connectUrl: string;
  bookings: Booking[];
}

const DAYS: [string, string][] = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]];
const ZONES = ["Europe/Madrid", "Europe/London", "Europe/Lisbon", "Europe/Paris", "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "Asia/Karachi"];

const fmt = (iso: string, tz: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function MyCalendar() {
  const [d, setD] = useState<Data | null | undefined>(undefined);
  const [tz, setTz] = useState("");
  const [rows, setRows] = useState<Record<string, { on: boolean; from: string; to: string; rest: [string, string][] }>>({});
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/sales/my-calendar", { cache: "no-store" });
      const j = (await r.json()) as Data;
      if (!r.ok || !j.host) return setD(null);
      setD(j);
      setTz(j.host.timezone);
      const next: typeof rows = {};
      for (const [k] of DAYS) {
        const ranges = j.host.weekly?.[k] ?? [];
        next[k] = { on: ranges.length > 0, from: ranges[0]?.[0] ?? "09:00", to: ranges[0]?.[1] ?? "17:00", rest: ranges.slice(1) };
      }
      setRows(next);
    } catch {
      setD(null);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!d || !d.host) return null;

  const save = async () => {
    setSaving(true);
    setMsg("");
    const weekly: Record<string, [string, string][]> = {};
    for (const [k] of DAYS) {
      const r = rows[k];
      if (r?.on && r.from < r.to) weekly[k] = [[r.from, r.to], ...r.rest];
    }
    try {
      const res = await fetch("/api/sales/my-calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "hours", timezone: tz, weekly }) });
      const j = await res.json().catch(() => ({}));
      setMsg(res.ok ? "Saved. New bookings follow these hours." : j.error || "Couldn't save.");
      if (res.ok) void load();
    } finally {
      setSaving(false);
    }
  };

  const connected = d.connections.length > 0;
  const input = "rounded-md border border-[#c9a227]/30 bg-[#141826] px-2 py-1 text-sm text-[#F3EEE4]";

  return (
    <section className="mb-10 rounded-2xl border border-[#c9a227]/40 bg-[#1C2236] p-6" aria-label="My calendar">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">My calendar</p>
      <h2 className="mt-1 text-xl font-semibold text-[#F8F5F0]">Your booked calls and hours</h2>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-[#F3EEE4]">Upcoming calls</h3>
          {d.bookings.length === 0 ? (
            <p className="mt-2 text-sm text-[#b8a898]">No calls booked yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/10 text-sm">
              {d.bookings.map((b) => (
                <li key={b.id} className="py-2">
                  <p className="font-medium text-[#F8F5F0]">{b.name || b.email || "Someone"}{b.calendar ? <span className="font-normal text-[#b8a898]"> · {b.calendar}</span> : null}</p>
                  <p className="text-[#b8a898]">
                    {fmt(b.startAt, d.host!.timezone)} ({d.host!.timezone.split("/").pop()?.replace("_", " ")})
                    {b.meetingUrl ? <> · <a href={b.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-[#E3C27C] underline">Zoom link</a></> : null}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-5 text-sm font-semibold text-[#F3EEE4]">Your calendar connection</h3>
          {connected ? (
            <ul className="mt-2 text-sm text-[#b8a898]">
              {d.connections.map((c) => (
                <li key={c.id}><span className="capitalize">{c.provider}</span> · {c.email || "calendar"}{c.add_events ? " · new calls are added here" : ""}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[#E3C27C]">No calendar connected yet, so bookings can&apos;t see when you&apos;re busy.</p>
          )}
          <a href={d.connectUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#1a2b4a]">
            {connected ? "Add or change a calendar" : "Connect my calendar"}
          </a>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#F3EEE4]">When people can book you</h3>
          <label className="mt-2 block text-sm text-[#b8a898]">
            Your time zone
            <select value={tz} onChange={(e) => setTz(e.target.value)} className={`${input} mt-1 block w-full`}>
              {Array.from(new Set([tz, ...ZONES])).filter(Boolean).map((z) => <option key={z} value={z}>{z.replace("_", " ")}</option>)}
            </select>
          </label>
          <ul className="mt-3 space-y-1.5 text-sm">
            {DAYS.map(([k, label]) => {
              const r = rows[k];
              if (!r) return null;
              return (
                <li key={k} className="flex flex-wrap items-center gap-2">
                  <label className="flex w-28 items-center gap-2 text-[#F3EEE4]">
                    <input type="checkbox" checked={r.on} onChange={(e) => setRows({ ...rows, [k]: { ...r, on: e.target.checked } })} />
                    {label}
                  </label>
                  <input type="time" aria-label={`${label} from`} value={r.from} disabled={!r.on} onChange={(e) => setRows({ ...rows, [k]: { ...r, from: e.target.value } })} className={input} />
                  <span className="text-[#b8a898]">to</span>
                  <input type="time" aria-label={`${label} to`} value={r.to} disabled={!r.on} onChange={(e) => setRows({ ...rows, [k]: { ...r, to: e.target.value } })} className={input} />
                </li>
              );
            })}
          </ul>
          <button onClick={save} disabled={saving} className="mt-4 rounded-full bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#1a2b4a] disabled:opacity-60">
            {saving ? "Saving…" : "Save my hours"}
          </button>
          {msg && <p className="mt-2 text-sm text-[#E3C27C]" role="status">{msg}</p>}
        </div>
      </div>
    </section>
  );
}
