"use client";

import { useMemo } from "react";
import { fmtDay, dayNum, todayStr, type PData, type PTask } from "./types";

const COLOR: Record<string, string> = { done: "#8fb58a", in_progress: "#c9a227", today: "#2E7C83", waiting: "#7b6b8d", backlog: "#1a2b4a" };
const addDay = (d: string, n: number) => new Date((dayNum(d) + n) * 86400000).toISOString().slice(0, 10);

// A Gantt chart: one row per task, a bar from its start to its due date, milestones as diamonds, a line for today.
export default function ProjectTimeline({ data, onOpen }: { data: PData; onOpen: (t: PTask) => void }) {
  const { tasks, rangeStart, days, ppd } = useMemo(() => {
    const dated = data.tasks.filter((t) => t.dueDay || t.startDay);
    const all = [
      ...dated.flatMap((t) => [t.startDay, t.dueDay]),
      ...data.milestones.map((m) => m.dueDay),
      data.project.startDate,
      data.project.dueDate,
      todayStr(),
    ].filter((d): d is string => !!d);
    const min = all.reduce((a, b) => (a < b ? a : b));
    const max = all.reduce((a, b) => (a > b ? a : b));
    const start = addDay(min, -2);
    const n = dayNum(max) - dayNum(start) + 4;
    return {
      tasks: [...dated].sort((a, b) => (a.startDay ?? a.dueDay ?? "").localeCompare(b.startDay ?? b.dueDay ?? "") || a.id - b.id),
      rangeStart: start,
      days: Math.max(14, n),
      ppd: Math.max(16, Math.min(36, Math.floor(980 / Math.max(14, n)))),
    };
  }, [data]);

  const undated = data.tasks.filter((t) => !t.dueDay && !t.startDay);
  const x = (d: string) => (dayNum(d) - dayNum(rangeStart)) * ppd;
  const width = days * ppd;
  const today = todayStr();
  const weeks: string[] = [];
  for (let i = 0; i < days; i += 7) weeks.push(addDay(rangeStart, i));
  const LABEL = 200;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20">
      <div style={{ width: LABEL + width, minWidth: "100%" }} className="relative">
        {/* week ruler */}
        <div className="flex border-b border-[#1a2b4a]/10 text-[10px] text-[#7a8a99]">
          <div style={{ width: LABEL }} className="sticky left-0 z-10 flex-none bg-white px-3 py-2 font-medium dark:bg-[#14213a]">Task</div>
          <div className="relative h-8" style={{ width }}>
            {weeks.map((w) => (
              <div key={w} className="absolute top-0 h-full border-l border-[#1a2b4a]/10 pl-1 pt-2" style={{ left: x(w) }}>{fmtDay(w)}</div>
            ))}
          </div>
        </div>
        {/* milestones */}
        {data.milestones.length > 0 && (
          <div className="flex border-b border-[#1a2b4a]/10">
            <div style={{ width: LABEL }} className="sticky left-0 z-10 flex-none bg-white px-3 py-2 text-xs font-semibold text-[#c9a227] dark:bg-[#14213a]">Milestones</div>
            <div className="relative h-9" style={{ width }}>
              {data.milestones.filter((m) => m.dueDay).map((m) => (
                <div key={m.id} className="absolute top-1.5 flex items-center gap-1 whitespace-nowrap text-[10px] text-[#1a2b4a] dark:text-[#F8F5F0]" style={{ left: x(m.dueDay!) - 6 }} title={`${m.title} · ${fmtDay(m.dueDay)}`}>
                  <span className={`h-3 w-3 rotate-45 ${m.done ? "bg-[#8fb58a]" : "bg-[#c9a227]"}`} />
                  <span className="max-w-[140px] truncate">{m.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* tasks */}
        {tasks.map((t) => {
          const s = t.startDay ?? t.dueDay!;
          const e = t.dueDay ?? t.startDay!;
          const left = x(s < e ? s : e);
          const w = Math.max(ppd, (Math.abs(dayNum(e) - dayNum(s)) + 1) * ppd);
          return (
            <div key={t.id} className="flex border-b border-[#1a2b4a]/6">
              <button onClick={() => onOpen(t)} style={{ width: LABEL }} className={`sticky left-0 z-10 flex-none truncate bg-white px-3 py-2 text-left text-xs font-medium text-[#1a2b4a] hover:underline dark:bg-[#14213a] dark:text-[#F8F5F0] ${t.status === "done" ? "line-through opacity-60" : ""}`} title={t.title}>
                {t.title}
              </button>
              <div className="relative h-8" style={{ width }}>
                <button
                  onClick={() => onOpen(t)}
                  className="absolute top-1.5 h-5 rounded-md text-left text-[10px] font-medium text-white shadow-sm hover:brightness-110"
                  style={{ left, width: w, backgroundColor: COLOR[t.status] || "#1a2b4a", opacity: t.status === "done" ? 0.7 : 1 }}
                  title={`${t.title} · ${fmtDay(s)}${s !== e ? ` to ${fmtDay(e)}` : ""}`}
                  aria-label={`${t.title}, ${fmtDay(s)} to ${fmtDay(e)}`}
                />
              </div>
            </div>
          );
        })}
        {/* today */}
        {today >= rangeStart && <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-[#b3392b]/60" style={{ left: LABEL + x(today) + ppd / 2 }} title="Today" />}
      </div>
      {tasks.length === 0 && <p className="p-5 text-sm text-[#7a8a99]">Give your tasks a start or due date and they appear here as bars.</p>}
      {undated.length > 0 && (
        <p className="border-t border-[#1a2b4a]/10 p-3 text-xs text-[#7a8a99]">
          {undated.length} task{undated.length === 1 ? " has" : "s have"} no dates yet: {undated.slice(0, 4).map((t) => t.title).join(", ")}{undated.length > 4 ? "…" : ""}
        </p>
      )}
      <div className="flex flex-wrap gap-3 border-t border-[#1a2b4a]/10 p-3 text-[11px] text-[#7a8a99]">
        {[["backlog", "To do"], ["today", "Today"], ["in_progress", "In progress"], ["waiting", "Waiting"], ["done", "Done"]].map(([k, l]) => (
          <span key={k} className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR[k] }} />{l}</span>
        ))}
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rotate-45 bg-[#c9a227]" /> Milestone</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-px bg-[#b3392b]/60" /> Today</span>
      </div>
    </div>
  );
}
