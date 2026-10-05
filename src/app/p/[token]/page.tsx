"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";

interface GuestData {
  guest: { name: string; role: "client" | "contractor" };
  from: string | null;
  project: { name: string; goal: string | null; status: string; startDate: string | null; dueDate: string | null; percent: number };
  milestones: { title: string; dueDay: string | null; done: boolean }[];
  tasks: { id: number; title: string; description: string; status: string; dueDay: string | null; mine: boolean; canUpdate: boolean }[];
}
const STATUS: Record<string, string> = { backlog: "To do", today: "Today", in_progress: "In progress", waiting: "Waiting", done: "Done" };
const fmt = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");

// A client's or contractor's private view of one project. No account; the link is the key.
export default function GuestProjectPage() {
  const { token } = useParams<{ token: string }>();
  const [d, setD] = useState<GuestData | null>(null);
  const [bad, setBad] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/project-share/${token}`, { cache: "no-store" });
    if (!res.ok) return setBad(true);
    setD(await res.json());
  }, [token]);
  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (taskId: number, status: string) => {
    setErr("");
    const res = await fetch(`/api/project-share/${token}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId, status }) });
    if (!res.ok) setErr((await res.json().catch(() => ({}))).error || "That didn't save.");
    await load();
  };

  if (bad) return <main className="mx-auto max-w-xl px-4 py-16 text-center text-[#1a2b4a]"><h1 className="mb-2 text-xl font-bold">This link isn&apos;t active</h1><p className="text-[#5a6472]">It may have been turned off. Ask the person who shared it for a new one.</p></main>;
  if (!d) return <main className="px-4 py-16 text-center text-[#7a8a99]">Loading…</main>;
  const mine = d.tasks.filter((t) => t.mine);
  const rest = d.tasks.filter((t) => !t.mine);
  return (
    <main className="mx-auto max-w-2xl bg-[#F8F5F0] px-4 py-10 text-[#1a2b4a] min-h-screen">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#b8923f]">{d.from ? `Shared by ${d.from}` : "Shared with you"}</p>
      <h1 className="text-3xl font-bold">{d.project.name}</h1>
      {d.project.goal && <p className="mt-2 text-[#5a6472]">{d.project.goal}</p>}
      <p className="mt-2 text-sm text-[#5a6472]">Hello {d.guest.name.split(" ")[0]}. {d.guest.role === "contractor" ? "You can update the tasks assigned to you." : "This is a view-only look at how the project is going."}</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${d.project.percent}%` }} /></div>
        <span className="text-sm text-[#5a6472]">{d.project.percent}% complete</span>
      </div>
      {(d.project.startDate || d.project.dueDate) && <p className="mt-1 text-xs text-[#5a6472]">{fmt(d.project.startDate)} to {fmt(d.project.dueDate)}</p>}

      {d.milestones.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#5a6472]">Milestones</h2>
          <ul className="space-y-1.5">
            {d.milestones.map((m, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                {m.done ? <CheckCircle2 className="h-4 w-4 text-[#2c6b3f]" /> : <Circle className="h-4 w-4 text-[#b8a898]" />}
                <span className={m.done ? "line-through opacity-60" : ""}>{m.title}</span>
                <span className="ml-auto text-xs text-[#5a6472]">{fmt(m.dueDay)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {err && <p role="alert" className="mt-4 text-sm text-[#8a2f2f]">{err}</p>}
      {mine.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#5a6472]">Assigned to you</h2>
          <ul className="space-y-2">
            {mine.map((t) => (
              <li key={t.id} className="rounded-xl bg-white p-3 shadow-sm">
                <p className="font-medium">{t.title}</p>
                {t.description && <p className="mt-1 text-sm text-[#5a6472]">{t.description}</p>}
                <div className="mt-2 flex items-center gap-3 text-xs text-[#5a6472]">
                  {t.dueDay && <span>Due {fmt(t.dueDay)}</span>}
                  {t.canUpdate ? (
                    <select value={t.status} onChange={(e) => setStatus(t.id, e.target.value)} aria-label={`Stage for ${t.title}`} className="ml-auto rounded-md border border-[#1a2b4a]/15 bg-white px-2 py-1 text-xs">
                      {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  ) : (
                    <span className="ml-auto">{STATUS[t.status]}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {rest.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#5a6472]">{mine.length ? "Also on the project" : "Tasks"}</h2>
          <ul className="space-y-1.5">
            {rest.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                {t.status === "done" ? <CheckCircle2 className="h-4 w-4 flex-none text-[#2c6b3f]" /> : <Circle className="h-4 w-4 flex-none text-[#b8a898]" />}
                <span className={t.status === "done" ? "line-through opacity-60" : ""}>{t.title}</span>
                <span className="ml-auto flex-none text-xs text-[#5a6472]">{t.dueDay ? `${fmt(t.dueDay)} · ` : ""}{STATUS[t.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {d.tasks.length === 0 && <p className="mt-8 text-sm text-[#5a6472]">No tasks have been shared yet.</p>}
    </main>
  );
}
