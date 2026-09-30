"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, X, Settings2, ExternalLink, Trash2, CalendarClock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import ContactLookupInput, { lookupName } from "@/components/crm/ContactLookupInput";

type Stage = { id: string; key: string | null; name: string; followUpDays: number | null; kind: "open" | "booked" | "closed"; sortOrder: number };
type Card = {
  id: string;
  stage_id: string;
  contact_id: string | null;
  name: string;
  handle: string | null;
  profile_url: string | null;
  email: string | null;
  platform: "IG" | "FB" | "LI";
  script_id: string | null;
  script_title: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  follow_up_on: string | null;
  deal_id: string | null;
  sort_order: number;
  stage_changed_at: string;
};
type ScriptLite = { id: string; title: string; platforms: string[]; channel: string };

const PLATFORMS = [
  { id: "IG", label: "Instagram", short: "IG", color: "bg-[#E1306C]/10 text-[#B0245A] border-[#E1306C]/30" },
  { id: "FB", label: "Facebook", short: "FB", color: "bg-[#1877F2]/10 text-[#1459B8] border-[#1877F2]/30" },
  { id: "LI", label: "LinkedIn", short: "LI", color: "bg-[#0A66C2]/10 text-[#0A4F96] border-[#0A66C2]/30" },
] as const;
const plat = (id: string) => PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];
const box = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const LOOKUP = "flex h-10 w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] placeholder:text-[#b8a898] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 focus:border-[#c9a227] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]";
const shortDate = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "");
const ago = (iso: string | null) => {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
};

type Draft = { name: string; handle: string; profileUrl: string; email: string; platform: string; contactId: string | null; stageId: string; scriptId: string; notes: string };

