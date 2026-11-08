"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { hm } from "@/lib/timeTracking";
import { STATUS_LABEL, loggedMinutes, shiftMinutes, type ShiftStatus } from "@/lib/workLog";

type Item = { id: string; what: string; quantity: number | null; unit: string | null; minutes: number | null; taskId: number | null; projectId: string | null; challenge: string | null };
type Shift = { id: string; personEmail: string; personName: string; clockIn: string; clockOut: string | null; status: ShiftStatus; items: Item[] };
type Done = { id: number; title: string; completedAt: string; assignee: string | null; projectId: string | null };
type Data = {
  me: { reviewer: boolean };
  shifts: Shift[];
  doneTasks?: Done[];
  taskTitles?: Record<string, string>;
  projects: { id: string; name: string }[];
  team?: { name: string; email: string }[];
};

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const h2 = "mb-3 flex items-center gap-2 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]";
const input = "rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-1.5 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA");
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const NO_PROJECT = "none";
const UNLISTED = "unlisted";
const STATUS_STYLE: Record<ShiftStatus, string> = {
  open: "bg-[#2E7C83]/12 text-[#1f5f66] dark:text-[#7fd0d6]",
  submitted: "bg-[#c9a227]/20 text-[#7a5f0c] dark:text-[#e0c35a]",
  approved: "bg-[#2f7d4f]/15 text-[#1f5f3a] dark:text-[#8fd6aa]",
  returned: "bg-[#8a2f2f]/12 text-[#8a2f2f] dark:text-[#f0a0a0]",
};

/** Sunday 00:00 (viewer's local time) of the week containing `d`. Team weeks run Sunday to Saturday. */
const sundayStart = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

type Person = { key: string; name: string; email: string | null };
type Totals = { total: number; logged: number; projects: Record<string, number> };
const emptyTotals = (): Totals => ({ total: 0, logged: 0, projects: {} });

/**
 * Team work logs on the Time page (owner only). Its own week, Sunday to Saturday: for each person the week's total time and
 * time on each project, then day by day what they logged, the tasks they finished, and a running "week so far" total.
 * The data is the Work Log's own; review and approval stay on /work-log.
 */
