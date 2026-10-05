"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { COLUMNS, PRIORITY_COLOR, fmtDay, todayStr, type PData, type PTask } from "./types";

// Every task in the project in one table, soonest first. Change a stage right in the row; click the name to edit.
export default function ProjectList({ data, onOpen, onStatus, onAdd }: { data: PData; onOpen: (t: PTask) => void; onStatus: (id: number, status: string) => Promise<void>; onAdd: (status: string, title: string) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const rows = [...data.tasks].sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || (a.dueDay ?? "9999").localeCompare(b.dueDay ?? "9999") || a.id - b.id);
  const whoOf = (t: PTask) => data.team.find((m) => m.id === t.assigneeMemberId)?.name || data.guests.find((g) => g.id === t.assigneeGuestId)?.name || "Me";
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-[#1a2b4a]/10 text-left text-xs text-[#7a8a99]">
            <th className="px-4 py-2.5 font-medium">Task</th>
            <th className="px-2 py-2.5 font-medium">Stage</th>
            <th className="px-2 py-2.5 font-medium">Assigned to</th>
            <th className="px-2 py-2.5 font-medium">Start</th>
            <th className="px-2 py-2.5 font-medium">Due</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const overdue = t.dueDay && t.status !== "done" && t.dueDay < todayStr();
            return (
              <tr key={t.id} className="border-b border-[#1a2b4a]/6 last:border-0">
                <td className="px-4 py-2">
                  <button onClick={() => onOpen(t)} className={`flex items-center gap-2 text-left font-medium text-[#1a2b4a] hover:underline dark:text-[#F8F5F0] ${t.status === "done" ? "line-through opacity-60" : ""}`}>
                    <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: PRIORITY_COLOR[t.priority] || "#7b8fa3" }} />
                    {t.title}
                  </button>
                </td>
                <td className="px-2 py-2">
                  <select value={t.status} onChange={(e) => onStatus(t.id, e.target.value)} aria-label={`Stage for ${t.title}`} className="rounded-md border border-[#1a2b4a]/15 bg-white px-2 py-1 text-xs text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]">
                    {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2 text-xs text-[#7a8a99]">{whoOf(t)}</td>
                <td className="px-2 py-2 text-xs text-[#7a8a99]">{fmtDay(t.startDay)}</td>
                <td className={`px-2 py-2 text-xs ${overdue ? "font-semibold text-[#b3392b]" : "text-[#7a8a99]"}`}>{fmtDay(t.dueDay)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <form
        className="flex items-center gap-2 border-t border-[#1a2b4a]/10 p-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          await onAdd("backlog", title.trim());
          setTitle("");
        }}
      >
        <Plus className="h-4 w-4 text-[#7a8a99]" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task, then Enter" aria-label="New task" className="flex-1 bg-transparent text-sm text-[#1a2b4a] outline-none dark:text-[#F8F5F0]" />
      </form>
    </div>
  );
}
