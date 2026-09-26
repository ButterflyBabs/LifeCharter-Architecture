"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Check, Clock } from "lucide-react";
import { dueInfo, TONE_CLASS } from "@/lib/taskDue";
import { dayInTz } from "@/lib/tz";

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_at?: string | null;
  due_has_time?: boolean | null;
  time_kind?: "deadline" | "scheduled" | null;
  business: { name: string; color: string } | null;
  segment: { name: string; color: string } | null;
}

const COLUMNS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "in_progress", label: "In Progress" },
  { key: "waiting", label: "Waiting" },
  { key: "backlog", label: "Backlog" },
  { key: "done", label: "Done" },
];

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#D83A34",
  high: "#F0B400",
  medium: "#54A33B",
  low: "#9CA3AF",
  optional: "#9CA3AF",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [adding, setAdding] = useState(false);
  const [newDay, setNewDay] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newKind, setNewKind] = useState<"deadline" | "scheduled">("deadline");
  const [tz, setTz] = useState("UTC");
  // Inline due editor for one existing task.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDay, setEditDay] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editKind, setEditKind] = useState<"deadline" | "scheduled">("deadline");

  useEffect(() => {
    setTz(localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  const load = () =>
    fetch("/api/tasks")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTasks(d?.tasks ?? []))
      .catch(() => setTasks([]));

  useEffect(() => {
    load();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        status: "today",
        priority: newPriority,
        ...(newDay || newTime
          ? { dueDay: newDay || dayInTz(new Date(), tz), dueTime: newTime || undefined, timeKind: newKind, tz }
          : {}),
      }),
    }).catch(() => {});
    setNewTitle("");
    setNewDay("");
    setNewTime("");
    setNewKind("deadline");
    setAdding(false);
    load();
  };

  const setStatus = async (id: number, status: string) => {
    setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, status } : t)) ?? null);
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  const openEditor = (t: Task) => {
    setEditingId(t.id);
    setEditDay(t.due_at ? dayInTz(t.due_at, tz) : "");
    setEditTime(t.due_at && t.due_has_time ? new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(t.due_at)) : "");
    setEditKind(t.time_kind === "scheduled" ? "scheduled" : "deadline");
  };

  const saveDue = async (id: number, clear = false) => {
    const body = clear
      ? { clearDue: true }
      : { dueDay: editDay || dayInTz(new Date(), tz), dueTime: editTime || undefined, timeKind: editKind, tz };
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
    setEditingId(null);
    load();
  };

  const remove = async (id: number) => {
    setTasks((prev) => prev?.filter((t) => t.id !== id) ?? null);
    await fetch(`/api/tasks/${id}`, { method: "DELETE" }).catch(() => {});
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to Executive Home
      </Link>

      <div className="mb-6">
        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Tasks</h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">Everything across your businesses, by status.</p>
      </div>

      {/* Add task */}
      <form onSubmit={addTask} className="flex flex-wrap gap-2 mb-8">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 min-w-[240px] px-4 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-[#84AEB2]"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm"
        >
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="date"
          value={newDay}
          onChange={(e) => setNewDay(e.target.value)}
          aria-label="Due date"
          className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm"
        />
        <input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          aria-label="Time of day"
          className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm"
        />
        {newTime && (
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as "deadline" | "scheduled")}
            aria-label="What the time means"
            className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm"
          >
            <option value="deadline">Due by this time</option>
            <option value="scheduled">Do it at this time</option>
          </select>
        )}
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1a2b4a] text-white rounded-lg text-sm hover:bg-[#1a2b4a]/90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {tasks === null ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="bg-[#F8F5F0] dark:bg-white/5 rounded-2xl p-3">
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <h2 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{col.label}</h2>
                  <span className="text-xs text-gray-400">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white dark:bg-[#1A1A2E] rounded-xl border border-gray-200/60 dark:border-white/10 p-3 shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => setStatus(t.id, t.status === "done" ? "today" : "done")}
                          title={t.status === "done" ? "Reopen" : "Mark done"}
                          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            t.status === "done"
                              ? "bg-[#54A33B] border-[#54A33B] text-white"
                              : "border-gray-300 hover:border-[#54A33B]"
                          }`}
                        >
                          {t.status === "done" && <Check className="w-2.5 h-2.5" />}
                        </button>
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: PRIORITY_COLOR[t.priority] ?? "#9CA3AF" }}
                          title={t.priority}
                        />
                        <p
                          className={`text-sm leading-snug flex-1 ${
                            t.status === "done"
                              ? "line-through text-gray-400"
                              : "text-[#3F4654] dark:text-[#e8e4f0]"
                          }`}
                        >
                          {t.title}
                        </p>
                        <button
                          onClick={() => remove(t.id)}
                          className="text-gray-300 hover:text-[#D83A34] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {(() => {
                        const info = dueInfo(t, tz);
                        return (
                          <div className="mt-2 flex items-center gap-2">
                            {info && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${TONE_CLASS[info.tone]}`}>{info.label}</span>
                            )}
                            {t.status !== "done" && (
                              <button
                                onClick={() => (editingId === t.id ? setEditingId(null) : openEditor(t))}
                                className="inline-flex items-center gap-1 text-[10px] text-[#2E7C83] hover:underline"
                              >
                                <Clock className="w-3 h-3" /> {info ? "Change" : "Set date / time"}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                      {editingId === t.id && (
                        <div className="mt-2 p-2 rounded-lg bg-[#F8F5F0] dark:bg-white/5 space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={editDay}
                              onChange={(e) => setEditDay(e.target.value)}
                              aria-label="Due date"
                              className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md"
                            />
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              aria-label="Time of day"
                              className="w-24 px-2 py-1.5 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md"
                            />
                          </div>
                          {editTime && (
                            <select
                              value={editKind}
                              onChange={(e) => setEditKind(e.target.value as "deadline" | "scheduled")}
                              aria-label="What the time means"
                              className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md"
                            >
                              <option value="deadline">Due by this time</option>
                              <option value="scheduled">Do it at this time</option>
                            </select>
                          )}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => saveDue(t.id)}
                              disabled={!editDay && !editTime}
                              className="px-3 py-1 text-xs rounded-md bg-[#2E7C83] text-white disabled:opacity-50"
                            >
                              Save
                            </button>
                            {t.due_at && (
                              <button onClick={() => saveDue(t.id, true)} className="text-xs text-gray-400 hover:text-[#D83A34]">
                                Remove date
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {t.segment && (
                        <span
                          className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: t.segment.color ?? "#7b6b8d" }}
                        >
                          {t.segment.name}
                        </span>
                      )}
                      <select
                        value={t.status}
                        onChange={(e) => setStatus(t.id, e.target.value)}
                        className="mt-2 w-full text-xs bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 text-[#7C7C82]"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-xs text-gray-300 px-2 py-3">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
