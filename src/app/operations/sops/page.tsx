"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, ArrowLeft, CheckCircle2, BookOpen, Heading2, Loader2, Plus, Printer, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OPERATIONS_PILLARS } from "@/lib/operations";

interface Sop {
  id: string;
  title: string;
  pillar_key: string | null;
  purpose: string | null;
  steps: string[];
  owner: string | null;
  tools: string | null;
  status: "draft" | "active" | "archived";
  last_reviewed: string | null;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  checks?: number[];
}
const EMPTY = { id: "", title: "", pillarKey: "", purpose: "", steps: [""], owner: "", tools: "", status: "draft" as "draft" | "active" | "archived", notes: "" };
const pillarName = (k: string | null) => OPERATIONS_PILLARS.find((p) => p.key === k)?.name ?? "General";
// Approval state of a SOP: approved, edited after it was approved, or still waiting for sign-off.
const approval = (s: Sop): "approved" | "edited" | "needed" =>
  !s.approved_at ? "needed" : new Date(s.updated_at).getTime() - new Date(s.approved_at).getTime() > 60_000 ? "edited" : "approved";
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Steps are read as a checklist: a line that starts with "## " is a section header, every other line is a step with
// a tick box. The first sentence of a step is shown bold so the list can be scanned.
const isHeader = (t: string) => /^##\s*/.test(t);
const headerText = (t: string) => t.replace(/^##\s*/, "").trim();
function leadAndRest(t: string): { lead: string; rest: string } {
  const m = t.match(/^([\s\S]{6,140}?[.:?!])\s+([\s\S]+)$/);
  return m ? { lead: m[1], rest: m[2] } : { lead: t, rest: "" };
}

function Checklist({ sop, onChange }: { sop: Sop; onChange: (checks: number[]) => void }) {
  const done = new Set(sop.checks ?? []);
  const stepIdx = sop.steps.map((t, i) => (isHeader(t) ? -1 : i)).filter((i) => i >= 0);
  const doneCount = stepIdx.filter((i) => done.has(i)).length;
  let n = 0;
  const toggle = (i: number) => {
    const next = new Set(done);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    onChange(Array.from(next).sort((a, b) => a - b));
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div className="h-2 min-w-[8rem] flex-1 overflow-hidden rounded-full bg-[#1a2b4a]/10">
          <div className="h-full rounded-full bg-[#2c6b3f] transition-all" style={{ width: `${stepIdx.length ? (doneCount / stepIdx.length) * 100 : 0}%` }} />
        </div>
        <span className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{doneCount} of {stepIdx.length} done</span>
        {doneCount > 0 && (
          <Button size="sm" variant="outline" onClick={() => onChange([])}><RotateCcw className="mr-1 h-3.5 w-3.5" />Start a fresh run</Button>
        )}
      </div>
      <div className="space-y-2">
        {sop.steps.map((t, i) => {
          if (isHeader(t)) {
            return (
              <h3 key={i} className="mt-5 border-b-2 border-[#c9a227]/50 pb-1 text-lg font-bold text-[#1a2b4a] first:mt-0 dark:text-[#F8F5F0]">
                {headerText(t)}
              </h3>
            );
          }
          n += 1;
          const { lead, rest } = leadAndRest(t);
          const checked = done.has(i);
          return (
            <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${checked ? "border-[#2c6b3f]/30 bg-[#2c6b3f]/5" : "border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20"}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(i)} className="mt-1 h-5 w-5 shrink-0 accent-[#2c6b3f]" />
              <span className={`min-w-0 text-[#1a2b4a] dark:text-[#F8F5F0] ${checked ? "opacity-60" : ""}`}>
                <span className="mr-1 text-sm font-semibold text-[#7a8a99]">{n}.</span>
                <span className={rest ? "font-semibold" : ""}>{lead}</span>
                {rest && <span className="block text-sm leading-relaxed">{rest}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function SopLibraryPage() {
  const [sops, setSops] = useState<Sop[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Sop | null>(null);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/sops", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setSops(d.sops ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const list = (sops ?? []).filter((s) => (showArchived || s.status !== "archived") && (!q || `${s.title} ${s.purpose ?? ""}`.toLowerCase().includes(q.toLowerCase())));
    const m = new Map<string, Sop[]>();
    for (const s of list) m.set(pillarName(s.pillar_key), [...(m.get(pillarName(s.pillar_key)) ?? []), s]);
    return Array.from(m.entries());
  }, [sops, q, showArchived]);

  function edit(s?: Sop) {
    setForm(
      s
        ? { id: s.id, title: s.title, pillarKey: s.pillar_key ?? "", purpose: s.purpose ?? "", steps: s.steps.length ? s.steps : [""], owner: s.owner ?? "", tools: s.tools ?? "", status: s.status, notes: "" }
        : EMPTY
    );
    setView(null);
    setOpen(true);
    setMsg("");
  }

  async function draft() {
    if (!form.title.trim()) return setMsg("Name the process first (e.g. \"Onboarding a new client\").");
    setBusy("draft");
    setMsg("");
    const r = await fetch("/api/sops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "draft", title: form.title, notes: form.notes, pillarKey: form.pillarKey }) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (d.needsKey) return setMsg("Connect your AI in Settings → AI to have your assistant draft SOPs.");
    if (!r.ok) return setMsg(d.error || "Couldn't draft it just now.");
    setForm((f) => ({ ...f, purpose: d.draft.purpose || f.purpose, steps: d.draft.steps?.length ? d.draft.steps : f.steps, owner: d.draft.owner || f.owner, tools: d.draft.tools || f.tools }));
  }

  async function save() {
    if (!form.title.trim()) return setMsg("Give the SOP a title.");
    setBusy("save");
    const r = await fetch("/api/sops", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(form.id ? { id: form.id } : {}), title: form.title, pillarKey: form.pillarKey, purpose: form.purpose, steps: form.steps, owner: form.owner, tools: form.tools, status: form.status }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) return setMsg(d.error || "Couldn't save the SOP.");
    setOpen(false);
    setForm(EMPTY);
    void load();
  }

  async function remove(s: Sop) {
    if (!confirm(`Delete "${s.title}"?`)) return;
    await fetch("/api/sops", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) });
    setView(null);
    void load();
  }

  async function markReviewed(s: Sop) {
    const today = new Date().toISOString().slice(0, 10);
    await fetch("/api/sops", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, lastReviewed: today }) });
    setView({ ...s, last_reviewed: today });
    void load();
  }

  // Ticking a step is saved on the SOP so everyone running it sees the same list; it never counts as an edit.
  async function saveChecks(s: Sop, checks: number[]) {
    setView({ ...s, checks });
    setSops((cur) => (cur ? cur.map((x) => (x.id === s.id ? { ...x, checks } : x)) : cur));
    await fetch("/api/sops", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, checks }) }).catch(() => {});
  }

  async function approve(s: Sop, on: boolean) {
    const r = await fetch("/api/sops", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, approve: on }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Couldn't save that.");
    setMsg(on ? `Approved "${s.title}". It is in use.` : `Approval withdrawn for "${s.title}". It is back to a draft.`);
    if (view?.id === s.id) setView(d.sop ?? null);
    void load();
  }

  async function setStatus(s: Sop, status: "draft" | "active" | "archived") {
    await fetch("/api/sops", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, status }) });
    setView(null);
    setMsg(status === "archived" ? `Archived "${s.title}". It is kept, and you can restore it any time.` : `Restored "${s.title}" as a draft.`);
    void load();
  }

  const active = (sops ?? []).filter((s) => s.status === "active").length;
  const archivedCount = (sops ?? []).filter((s) => s.status === "archived").length;

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto print:p-0">
      <div className="print:hidden">
        <Link href="/operations" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> Operations
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1c5a60] to-[#c9a227] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Playbook & SOPs</h1>
              <p className="text-[#7a8a99]">How your business runs, written down once. {sops ? `${active} in use · counts toward your Operations score.` : ""}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-44" />
            {archivedCount > 0 && (
              <Button variant="outline" onClick={() => setShowArchived((v) => !v)}>{showArchived ? "Hide archived" : `Show archived (${archivedCount})`}</Button>
            )}
            <Button onClick={() => edit()}><Plus className="w-4 h-4 mr-1" />New SOP</Button>
          </div>
        </div>
        {msg && <p className="mb-4 rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">{msg}</p>}
      </div>

      {open && (
        <Card className="mb-6 print:hidden">
          <CardHeader>
            <CardTitle>{form.id ? "Edit SOP" : "New SOP"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[1fr_220px]">
              <Input placeholder="Process name (e.g. Onboarding a new client)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select value={form.pillarKey} onChange={(e) => setForm({ ...form, pillarKey: e.target.value })} className="h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 text-sm" aria-label="Area">
                <option value="">General</option>
                {OPERATIONS_PILLARS.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
            </div>
            {!form.id && (
              <div className="rounded-xl bg-[#c9a227]/10 p-3 space-y-2">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional: jot how you do it today, and your assistant will turn it into clean steps."
                  className="w-full rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/20 p-2 text-sm"
                />
                <Button size="sm" variant="outline" onClick={draft} disabled={busy === "draft"}>
                  {busy === "draft" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}Draft it for me
                </Button>
              </div>
            )}
            <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={2} placeholder="Purpose: why this exists and what 'done' looks like" className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-2 text-sm" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Steps</p>
              {form.steps.map((st, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-right text-sm text-[#7a8a99]">{isHeader(st) ? "§" : i + 1 - form.steps.slice(0, i).filter(isHeader).length + "."}</span>
                  <Input className={isHeader(st) ? "font-bold" : ""} value={st} onChange={(e) => setForm({ ...form, steps: form.steps.map((x, j) => (j === i ? e.target.value : x)) })} />
                  <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })} aria-label="Remove step"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, steps: [...form.steps, ""] })}><Plus className="w-3.5 h-3.5 mr-1" />Add a step</Button>
                <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, steps: [...form.steps, "## "] })}><Heading2 className="w-3.5 h-3.5 mr-1" />Add a section header</Button>
              </div>
              <p className="text-xs text-[#7a8a99]">Each step becomes a tick box. A line that starts with ## is a section header. The first sentence of a step is shown bold, so start each step with the action.</p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Input placeholder="Owner (role)" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
              <Input placeholder="Tools used" value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              <input type="checkbox" checked={form.status === "active"} onChange={(e) => setForm({ ...form, status: e.target.checked ? "active" : "draft" })} className="h-4 w-4" />
              In use (not a draft)
            </label>
            <div className="flex gap-2">
              <Button onClick={save} disabled={busy === "save"}>Save SOP</Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {view && (
        <Card className="mb-6">
          <CardContent className="p-6 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#7a8a99]">{pillarName(view.pillar_key)}</p>
                <h2 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{view.title}</h2>
                <p className="text-xs text-[#7a8a99]">
                  {view.owner ? `Owner: ${view.owner} · ` : ""}
                  {view.tools ? `Tools: ${view.tools} · ` : ""}
                  {view.last_reviewed ? `Reviewed ${view.last_reviewed}` : "Not reviewed yet"}
                </p>
              </div>
              <div className="flex gap-1 print:hidden">
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>
                <Button size="sm" variant="outline" onClick={() => markReviewed(view)}>Mark reviewed today</Button>
                {view.status !== "archived" && approval(view) !== "approved" && <Button size="sm" onClick={() => approve(view, true)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approve</Button>}
                <Button size="sm" variant="outline" onClick={() => edit(view)}>Edit</Button>
                {view.status === "archived" ? (
                  <Button size="sm" variant="outline" onClick={() => setStatus(view, "draft")}><ArchiveRestore className="w-3.5 h-3.5 mr-1" />Restore</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setStatus(view, "archived")}><Archive className="w-3.5 h-3.5 mr-1" />Archive</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove(view)} aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setView(null)}>Close</Button>
              </div>
            </div>
            {view.purpose && <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">{view.purpose}</p>}
            <Checklist sop={view} onChange={(checks) => saveChecks(view, checks)} />
          </CardContent>
        </Card>
      )}

      <div className="print:hidden space-y-5">
        {sops === null ? (
          <p className="text-[#7a8a99]">Loading…</p>
        ) : !sops.length ? (
          <Card>
            <CardContent className="p-6 text-[#1a2b4a] dark:text-[#F8F5F0] space-y-2">
              <p>Start with the process you explain most often: onboarding a client, delivering your core service, or following up on a lead.</p>
              <p className="text-sm text-[#7a8a99]">Name it, jot how you do it today, and your assistant drafts clean steps you can edit.</p>
            </CardContent>
          </Card>
        ) : (
          groups.map(([group, list]) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">{group}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((s) => {
                  const ap = approval(s);
                  return (
                    <div key={s.id} className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-4 hover:border-[#c9a227]">
                      <button onClick={() => setView(s)} className="block w-full text-left">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.title}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.status === "active" ? "bg-[#2c6b3f]/10 text-[#2c6b3f]" : "bg-[#8a7f74]/10 text-[#8a7f74]"}`}>{s.status === "archived" ? "Archived" : s.status === "active" ? "In use" : "Draft"}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-[#7a8a99]">{s.purpose || `${s.steps.length} steps`}</p>
                      </button>
                      {s.status !== "archived" && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#1a2b4a]/10 pt-3">
                          {ap === "approved" ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2c6b3f]"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Approved {s.approved_at ? dayLabel(s.approved_at) : ""}</span>
                              <Button size="sm" variant="ghost" onClick={() => approve(s, false)}>Withdraw approval</Button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-semibold text-[#7a5a0e] dark:text-[#e0c35a]">{ap === "edited" ? "Edited since approved" : "Needs approval"}</span>
                              <Button size="sm" onClick={() => approve(s, true)}><CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden />Approve</Button>
                              <Button size="sm" variant="outline" onClick={() => edit(s)}>Edit</Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
