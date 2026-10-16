"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { dayInTz } from "@/lib/tz";
import EfTasks from "../../ef-tasks/EfTasks";

// One Embraced;Fully project: its goal and dates, its milestones and its tasks (the same lists as the task page,
// fixed to this project). Babs only.

interface Project { id: string; name: string; goal: string | null; status: "active" | "done"; due_date: string | null }
interface Milestone { id: string; project_id: string; title: string; due_date: string | null; done: boolean }

export default function EfProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tz, setTz] = useState("UTC");
  const [mTitle, setMTitle] = useState("");
  const [mDue, setMDue] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setTz(localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);
  const load = useCallback(async () => {
    const [p, m] = await Promise.all([
      fetch("/api/ef-projects", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/ef-milestones?projectId=${id}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    setProject(((p?.projects ?? []) as Project[]).find((x) => x.id === id) ?? null);
    setMilestones(m?.milestones ?? []);
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);

  const patchProject = async (body: Record<string, unknown>) => {
    setErr("");
    const res = await fetch("/api/ef-projects", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) }).catch(() => null);
    const d = res && res.ok ? await res.json() : null;
    if (!d?.project) return setErr("That didn't save.");
    setProject(d.project as Project);
  };
  const removeProject = async () => {
    if (!window.confirm("Delete this project? Its tasks stay, with no project.")) return;
    await fetch("/api/ef-projects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    router.push("/ef-projects");
  };
  const addMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) return;
    const res = await fetch("/api/ef-milestones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, title: mTitle, dueDate: mDue || undefined }) }).catch(() => null);
    const d = res && res.ok ? await res.json() : null;
    if (!d?.milestone) return setErr("Couldn't add the milestone.");
    setMilestones((prev) => [...prev, d.milestone as Milestone]);
    setMTitle("");
    setMDue("");
  };
  const patchMilestone = async (mid: string, body: Record<string, unknown>) => {
    const res = await fetch("/api/ef-milestones", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: mid, ...body }) }).catch(() => null);
    const d = res && res.ok ? await res.json() : null;
    if (d?.milestone) setMilestones((prev) => prev.map((m) => (m.id === mid ? (d.milestone as Milestone) : m)));
  };
  const removeMilestone = async (mid: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== mid));
    await fetch("/api/ef-milestones", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: mid }) }).catch(() => {});
  };

  const today = dayInTz(new Date(), tz);
  const pretty = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", weekday: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

  if (project === undefined) return <div className="max-w-[1100px] mx-auto px-6 py-8 text-sm text-gray-400">Loading…</div>;
  if (project === null)
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <Link href="/ef-projects" className="text-sm text-[#2E7C83] hover:underline">Back to projects</Link>
        <p className="mt-4 text-sm text-gray-500">That project isn&apos;t here any more.</p>
      </div>
    );

  const doneMs = milestones.filter((m) => m.done).length;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <Link href="/ef-projects" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Embraced;Fully projects
      </Link>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Embraced;Fully · only you see this</p>

      <div className="mt-1 mb-6 rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1A1A2E]">
        <input
          defaultValue={project.name}
          aria-label="Project name"
          onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== project.name && void patchProject({ name: e.target.value })}
          className="w-full bg-transparent font-serif text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] outline-none"
        />
        <textarea
          defaultValue={project.goal ?? ""}
          rows={2}
          placeholder="What this project is for"
          aria-label="Goal"
          onBlur={(e) => e.target.value.trim() !== (project.goal ?? "").trim() && void patchProject({ goal: e.target.value })}
          className="mt-2 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="text-gray-500">
            Due <input type="date" defaultValue={project.due_date ?? ""} onChange={(e) => void patchProject({ dueDate: e.target.value || null })} className="ml-1 px-2 py-1 text-sm bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md" />
          </label>
          <button onClick={() => patchProject({ status: project.status === "done" ? "active" : "done" })} className="text-[#2E7C83] hover:underline">
            {project.status === "done" ? "Reopen this project" : "Mark this project finished"}
          </button>
          <button onClick={removeProject} className="inline-flex items-center gap-1 text-gray-400 hover:text-[#D83A34]">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          {project.status === "done" && <span className="rounded-full bg-[#EAF3DE] px-2 py-0.5 text-xs text-[#27500A]">Finished</span>}
        </div>
        {err && <p className="mt-2 text-sm text-[#a3281f]">{err}</p>}
      </div>

      <section className="mb-8 rounded-2xl bg-[#F8F5F0] p-4 dark:bg-white/5">
        <h2 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
          Milestones <span className="ml-1 text-xs font-normal text-gray-400">{doneMs} of {milestones.length} reached</span>
        </h2>
        <ul className="mt-2 space-y-1.5">
          {milestones.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200/60 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#1A1A2E]">
              <button
                onClick={() => patchMilestone(m.id, { done: !m.done })}
                aria-label={m.done ? "Mark not reached" : "Mark reached"}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${m.done ? "border-[#54A33B] bg-[#54A33B] text-white" : "border-gray-300 hover:border-[#54A33B]"}`}
              >
                {m.done && <Check className="h-2.5 w-2.5" />}
              </button>
              <span className={`min-w-[160px] flex-1 text-sm ${m.done ? "text-gray-400 line-through" : "text-[#3F4654] dark:text-[#e8e4f0]"}`}>{m.title}</span>
              <input type="date" defaultValue={m.due_date ?? ""} onChange={(e) => patchMilestone(m.id, { dueDate: e.target.value || null })} aria-label="Milestone date" className="px-2 py-1 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md" />
              {m.due_date && !m.done && m.due_date < today && <span className="rounded-full bg-[#FBECEA] px-2 py-0.5 text-[10px] text-[#B0342C]">Overdue · {pretty(m.due_date)}</span>}
              <button onClick={() => removeMilestone(m.id)} aria-label="Delete milestone" className="text-gray-300 hover:text-[#D83A34]">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {milestones.length === 0 && <li className="text-xs text-gray-400">No milestones yet. A milestone is a checkpoint with a date, like &ldquo;Site live&rdquo;.</li>}
        </ul>
        <form onSubmit={addMilestone} className="mt-3 flex flex-wrap gap-2">
          <input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="Add a milestone…" aria-label="Milestone" className="min-w-[200px] flex-1 px-3 py-2 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm" />
          <input type="date" value={mDue} onChange={(e) => setMDue(e.target.value)} aria-label="Date" className="px-3 py-2 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm" />
          <button type="submit" disabled={!mTitle.trim()} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1a2b4a] text-white rounded-lg text-sm disabled:opacity-50">
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </section>

      <h2 className="mb-3 text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Tasks in this project</h2>
      <EfTasks lockProject={id} embedded />
    </div>
  );
}
