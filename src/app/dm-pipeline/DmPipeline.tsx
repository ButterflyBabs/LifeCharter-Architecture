"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, X, Settings2, ExternalLink, Trash2, CalendarClock, AlertCircle, ChevronLeft, ChevronRight, Tag, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import ContactLookupInput, { lookupName } from "@/components/crm/ContactLookupInput";

type Board = { id: string; name: string; tag: string | null; sortOrder: number };
export type Stage = { id: string; boardId: string; key: string | null; name: string; tag: string | null; followUpDays: number | null; kind: "open" | "booked" | "closed"; sortOrder: number };
export type Card = {
  id: string;
  board_id: string;
  stage_id: string;
  contact_id: string | null;
  name: string;
  handle: string | null;
  profile_url: string | null;
  email: string | null;
  platform: string | null;
  script_id: string | null;
  script_title: string | null;
  link_code?: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  follow_up_on: string | null;
  deal_id: string | null;
  sort_order: number;
  stage_changed_at: string;
};
export type ScriptLite = { id: string; title: string; platforms: string[]; channel: string; content?: string };
export type Post = (b: Record<string, unknown>) => Promise<Record<string, unknown> | null>;

const PLATFORMS = [
  // solid = the badge on each card; bar = the stripe down the card's left edge. Facebook and LinkedIn are
  // both "blue" brands, so LinkedIn takes a deep navy here to keep the two apart at a glance.
  { id: "IG", label: "Instagram", short: "IG", color: "bg-[#E1306C]/10 text-[#B0245A] border-[#E1306C]/30", solid: "bg-[#C13584] text-white", bar: "border-l-[#C13584]" },
  { id: "FB", label: "Facebook", short: "FB", color: "bg-[#1877F2]/10 text-[#1459B8] border-[#1877F2]/30", solid: "bg-[#1877F2] text-white", bar: "border-l-[#1877F2]" },
  { id: "LI", label: "LinkedIn", short: "LI", color: "bg-[#0A66C2]/10 text-[#0A4F96] border-[#0A66C2]/30", solid: "bg-[#0A3D62] text-white", bar: "border-l-[#0A3D62]" },
  { id: "Email", label: "Email", short: "Email", color: "bg-[#2E7C83]/10 text-[#1F5E63] border-[#2E7C83]/30", solid: "bg-[#2E7C83] text-white", bar: "border-l-[#2E7C83]" },
  { id: "TXT", label: "Text", short: "Text", color: "bg-[#c9a227]/15 text-[#6b5410] border-[#c9a227]/40", solid: "bg-[#8a6a15] text-white", bar: "border-l-[#8a6a15]" },
] as const;
const plat = (id: string | null) => PLATFORMS.find((p) => p.id === id) ?? null;
const KIND_LABEL = { open: "Open", booked: "Booked (adds a Sales Pipeline deal)", closed: "Closed" };
const box = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const LOOKUP = "flex h-10 w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] placeholder:text-[#b8a898] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 focus:border-[#c9a227] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]";
const shortDate = (d: string | null | undefined) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "");
const ago = (iso: string | null) => {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
};
const followLabel = (s: Stage) => (s.kind === "booked" ? "Adds a Sales Pipeline deal" : s.followUpDays == null ? "No follow-up" : s.followUpDays === 0 ? "Follow up today" : `Follow up in ${s.followUpDays} day${s.followUpDays === 1 ? "" : "s"}`);

type Draft = { name: string; handle: string; profileUrl: string; email: string; platform: string; contactId: string | null; stageId: string; scriptId: string; notes: string };

