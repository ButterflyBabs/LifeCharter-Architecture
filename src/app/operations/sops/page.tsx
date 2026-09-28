"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2, Plus, Printer, Sparkles, Trash2 } from "lucide-react";
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
  status: "draft" | "active";
  last_reviewed: string | null;
  updated_at: string;
}
const EMPTY = { id: "", title: "", pillarKey: "", purpose: "", steps: [""], owner: "", tools: "", status: "draft" as "draft" | "active", notes: "" };
const pillarName = (k: string | null) => OPERATIONS_PILLARS.find((p) => p.key === k)?.name ?? "General";

export default function SopLibraryPage() {
  const [sops, setSops] = useState<Sop[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Sop | null>(null);
  const [q, setQ] = useState("");
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
    const list = (sops ?? []).filter((s) => !q || `${s.title} ${s.purpose ?? ""}`.toLowerCase().includes(q.toLowerCase()));
    const m = new Map<string, Sop[]>();
    for (const s of list) m.set(pillarName(s.pillar_key), [...(m.get(pillarName(s.pillar_key)) ?? []), s]);
    return Array.from(m.entries());
  }, [sops, q]);

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

  const active = (sops ?? []).filter((s) => s.status === "active").length;

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
                  <span className="w-6 text-right text-sm text-[#7a8a99]">{i + 1}.</span>
                  <Input value={st} onChange={(e) => setForm({ ...form, steps: form.steps.map((x, j) => (j === i ? e.target.value : x)) })} />
                  <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })} aria-label="Remove step"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, steps: [...form.steps, ""] })}><Plus className="w-3.5 h-3.5 mr-1" />Add a step</Button>
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
                <Button size="sm" variant="outline" onClick={() => edit(view)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(view)} aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setView(null)}>Close</Button>
              </div>
            </div>
            {view.purpose && <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">{view.purpose}</p>}
            <ol className="list-decimal pl-6 space-y-1 text-[#1a2b4a] dark:text-[#F8F5F0]">{view.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
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
                {list.map((s) => (
                  <button key={s.id} onClick={() => setView(s)} className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-4 text-left hover:border-[#c9a227]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.status === "active" ? "bg-[#2c6b3f]/10 text-[#2c6b3f]" : "bg-[#8a7f74]/10 text-[#8a7f74]"}`}>{s.status === "active" ? "In use" : "Draft"}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-[#7a8a99]">{s.purpose || `${s.steps.length} steps`}</p>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
