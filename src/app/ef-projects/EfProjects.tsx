"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { dayInTz } from "@/lib/tz";

// Embraced;Fully projects: every project with where it stands. Babs only; its own tables, never shown elsewhere.

interface Project { id: string; name: string; goal: string | null; status: "active" | "done"; due_date: string | null }
interface Task { id: string; project_id: string | null; status: string; due_date: string | null }
interface Milestone { id: string; project_id: string; title: string; due_date: string | null; done: boolean }

export default function EfProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tz, setTz] = useState("UTC");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [due, setDue] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setTz(localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);
  const load = useCallback(async () => {
    const [p, t, m] = await Promise.all([
      fetch("/api/ef-projects", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/ef-tasks", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/ef-milestones", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    setProjects(p?.projects ?? []);
    setTasks(t?.tasks ?? []);
    setMilestones(m?.milestones ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setErr("");
    const res = await fetch("/api/ef-projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, goal: goal || undefined, dueDate: due || undefined }) }).catch(() => null);
    const d = res && res.ok ? await res.json() : null;
    if (!d?.project) return setErr("Couldn't add the project.");
    setName("");
    setGoal("");
    setDue("");
    void load();
  };

  const today = dayInTz(new Date(), tz);
  const pretty = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  const shown = (projects ?? []).filter((p) => (showDone ? true : p.status === "active"));

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <Link href="/ef-tasks" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Embraced;Fully tasks
      </Link>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Embraced;Fully · only you see this</p>
        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Embraced;Fully projects</h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">Each project has its own goal, milestones and tasks. Always separate from the Command Suite and the LifeCharter Program.</p>
      </div>

      <form onSubmit={add} className="mb-6 grid gap-2 rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1A1A2E] sm:grid-cols-[1fr_auto]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New Embraced;Fully project…" aria-label="Project name" className="px-4 py-2.5 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A2E] rounded-lg text-sm" />
        <button type="submit" disabled={!name.trim()} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1a2b4a] text-white rounded-lg text-sm disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add project
        </button>
        <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What it is for (optional)" aria-label="Goal" className="px-4 py-2.5 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A2E] rounded-lg text-sm" />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" className="px-3 py-2.5 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A2E] rounded-lg text-sm" />
      </form>
      {err && <p className="mb-3 text-sm text-[#a3281f]">{err}</p>}

      <label className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show finished projects
      </label>

      {projects === null ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl bg-[#F8F5F0] p-6 text-sm text-gray-500 dark:bg-white/5">No projects yet. Add the first one above.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((p) => {
            const mine = tasks.filter((t) => t.project_id === p.id);
            const done = mine.filter((t) => t.status === "done").length;
            const open = mine.length - done;
            const overdue = mine.filter((t) => t.status !== "done" && t.due_date && t.due_date < today).length;
            const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
            const ms = milestones.filter((m) => m.project_id === p.id);
            const next = ms.filter((m) => !m.done).sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))[0];
            return (
              <Link key={p.id} href={`/ef-projects/${p.id}`} className="block rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-[#1A1A2E]">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-serif text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.name}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${p.status === "done" ? "bg-[#EAF3DE] text-[#27500A]" : "bg-[#E6EFF6] text-[#2B5F8A]"}`}>{p.status === "done" ? "Finished" : "Active"}</span>
                </div>
                {p.goal && <p className="mt-1 text-sm text-[#5d6b7a] dark:text-[#b8c2cf] line-clamp-2">{p.goal}</p>}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1a2b4a]/10" aria-label={`${pct}% of tasks done`}>
                  <div className="h-full bg-[#54A33B]" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">
                  <span>{done} of {mine.length} tasks done</span>
                  <span>{open} open</span>
                  {overdue > 0 && <span className="font-semibold text-[#B0342C]">{overdue} overdue</span>}
                  {p.due_date && <span>Due {pretty(p.due_date)}</span>}
                </p>
                {next && (
                  <p className="mt-2 text-xs text-[#3F4654] dark:text-[#e8e4f0]">
                    Next milestone: <span className="font-medium">{next.title}</span>
                    {next.due_date ? ` · ${next.due_date < today ? "was due " : ""}${pretty(next.due_date)}` : ""}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
