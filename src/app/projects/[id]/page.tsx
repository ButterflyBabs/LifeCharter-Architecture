"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, KanbanSquare, ListChecks, Settings2 } from "lucide-react";
import ProjectBoard from "@/components/projects/ProjectBoard";
import ProjectList from "@/components/projects/ProjectList";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectDetails from "@/components/projects/ProjectDetails";
import TaskDrawer from "@/components/projects/TaskDrawer";
import { PROJECT_STATUS_LABEL, fmtDay, tzParam, type PData, type PTask } from "@/components/projects/types";

type Tab = "board" | "list" | "timeline" | "details";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<PData | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<Tab>("board");
  const [open, setOpen] = useState<PTask | null>(null);
  const [err, setErr] = useState("");
  const api = `/api/projects/${id}`;
  const tz = tzParam();

  const load = useCallback(async () => {
    const res = await fetch(`${api}?tz=${encodeURIComponent(tz)}`, { cache: "no-store" });
    if (res.status === 404) return setMissing(true);
    const d = await res.json().catch(() => null);
    if (d?.project) setData(d);
  }, [api, tz]);

  useEffect(() => {
    load();
    try {
      const t = sessionStorage.getItem("project-tab");
      if (t === "board" || t === "list" || t === "timeline" || t === "details") setTab(t);
    } catch {
      /* default tab */
    }
  }, [load]);

  const pick = (t: Tab) => {
    setTab(t);
    try {
      sessionStorage.setItem("project-tab", t);
    } catch {
      /* not remembered */
    }
  };

  const patchTask = async (taskId: number, patch: Record<string, unknown>) => {
    setErr("");
    const res = await fetch(`${api}/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...patch, tz }) });
    if (!res.ok) setErr((await res.json().catch(() => ({}))).error || "That didn't save.");
    await load();
  };
  const addTask = async (status: string, title: string) => {
    setErr("");
    const res = await fetch(`${api}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, status, tz }) });
    if (!res.ok) setErr((await res.json().catch(() => ({}))).error || "Couldn't add it.");
    await load();
  };
  const moveTasks = async (moves: { id: number; status: string; position: number }[]) => {
    // Show the new place at once, then save.
    setData((d) => (d ? { ...d, tasks: d.tasks.map((t) => { const m = moves.find((x) => x.id === t.id); return m ? { ...t, status: m.status, position: m.position } : t; }) } : d));
    await Promise.all(moves.map((m) => fetch(`${api}/tasks/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: m.status, position: m.position, tz }) })));
    await load();
  };
  const delTask = async (taskId: number) => {
    await fetch(`${api}/tasks/${taskId}`, { method: "DELETE" });
    await load();
  };

  if (missing) return <div className="px-4 py-10 text-center text-[#7a8a99]">That project isn&apos;t here any more. <Link href="/projects" className="text-[#2E7C83] underline">Back to Projects</Link></div>;
  if (!data) return <div className="px-4 py-10 text-[#7a8a99]">Loading…</div>;
  const p = data.project;
  const done = data.tasks.filter((t) => t.status === "done").length;
  const pct = data.tasks.length ? Math.round((done / data.tasks.length) * 100) : 0;
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "board", label: "Board", icon: <KanbanSquare className="h-4 w-4" /> },
    { id: "list", label: "List", icon: <ListChecks className="h-4 w-4" /> },
    { id: "timeline", label: "Timeline", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "details", label: "Details & sharing", icon: <Settings2 className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/projects" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:underline"><ArrowLeft className="h-4 w-4" /> All projects</Link>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.name}</h1>
          {p.goal && <p className="mt-1 max-w-3xl text-sm text-[#7a8a99]">{p.goal}</p>}
        </div>
        <div className="flex items-center gap-3 text-xs text-[#7a8a99]">
          <span className="rounded-full bg-[#2E7C83]/12 px-2.5 py-1 font-medium text-[#2E7C83]">{PROJECT_STATUS_LABEL[p.status] || p.status}</span>
          {(p.startDate || p.dueDate) && <span>{fmtDay(p.startDate)} to {fmtDay(p.dueDate)}</span>}
        </div>
      </div>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${pct}%` }} /></div>
        <span className="text-xs text-[#7a8a99]">{done} of {data.tasks.length} done · {pct}%</span>
      </div>
      <div className="mb-5 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-[#1a2b4a]/5 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => pick(t.id)} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${tab === t.id ? "bg-white text-[#1a2b4a] shadow-sm dark:bg-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#7a8a99] hover:text-[#1a2b4a]"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {err && <p role="alert" className="mb-3 text-sm text-[#8a2f2f]">{err}</p>}
      {tab === "board" && <ProjectBoard data={data} onOpen={setOpen} onMove={moveTasks} onAdd={addTask} />}
      {tab === "list" && <ProjectList data={data} onOpen={setOpen} onStatus={(tid, status) => patchTask(tid, { status })} onAdd={addTask} />}
      {tab === "timeline" && <ProjectTimeline data={data} onOpen={setOpen} />}
      {tab === "details" && <ProjectDetails key={p.id + p.name} data={data} api={api} onChanged={load} onDeleted={() => router.push("/projects")} />}
      {open && <TaskDrawer task={open} data={data} onClose={() => setOpen(null)} onSave={patchTask} onDelete={delTask} />}
    </div>
  );
}
