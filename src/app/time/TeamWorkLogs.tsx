"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { hm, minutesOf } from "@/lib/timeTracking";
import { STATUS_LABEL, loggedMinutes, shiftMinutes, type ShiftStatus } from "@/lib/workLog";

type Item = { id: string; what: string; quantity: number | null; unit: string | null; minutes: number | null; taskId: number | null; projectId: string | null; challenge: string | null };
type Shift = { id: string; personEmail: string; personName: string; clockIn: string; clockOut: string | null; breakMinutes?: number; breakStartedAt?: string | null; status: ShiftStatus; items: Item[] };
type Done = { id: number; title: string; completedAt: string; assignee: string | null; projectId: string | null };
type Data = {
  me: { reviewer: boolean; name?: string; email?: string };
  shifts: Shift[];
  doneTasks?: Done[];
  taskTitles?: Record<string, string>;
  projects: { id: string; name: string }[];
  team?: { name: string; email: string; tracksHours?: boolean; active?: boolean }[];
};
type TimeEntry = { id: string; person_email: string; project_id: string | null; note: string | null; started_at: string; ended_at: string | null; billable: boolean };
type TimeData = { me: string; entries: TimeEntry[] };

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const h2 = "mb-3 flex items-center gap-2 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]";
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

type Person = { key: string; name: string; email: string | null; tracks?: boolean };
type Totals = { total: number; logged: number; projects: Record<string, number> };
const emptyTotals = (): Totals => ({ total: 0, logged: 0, projects: {} });

/**
 * Team work logs on the Time page (owner only). Its own week, Sunday to Saturday: for each person the week's total time and
 * time on each project, then day by day what they logged, the tasks they finished, and a running "week so far" total.
 * The data is the Work Log's own; review and approval stay on /work-log.
 */
