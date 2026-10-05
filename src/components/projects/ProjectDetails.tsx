"use client";

import { useState } from "react";
import { Check, Copy, Plus, Trash2, X } from "lucide-react";
import { PROJECT_STATUS_LABEL, type PData } from "./types";

const FIELD = "w-full rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]";
const LABEL = "mb-1 block text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0]";
const CARD = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/20";

export default function ProjectDetails({ data, api, onChanged, onDeleted }: { data: PData; api: string; onChanged: () => Promise<void>; onDeleted: () => void }) {
  const p = data.project;
  const [f, setF] = useState({ name: p.name, goal: p.goal, status: p.status, startDate: p.startDate ?? "", dueDate: p.dueDate ?? "", ownerMemberId: p.ownerMemberId ?? "", notes: p.notes });
  const [saved, setSaved] = useState("");
  const [err, setErr] = useState("");
  const [ms, setMs] = useState({ title: "", day: "" });
  const [guest, setGuest] = useState({ name: "", email: "", role: "client" });
  const [copied, setCopied] = useState("");
  const [del, setDel] = useState(false);

  const call = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "That didn't work.");
    return d;
  };
  const run = async (fn: () => Promise<unknown>) => {
    setErr("");
    try {
      await fn();
      await onChanged();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const save = () =>
    run(async () => {
      await call(api, "PATCH", { name: f.name, goal: f.goal, status: f.status, startDate: f.startDate || null, dueDate: f.dueDate || null, ownerMemberId: f.ownerMemberId || null, notes: f.notes });
      setSaved("Saved");
      setTimeout(() => setSaved(""), 1500);
    });

  const copy = async (link: string, id: string) => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* the link is shown anyway */
    }
    setCopied(id);
    setTimeout(() => setCopied(""), 1800);
  };

  return (
    <div className="space-y-5">
      {err && <p role="alert" className="text-sm text-[#8a2f2f]">{err}</p>}

      <section className={CARD}>
        <h3 className="mb-3 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">About this project</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="pd-name">Name</label>
            <input id="pd-name" className={FIELD} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="pd-goal">Goal</label>
            <textarea id="pd-goal" rows={2} className={FIELD} value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} />
          </div>
          <div>
            <label className={LABEL} htmlFor="pd-status">Status</label>
            <select id="pd-status" className={FIELD} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              {Object.entries(PROJECT_STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="pd-owner">Owner</label>
            <select id="pd-owner" className={FIELD} value={f.ownerMemberId} onChange={(e) => setF({ ...f, ownerMemberId: e.target.value })}>
              <option value="">Me</option>
              {data.team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="pd-start">Starts</label>
            <input id="pd-start" type="date" className={FIELD} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
          </div>
          <div>
            <label className={LABEL} htmlFor="pd-due">Ends</label>
            <input id="pd-due" type="date" className={FIELD} value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="pd-notes">Notes</label>
            <textarea id="pd-notes" rows={5} className={FIELD} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Decisions, links, anything the team should remember." />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={save} disabled={!f.name.trim()} className="rounded-lg bg-[#1a2b4a] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">Save</button>
          {saved && <span className="inline-flex items-center gap-1 text-sm text-[#2c6b3f]"><Check className="h-4 w-4" /> {saved}</span>}
        </div>
      </section>

      <section className={CARD}>
        <h3 className="mb-1 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Milestones</h3>
        <p className="mb-3 text-xs text-[#7a8a99]">The big moments. They show as diamonds on the timeline. Click a name or a date to change it.</p>
        <ul className="space-y-1.5">
          {data.milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={m.done} aria-label={`Done: ${m.title}`} onChange={(e) => run(() => call(`${api}/milestones/${m.id}`, "PATCH", { done: e.target.checked }))} />
              <input
                key={`t:${m.id}:${m.title}`}
                defaultValue={m.title}
                aria-label={`Milestone name: ${m.title}`}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (!v) e.target.value = m.title;
                  else if (v !== m.title) run(() => call(`${api}/milestones/${m.id}`, "PATCH", { title: v }));
                }}
                className={`min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[#1a2b4a] hover:border-[#1a2b4a]/15 focus:border-[#2E7C83] focus:bg-white dark:text-[#F8F5F0] dark:focus:bg-[#1a2b4a]/40 ${m.done ? "line-through opacity-60" : ""}`}
              />
              <input
                key={`d:${m.id}:${m.dueDay ?? ""}`}
                type="date"
                defaultValue={m.dueDay ?? ""}
                aria-label={`Date for ${m.title}`}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v !== (m.dueDay ?? "")) run(() => call(`${api}/milestones/${m.id}`, "PATCH", { dueDay: v || null }));
                }}
                className="rounded-md border border-[#1a2b4a]/15 bg-white px-1.5 py-1 text-xs text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]"
              />
              <button onClick={() => run(() => call(`${api}/milestones/${m.id}`, "DELETE"))} aria-label={`Remove ${m.title}`} className="text-[#7a8a99] hover:text-[#8a2f2f]"><X className="h-4 w-4" /></button>
            </li>
          ))}
          {data.milestones.length === 0 && <li className="text-sm text-[#7a8a99]">No milestones yet.</li>}
        </ul>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ms.title.trim()) return;
            run(async () => {
              await call(`${api}/milestones`, "POST", { title: ms.title, dueDay: ms.day || null });
              setMs({ title: "", day: "" });
            });
          }}
        >
          <input aria-label="Milestone" className={`${FIELD} flex-1 min-w-[10rem]`} placeholder="Add a milestone" value={ms.title} onChange={(e) => setMs({ ...ms, title: e.target.value })} />
          <input aria-label="Milestone date" type="date" className={`${FIELD} w-40`} value={ms.day} onChange={(e) => setMs({ ...ms, day: e.target.value })} />
          <button className="inline-flex items-center gap-1 rounded-lg border border-[#2E7C83] px-3 py-2 text-sm font-medium text-[#2E7C83]"><Plus className="h-4 w-4" /> Add</button>
        </form>
      </section>

      <section className={CARD}>
        <h3 className="mb-1 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Share with a client or contractor</h3>
        <p className="mb-3 text-xs text-[#7a8a99]">
          They get a private link and need no account. A <b>client</b> sees the project, its progress, milestones and the tasks you mark as shared. A <b>contractor</b> sees the same and can move the tasks assigned to them. Nothing is emailed: copy the link and send it yourself. Remove someone and the link stops working.
        </p>
        <ul className="space-y-2">
          {data.guests.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#1a2b4a]/5 px-3 py-2 text-sm">
              <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{g.name}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#7a8a99] dark:bg-[#1a2b4a]/40">{g.role}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-[#7a8a99]">{g.link}</span>
              <button onClick={() => copy(g.link, g.id)} className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7C83]">{copied === g.id ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy link</>}</button>
              <button onClick={() => run(() => call(`${api}/guests?guest=${g.id}`, "DELETE"))} className="text-xs text-[#8a2f2f] hover:underline">Remove</button>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!guest.name.trim()) return;
            run(async () => {
              await call(`${api}/guests`, "POST", guest);
              setGuest({ name: "", email: "", role: guest.role });
            });
          }}
        >
          <input aria-label="Name" className={`${FIELD} flex-1 min-w-[9rem]`} placeholder="Name" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
          <input aria-label="Email (optional)" className={`${FIELD} flex-1 min-w-[10rem]`} placeholder="Email (optional)" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} />
          <select aria-label="Role" className={`${FIELD} w-36`} value={guest.role} onChange={(e) => setGuest({ ...guest, role: e.target.value })}>
            <option value="client">Client</option>
            <option value="contractor">Contractor</option>
          </select>
          <button className="inline-flex items-center gap-1 rounded-lg border border-[#2E7C83] px-3 py-2 text-sm font-medium text-[#2E7C83]"><Plus className="h-4 w-4" /> Create link</button>
        </form>
      </section>

      <section className={CARD}>
        <h3 className="mb-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Delete this project</h3>
        {del ? (
          <div className="space-y-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
            <p>What should happen to its {data.tasks.length} task{data.tasks.length === 1 ? "" : "s"}?</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => run(async () => { await call(api, "DELETE"); onDeleted(); })} className="rounded-lg border border-[#1a2b4a]/25 px-3 py-1.5">Keep them as ordinary tasks</button>
              <button onClick={() => run(async () => { await call(`${api}?tasks=delete`, "DELETE"); onDeleted(); })} className="rounded-lg bg-[#8a2f2f] px-3 py-1.5 text-white">Delete them too</button>
              <button onClick={() => setDel(false)} className="px-3 py-1.5 text-[#7a8a99] underline">Never mind</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setDel(true)} className="inline-flex items-center gap-1 text-sm text-[#8a2f2f] hover:underline"><Trash2 className="h-4 w-4" /> Delete project</button>
        )}
      </section>
    </div>
  );
}