export default function DmPipeline() {
  const tz = typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Denver";
  const [stages, setStages] = useState<Stage[]>([]);
  const [boardName, setBoardName] = useState("DM Pipeline");
  const [cards, setCards] = useState<Card[] | null>(null);
  const [today, setToday] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [dragId, setDragId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [scripts, setScripts] = useState<ScriptLite[]>([]);
  const [initial, setInitial] = useState<Partial<Draft> | undefined>(undefined);

  // Arriving from Scripts & Templates: /dm-pipeline?add=1&script=<id>&platform=LI
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("add") === "1") {
      const p = q.get("platform");
      setInitial({ scriptId: q.get("script") || "", ...(p && ["IG", "FB", "LI"].includes(p) ? { platform: p } : {}) });
      setAdding(true);
      window.history.replaceState(null, "", "/dm-pipeline");
    }
  }, []);

  const load = useCallback(async () => {
    const d = await fetch(`/api/dm-pipeline?tz=${encodeURIComponent(tz)}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    if (d.error) setMsg(d.error);
    setStages(d.stages ?? []);
    if (d.name) setBoardName(d.name);
    setCards(d.cards ?? []);
    setToday(d.today ?? "");
  }, [tz]);
  useEffect(() => {
    void load();
    fetch("/api/scripts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setScripts(((d.items ?? []) as ScriptLite[]).filter((s) => s.channel === "dm" || (s.platforms ?? []).some((p) => ["DM", "IG", "FB", "LI"].includes(p)))))
      .catch(() => {});
  }, [load]);

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/dm-pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, tz }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error || "Something went wrong.");
      return null;
    }
    return d;
  }

  async function move(cardId: string, stageId: string) {
    const card = cards?.find((c) => c.id === cardId);
    if (!card || card.stage_id === stageId) return;
    const stage = stages.find((s) => s.id === stageId);
    setCards((cs) => (cs ?? []).map((c) => (c.id === cardId ? { ...c, stage_id: stageId } : c)));
    const d = await post({ action: "move", cardId, stageId });
    if (d?.card) {
      setCards((cs) => (cs ?? []).map((c) => (c.id === cardId ? { ...c, ...d.card } : c)));
      if (stage?.kind === "booked") setMsg(`${card.name} is booked, and added to your Sales Pipeline.`);
      else if (stage?.followUpDays != null) setMsg(`${card.name} moved to ${stage.name}. Follow-up set for ${shortDate(d.card.follow_up_on)} and added to your tasks.`);
    } else void load();
  }

  const visible = useMemo(() => (cards ?? []).filter((c) => filter === "All" || c.platform === filter), [cards, filter]);
  const dueCount = visible.filter((c) => c.follow_up_on && today && c.follow_up_on <= today).length;
  const open = cards?.find((c) => c.id === openId) ?? null;

  return (
    <div className="py-8 px-4 sm:px-6 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a] flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{boardName}</h1>
            <p className="text-[#7a8a99]">Everyone you&rsquo;re messaging on Instagram, Facebook and LinkedIn. Drag a card to its next stage and the follow-up sets itself.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettings(true)}><Settings2 className="w-4 h-4 mr-1" /> Settings</Button>
          <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-1" /> Add a prospect</Button>
        </div>
      </div>

      {msg && (
        <button onClick={() => setMsg("")} className="mb-4 block w-full text-left rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">
          {msg}
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[{ id: "All", label: "All platforms" }, ...PLATFORMS].map((p) => (
          <button
            key={p.id}
            onClick={() => setFilter(p.id)}
            aria-pressed={filter === p.id}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border ${filter === p.id ? "bg-[#1a2b4a] text-white border-[#1a2b4a]" : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}
          >
            {p.label}
          </button>
        ))}
        {dueCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#C76F56]/10 px-3 py-1.5 text-xs font-medium text-[#A4523C]">
            <AlertCircle className="w-3.5 h-3.5" /> {dueCount} follow-up{dueCount === 1 ? "" : "s"} due
          </span>
        )}
      </div>

      {!cards ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-3">
            {stages.map((s) => {
              const col = visible.filter((c) => c.stage_id === s.id);
              return (
                <section
                  key={s.id}
                  aria-label={s.name}
                  onDragOver={(e) => { if (dragId) e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); if (dragId) void move(dragId, s.id); setDragId(null); }}
                  className={`flex w-64 shrink-0 flex-col rounded-2xl border p-3 ${s.kind === "booked" ? "border-green-500/30 bg-green-500/5" : s.kind === "closed" ? "border-[#7b6b8d]/20 bg-[#7b6b8d]/5" : "border-[#1a2b4a]/10 bg-[#1a2b4a]/[0.03] dark:border-white/10 dark:bg-white/5"}`}
                >
                  <div className="mb-3 px-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.name}</h2>
                      <span className="text-xs text-[#7b6b8d]">{col.length}</span>
                    </div>
                    <p className="text-xs text-[#7b6b8d]">
                      {s.kind === "booked" ? "Adds a Sales Pipeline deal" : s.followUpDays == null ? "No follow-up" : s.followUpDays === 0 ? "Follow up today" : `Follow up in ${s.followUpDays} day${s.followUpDays === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-h-[40px]">
                    {col.map((c) => {
                      const p = plat(c.platform);
                      const overdue = c.follow_up_on && today && c.follow_up_on < today;
                      const due = c.follow_up_on && c.follow_up_on === today;
                      return (
                        <article
                          key={c.id}
                          draggable
                          onDragStart={() => setDragId(c.id)}
                          onDragEnd={() => setDragId(null)}
                          className={`rounded-xl border bg-white p-3 shadow-sm dark:bg-[#1a2b4a]/60 cursor-grab active:cursor-grabbing ${overdue ? "border-[#C76F56]/60" : due ? "border-[#c9a227]/70" : "border-[#1a2b4a]/10 dark:border-white/10"}`}
                        >
                          <button onClick={() => setOpenId(c.id)} className="block w-full text-left">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold leading-snug text-[#1a2b4a] dark:text-[#F8F5F0]">{c.name}</p>
                              <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${p.color}`}>{p.short}</span>
                            </div>
                            {c.handle && <p className="text-xs text-[#7b6b8d] truncate">{c.handle}</p>}
                            {c.script_title && <p className="mt-1 text-[11px] text-[#5a6472] dark:text-[#b8c2cf] truncate">Script: {c.script_title}</p>}
                            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                              {c.follow_up_on && (
                                <span className={`inline-flex items-center gap-1 ${overdue ? "text-[#A4523C] font-semibold" : due ? "text-[#8a6a15] font-semibold" : "text-[#7b6b8d]"}`}>
                                  <CalendarClock className="w-3 h-3" /> {overdue ? "Overdue · " : due ? "Today · " : ""}{shortDate(c.follow_up_on)}
                                </span>
                              )}
                              {c.last_contacted_at && <span className="text-[#7b6b8d]">DM&rsquo;d {ago(c.last_contacted_at)}</span>}
                            </div>
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {adding && stages.length > 0 && <AddCard stages={stages} scripts={scripts} initial={initial} onClose={() => { setAdding(false); setInitial(undefined); }} onSaved={(c) => { setCards((cs) => [...(cs ?? []), c]); setAdding(false); setMsg(`${c.name} added.${c.follow_up_on ? ` Follow-up set for ${shortDate(c.follow_up_on)}.` : ""}`); }} post={post} />}
      {open && <CardDetail card={open} stages={stages} onClose={() => setOpenId(null)} onMove={(sid) => void move(open.id, sid)} onSaved={(c) => setCards((cs) => (cs ?? []).map((x) => (x.id === c.id ? { ...x, ...c } : x)))} onDeleted={() => { setCards((cs) => (cs ?? []).filter((x) => x.id !== open.id)); setOpenId(null); }} post={post} />}
      {settings && <StageSettings boardName={boardName} stages={stages} onClose={() => setSettings(false)} onSaved={(s, n) => { setStages(s); setBoardName(n); setSettings(false); setMsg("Saved. New follow-ups use the new days."); }} post={post} />}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label={title} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#15233d]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-[#1a2b4a]/5"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PlatformPick({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2" role="group" aria-label="Platform">
      {PLATFORMS.map((p) => (
        <button key={p.id} type="button" aria-pressed={value === p.id} onClick={() => onChange(p.id)} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${value === p.id ? "bg-[#2E7C83] text-white border-[#2E7C83]" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

function AddCard({ stages, scripts, onClose, onSaved, post, initial }: { stages: Stage[]; scripts: ScriptLite[]; onClose: () => void; onSaved: (c: Card) => void; post: (b: Record<string, unknown>) => Promise<{ card?: Card } | null>; initial?: Partial<Draft> }) {
  const sent = stages.find((s) => s.key === "sent") ?? stages[0];
  const [d, setD] = useState<Draft>({ name: "", handle: "", profileUrl: "", email: "", platform: "IG", contactId: null, stageId: sent?.id ?? "", scriptId: "", notes: "", ...initial });
  const [busy, setBusy] = useState(false);
  const stage = stages.find((s) => s.id === d.stageId);
  return (
    <Modal title="Add a prospect" onClose={onClose}>
      <div className="space-y-3">
        <PlatformPick value={d.platform} onChange={(v) => setD({ ...d, platform: v })} />
        <label className="block text-xs font-medium text-[#5a6472]">Name (or search your contacts)
          <ContactLookupInput className={LOOKUP} value={d.name} onChange={(v) => setD({ ...d, name: v, contactId: null })} pickLabel="Use" onPick={(c) => setD({ ...d, name: lookupName(c), email: c.email, contactId: c.id })} />
        </label>
        {d.contactId && <p className="text-xs text-[#2E7C83]">Linked to their contact record.</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#5a6472]">Handle
            <Input value={d.handle} onChange={(e) => setD({ ...d, handle: e.target.value })} placeholder="@theirhandle" />
          </label>
          <label className="block text-xs font-medium text-[#5a6472]">Email (optional, adds them to Contacts)
            <Input type="email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} disabled={Boolean(d.contactId)} />
          </label>
        </div>
        <label className="block text-xs font-medium text-[#5a6472]">Profile link (optional)
          <Input value={d.profileUrl} onChange={(e) => setD({ ...d, profileUrl: e.target.value })} placeholder="https://" />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#5a6472]">Stage
            <select value={d.stageId} onChange={(e) => setD({ ...d, stageId: e.target.value })} className={`${box} h-10`}>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-[#5a6472]">Script used (optional)
            <select value={d.scriptId} onChange={(e) => setD({ ...d, scriptId: e.target.value })} className={`${box} h-10`}>
              <option value="">None</option>
              {scripts.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-xs font-medium text-[#5a6472]">Notes
          <textarea rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} className={box} />
        </label>
        {stage && <p className="text-xs text-[#7a8a99]">{stage.followUpDays == null ? "No follow-up in this stage." : `A follow-up task is set ${stage.followUpDays === 0 ? "for today" : `for ${stage.followUpDays} day${stage.followUpDays === 1 ? "" : "s"} from now`}.`}</p>}
        <div className="flex gap-2 pt-1">
          <Button
            disabled={busy || !d.name.trim()}
            onClick={async () => {
              setBusy(true);
              const script = scripts.find((s) => s.id === d.scriptId);
              const r = await post({ action: "add", ...d, scriptTitle: script?.title ?? "" });
              setBusy(false);
              if (r?.card) onSaved(r.card);
            }}
          >
            {busy ? "Adding…" : "Add to DM Pipeline"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

function CardDetail({ card, stages, onClose, onMove, onSaved, onDeleted, post }: { card: Card; stages: Stage[]; onClose: () => void; onMove: (stageId: string) => void; onSaved: (c: Card) => void; onDeleted: () => void; post: (b: Record<string, unknown>) => Promise<{ card?: Card } | null> }) {
  const [d, setD] = useState({ name: card.name, handle: card.handle ?? "", profileUrl: card.profile_url ?? "", email: card.email ?? "", platform: card.platform as string, notes: card.notes ?? "", followUpOn: card.follow_up_on ?? "" });
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={card.name} onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-xs font-medium text-[#5a6472]">Stage
          <select value={card.stage_id} onChange={(e) => onMove(e.target.value)} className={`${box} h-10`}>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <PlatformPick value={d.platform} onChange={(v) => setD({ ...d, platform: v })} />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#5a6472]">Name<Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Handle<Input value={d.handle} onChange={(e) => setD({ ...d, handle: e.target.value })} /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Email<Input type="email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Follow up on<Input type="date" value={d.followUpOn} onChange={(e) => setD({ ...d, followUpOn: e.target.value })} /></label>
        </div>
        <label className="block text-xs font-medium text-[#5a6472]">Profile link<Input value={d.profileUrl} onChange={(e) => setD({ ...d, profileUrl: e.target.value })} placeholder="https://" /></label>
        <label className="block text-xs font-medium text-[#5a6472]">Notes<textarea rows={3} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} className={box} /></label>
        <div className="flex flex-wrap gap-3 text-sm">
          {card.profile_url && <a href={card.profile_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2E7C83] hover:underline">Open their profile <ExternalLink className="w-3.5 h-3.5" /></a>}
          {card.contact_id && <Link href="/contacts" className="text-[#2E7C83] hover:underline">In Contacts</Link>}
          {card.deal_id && <Link href="/sales/pipeline" className="text-[#2E7C83] hover:underline">In Sales Pipeline</Link>}
          {card.script_title && <span className="text-[#7a8a99]">Script: {card.script_title}</span>}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await post({ action: "update", cardId: card.id, ...d });
              setBusy(false);
              if (r?.card) { onSaved(r.card); onClose(); }
            }}
          >
            Save
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <button
            onClick={async () => { if (confirm(`Take ${card.name} off the DM Pipeline? Their open follow-up task goes too; they stay in Contacts.`) && (await post({ action: "delete", cardId: card.id }))) onDeleted(); }}
            className="ml-auto inline-flex items-center gap-1 text-sm text-[#C76F56] hover:underline"
          >
            <Trash2 className="w-4 h-4" /> Remove
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StageSettings({ boardName, stages, onClose, onSaved, post }: { boardName: string; stages: Stage[]; onClose: () => void; onSaved: (s: Stage[], name: string) => void; post: (b: Record<string, unknown>) => Promise<{ stages?: Stage[]; name?: string } | null> }) {
  const [name, setName] = useState(boardName);
  const [rows, setRows] = useState(stages.map((s) => ({ id: s.id, name: s.name, followUpDays: s.followUpDays == null ? "" : String(s.followUpDays), kind: s.kind })));
  return (
    <Modal title="Board settings" onClose={onClose}>
      <label className="mb-4 block text-xs font-medium text-[#5a6472]">Board name (shows in your menu too)
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="DM Pipeline" />
      </label>
      <p className="mb-3 text-sm text-[#7a8a99]">Rename a stage or change how many days after a move its follow-up is due. Leave days empty for no follow-up.</p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[1fr_110px] gap-2 items-center">
            <Input value={r.name} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Stage name" />
            <div className="flex items-center gap-1">
              <Input type="number" min={0} max={365} value={r.followUpDays} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, followUpDays: e.target.value } : x)))} aria-label={`${r.name} follow-up days`} disabled={r.kind !== "open"} />
              <span className="text-xs text-[#7a8a99]">days</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          onClick={async () => {
            const n = name.trim() !== boardName ? await post({ action: "name", name }) : { name: boardName };
            const d = await post({ action: "stages", stages: rows.map((r) => ({ id: r.id, name: r.name, followUpDays: r.followUpDays === "" ? null : Number(r.followUpDays) })) });
            if (d?.stages) onSaved(d.stages, n?.name || boardName);
          }}
        >
          Save
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}

