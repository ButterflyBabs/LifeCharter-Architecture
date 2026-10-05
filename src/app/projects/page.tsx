"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, FolderKanban, Plus, X } from "lucide-react";
import { PROJECT_STATUS_LABEL, fmtDay, tzParam } from "@/components/projects/types";

interface ProjectCard {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  color: string | null;
  tasks: number;
  done: number;
  next: { title: string; day: string } | null;
  openMilestones: number;
}
interface Template {
  key: string;
  name: string;
  blurb: string;
  anchorLabel: string;
  tasks: number;
}

const FIELD = "w-full rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]";
const LABEL = "mb-1 block text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0]";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [show, setShow] = useState<"active" | "all">("active");
  const [creating, setCreating] = useState(false);
  const [tpl, setTpl] = useState<string>("");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [day, setDay] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const d = await fetch(`/api/projects?tz=${encodeURIComponent(tzParam())}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (d) {
      setProjects(d.projects ?? []);
      setTemplates(d.templates ?? []);
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const chosen = templates.find((t) => t.key === tpl) || null;
  const create = async () => {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, goal, template: tpl || undefined, anchorDay: chosen ? day : undefined, dueDay: !chosen && day ? day : undefined, tz: tzParam() }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(d.error || "Couldn't create it.");
    router.push(`/projects/${d.id}`);
  };

  const list = projects.filter((p) => show === "all" || p.status !== "done");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a227] to-[#2E7C83]"><FolderKanban className="h-6 w-6 text-white" /></div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Projects</h1>
            <p className="text-[#7a8a99]">Group your tasks into the things you are building: a launch, a challenge, a client, a program.</p>
          </div>
        </div>
        <button onClick={() => { setCreating(true); setTpl(""); setName(""); setGoal(""); setDay(""); setErr(""); }} className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a2b4a] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"><Plus className="h-4 w-4" /> New project</button>
      </div>

      <div className="mb-4 flex gap-2 text-sm">
        {([["active", "Open projects"], ["all", "Everything"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setShow(k)} aria-pressed={show === k} className={`rounded-full px-3 py-1 ${show === k ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/8 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>{l}</button>
        ))}
      </div>

      {!loaded ? (
        <p className="text-[#7a8a99]">Loading…</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1a2b4a]/20 p-10 text-center">
          <p className="mb-1 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">No projects yet</p>
          <p className="mb-4 text-sm text-[#7a8a99]">Start from a ready-made plan (a MasterClass or a 21-Day Challenge) or begin with a blank project.</p>
          <button onClick={() => setCreating(true)} className="rounded-lg bg-[#2E7C83] px-5 py-2 text-sm font-semibold text-white">Start a project</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const pct = p.tasks ? Math.round((p.done / p.tasks) * 100) : 0;
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="group rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm transition hover:border-[#2E7C83]/50 hover:shadow-md dark:bg-[#1a2b4a]/20" style={{ borderTop: `4px solid ${p.color || "#2E7C83"}` }}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h2 className="font-semibold leading-snug text-[#1a2b4a] dark:text-[#F8F5F0]">{p.name}</h2>
                  <span className="flex-none rounded-full bg-[#1a2b4a]/8 px-2 py-0.5 text-[10px] font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{PROJECT_STATUS_LABEL[p.status] || p.status}</span>
                </div>
                {p.goal && <p className="mb-3 line-clamp-2 text-xs text-[#7a8a99]">{p.goal}</p>}
                <div className="mb-1 h-2 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${pct}%` }} /></div>
                <p className="mb-3 text-[11px] text-[#7a8a99]">{p.done} of {p.tasks} tasks done · {pct}%</p>
                <div className="space-y-1 text-xs text-[#7a8a99]">
                  {p.next && <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Next: {p.next.title} ({fmtDay(p.next.day)})</p>}
                  {(p.startDate || p.dueDate) && <p>{fmtDay(p.startDate)} to {fmtDay(p.dueDate)}{p.openMilestones ? ` · ${p.openMilestones} milestone${p.openMilestones === 1 ? "" : "s"} ahead` : ""}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCreating(false)}>
          <div role="dialog" aria-label="New project" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#F8F5F0] p-5 shadow-2xl dark:bg-[#14213a]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">New project</h2>
              <button onClick={() => setCreating(false)} aria-label="Close" className="rounded-lg p-1 text-[#7a8a99] hover:bg-[#1a2b4a]/10"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-2 text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Start from</p>
            <div className="mb-4 grid gap-2">
              <button onClick={() => setTpl("")} aria-pressed={!tpl} className={`rounded-xl border p-3 text-left ${!tpl ? "border-[#2E7C83] bg-[#2E7C83]/8" : "border-[#1a2b4a]/12"}`}>
                <span className="block text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Blank project</span>
                <span className="text-xs text-[#7a8a99]">Add your own tasks.</span>
              </button>
              {templates.map((t) => (
                <button key={t.key} onClick={() => { setTpl(t.key); if (!name) setName(t.name); }} aria-pressed={tpl === t.key} className={`rounded-xl border p-3 text-left ${tpl === t.key ? "border-[#2E7C83] bg-[#2E7C83]/8" : "border-[#1a2b4a]/12"}`}>
                  <span className="block text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{t.name}</span>
                  <span className="text-xs text-[#7a8a99]">{t.blurb} {t.tasks} tasks, dated for you.</span>
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className={LABEL} htmlFor="np-name">Project name</label>
                <input id="np-name" className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. October MasterClass" />
              </div>
              <div>
                <label className={LABEL} htmlFor="np-day">{chosen ? chosen.anchorLabel : "Due date (optional)"}</label>
                <input id="np-day" type="date" className={FIELD} value={day} onChange={(e) => setDay(e.target.value)} />
                {chosen && <p className="mt-1 text-[11px] text-[#7a8a99]">Every task is dated back from (or forward from) this day. You can change any date afterwards.</p>}
              </div>
              <div>
                <label className={LABEL} htmlFor="np-goal">Goal (optional)</label>
                <textarea id="np-goal" rows={2} className={FIELD} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={chosen ? "Leave blank to use the suggested goal" : "What does done look like?"} />
              </div>
            </div>
            {err && <p role="alert" className="mt-2 text-sm text-[#8a2f2f]">{err}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={create} disabled={busy || (!name.trim() && !tpl) || (!!chosen && !day)} className="rounded-lg bg-[#1a2b4a] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Creating…" : "Create project"}</button>
              <button onClick={() => setCreating(false)} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