export default function TeamWorkLogs() {
  const [week, setWeek] = useState(() => sundayStart());
  const [who, setWho] = useState<string | null>(null); // whose reports are open; none until a card is clicked
  const [t, setT] = useState<TimeData | null>(null);
  const [d, setD] = useState<Data | null>(null);
  const settled = useRef(false); // the first look may step back one week; after that the arrows are the person's

  useEffect(() => {
    let live = true;
    void fetch(`/api/work-log?from=${week.toISOString()}&to=${addDays(week, 7).toISOString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: Data) => {
        if (!live) return;
        // On a Sunday or Monday the new week is empty while the team's hours are in the week just ended: open on that one.
        const lo = week.getTime();
        const hi = addDays(week, 7).getTime();
        const has = (j.shifts ?? []).some((s) => Date.parse(s.clockIn) >= lo && Date.parse(s.clockIn) < hi) || (j.doneTasks ?? []).length > 0;
        if (!settled.current && j.me?.reviewer && !has) {
          settled.current = true;
          setWeek(addDays(week, -7));
          return;
        }
        settled.current = true;
        setD(j);
      })
      .catch(() => live && setD(null));
    return () => {
      live = false;
    };
  }, [week]);

  // The owner's own time (timer and hand-added entries on the Time page) for the same week.
  useEffect(() => {
    let live = true;
    void fetch(`/api/time?from=${week.toISOString()}&to=${addDays(week, 7).toISOString()}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<TimeData>)
      .then((j) => live && setT(j && Array.isArray(j.entries) ? j : null))
      .catch(() => live && setT(null));
    return () => {
      live = false;
    };
  }, [week]);

  const mine = useMemo(() => {
    if (!t || !d) return null;
    const entries = t.entries.filter((e) => e.person_email === t.me).sort((a, b) => b.started_at.localeCompare(a.started_at));
    const projects: Record<string, number> = {};
    let total = 0;
    for (const e of entries) {
      const m = minutesOf(e);
      total += m;
      const k = e.project_id || NO_PROJECT;
      projects[k] = (projects[k] ?? 0) + m;
    }
    return { name: d.me.name || "Me", entries, total, projects };
  }, [t, d]);

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

    // Everyone active on the team, people who track hours first (so a person with no log still has a card). The owner has
    // her own card, built from her Time page.
    const ownEmail = (d.me.email || "").toLowerCase();
    const people: Person[] = (d.team ?? [])
      .filter((m) => m.active !== false)
      .sort((a, b) => Number(b.tracksHours !== false) - Number(a.tracksHours !== false) || a.name.localeCompare(b.name))
      .map((m) => ({ key: m.email.toLowerCase(), name: m.name, email: m.email.toLowerCase(), tracks: m.tracksHours !== false }));
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
    for (const s of shifts) if (s.personEmail.toLowerCase() !== ownEmail) cell(dayKey(s.clockIn), personOfShift(s)).shifts.push(s);
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
          const m = shiftMinutes({ clock_in: s.clockIn, clock_out: s.clockOut, break_minutes: s.breakMinutes, break_started_at: s.breakStartedAt });
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
  const shown = who && who !== "me" ? view.people.filter((p) => p.key === who) : [];
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
        Each person&apos;s week, Sunday to Saturday: total time and time on each project. Click a card to open that person&apos;s day by day, with what they logged, the tasks they finished and a running total as the week goes.{" "}
        <a className="font-semibold text-[#2E7C83] underline" href="/work-log">Review and approve in Work Log</a>
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className={btn} aria-label="Previous team week" onClick={() => setWeek(addDays(week, -7))}><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{label}</span>
        <button className={btn} aria-label="Next team week" onClick={() => setWeek(addDays(week, 7))}><ChevronRight className="h-4 w-4" /></button>
        <button className={btn} onClick={() => setWeek(sundayStart())}>This week</button>
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7b6b8d]">Week totals. Click a card to open that person&apos;s day by day.</h3>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mine && (
          <button
            type="button"
            aria-pressed={who === "me"}
            onClick={() => setWho(who === "me" ? null : "me")}
            className={`w-full rounded-xl border p-3 text-left transition dark:border-white/10 ${who === "me" ? "border-[#2E7C83] ring-2 ring-[#2E7C83]" : "border-[#1a2b4a]/10 hover:border-[#2E7C83]/60"}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{mine.name} (you)</p>
              <p className="text-xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(mine.total)}</p>
            </div>
            <p className="text-xs text-[#7b6b8d]">From your Time page</p>
            {!Object.keys(mine.projects).length ? <p className="mt-2 text-sm text-[#7b6b8d]">Nothing tracked this week.</p> : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {Object.entries(mine.projects).sort((a, b) => b[1] - a[1]).map(([k, m]) => (
                  <li key={k}>
                    <div className="flex items-baseline justify-between gap-2"><span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{projectName(k)}</span><span className="tabular-nums text-[#5b5f73] dark:text-[#b8a898]">{hm(m)}</span></div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${(m / Math.max(1, mine.total)) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs font-semibold text-[#2E7C83]">{who === "me" ? "Hide day by day" : "Open day by day"}</p>
          </button>
        )}
        {view.people.map((p) => {
          const t = view.week$.get(p.key) ?? emptyTotals();
          const lines = projectLines(t);
          const on = who === p.key;
          const n = view.doneCount.get(p.key) ?? 0;
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={on}
              onClick={() => setWho(on ? null : p.key)}
              className={`w-full rounded-xl border p-3 text-left transition dark:border-white/10 ${on ? "border-[#2E7C83] ring-2 ring-[#2E7C83]" : "border-[#1a2b4a]/10 hover:border-[#2E7C83]/60"}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.name}</p>
                <p className="text-xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(t.total)}</p>
              </div>
              <p className="text-xs text-[#7b6b8d]">{n} task{n === 1 ? "" : "s"} done{p.tracks ? ` · ${hm(t.logged)} itemized` : " · does not track hours"}</p>
              {!lines.length ? <p className="mt-2 text-sm text-[#7b6b8d]">{p.tracks ? "Nothing logged this week." : "No hours expected."}</p> : (
                <ul className="mt-2 space-y-1.5 text-sm">
                  {lines.map(([k, m]) => (
                    <li key={k}>
                      <div className="flex items-baseline justify-between gap-2"><span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{projectName(k)}</span><span className="tabular-nums text-[#5b5f73] dark:text-[#b8a898]">{hm(m)}</span></div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className={`h-full rounded-full ${k === UNLISTED ? "bg-[#1a2b4a]/25" : "bg-[#c9a227]"}`} style={{ width: `${(m / Math.max(1, t.total)) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs font-semibold text-[#2E7C83]">{on ? "Hide day by day" : "Open day by day"}</p>
            </button>
          );
        })}
      </div>

      {who === "me" && mine && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7b6b8d]">Day by day: {mine.name}</h3>
          {!mine.entries.length && <p className="text-sm text-[#7b6b8d]">Nothing tracked this week. Start a timer or add time by hand above.</p>}
          {Array.from(mine.entries.reduce((mp, e) => {
            const k = dayKey(e.started_at);
            return mp.set(k, [...(mp.get(k) ?? []), e]);
          }, new Map<string, TimeEntry[]>()).entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([day, es]) => (
            <div key={day}>
              <p className="mb-1 flex justify-between border-b border-[#1a2b4a]/10 pb-1 text-xs font-semibold uppercase tracking-wide text-[#7b6b8d]">
                <span>{new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                <span className="tabular-nums">{hm(es.reduce((n, e) => n + minutesOf(e), 0))}</span>
              </p>
              <ul className="divide-y divide-[#1a2b4a]/10 text-sm dark:divide-white/10">
                {es.map((e) => (
                  <li key={e.id} className="flex flex-wrap justify-between gap-2 py-1.5">
                    <span className="min-w-0 text-[#1a2b4a] dark:text-[#F8F5F0]">{e.note || "No note"}<span className="text-[#5b5f73] dark:text-[#b8a898]"> · {e.project_id ? project(e.project_id) ?? "A project" : "No project chosen"}{e.billable ? "" : " · not billable"}</span></span>
                    <span className="tabular-nums text-[#5b5f73] dark:text-[#b8a898]">{e.ended_at ? hm(minutesOf(e)) : "running"} · {timeOf(e.started_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {who && who !== "me" && (
        <>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7b6b8d]">Day by day: {shown[0]?.name}</h3>
      {!view.days.some((x) => x.rows.some((r) => shown.includes(r.p))) && <p className="text-sm text-[#7b6b8d]">Nothing logged and no tasks finished this week.</p>}
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
                      const mins = shiftMinutes({ clock_in: s.clockIn, clock_out: s.clockOut, break_minutes: s.breakMinutes, break_started_at: s.breakStartedAt });
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
        </>
      )}
    </section>
  );
}
