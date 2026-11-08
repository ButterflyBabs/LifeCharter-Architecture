"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { hm } from "@/lib/timeTracking";
import { shiftMinutes, type ShiftStatus } from "@/lib/workLog";

type Item = { minutes: number | null; projectId: string | null };
type Shift = { id: string; personEmail: string; personName: string; clockIn: string; clockOut: string | null; status: ShiftStatus; items: Item[] };
type Data = { me: { reviewer: boolean }; shifts: Shift[]; projects: { id: string; name: string }[]; team?: { name: string; email: string; tracksHours?: boolean; active?: boolean }[] };

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898] mb-1";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]";
const NO_PROJECT = "none";
const UNLISTED = "unlisted";

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
/** Sunday 00:00 (local) of the week containing d. Team weeks run Sunday to Saturday. */
const sundayStart = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
};
const monthStart = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const shortDay = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const mins = (s: Shift) => shiftMinutes({ clock_in: s.clockIn, clock_out: s.clockOut });
const get = (from: Date, to: Date) =>
  fetch(`/api/work-log?from=${from.toISOString()}&to=${to.toISOString()}`, { cache: "no-store" })
    .then((r) => r.json() as Promise<Data>)
    .catch(() => null);

/**
 * The owner's hours summary at the top of Work Log: the month's running total (with arrows for other months), last week's hours
 * (the Sunday to Saturday week just ended), hours waiting for review, and each person's hours on each project.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ReviewSummary({ refreshKey, renderShift }: { refreshKey: string; renderShift?: (s: any) => ReactNode }) {
  const [open, setOpen] = useState<string | null>(null);
  const [month, setMonth] = useState(() => monthStart());
  const [m, setM] = useState<Data | null>(null);
  const [w, setW] = useState<Data | null>(null);
  const thisSunday = useMemo(() => sundayStart(), []);
  const lastSunday = useMemo(() => addDays(thisSunday, -7), [thisSunday]);

  useEffect(() => {
    let live = true;
    void get(month, new Date(month.getFullYear(), month.getMonth() + 1, 1)).then((j) => live && setM(j));
    return () => {
      live = false;
    };
  }, [month, refreshKey]);
  useEffect(() => {
    let live = true;
    void get(lastSunday, thisSunday).then((j) => live && setW(j));
    return () => {
      live = false;
    };
  }, [lastSunday, thisSunday, refreshKey]);

  const v = useMemo(() => {
    if (!m?.me?.reviewer) return null;
    const lo = month.getTime();
    const hi = new Date(month.getFullYear(), month.getMonth() + 1, 1).getTime();
    const wlo = lastSunday.getTime();
    const whi = thisSunday.getTime();
    const names = new Map<string, string>();
    const skip = new Set<string>();
    for (const t of [...(m.team ?? []), ...(w?.team ?? [])]) {
      names.set(t.email.toLowerCase(), t.name);
      if (t.tracksHours === false) skip.add(t.email.toLowerCase());
    }
    type Row = { email: string; name: string; month: number; lastWeek: number; waiting: number; waitingShifts: number; projects: Record<string, number>; logged: number };
    const rows = new Map<string, Row>();
    const row = (s: Shift) => {
      const k = s.personEmail.toLowerCase();
      return rows.get(k) ?? rows.set(k, { email: k, name: names.get(k) || s.personName, month: 0, lastWeek: 0, waiting: 0, waitingShifts: 0, projects: {}, logged: 0 }).get(k)!;
    };
    const seen = new Set<string>();
    for (const s of m.shifts) {
      const t = Date.parse(s.clockIn);
      if (skip.has(s.personEmail.toLowerCase()) || t < lo || t >= hi) continue;
      seen.add(s.id);
      const r = row(s);
      r.month += mins(s);
      for (const i of s.items) {
        if (!i.minutes) continue;
        r.logged += i.minutes;
        const p = i.projectId || NO_PROJECT;
        r.projects[p] = (r.projects[p] ?? 0) + i.minutes;
      }
    }
    // Last week and waiting come from the second request (waiting is every submitted day, whatever its date).
    for (const s of w?.shifts ?? []) {
      if (skip.has(s.personEmail.toLowerCase())) continue;
      const t = Date.parse(s.clockIn);
      if (t >= wlo && t < whi) row(s).lastWeek += mins(s);
      if (s.status === "submitted") {
        const r = row(s);
        r.waiting += mins(s);
        r.waitingShifts += 1;
      }
    }
    // The month's running total, week by week (Sunday to Saturday), across the team.
    const weeks: { from: Date; mins: number }[] = [];
    for (let d = sundayStart(month); d.getTime() < hi; d = addDays(d, 7)) weeks.push({ from: d, mins: 0 });
    for (const s of m.shifts) {
      const t = Date.parse(s.clockIn);
      if (!seen.has(s.id)) continue;
      const wk = weeks.find((x) => t >= x.from.getTime() && t < addDays(x.from, 7).getTime());
      if (wk) wk.mins += mins(s);
    }
    // People who track hours show even with none yet; anyone else shows only if they have hours.
    for (const t of m.team ?? []) {
      const k = t.email.toLowerCase();
      if (t.tracksHours !== false && !rows.has(k)) rows.set(k, { email: k, name: t.name, month: 0, lastWeek: 0, waiting: 0, waitingShifts: 0, projects: {}, logged: 0 });
    }
    const tracked = new Set((m.team ?? []).filter((t) => t.tracksHours !== false).map((t) => t.email.toLowerCase()));
    for (const [k, r] of Array.from(rows.entries())) if (!tracked.has(k) && !r.month && !r.lastWeek && !r.waiting) rows.delete(k);
    const list = Array.from(rows.values()).sort((a, b) => b.month - a.month || a.name.localeCompare(b.name));
    const sum = (f: (r: Row) => number) => list.reduce((n, r) => n + f(r), 0);
    // One card per active team member (people who track hours first), even with no hours, so each can be opened.
    const blank = (k: string, name: string): Row => ({ email: k, name, month: 0, lastWeek: 0, waiting: 0, waitingShifts: 0, projects: {}, logged: 0 });
    const cards = (m.team ?? [])
      .filter((t) => t.active !== false)
      .map((t) => ({ tracks: t.tracksHours !== false, row: rows.get(t.email.toLowerCase()) ?? blank(t.email.toLowerCase(), t.name) }))
      .sort((a, b) => Number(b.tracks) - Number(a.tracks) || a.row.name.localeCompare(b.row.name));
    const shifts = m.shifts.filter((s) => seen.has(s.id)).sort((a, b) => b.clockIn.localeCompare(a.clockIn));
    return { cards, shifts, list, weeks, month: sum((r) => r.month), lastWeek: sum((r) => r.lastWeek), waiting: sum((r) => r.waiting), waitingShifts: sum((r) => r.waitingShifts) };
  }, [m, w, month, lastSunday, thisSunday]);

  if (!v || !m) return null;
  const projectName = (k: string) => (k === NO_PROJECT ? "No project chosen" : k === UNLISTED ? "Time not itemized" : m.projects.find((p) => p.id === k)?.name ?? "A project");
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isCurrent = month.getTime() === monthStart().getTime();
  const lines = (r: (typeof v.list)[number]) => {
    const l = Object.entries(r.projects).sort((a, b) => b[1] - a[1]);
    const rest = r.month - r.logged;
    return rest > 0 ? [...l, [UNLISTED, rest] as [string, number]] : l;
  };
  let running = 0;

  return (
    <section className="space-y-4" aria-label="Hours summary">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Hours summary</h2>
        <button className={btn} aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{monthLabel}</span>
        <button className={btn} aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></button>
        {!isCurrent && <button className={btn} onClick={() => setMonth(monthStart())}>This month</button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className={label}>{isCurrent ? `${month.toLocaleDateString("en-US", { month: "long" })} so far` : monthLabel}</p>
          <p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(v.month)}</p>
          <p className="mt-1 text-xs text-[#7b6b8d]">All team hours on the clock this month</p>
        </div>
        <div className={card}>
          <p className={label}>Last week</p>
          <p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(v.lastWeek)}</p>
          <p className="mt-1 text-xs text-[#7b6b8d]">{shortDay(lastSunday)} to {shortDay(addDays(thisSunday, -1))}</p>
        </div>
        <div className={card}>
          <p className={label}>Waiting to be reviewed</p>
          <p className="text-2xl font-semibold tabular-nums text-[#7a5f0c] dark:text-[#e0c35a]">{hm(v.waiting)}</p>
          <p className="mt-1 text-xs text-[#7b6b8d]">{v.waitingShifts} submitted day{v.waitingShifts === 1 ? "" : "s"} to approve</p>
        </div>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d]">
              <th className="pb-2 pr-3">Person</th>
              <th className="pb-2 pr-3 text-right">{isCurrent ? "This month" : monthLabel}</th>
              <th className="pb-2 pr-3 text-right">Last week</th>
              <th className="pb-2 text-right">Waiting for review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2b4a]/10 dark:divide-white/10">
            {v.list.map((r) => (
              <tr key={r.email}>
                <td className="py-2 pr-3 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{r.name}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{hm(r.month)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{hm(r.lastWeek)}</td>
                <td className="py-2 text-right tabular-nums">{r.waiting ? `${hm(r.waiting)} (${r.waitingShifts})` : "None"}</td>
              </tr>
            ))}
            {!v.list.length && <tr><td className="py-2 text-[#7b6b8d]" colSpan={4}>No hours logged yet.</td></tr>}
            {v.list.length > 0 && (
              <tr className="font-semibold">
                <td className="py-2 pr-3">Team total</td>
                <td className="py-2 pr-3 text-right tabular-nums">{hm(v.month)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{hm(v.lastWeek)}</td>
                <td className="py-2 text-right tabular-nums">{v.waiting ? `${hm(v.waiting)} (${v.waitingShifts})` : "None"}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={card}>
        <p className={label}>Running total, {monthLabel} (weeks run Sunday to Saturday)</p>
        <ul className="divide-y divide-[#1a2b4a]/10 text-sm dark:divide-white/10">
          {v.weeks.map((x) => {
            running += x.mins;
            return (
              <li key={x.from.toISOString()} className="flex flex-wrap justify-between gap-2 py-1.5">
                <span className="text-[#5b5f73] dark:text-[#b8a898]">{shortDay(x.from)} to {shortDay(addDays(x.from, 6))}</span>
                <span className="tabular-nums"><span className="text-[#5b5f73] dark:text-[#b8a898]">{hm(x.mins)} · running total </span><span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(running)}</span></span>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className={label}>Each person, {monthLabel}. Click a card to open their reports.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {v.cards.map(({ tracks, row: r }) => {
            const on = open === r.email;
            return (
              <button
                key={r.email}
                type="button"
                aria-pressed={on}
                onClick={() => setOpen(on ? null : r.email)}
                className={`${card} w-full text-left transition ${on ? "ring-2 ring-[#2E7C83]" : "hover:ring-1 hover:ring-[#2E7C83]/50"}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{r.name}</p>
                  <p className="text-lg font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(r.month)}</p>
                </div>
                <p className="text-xs text-[#7b6b8d]">{tracks ? `Last week ${hm(r.lastWeek)}${r.waitingShifts ? ` · ${r.waitingShifts} waiting for review` : ""}` : "Does not track hours"}</p>
                {!lines(r).length ? <p className="mt-2 text-sm text-[#7b6b8d]">{tracks ? "Nothing logged this month." : "No work log reports."}</p> : (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {lines(r).map(([k, mm]) => (
                      <li key={k}>
                        <div className="flex items-baseline justify-between gap-2"><span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{projectName(k)}</span><span className="tabular-nums text-[#5b5f73] dark:text-[#b8a898]">{hm(mm)}</span></div>
                        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className={`h-full rounded-full ${k === UNLISTED ? "bg-[#1a2b4a]/25" : "bg-[#c9a227]"}`} style={{ width: `${(mm / Math.max(1, r.month)) * 100}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs font-semibold text-[#2E7C83]">{on ? "Hide reports" : "Open reports"}</p>
              </button>
            );
          })}
        </div>

        {open && (() => {
          const person = v.cards.find((c) => c.row.email === open)?.row;
          const theirs = v.shifts.filter((s) => s.personEmail.toLowerCase() === open);
          const byDay = new Map<string, Shift[]>();
          for (const s of theirs) {
            const k = new Date(s.clockIn).toLocaleDateString("en-CA");
            byDay.set(k, [...(byDay.get(k) ?? []), s]);
          }
          return (
            <div className="mt-4 space-y-4" aria-label={`${person?.name ?? "Team member"} reports`}>
              <h3 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{person?.name}: reports for {monthLabel}</h3>
              {!theirs.length && <p className="text-sm text-[#7b6b8d]">No work log reports for {monthLabel}.</p>}
              {Array.from(byDay.entries()).map(([day, list]) => (
                <div key={day} className="space-y-3">
                  <p className="border-b border-[#1a2b4a]/10 pb-1 text-xs font-semibold uppercase tracking-wide text-[#7b6b8d] dark:border-white/10">
                    {new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </p>
                  {list.map((s) => <div key={s.id}>{renderShift ? renderShift(s) : null}</div>)}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </section>
  );
}
