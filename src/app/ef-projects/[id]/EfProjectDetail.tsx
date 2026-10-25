"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, KanbanSquare, ListChecks, Plus, Settings2, Table2 } from "lucide-react";
import ProjectBoard from "@/components/projects/ProjectBoard";
import ProjectList from "@/components/projects/ProjectList";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectDetails from "@/components/projects/ProjectDetails";
import TaskDrawer from "@/components/projects/TaskDrawer";
import { PROJECT_STATUS_LABEL, fmtDay, tzParam, type PData, type PTask } from "@/components/projects/types";
import EfTasks from "../../ef-tasks/EfTasks";

// One Embraced;Fully project, built the same way as the Suite's Projects (Board, List, Timeline, Details), but on its
// own tables and never mixed with them. Babs only.

type Tab = "board" | "list" | "timeline" | "tasks" | "details";
type EfData = PData & { parent: { id: string; name: string } | null; children: { id: string; name: string; status: string }[] };
interface Card { id: string; name: string; parentId: string | null }

export default function EfProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<EfData | null>(null);
  const [all, setAll] = useState<Card[]>([]);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<Tab>("board");
  const [open, setOpen] = useState<PTask | null>(null);
  const [err, setErr] = useState("");
  const [subName, setSubName] = useState("");
  const api = `/api/ef-projects/${id}`;
  const tz = tzParam();

  const load = useCallback(async () => {
    const [res, list] = await Promise.all([
      fetch(`${api}?tz=${encodeURIComponent(tz)}`, { cache: "no-store" }),
      fetch("/api/ef-projects?overview=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    if (res.status === 404) return setMissing(true);
    const d = await res.json().catch(() => null);
    if (d?.project) setData(d);
    setAll((list?.projects ?? []) as Card[]);
  }, [api, tz]);

  useEffect(() => {
    load();
    try {
      const t = sessionStorage.getItem("ef-project-tab");
      if (t === "board" || t === "list" || t === "timeline" || t === "tasks" || t === "details") setTab(t);
    } catch {
      /* default tab */
    }
  }, [load]);

  const pick = (t: Tab) => {
    setTab(t);
    try {
      sessionStorage.setItem("ef-project-tab", t);
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
  const setParent = async (parentId: string | null) => {
    setErr("");
    const res = await fetch("/api/ef-projects", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, parentId }) });
    if (!res.ok) setErr((await res.json().catch(() => ({}))).error || "That didn't save.");
    await load();
  };
  const addSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    const res = await fetch("/api/ef-projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: subName, parentId: id }) });
    if (!res.ok) return setErr("Couldn't add the sub-project.");
    setSubName("");
    await load();
  };

  if (missing) return <div className="px-4 py-10 text-center text-[#7a8a99]">That project isn&apos;t here any more. <Link href="/ef-projects" className="text-[#2E7C83] underline">Back to Embraced;Fully projects</Link></div>;
  if (!data) return <div className="px-4 py-10 text-[#7a8a99]">Loading…</div>;
  const p = data.project;
  const done = data.tasks.filter((t) => t.status === "done").length;
  const pct = data.tasks.length ? Math.round((done / data.tasks.length) * 100) : 0;
  const kids = data.children;
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "board", label: "Board", icon: <KanbanSquare className="h-4 w-4" /> },
    { id: "list", label: "List", icon: <ListChecks className="h-4 w-4" /> },
    { id: "timeline", label: "Timeline", icon: <BarChart3 className="h-4 w-4" /> },
    ...(kids.length ? [{ id: "tasks" as Tab, label: "All tasks (with sub-projects)", icon: <Table2 className="h-4 w-4" /> }] : []),
    { id: "details", label: "Details & milestones", icon: <Settings2 className="h-4 w-4" /> },
  ];
  const active: Tab = tab === "tasks" && !kids.length ? "board" : tab;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/ef-projects" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:underline"><ArrowLeft className="h-4 w-4" /> All Embraced;Fully projects</Link>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Embraced;Fully · only you see this</p>
      {data.parent && <p className="mt-1 text-sm text-[#7a8a99]">Part of <Link href={`/ef-projects/${data.parent.id}`} className="text-[#2E7C83] hover:underline">{data.parent.name}</Link></p>}
      <div className="mb-4 mt-1 flex flex-wrap items-end justify-between gap-3">
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

      {!data.parent && (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">Sub-projects</span>
          {kids.map((k) => <Link key={k.id} href={`/ef-projects/${k.id}`} className="rounded-full border border-[#1a2b4a]/15 bg-white px-3 py-1 hover:bg-[#1a2b4a]/5 dark:bg-[#1A1A2E]">{k.name}</Link>)}
          {kids.length === 0 && <span className="text-xs text-[#7a8a99]">None yet.</span>}
          <form onSubmit={addSub} className="flex gap-2">
            <input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="Add a sub-project…" aria-label="Sub-project name" className="w-48 rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-1.5 text-sm dark:bg-[#1a2b4a]/30" />
            <button type="submit" disabled={!subName.trim()} className="inline-flex items-center gap-1 rounded-lg border border-[#2E7C83] px-3 py-1.5 text-sm font-medium text-[#2E7C83] disabled:opacity-50"><Plus className="h-4 w-4" /> Add</button>
          </form>
        </div>
      )}

      <div className="mb-5 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-[#1a2b4a]/5 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => pick(t.id)} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${active === t.id ? "bg-white text-[#1a2b4a] shadow-sm dark:bg-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#7a8a99] hover:text-[#1a2b4a]"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {err && <p role="alert" className="mb-3 text-sm text-[#8a2f2f]">{err}</p>}
      {active === "board" && <ProjectBoard data={data} onOpen={setOpen} onMove={moveTasks} onAdd={addTask} />}
      {active === "list" && <ProjectList data={data} onOpen={setOpen} onStatus={(tid, status) => patchTask(tid, { status })} onAdd={addTask} />}
      {active === "timeline" && <ProjectTimeline data={data} onOpen={setOpen} />}
      {active === "tasks" && <EfTasks lockProject={id} lockProjects={[id, ...kids.map((k) => k.id)]} embedded />}
      {active === "details" && (
        <div className="space-y-5">
          {!kids.length && (
            <section className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/20">
              <h3 className="mb-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Part of</h3>
              <select value={data.parent?.id ?? ""} onChange={(e) => void setParent(e.target.value || null)} className="w-full max-w-sm rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]">
                <option value="">Nothing (a project of its own)</option>
                {all.filter((x) => !x.parentId && x.id !== id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </section>
          )}
          <ProjectDetails key={p.id + p.name} data={data} api={api} onChanged={load} onDeleted={() => router.push("/ef-projects")} solo />
        </div>
      )}
      {open && <TaskDrawer task={open} data={data} onClose={() => setOpen(null)} onSave={patchTask} onDelete={delTask} solo />}
    </div>
  );
}