export default function TeamWorkLogs() {
  const [week, setWeek] = useState(() => sundayStart());
  const [who, setWho] = useState("all");
  const [d, setD] = useState<Data | null>(null);

  useEffect(() => {
    let live = true;
    void fetch(`/api/work-log?from=${week.toISOString()}&to=${addDays(week, 7).toISOString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: Data) => live && setD(j))
      .catch(() => live && setD(null));
    return () => {
      live = false;
    };
  }, [week]);

  const view = useMemo(() => {
    if (!d?.me?.reviewer) return null;
    const lo = week.getTime();
    const hi = addDays(week, 7).getTime();
    const shifts = d.shifts.filter((s) => {
      const t = Date.parse(s.clockIn);
      return t >= lo && t < hi; // the API also returns unfinished shifts from other weeks
    });
    const done = (d.doneTasks ?? []).filter((t) => {
      const c = Date.parse(t.completedAt);
      return c >= lo && c < hi;
    });

    // Everyone on the team (so a person with no log shows 0 h), plus anyone who has a shift but is not on the list.
    const people: Person[] = (d.team ?? []).map((m) => ({ key: m.email.toLowerCase(), name: m.name, email: m.email.toLowerCase() }));
    const byEmail = new Map(people.map((p) => [p.email!, p]));
    const byName = new Map(people.map((p) => [p.name.toLowerCase(), p]));
    const personOfShift = (s: Shift): Person => {
      const k = s.personEmail.toLowerCase();
      let p = byEmail.get(k);
      if (!p) {
        p = { key: k, name: s.personName, email: k };
        people.push(p);
        byEmail.set(k, p);
        byName.set(p.name.toLowerCase(), p);
      }
      return p;
    };
    const personOfTask = (t: Done): Person => {
      const n = (t.assignee || "Someone").toLowerCase();
      let p = byName.get(n);
      if (!p) {
        p = { key: `name:${n}`, name: t.assignee || "Someone", email: null };
        people.push(p);
        byName.set(n, p);
      }
      return p;
    };

    type Cell = { shifts: Shift[]; done: Done[] };
    const cells = new Map<string, Map<string, Cell>>(); // day -> person key -> cell
    const cell = (day: string, p: Person) => {
      const m = cells.get(day) ?? cells.set(day, new Map()).get(day)!;
      return m.get(p.key) ?? m.set(p.key, { shifts: [], done: [] }).get(p.key)!;
    };
    for (const s of shifts) cell(dayKey(s.clockIn), personOfShift(s)).shifts.push(s);
    for (const t of done) cell(dayKey(t.completedAt), personOfTask(t)).done.push(t);

    // Week totals per person, and the running total after each day they worked.
    const week$ = new Map<string, Totals>();
    const doneCount = new Map<string, number>();
    const days: { day: string; rows: { p: Person; cell: Cell; dayMin: number; running: Totals }[] }[] = [];
    for (const day of Array.from(cells.keys()).sort()) {
      const rows: { p: Person; cell: Cell; dayMin: number; running: Totals }[] = [];
      for (const p of people) {
        const c = cells.get(day)!.get(p.key);
        if (!c) continue;
        const t = week$.get(p.key) ?? emptyTotals();
        let dayMin = 0;
        for (const s of c.shifts) {
          const m = shiftMinutes({ clock_in: s.clockIn, clock_out: s.clockOut });
          dayMin += m;
          t.total += m;
          t.logged += loggedMinutes(s.items);
          for (const i of s.items) {
            if (!i.minutes) continue;
            const k = i.projectId || NO_PROJECT;
            t.projects[k] = (t.projects[k] ?? 0) + i.minutes;
          }
        }
        week$.set(p.key, t);
        doneCount.set(p.key, (doneCount.get(p.key) ?? 0) + c.done.length);
        rows.push({ p, cell: c, dayMin, running: { total: t.total, logged: t.logged, projects: { ...t.projects } } });
      }
      days.push({ day, rows });
    }
    return { people, days, week$, doneCount };
  }, [d, week]);

  if (!view || !d) return null;
  const projectName = (k: string) => (k === NO_PROJECT ? "No project chosen" : k === UNLISTED ? "Time not itemized" : d.projects.find((p) => p.id === k)?.name ?? "A project");
  const project = (id: string | null) => (id ? d.projects.find((p) => p.id === id)?.name ?? null : null);
  const shown = view.people.filter((p) => who === "all" || p.key === who);
  const label = `${week.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${addDays(week, 6).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  /** A person's week as project lines, biggest first, with whatever on the clock was not itemized shown last. */
  const projectLines = (t: Totals) => {
    const lines = Object.entries(t.projects).sort((a, b) => b[1] - a[1]);
    const rest = t.total - t.logged;
    return rest > 0 ? [...lines, [UNLISTED, rest] as [string, number]] : lines;
  };

  return (
    <section className={card}>
      <h2 className={h2}><ClipboardList className="h-5 w-5 text-[#2E7C83]" />Team work logs</h2>
      <p className="mb-3 text-sm text-[#5b5f73] dark:text-[#b8a898]">
        Each person&apos;s week, Sunday to Saturday: total time, time on each project, what they logged and the tasks they finished, with a running total as the week goes.{" "}
        <a className="font-semibold text-[#2E7C83] underline" href="/work-log">Review and approve in Work Log</a>
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className={btn} aria-label="Previous team week" onClick={() => setWeek(addDays(week, -7))}><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{label}</span>
        <button className={btn} aria-label="Next team week" onClick={() => setWeek(addDays(week, 7))}><ChevronRight className="h-4 w-4" /></button>
        <button className={btn} onClick={() => setWeek(sundayStart())}>This week</button>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#7b6b8d]">Person</span>
          <select className={input} value={who} onChange={(e) => setWho(e.target.value)} aria-label="Show work logs for">
            <option value="all">Everyone</option>
            {view.people.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
        </label>
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7b6b8d]">Week totals</h3>
      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((p) => {
          const t = view.week$.get(p.key) ?? emptyTotals();
          const lines = projectLines(t);
          return (
            <div key={p.key} className="rounded-xl border border-[#1a2b4a]/10 p-3 dark:border-white/10">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.name}</p>
                <p className="text-xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(t.total)}</p>
              </div>
              <p className="text-xs text-[#7b6b8d]">{view.doneCount.get(p.key) ?? 0} task{(view.doneCount.get(p.key) ?? 0) === 1 ? "" : "s"} done · {hm(t.logged)} itemized</p>
              {!lines.length ? <p className="mt-2 text-sm text-[#7b6b8d]">Nothing logged this week.</p> : (
                <ul className="mt-2 space-y-1.5 text-sm">
                  {lines.map(([k, m]) => (
                    <li key={k}>
                      <div className="flex items-baseline justify-between gap-2"><span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{projectName(k)}</span><span className="tabular-nums text-[#5b5f73] dark:text-[#b8a898]">{hm(m)}</span></div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className={`h-full rounded-full ${k === UNLISTED ? "bg-[#1a2b4a]/25" : "bg-[#c9a227]"}`} style={{ width: `${(m / Math.max(1, t.total)) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7b6b8d]">Day by day</h3>
      {!view.days.some((x) => x.rows.some((r) => shown.includes(r.p))) && <p className="text-sm text-[#7b6b8d]">No team work logged or tasks finished this week.</p>}
      <div className="space-y-6">
        {view.days.map(({ day, rows }) => {
          const mine = rows.filter((r) => shown.includes(r.p));
          if (!mine.length) return null;
          return (
            <div key={day}>
              <p className="mb-2 flex justify-between border-b border-[#1a2b4a]/10 pb-1 text-xs font-semibold uppercase tracking-wide text-[#7b6b8d]">
                <span>{new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                <span className="tabular-nums">{hm(mine.reduce((n, r) => n + r.dayMin, 0))}</span>
              </p>
              <div className="space-y-4">
                {mine.map(({ p, cell: c, dayMin, running }) => (
                  <div key={p.key} className="rounded-xl border border-[#1a2b4a]/10 p-3 dark:border-white/10">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.name}</p>
                      <p className="text-xs tabular-nums text-[#5b5f73] dark:text-[#b8a898]">Today {hm(dayMin)} · <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Week so far {hm(running.total)}</span></p>
                    </div>
                    {c.shifts.map((s) => {
                      const mins = shiftMinutes({ clock_in: s.clockIn, clock_out: s.clockOut });
                      return (
                        <div key={s.id} className="mt-2 text-sm">
                          <p className="flex flex-wrap items-center gap-2 text-[#5b5f73] dark:text-[#b8a898]">
                            <span className="tabular-nums">{timeOf(s.clockIn)} to {s.clockOut ? timeOf(s.clockOut) : "still working"}</span>
                            <span className="font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(mins)}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                          </p>
                          {!s.items.length ? <p className="mt-1 text-xs text-[#7b6b8d]">No activity listed yet.</p> : (
                            <ul className="mt-1 list-disc space-y-1 pl-5">
                              {s.items.map((i) => (
                                <li key={i.id}>
                                  <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{i.what}</span>
                                  <span className="text-[#5b5f73] dark:text-[#b8a898]">
                                    {i.quantity != null ? ` · ${i.quantity}${i.unit ? ` ${i.unit}` : ""}` : ""}
                                    {i.minutes ? ` · ${hm(i.minutes)}` : ""}
                                    {i.taskId && d.taskTitles?.[String(i.taskId)] ? ` · Task: ${d.taskTitles[String(i.taskId)]}` : ""}
                                    {project(i.projectId) ? ` · ${project(i.projectId)}` : ""}
                                  </span>
                                  {i.challenge && <span className="block text-xs text-[#8a2f2f] dark:text-[#f0a0a0]">In the way: {i.challenge}</span>}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                    {c.done.length > 0 && (
                      <div className="mt-2 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#2f7d4f]">Tasks completed ({c.done.length})</p>
                        <ul className="mt-1 space-y-1">
                          {c.done.map((t) => (
                            <li key={t.id} className="flex items-start gap-1.5">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2f7d4f]" />
                              <span><span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{t.title}</span><span className="text-xs text-[#7b6b8d]"> · {timeOf(t.completedAt)}{project(t.projectId) ? ` · ${project(t.projectId)}` : ""}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Object.keys(running.projects).length > 0 && (
                      <p className="mt-2 border-t border-[#1a2b4a]/10 pt-2 text-xs text-[#5b5f73] dark:border-white/10 dark:text-[#b8a898]">
                        <span className="font-semibold uppercase tracking-wide text-[#7b6b8d]">Project time, week so far: </span>
                        {Object.entries(running.projects).sort((a, b) => b[1] - a[1]).map(([k, m]) => `${projectName(k)} ${hm(m)}`).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