export default function DmPipeline({ purpose = "outreach", embedded = false }: { purpose?: "outreach" | "affiliate"; embedded?: boolean }) {
  const tz = typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Denver";
  const [boards, setBoards] = useState<Board[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [today, setToday] = useState("");
  const [nextSession, setNextSession] = useState<string | null>(null);
  const [sending, setSending] = useState<{ cardId: string; scriptId: string } | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [dragId, setDragId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [creating, setCreating] = useState(false);
  const [scripts, setScripts] = useState<ScriptLite[]>([]);
  const [initial, setInitial] = useState<Partial<Draft> | undefined>(undefined);

  // Arriving from Scripts & Templates: /dm-pipeline?add=1&script=<id>&platform=LI
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!embedded && q.get("add") === "1") {
      const p = q.get("platform");
      setInitial({ scriptId: q.get("script") || "", ...(p && PLATFORMS.some((x) => x.id === p) ? { platform: p } : {}) });
      setAdding(true);
      window.history.replaceState(null, "", "/dm-pipeline");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(
    async (boardId?: string) => {
      const q = new URLSearchParams({ tz, purpose });
      if (boardId) q.set("board", boardId);
      const d = await fetch(`/api/dm-pipeline?${q}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
      if (d.error) setMsg(d.error);
      setBoards(d.boards ?? []);
      setBoard(d.board ?? null);
      setStages(d.stages ?? []);
      setCards(d.cards ?? []);
      setToday(d.today ?? "");
      setNextSession(d.nextSession ?? null);
      try {
        if (d.board?.id) localStorage.setItem(`pipelines-board-${purpose}`, d.board.id);
      } catch {
        /* not remembered */
      }
    },
    [tz, purpose]
  );
  useEffect(() => {
    let last: string | undefined;
    try {
      last = localStorage.getItem(`pipelines-board-${purpose}`) || undefined;
    } catch {
      /* none */
    }
    void load(last);
    fetch("/api/scripts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setScripts(((d.items ?? []) as ScriptLite[]).filter((s) => s.channel === "dm" || (s.platforms ?? []).some((p) => ["DM", "IG", "FB", "LI", "Email", "TXT"].includes(p)))))
      .catch(() => {});
  }, [load, purpose]);

  const post: Post = async (body) => {
    const r = await fetch("/api/dm-pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, tz, purpose }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error || "Something went wrong.");
      return null;
    }
    return d;
  };

  // The message opens in its own small window, so it can sit beside LinkedIn while you paste. If the browser blocks
  // pop-ups it opens over the page instead.
  function openSend(cardId: string, scriptId: string) {
    const q = new URLSearchParams({ card: cardId, script: scriptId, board: board?.id ?? "", purpose });
    const w = window.open(`/dm-send?${q}`, "dm-send", "popup=yes,width=560,height=760,left=80,top=60");
    if (w) w.focus();
    else setSending({ cardId, scriptId });
  }

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "dm-sent") return;
      const saved = e.data.card as Card;
      setCards((cs) => (cs ?? []).map((x) => (x.id === saved.id ? { ...x, ...saved } : x)));
      setOpenId(null);
      if (e.data.note) setMsg(String(e.data.note));
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  async function move(cardId: string, stageId: string) {
    const card = cards?.find((c) => c.id === cardId);
    if (!card || card.stage_id === stageId) return;
    const stage = stages.find((s) => s.id === stageId);
    setCards((cs) => (cs ?? []).map((c) => (c.id === cardId ? { ...c, stage_id: stageId } : c)));
    const d = (await post({ action: "move", cardId, stageId })) as { card?: Card } | null;
    if (d?.card) {
      setCards((cs) => (cs ?? []).map((c) => (c.id === cardId ? { ...c, ...d.card } : c)));
      const tagNote = stage?.tag && card.contact_id ? ` Tagged ${stage.tag}.` : "";
      if (stage?.kind === "booked") setMsg(`${card.name} is booked, and added to your Sales Pipeline.${tagNote}`);
      else if (stage?.followUpDays != null) setMsg(`${card.name} moved to ${stage.name}. Follow-up set for ${shortDate(d.card.follow_up_on)} and added to your tasks.${tagNote}`);
      else if (tagNote) setMsg(`${card.name} moved to ${stage?.name}.${tagNote}`);
    } else void load(board?.id);
  }

  const visible = useMemo(() => (cards ?? []).filter((c) => filter === "All" || c.platform === filter), [cards, filter]);
  const dueCount = visible.filter((c) => c.follow_up_on && today && c.follow_up_on <= today).length;
  const open = cards?.find((c) => c.id === openId) ?? null;

  return (
    <div className={embedded ? "" : "py-8 px-4 sm:px-6 max-w-[1500px] mx-auto"}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className={`flex items-center gap-3 ${embedded ? "hidden" : ""}`}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a] flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{board?.name ?? "Pipelines"}</h1>
            <p className="text-[#7a8a99]">Drag someone to their next stage: the follow-up sets itself and their contact record picks up the stage&rsquo;s tag.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {board && <Button variant="outline" onClick={() => setSettings(true)}><Settings2 className="w-4 h-4 mr-1" /> Stages & settings</Button>}
          {board && <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-1" /> Add a person</Button>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-[#1a2b4a]/10 pb-3" role="tablist" aria-label="Your pipelines">
        {boards.map((b) => (
          <button
            key={b.id}
            role="tab"
            aria-selected={b.id === board?.id}
            onClick={() => void load(b.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${b.id === board?.id ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/10"}`}
          >
            {b.name}
          </button>
        ))}
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#2E7C83]/50 px-3 py-1.5 text-sm text-[#2E7C83] hover:bg-[#2E7C83]/5">
          <Plus className="w-4 h-4" /> {purpose === "affiliate" ? "New recruiting board" : "New pipeline"}
        </button>
      </div>

      {msg && (
        <button onClick={() => setMsg("")} className="mb-4 block w-full text-left rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">
          {msg}
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[{ id: "All", label: "All" }, ...PLATFORMS].map((p) => (
          <button
            key={p.id}
            onClick={() => setFilter(p.id)}
            aria-pressed={filter === p.id}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border ${filter === p.id ? "bg-[#1a2b4a] text-white border-[#1a2b4a]" : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}
          >
            {p.label}
            {cards ? <span className="ml-1.5 tabular-nums opacity-70">{p.id === "All" ? cards.length : cards.filter((c) => c.platform === p.id).length}</span> : null}
          </button>
        ))}
        {board?.tag && (
          <span className="inline-flex items-center gap-1 text-xs text-[#7a8a99]"><Tag className="w-3.5 h-3.5" /> Everyone here is tagged <strong className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{board.tag}</strong></span>
        )}
        {dueCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#C76F56]/10 px-3 py-1.5 text-xs font-medium text-[#A4523C]">
            <AlertCircle className="w-3.5 h-3.5" /> {dueCount} follow-up{dueCount === 1 ? "" : "s"} due
          </span>
        )}
        <Link href="/daily-compass/scripts" className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#2E7C83]/40 px-3 py-1.5 text-xs font-medium text-[#2E7C83] hover:bg-[#2E7C83]/5">
          <FileText className="w-3.5 h-3.5" /> DM scripts &amp; templates
        </Link>
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
                    <p className="text-xs text-[#7b6b8d]">{followLabel(s)}</p>
                    {s.tag && <p className="text-[11px] text-[#7b6b8d] truncate" title="Tag given to their contact record">Tag: {s.tag}</p>}
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
                          className={`rounded-xl border border-l-4 bg-white p-3 shadow-sm dark:bg-[#1a2b4a]/60 cursor-grab active:cursor-grabbing ${overdue ? "border-[#C76F56]/60" : due ? "border-[#c9a227]/70" : "border-[#1a2b4a]/10 dark:border-white/10"} ${p ? p.bar : "border-l-[#b8a898]"}`}
                        >
                          <button onClick={() => setOpenId(c.id)} className="block w-full text-left">
                            <span className={`mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${p ? p.solid : "bg-[#b8a898]/25 text-[#5a6472] dark:text-[#b8c2cf]"}`}>{p ? p.label : "No platform set"}</span>
                            <p className="font-semibold leading-snug text-[#1a2b4a] dark:text-[#F8F5F0]">{c.name}</p>
                            {c.handle && <p className="text-xs text-[#7b6b8d] truncate">{c.handle}</p>}
                            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                              {c.follow_up_on && (
                                <span className={`inline-flex items-center gap-1 ${overdue ? "text-[#A4523C] font-semibold" : due ? "text-[#8a6a15] font-semibold" : "text-[#7b6b8d]"}`}>
                                  <CalendarClock className="w-3 h-3" /> {overdue ? "Overdue · " : due ? "Today · " : ""}{shortDate(c.follow_up_on)}
                                </span>
                              )}
                              {c.last_contacted_at && <span className="text-[#7b6b8d]">Messaged {ago(c.last_contacted_at)}</span>}
                              {!c.contact_id && <span className="text-[#7b6b8d]" title="Add an email to put them in Contacts and tag them">Not in Contacts</span>}
                            </div>
                          </button>
                          <DmSentPick card={c} scripts={scripts} onPick={(sid) => openSend(c.id, sid)} />
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

      {sending && (() => {
        const c = cards?.find((x) => x.id === sending.cardId);
        const sc = scripts.find((x) => x.id === sending.scriptId);
        return c && sc ? (
          <SendDm
            key={`${c.id}-${sc.id}`}
            card={c}
            script={sc}
            stages={stages}
            sessionIso={nextSession}
            onClose={() => setSending(null)}
            onDone={(saved, note) => { setCards((cs) => (cs ?? []).map((x) => (x.id === saved.id ? { ...x, ...saved } : x))); setSending(null); setOpenId(null); setMsg(note); }}
            post={post}
          />
        ) : null;
      })()}

      {adding && board && stages.length > 0 && (
        <AddCard
          board={board}
          stages={stages}
          scripts={scripts}
          initial={initial}
          onClose={() => { setAdding(false); setInitial(undefined); }}
          onSaved={(c) => { setCards((cs) => [...(cs ?? []), c]); setAdding(false); setInitial(undefined); setMsg(`${c.name} added to ${board.name}.${c.follow_up_on ? ` Follow-up set for ${shortDate(c.follow_up_on)}.` : ""}`); }}
          post={post}
        />
      )}
      {open && <CardDetail card={open} stages={stages} scripts={scripts} onPick={(sid) => openSend(open.id, sid)} onClose={() => setOpenId(null)} onMove={(sid) => void move(open.id, sid)} onSaved={(c) => setCards((cs) => (cs ?? []).map((x) => (x.id === c.id ? { ...x, ...c } : x)))} onDeleted={() => { setCards((cs) => (cs ?? []).filter((x) => x.id !== open.id)); setOpenId(null); }} post={post} />}
      {settings && board && (
        <BoardSettings
          board={board}
          stages={stages}
          cards={cards ?? []}
          canDelete={boards.length > 1}
          onClose={() => { setSettings(false); void load(board.id); }}
          onDeleted={() => { setSettings(false); void load(); setMsg("Pipeline deleted."); }}
          post={post}
        />
      )}
      {creating && (
        <NewBoard
          onClose={() => setCreating(false)}
          onCreated={(b) => { setCreating(false); void load(b.id); setMsg(`${b.name} is ready. Rename stages, tags and follow-ups under Stages & settings.`); }}
          post={post}
        />
      )}
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label={title} className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#15233d]`} onClick={(e) => e.stopPropagation()}>
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
    <div className="flex flex-wrap gap-2" role="group" aria-label="Platform">
      {PLATFORMS.map((p) => (
        <button key={p.id} type="button" aria-pressed={value === p.id} onClick={() => onChange(value === p.id ? "" : p.id)} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${value === p.id ? "bg-[#2E7C83] text-white border-[#2E7C83]" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

function AddCard({ board, stages, scripts, onClose, onSaved, post, initial }: { board: Board; stages: Stage[]; scripts: ScriptLite[]; onClose: () => void; onSaved: (c: Card) => void; post: Post; initial?: Partial<Draft> }) {
  const first = stages.find((s) => s.key === "sent") ?? stages[0];
  const [d, setD] = useState<Draft>({ name: "", handle: "", profileUrl: "", email: "", platform: "", contactId: null, stageId: first?.id ?? "", scriptId: "", notes: "", ...initial });
  const [busy, setBusy] = useState(false);
  const stage = stages.find((s) => s.id === d.stageId);
  return (
    <Modal title={`Add a person to ${board.name}`} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-xs font-medium text-[#5a6472]">Where you&rsquo;re reaching them (optional)</p>
          <PlatformPick value={d.platform} onChange={(v) => setD({ ...d, platform: v })} />
        </div>
        <label className="block text-xs font-medium text-[#5a6472]">Name (or search your contacts)
          <ContactLookupInput className={LOOKUP} value={d.name} onChange={(v) => setD({ ...d, name: v, contactId: null })} pickLabel="Use" onPick={(c) => setD({ ...d, name: lookupName(c), email: c.email, contactId: c.id })} />
        </label>
        {d.contactId && <p className="text-xs text-[#2E7C83]">Linked to their contact record: they&rsquo;ll get this pipeline&rsquo;s tags.</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#5a6472]">Handle
            <Input value={d.handle} onChange={(e) => setD({ ...d, handle: e.target.value })} placeholder="@theirhandle" />
          </label>
          <label className="block text-xs font-medium text-[#5a6472]">Email (adds them to Contacts)
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
        {stage && <p className="text-xs text-[#7a8a99]">{stage.followUpDays == null ? "No follow-up in this stage." : `A follow-up task is set ${stage.followUpDays === 0 ? "for today" : `for ${stage.followUpDays} day${stage.followUpDays === 1 ? "" : "s"} from now`}.`}{stage.tag ? ` Tags: ${[board.tag, stage.tag].filter(Boolean).join(", ")}.` : ""}</p>}
        <div className="flex gap-2 pt-1">
          <Button
            disabled={busy || !d.name.trim()}
            onClick={async () => {
              setBusy(true);
              const script = scripts.find((s) => s.id === d.scriptId);
              const r = (await post({ action: "add", boardId: board.id, ...d, scriptTitle: script?.title ?? "" })) as { card?: Card } | null;
              setBusy(false);
              if (r?.card) onSaved(r.card);
            }}
          >
            {busy ? "Adding…" : "Add"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

// "Send a DM": pick a script to see its message, copy it, and log it as sent. Shows the last one sent.
function DmSentPick({ card, scripts, onPick }: { card: Card; scripts: ScriptLite[]; onPick: (scriptId: string) => void }) {
  const mine = card.platform ? scripts.filter((s) => (s.platforms ?? []).includes(card.platform as string)) : [];
  const rest = scripts.filter((s) => !mine.includes(s));
  return (
    <div className="mt-2">
      <select value="" onChange={(e) => e.target.value && onPick(e.target.value)} aria-label="Choose a DM to send" className="block h-8 w-full rounded-md border border-[#2E7C83]/40 bg-white px-1.5 text-xs font-medium text-[#2E7C83] dark:bg-[#1a2b4a]/40">
        <option value="">Choose a DM to send…</option>
        {mine.length > 0 && <optgroup label={`${card.platform} scripts`}>{mine.map((s) => <option key={s.id} value={s.id}>{s.title.replace(/^MasterClass DM · /, "")}</option>)}</optgroup>}
        {rest.length > 0 && <optgroup label={mine.length ? "Other scripts" : "Scripts"}>{rest.map((s) => <option key={s.id} value={s.id}>{s.title.replace(/^MasterClass DM · /, "")}</option>)}</optgroup>}
      </select>
      {card.script_title && <p className="mt-1 text-[11px] text-[#5a6472] dark:text-[#b8c2cf] truncate">DM sent: {card.script_title.replace(/^MasterClass DM · /, "")}</p>}
    </div>
  );
}

const TITLE_WORDS = /^(dr|mr|mrs|ms|prof|rev|col|colonel)\.?$/i;
const firstNameOf = (name: string) => name.split(",")[0].split(/\s+/).find((w) => w && !TITLE_WORDS.test(w) && !w.startsWith("(")) ?? name;
const niceDate = (iso: string) => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Denver" }).format(new Date(iso));

// The message for one card: the script with their name, the session date and their personal link filled in.
function fillScript(card: Card, script: ScriptLite, sessionDate: string): string {
  let t = script.content ?? "";
  if (/new connection opener/i.test(script.title)) {
    const m = (card.notes ?? "").match(/Connection note:\s*([^\n]+)/);
    if (m) return m[1].trim();
  }
  t = t.replace(/\[Name\]/g, firstNameOf(card.name));
  if (sessionDate) t = t.replace(/\[Thursday, date\]/g, sessionDate);
  if (card.link_code) t = t.replace(/\[their personal link[^\]]*\]/gi, `https://lccommandsuite.com/m/${card.link_code}`);
  return t;
}

// Which stage the card usually moves to once this script has gone out.
function nextStageKey(title: string): string | null {
  if (/\b1 · /.test(title)) return "sent";
  if (/\b2 · Invite/i.test(title)) return "invited";
  return null;
}

export function SendDm({ card, script, stages, sessionIso, onClose, onDone, post, standalone }: { standalone?: boolean; card: Card; script: ScriptLite; stages: Stage[]; sessionIso: string | null; onClose: () => void; onDone: (c: Card, note: string) => void; post: Post }) {
  const [sessionDate, setSessionDate] = useState(sessionIso ? niceDate(sessionIso) : "");
  const [text, setText] = useState(() => fillScript(card, script, sessionIso ? niceDate(sessionIso) : ""));
  const cur = stages.find((s) => s.id === card.stage_id);
  const suggestKey = nextStageKey(script.title);
  const suggested = stages.find((s) => s.key === suggestKey);
  const [moveTo, setMoveTo] = useState(suggested && cur && suggested.sortOrder > cur.sortOrder ? suggested.id : "");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const left = Array.from(new Set(text.match(/\[[^\]]+\]/g) ?? []));
  const short = script.title.replace(/^MasterClass DM · /, "");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* select the text instead */
    }
  }
  const content = (
      <div className="space-y-3">
        <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">For <strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">{card.name}</strong>. Copy it, paste it into their profile, then press <em>I sent it</em> to log it and move them on.</p>
        {sessionIso && (
          <label className="block text-xs font-medium text-[#5a6472]">Session date used in the message
            <Input value={sessionDate} onChange={(e) => {
              const old = sessionDate;
              setSessionDate(e.target.value);
              if (old) setText((t) => t.split(old).join(e.target.value));
            }} />
          </label>
        )}
        <textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} className={`${box} text-[15px] leading-relaxed`} aria-label="Message" />
        <div className="flex items-center justify-between text-xs text-[#7a8a99]">
          <span>{text.length} characters</span>
          {left.length > 0 && <span className="text-[#A4523C] font-medium">Still to fill in: {left.join("  ")}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void copy()}>{copied ? "Copied" : "Copy message"}</Button>
          {card.profile_url && (
            <a href={card.profile_url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#2E7C83]/40 px-4 text-sm font-medium text-[#2E7C83] hover:bg-[#2E7C83]/5">
              Open their profile <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <div className="rounded-xl border border-[#1a2b4a]/10 p-3 space-y-2">
          <label className="block text-xs font-medium text-[#5a6472]">After you send it, move them to
            <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={`${box} h-10`}>
              <option value="">Stay in {cur?.name ?? "this stage"}</option>
              {stages.filter((s) => s.id !== card.stage_id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <div className="flex gap-2">
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const r = (await post({ action: "dm-sent", cardId: card.id, scriptId: script.id, scriptTitle: script.title, stageId: moveTo || undefined })) as { card?: Card } | null;
                setBusy(false);
                if (r?.card) {
                  const dest = stages.find((s) => s.id === r.card!.stage_id);
                  onDone(r.card, `Logged "${short}" for ${card.name}${moveTo ? `, moved to ${dest?.name}` : ""}.`);
                }
              }}
            >
              I sent it
            </Button>
            <Button variant="outline" onClick={onClose}>Not yet</Button>
          </div>
        </div>
      </div>
  );
  return standalone
    ? <div className="mx-auto max-w-2xl p-4"><h1 className="mb-3 text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{short}</h1>{content}</div>
    : <Modal title={short} onClose={onClose} wide>{content}</Modal>;
}

function CardDetail({ card, stages, scripts, onPick, onClose, onMove, onSaved, onDeleted, post }: { card: Card; stages: Stage[]; scripts: ScriptLite[]; onPick: (scriptId: string) => void; onClose: () => void; onMove: (stageId: string) => void; onSaved: (c: Card) => void; onDeleted: () => void; post: Post }) {
  const [d, setD] = useState({ name: card.name, handle: card.handle ?? "", profileUrl: card.profile_url ?? "", email: card.email ?? "", platform: card.platform ?? "", notes: card.notes ?? "", followUpOn: card.follow_up_on ?? "" });
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
        <DmSentPick card={card} scripts={scripts} onPick={onPick} />
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
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = (await post({ action: "update", cardId: card.id, ...d })) as { card?: Card } | null;
              setBusy(false);
              if (r?.card) { onSaved(r.card); onClose(); }
            }}
          >
            Save
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <button
            onClick={async () => { if (confirm(`Take ${card.name} off this pipeline? Their open follow-up task and this stage's tag come off; they stay in Contacts.`) && (await post({ action: "delete", cardId: card.id }))) onDeleted(); }}
            className="ml-auto inline-flex items-center gap-1 text-sm text-[#C76F56] hover:underline"
          >
            <Trash2 className="w-4 h-4" /> Remove
          </button>
        </div>
      </div>
    </Modal>
  );
}

function NewBoard({ onClose, onCreated, post }: { onClose: () => void; onCreated: (b: Board) => void; post: Post }) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [template, setTemplate] = useState<"dm" | "simple">("dm");
  const [busy, setBusy] = useState(false);
  const autoTag = name.toLowerCase().replace(/pipeline/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
  return (
    <Modal title="New pipeline" onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-xs font-medium text-[#5a6472]">Name
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Podcast guest outreach" />
        </label>
        <label className="block text-xs font-medium text-[#5a6472]">Tag (everyone on it gets this; each stage adds its own)
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder={autoTag || "podcast-outreach"} />
        </label>
        <div>
          <p className="mb-1.5 text-xs font-medium text-[#5a6472]">Start with</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ["dm", "DM outreach stages", "To reach out, Sent, Followed up, In conversation, Invited, Booked, Nurture, Not now"],
              ["simple", "Three simple stages", "New, In progress, Done. Add your own after."],
            ] as const).map(([id, title, sub]) => (
              <button key={id} type="button" aria-pressed={template === id} onClick={() => setTemplate(id)} className={`rounded-xl border p-3 text-left ${template === id ? "border-[#2E7C83] bg-[#2E7C83]/5" : "border-[#1a2b4a]/15"}`}>
                <span className="block text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</span>
                <span className="block text-xs text-[#7a8a99]">{sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            disabled={busy || !name.trim()}
            onClick={async () => {
              setBusy(true);
              const r = (await post({ action: "board-create", name, tag: tag || autoTag, template })) as { board?: Board } | null;
              setBusy(false);
              if (r?.board) onCreated(r.board);
            }}
          >
            Create pipeline
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

function BoardSettings({ board, stages: initialStages, cards, canDelete, onClose, onDeleted, post }: { board: Board; stages: Stage[]; cards: Card[]; canDelete: boolean; onClose: () => void; onDeleted: () => void; post: Post }) {
  const [name, setName] = useState(board.name);
  const [tag, setTag] = useState(board.tag ?? "");
  const [stages, setStages] = useState(initialStages);
  const [edits, setEdits] = useState<Record<string, { name: string; followUpDays: string; tag: string; kind: Stage["kind"] }>>(() =>
    Object.fromEntries(initialStages.map((s) => [s.id, { name: s.name, followUpDays: s.followUpDays == null ? "" : String(s.followUpDays), tag: s.tag ?? "", kind: s.kind }]))
  );
  const [newStage, setNewStage] = useState({ name: "", followUpDays: "", kind: "open" as Stage["kind"] });
  const [saving, setSaving] = useState(false);

  const sync = (list: Stage[]) => {
    setStages(list);
    setEdits((e) => ({ ...Object.fromEntries(list.map((s) => [s.id, e[s.id] ?? { name: s.name, followUpDays: s.followUpDays == null ? "" : String(s.followUpDays), tag: s.tag ?? "", kind: s.kind }])) }));
  };

  async function saveAll() {
    setSaving(true);
    if (name.trim() !== board.name || (tag.trim() || "") !== (board.tag ?? "")) {
      const r = (await post({ action: "board-update", boardId: board.id, name, tag })) as { stages?: Stage[] } | null;
      if (r?.stages) sync(r.stages);
    }
    for (const s of stages) {
      const e = edits[s.id];
      if (!e) continue;
      const changed = e.name !== s.name || e.followUpDays !== (s.followUpDays == null ? "" : String(s.followUpDays)) || e.tag !== (s.tag ?? "") || e.kind !== s.kind;
      if (changed) await post({ action: "stage-update", stageId: s.id, name: e.name, followUpDays: e.followUpDays === "" ? null : Number(e.followUpDays), tag: e.tag, kind: e.kind });
    }
    setSaving(false);
    onClose();
  }

  return (
    <Modal title="Stages & settings" onClose={onClose} wide>
      <div className="grid gap-2 sm:grid-cols-2 mb-4">
        <label className="block text-xs font-medium text-[#5a6472]">Pipeline name<Input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block text-xs font-medium text-[#5a6472]">Pipeline tag (everyone on it)<Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. masterclass-dm" /></label>
      </div>
      <p className="mb-2 text-sm text-[#7a8a99]">Each stage&rsquo;s tag goes on a person&rsquo;s contact record while they&rsquo;re in that stage. Follow-up days set their next task when they land there; leave empty for none.</p>
      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-[64px_1fr_80px_1fr_150px_32px] gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#7a8a99]">
          <span>Order</span><span>Stage</span><span>Days</span><span>Tag</span><span>Type</span><span />
        </div>
        {stages.map((s, i) => {
          const e = edits[s.id];
          if (!e) return null;
          const inIt = cards.filter((c) => c.stage_id === s.id).length;
          const set = (patch: Partial<typeof e>) => setEdits((all) => ({ ...all, [s.id]: { ...e, ...patch } }));
          return (
            <div key={s.id} className="grid grid-cols-2 sm:grid-cols-[64px_1fr_80px_1fr_150px_32px] gap-2 items-center rounded-lg border border-[#1a2b4a]/10 p-2 sm:border-0 sm:p-0">
              <div className="flex gap-1">
                <button type="button" disabled={i === 0} onClick={async () => { const r = (await post({ action: "stage-move", stageId: s.id, dir: "left" })) as { stages?: Stage[] } | null; if (r?.stages) sync(r.stages); }} aria-label={`Move ${s.name} earlier`} className="rounded p-1 hover:bg-[#1a2b4a]/5 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button type="button" disabled={i === stages.length - 1} onClick={async () => { const r = (await post({ action: "stage-move", stageId: s.id, dir: "right" })) as { stages?: Stage[] } | null; if (r?.stages) sync(r.stages); }} aria-label={`Move ${s.name} later`} className="rounded p-1 hover:bg-[#1a2b4a]/5 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <Input value={e.name} onChange={(ev) => set({ name: ev.target.value })} aria-label="Stage name" />
              <Input type="number" min={0} max={365} value={e.followUpDays} onChange={(ev) => set({ followUpDays: ev.target.value })} aria-label={`${s.name} follow-up days`} disabled={e.kind === "booked"} />
              <Input value={e.tag} onChange={(ev) => set({ tag: ev.target.value })} aria-label={`${s.name} tag`} placeholder="no tag" />
              <select value={e.kind} onChange={(ev) => set({ kind: ev.target.value as Stage["kind"] })} className={`${box} h-10`} aria-label={`${s.name} type`}>
                {(["open", "booked", "closed"] as const).map((k) => <option key={k} value={k}>{k === "booked" ? "Booked → deal" : KIND_LABEL[k]}</option>)}
              </select>
              <button
                type="button"
                title={inIt ? `Move the ${inIt} ${inIt === 1 ? "person" : "people"} out first` : "Delete stage"}
                disabled={inIt > 0}
                onClick={async () => { if (!confirm(`Delete the “${s.name}” stage?`)) return; const r = (await post({ action: "stage-delete", stageId: s.id })) as { stages?: Stage[] } | null; if (r?.stages) sync(r.stages); }}
                className="rounded p-1 text-[#7a8a99] hover:text-[#D83A34] disabled:opacity-30"
                aria-label={`Delete ${s.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-[1fr_80px_150px_auto] gap-2 items-center rounded-lg bg-[#1a2b4a]/[0.03] p-2">
        <Input value={newStage.name} onChange={(e) => setNewStage({ ...newStage, name: e.target.value })} placeholder="New stage name" aria-label="New stage name" />
        <Input type="number" min={0} max={365} value={newStage.followUpDays} onChange={(e) => setNewStage({ ...newStage, followUpDays: e.target.value })} placeholder="days" aria-label="New stage follow-up days" />
        <select value={newStage.kind} onChange={(e) => setNewStage({ ...newStage, kind: e.target.value as Stage["kind"] })} className={`${box} h-10`} aria-label="New stage type">
          <option value="open">Open</option>
          <option value="booked">Booked → deal</option>
          <option value="closed">Closed</option>
        </select>
        <Button
          variant="outline"
          disabled={!newStage.name.trim()}
          onClick={async () => {
            const r = (await post({ action: "stage-add", boardId: board.id, name: newStage.name, followUpDays: newStage.followUpDays === "" ? null : Number(newStage.followUpDays), kind: newStage.kind })) as { stages?: Stage[] } | null;
            if (r?.stages) { sync(r.stages); setNewStage({ name: "", followUpDays: "", kind: "open" }); }
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add stage
        </Button>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button onClick={saveAll} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        <Button variant="outline" onClick={onClose}>Close</Button>
        {canDelete && (
          <button
            onClick={async () => { if (confirm(`Delete “${board.name}” and everyone on it? Their open follow-up tasks go too; they stay in Contacts.`) && (await post({ action: "board-delete", boardId: board.id }))) onDeleted(); }}
            className="ml-auto inline-flex items-center gap-1 text-sm text-[#C76F56] hover:underline"
          >
            <Trash2 className="w-4 h-4" /> Delete this pipeline
          </button>
        )}
      </div>
    </Modal>
  );
}
