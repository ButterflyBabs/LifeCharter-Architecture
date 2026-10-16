"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Check, GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { dayInTz } from "@/lib/tz";

// Embraced;Fully (E:F) tasks. Babs only. The same shape as the Tasks page (lists you can fold, drag a task between
// them, Today = dated today or put there today) but its own list, kept apart from every other view.

interface EfTask {
  id: string;
  title: string;
  notes: string | null;
  status: "today" | "in_progress" | "waiting" | "backlog" | "done";
  priority: "critical" | "high" | "medium" | "low";
  due_date: string | null;
  today_on: string | null;
  completed_at: string | null;
  project_id: string | null;
}
interface EfProject {
  id: string;
  name: string;
  goal: string | null;
  status: "active" | "done";
  due_date: string | null;
}

const SECTIONS: { key: string; label: string; help: string }[] = [
  { key: "overdue", label: "Overdue", help: "Open tasks dated before today." },
  { key: "today", label: "Today", help: "Dated today, or anything you put here today. It starts fresh each day." },
  { key: "in_progress", label: "In Progress", help: "Started, not dated today or earlier." },
  { key: "waiting", label: "Waiting", help: "Held up by someone or something else." },
  { key: "backlog", label: "Backlog", help: "Not started and not for now: dated later or not dated yet." },
  { key: "done", label: "Done", help: "Finished." },
];
const PRIORITY_COLOR: Record<string, string> = { critical: "#D83A34", high: "#F0B400", medium: "#54A33B", low: "#9CA3AF" };
const RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function EfTasks() {
  const [tasks, setTasks] = useState<EfTask[] | null>(null);
  const [tz, setTz] = useState("UTC");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: true });
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  // Projects (Embraced;Fully only): groups for these tasks, kept here and nowhere else.
  const [projects, setProjects] = useState<EfProject[]>([]);
  const [fProject, setFProject] = useState(""); // "" all, "none", or a project id
  const [newProjectId, setNewProjectId] = useState("");
  const [projName, setProjName] = useState("");
  const [showProjects, setShowProjects] = useState(false);

  useEffect(() => {
    setTz(localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    try {
      const raw = localStorage.getItem("efTasksCollapsed");
      if (raw) setCollapsed({ done: true, ...JSON.parse(raw) });
    } catch {
      /* default */
    }
  }, []);

  const load = useCallback(async () => {
    const [r, pr] = await Promise.all([fetch("/api/ef-tasks", { cache: "no-store" }).catch(() => null), fetch("/api/ef-projects", { cache: "no-store" }).catch(() => null)]);
    const d = r && r.ok ? await r.json() : null;
    const pd = pr && pr.ok ? await pr.json() : null;
    setTasks(d?.tasks ?? []);
    setProjects(pd?.projects ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const today = dayInTz(new Date(), tz);
  const sectionOf = (t: EfTask): string => {
    if (t.status === "done") return "done";
    if (t.due_date && t.due_date < today) return "overdue";
    if (t.due_date === today || (t.status === "today" && t.today_on === today)) return "today";
    return t.status === "today" ? "backlog" : t.status;
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setErr("");
    const res = await fetch("/api/ef-tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) }).catch(() => null);
    const d = res && res.ok ? await res.json() : null;
    if (!d?.task) {
      setErr("That didn't save. Try again.");
      void load();
      return;
    }
    setTasks((prev) => prev?.map((t) => (t.id === id ? (d.task as EfTask) : t)) ?? null);
  };
  const move = (id: string, status: string) => patch(id, { status, todayOn: status === "today" ? today : undefined });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/ef-tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, priority, dueDate: due || undefined, todayOn: today, projectId: newProjectId || undefined }) }).catch(() => null);
    const d = res && res.ok ? await res.json() : null;
    if (!d?.task) return setErr("Couldn't add it.");
    setTasks((prev) => [...(prev ?? []), d.task as EfTask]);
    setTitle("");
    setDue("");
  };
  const remove = async (id: string) => {
    setTasks((prev) => prev?.filter((t) => t.id !== id) ?? null);
    await fetch("/api/ef-tasks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
  };
  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    const res = await fetch("/api/ef-projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: projName }) }).catch(() => null);
    const d = res && res.ok ? await res.json() : null;
    if (!d?.project) return setErr("Couldn't add the project.");
    setProjects((prev) => [...prev, d.project as EfProject]);
    setProjName("");
  };
  const patchProject = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch("/api/ef-projects", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) }).catch(() => null);
    const d = res && res.ok ? await res.json() : null;
    if (!d?.project) return setErr("That didn't save.");
    setProjects((prev) => prev.map((p) => (p.id === id ? (d.project as EfProject) : p)));
  };
  const removeProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev?.map((t) => (t.project_id === id ? { ...t, project_id: null } : t)) ?? null);
    if (fProject === id) setFProject("");
    await fetch("/api/ef-projects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
  };
  const toggleSection = (k: string) =>
    setCollapsed((c) => {
      const next = { ...c, [k]: !c[k] };
      try {
        localStorage.setItem("efTasksCollapsed", JSON.stringify(next));
      } catch {
        /* not remembered */
      }
      return next;
    });

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? "";
  const visible = (tasks ?? []).filter((t) => {
    if (words.length && !words.every((w) => `${t.title} ${t.notes ?? ""} ${projectName(t.project_id)}`.toLowerCase().includes(w))) return false;
    if (fProject === "none") return !t.project_id;
    if (fProject) return t.project_id === fProject;
    return true;
  });
  const openCount = (id: string) => (tasks ?? []).filter((t) => t.project_id === id && t.status !== "done").length;
  const prettyDay = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", weekday: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to Executive Home
      </Link>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Alignment Architect · only you see this</p>
        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Embraced;Fully tasks</h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">A list of its own, kept apart from the Command Suite&apos;s Tasks and from your team.</p>
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-2 mb-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add an Embraced;Fully task…" aria-label="New task" className="flex-1 min-w-[240px] px-4 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-[#84AEB2]" />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority" className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm">
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm" />
        {projects.filter((p) => p.status === "active").length > 0 && (
          <select value={newProjectId} onChange={(e) => setNewProjectId(e.target.value)} aria-label="Project" className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm max-w-[200px]">
            <option value="">No project</option>
            {projects.filter((p) => p.status === "active").map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        <button type="submit" disabled={!title.trim()} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1a2b4a] text-white rounded-lg text-sm hover:bg-[#1a2b4a]/90 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {tasks !== null && (
        <div className="mb-4 flex flex-wrap gap-2">
          {SECTIONS.map((s) => {
            const n = visible.filter((t) => sectionOf(t) === s.key).length;
            return (
              <div key={s.key} className="group relative">
                <button
                  onClick={() => {
                    setCollapsed((c) => ({ ...c, [s.key]: false }));
                    setTimeout(() => document.getElementById(`ef-${s.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
                  }}
                  className={`inline-flex items-baseline gap-2 rounded-xl border px-3.5 py-2 text-left ${s.key === "overdue" && n > 0 ? "border-[#B0342C]/40 bg-[#FBECEA] text-[#B0342C]" : "border-[#1a2b4a]/10 bg-white dark:bg-[#1A1A2E] text-[#1a2b4a] dark:text-[#F8F5F0]"}`}
                >
                  <span className="text-xl font-semibold tabular-nums leading-none">{n}</span>
                  <span className="text-xs">{s.label}</span>
                </button>
                <div role="tooltip" className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden w-60 rounded-lg border border-[#1a2b4a]/10 bg-white p-3 text-xs text-[#3F4654] shadow-lg group-hover:block dark:bg-[#1A1A2E] dark:text-[#e8e4f0]">
                  {s.help}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-5 rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1A1A2E] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Projects</span>
          <button onClick={() => setFProject("")} className={`rounded-full px-3 py-1 text-xs ${fProject === "" ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>All</button>
          {projects.filter((p) => p.status === "active").map((p) => (
            <button key={p.id} onClick={() => setFProject(fProject === p.id ? "" : p.id)} className={`rounded-full px-3 py-1 text-xs ${fProject === p.id ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
              {p.name} <span className="opacity-60">{openCount(p.id)}</span>
            </button>
          ))}
          <button onClick={() => setFProject(fProject === "none" ? "" : "none")} className={`rounded-full px-3 py-1 text-xs ${fProject === "none" ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>No project</button>
          <button onClick={() => setShowProjects((v) => !v)} aria-expanded={showProjects} className="ml-auto text-xs text-[#2E7C83] hover:underline">
            {showProjects ? "Close" : "Add or manage projects"}
          </button>
        </div>
        {showProjects && (
          <div className="mt-3 space-y-3 border-t border-[#1a2b4a]/10 pt-3">
            <form onSubmit={addProject} className="flex flex-wrap gap-2">
              <input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="New Embraced;Fully project…" aria-label="New project name" className="flex-1 min-w-[220px] px-3 py-2 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm" />
              <button type="submit" disabled={!projName.trim()} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1a2b4a] text-white rounded-lg text-sm disabled:opacity-50">
                <Plus className="w-4 h-4" /> Add project
              </button>
            </form>
            {projects.length === 0 && <p className="text-xs text-gray-400">No projects yet. Add one and file tasks under it from the add box or from More on any task.</p>}
            {projects.map((p) => (
              <div key={p.id} className="rounded-xl bg-[#F8F5F0] dark:bg-white/5 p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input defaultValue={p.name} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== p.name && void patchProject(p.id, { name: e.target.value })} aria-label="Project name" className="flex-1 min-w-[200px] px-3 py-1.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md text-sm font-medium" />
                  <label className="text-xs text-gray-500">
                    Due <input type="date" defaultValue={p.due_date ?? ""} onChange={(e) => void patchProject(p.id, { dueDate: e.target.value || null })} className="ml-1 px-2 py-1 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md" />
                  </label>
                  <button onClick={() => patchProject(p.id, { status: p.status === "done" ? "active" : "done" })} className="text-xs text-[#2E7C83] hover:underline">{p.status === "done" ? "Reopen" : "Mark project done"}</button>
                  <button onClick={() => removeProject(p.id)} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#D83A34]" title="Its tasks stay, with no project">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
                <textarea defaultValue={p.goal ?? ""} rows={2} placeholder="What this project is for (optional)" onBlur={(e) => e.target.value.trim() !== (p.goal ?? "").trim() && void patchProject(p.id, { goal: e.target.value })} className="w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A2E] px-3 py-1.5 text-sm" />
                <p className="text-[11px] text-gray-400">{openCount(p.id)} open task{openCount(p.id) === 1 ? "" : "s"}{p.status === "done" ? " · project marked done" : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search these tasks…" aria-label="Search" className="mb-5 w-full max-w-md px-4 py-2 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-[#84AEB2]" />
      {err && <p className="mb-3 text-sm text-[#a3281f]">{err}</p>}

      {tasks === null ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-4">
          {SECTIONS.map((s) => {
            const all = visible.filter((t) => sectionOf(t) === s.key);
            if (s.key === "overdue" && !all.length) return null;
            const list = s.key === "done" ? [...all].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")) : [...all].sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || RANK[a.priority] - RANK[b.priority]);
            const folded = Boolean(collapsed[s.key]) && !words.length;
            return (
              <section
                key={s.key}
                id={`ef-${s.key}`}
                onDragOver={(e) => {
                  if (dragId === null || s.key === "overdue") return;
                  e.preventDefault();
                  setOverKey(s.key);
                }}
                onDragLeave={() => setOverKey((k) => (k === s.key ? null : k))}
                onDrop={(e) => {
                  if (s.key === "overdue") return;
                  e.preventDefault();
                  const id = dragId ?? e.dataTransfer.getData("text/plain");
                  setDragId(null);
                  setOverKey(null);
                  const t = (tasks ?? []).find((x) => x.id === id);
                  if (t && sectionOf(t) !== s.key) void move(id, s.key);
                }}
                className={`rounded-2xl p-3 transition-colors ${overKey === s.key ? "bg-[#2E7C83]/15 ring-2 ring-[#2E7C83]/50" : "bg-[#F8F5F0] dark:bg-white/5"}`}
              >
                <button onClick={() => toggleSection(s.key)} aria-expanded={!folded} className="flex w-full items-center gap-2 px-2 py-1 text-left">
                  {folded ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  <h2 className={`text-base font-semibold ${s.key === "overdue" ? "text-[#B0342C]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>{s.label}</h2>
                  <span className="text-xs text-gray-400">{all.length}</span>
                </button>
                {!folded && (
                  <div className="mt-2 space-y-1.5">
                    {list.map((t) => {
                      const isOpen = Boolean(open[t.id]);
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", t.id);
                            setDragId(t.id);
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverKey(null);
                          }}
                          className={`bg-white dark:bg-[#1A1A2E] rounded-xl border border-gray-200/60 dark:border-white/10 px-3 py-2 shadow-sm ${dragId === t.id ? "opacity-50" : ""}`}
                        >
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" aria-hidden />
                            <button
                              onClick={() => move(t.id, t.status === "done" ? "today" : "done")}
                              aria-label={t.status === "done" ? "Reopen" : "Mark done"}
                              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${t.status === "done" ? "bg-[#54A33B] border-[#54A33B] text-white" : "border-gray-300 hover:border-[#54A33B]"}`}
                            >
                              {t.status === "done" && <Check className="w-2.5 h-2.5" />}
                            </button>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLOR[t.priority] }} title={t.priority} />
                            <div className="min-w-[180px] flex-1">
                              <p className={`text-sm leading-snug ${t.status === "done" ? "line-through text-gray-400" : "text-[#3F4654] dark:text-[#e8e4f0]"}`}>{t.title}</p>
                              {t.notes && !isOpen && (
                                <button onClick={() => setOpen((o) => ({ ...o, [t.id]: true }))} className="mt-0.5 block max-w-full truncate text-left text-xs text-gray-400 hover:text-[#2E7C83]">
                                  {t.notes.replace(/\s+/g, " ").slice(0, 140)}
                                </button>
                              )}
                            </div>
                            {t.project_id && projectName(t.project_id) && (
                              <button onClick={() => setFProject(t.project_id as string)} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a2b4a]/8 text-[#1a2b4a] dark:text-[#F8F5F0] hover:underline" title="Show only this project">
                                Project · {projectName(t.project_id)}
                              </button>
                            )}
                            {t.due_date && t.status !== "done" && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.due_date < today ? "bg-[#FBECEA] text-[#B0342C]" : t.due_date === today ? "bg-[#E6EFF6] text-[#2B5F8A]" : "bg-gray-100 text-gray-500"}`}>
                                {t.due_date < today ? `Overdue · ${prettyDay(t.due_date)}` : t.due_date === today ? "Due today" : prettyDay(t.due_date)}
                              </span>
                            )}
                            {s.key === "today" && t.status !== "today" && t.status !== "done" && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{SECTIONS.find((x) => x.key === t.status)?.label}</span>
                            )}
                            <button onClick={() => setOpen((o) => ({ ...o, [t.id]: !o[t.id] }))} aria-expanded={isOpen} className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#1a2b4a]">
                              <MoreHorizontal className="w-4 h-4" /> More
                            </button>
                          </div>
                          {isOpen && (
                            <div className="mt-2 space-y-2">
                              <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500" htmlFor={`ef-note-${t.id}`}>Notes and additional information</label>
                              <textarea
                                id={`ef-note-${t.id}`}
                                key={`${t.id}-${t.notes ?? ""}`}
                                defaultValue={t.notes ?? ""}
                                rows={4}
                                onBlur={(e) => {
                                  if (e.target.value.trim() !== (t.notes ?? "").trim()) void patch(t.id, { notes: e.target.value });
                                }}
                                placeholder="Anything you need to remember. It saves when you click away."
                                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A2E] px-3 py-2 text-sm"
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <label className="text-xs text-gray-500">
                                  Due{" "}
                                  <input type="date" defaultValue={t.due_date ?? ""} onChange={(e) => patch(t.id, { dueDate: e.target.value || null })} className="ml-1 px-2 py-1 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md" />
                                </label>
                                <label className="text-xs text-gray-500">
                                  Priority{" "}
                                  <select value={t.priority} onChange={(e) => patch(t.id, { priority: e.target.value })} className="ml-1 px-2 py-1 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md">
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                  </select>
                                </label>
                                <label className="text-xs text-gray-500">
                                  Project{" "}
                                  <select value={t.project_id ?? ""} onChange={(e) => patch(t.id, { projectId: e.target.value || null })} className="ml-1 px-2 py-1 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md max-w-[200px]">
                                    <option value="">No project</option>
                                    {projects.map((p) => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="text-xs text-gray-500">
                                  List{" "}
                                  <select value={t.status} onChange={(e) => move(t.id, e.target.value)} className="ml-1 px-2 py-1 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md">
                                    {SECTIONS.filter((x) => x.key !== "overdue").map((x) => (
                                      <option key={x.key} value={x.key}>{x.label}</option>
                                    ))}
                                  </select>
                                </label>
                                <button onClick={() => remove(t.id)} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#D83A34]">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {list.length === 0 && <p className="text-xs text-gray-400 px-2 py-3">{s.key === "today" ? "Nothing for today yet. Drag a task here or give one today's date." : "Nothing here."}</p>}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
