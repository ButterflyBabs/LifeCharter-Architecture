"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, X, Settings2, ExternalLink, Trash2, CalendarClock, AlertCircle, ChevronLeft, ChevronRight, Tag, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import ContactLookupInput, { lookupName } from "@/components/crm/ContactLookupInput";
import QualResult, { PriorityBadge, type Qual } from "@/components/qualifier/QualResult";
import { QUALIFIER_OPEN_TO_ALL } from "@/lib/qualifier";
import { LIST_TEMPLATE_CSV } from "@/lib/dmListParse";
import { EMAIL_LIST_TEMPLATE_CSV, mapPeople, parseCsv } from "@/lib/dmEmailList";

type Board = { id: string; name: string; tag: string | null; sortOrder: number };
export type Stage = { id: string; boardId: string; key: string | null; name: string; tag: string | null; followUpDays: number | null; kind: "open" | "booked" | "closed"; sortOrder: number };
export type Card = {
  dm_count?: number;
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
  qual_priority?: string | null;
  qual_fit?: string | null;
  qual_level?: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  follow_up_on: string | null;
  deal_id: string | null;
  sort_order: number;
  stage_changed_at: string;
};
export type ScriptLite = { id: string; title: string; platforms: string[]; channel: string; content?: string };
export type DmUse = { sent: number; limit: number; opensAt: string | null; followUps?: number };
export type Post = (b: Record<string, unknown>) => Promise<Record<string, unknown> | null>;

const PLATFORMS = [
  // solid = the badge on each card; bar = the stripe down the card's left edge. Facebook and LinkedIn are
  // both "blue" brands, so LinkedIn takes a deep navy here to keep the two apart at a glance.
  { id: "IG", label: "Instagram", short: "IG", color: "bg-[#E1306C]/10 text-[#B0245A] border-[#E1306C]/30", solid: "bg-[#C13584] text-white", bar: "border-l-[#C13584]" },
  { id: "FB", label: "Facebook", short: "FB", color: "bg-[#1877F2]/10 text-[#1459B8] border-[#1877F2]/30", solid: "bg-[#1877F2] text-white", bar: "border-l-[#1877F2]" },
  { id: "LI", label: "LinkedIn", short: "LI", color: "bg-[#0A66C2]/10 text-[#0A4F96] border-[#0A66C2]/30", solid: "bg-[#0A3D62] text-white", bar: "border-l-[#0A3D62]" },
  { id: "WA", label: "WhatsApp", short: "WA", color: "bg-[#25D366]/10 text-[#0E6B5C] border-[#25D366]/30", solid: "bg-[#128C7E] text-white", bar: "border-l-[#128C7E]" },
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
  const [dmUsage, setDmUsage] = useState<Record<string, DmUse>>({});
  const [sending, setSending] = useState<{ cardId: string; scriptId: string; angle?: string } | null>(null);
  // Prospect Qualifier on the cards: Babs only until it is opened to every account.
  const [qualOn, setQualOn] = useState(QUALIFIER_OPEN_TO_ALL);
  useEffect(() => {
    if (QUALIFIER_OPEN_TO_ALL || purpose !== "outreach") return;
    fetch("/api/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => setQualOn(d?.architect === true)).catch(() => {});
  }, [purpose]);
  const [filter, setFilter] = useState<string>("All");
  // Find a person: by name, handle, email or notes, and by stage (the platform chips above already filter by platform).
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [elsewhere, setElsewhere] = useState<{ id: string; name: string; handle: string | null; platform: string | null; boardId: string; boardName: string; stageName: string }[]>([]);
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
      const prof = q.get("profile") || "";
      const handleFrom = prof.match(/(?:linkedin\.com\/in|instagram\.com|facebook\.com)\/([^/?#]+)/i)?.[1];
      setInitial({
        scriptId: q.get("script") || "",
        ...(p && PLATFORMS.some((x) => x.id === p) ? { platform: p } : {}),
        ...(q.get("name") ? { name: q.get("name")!.slice(0, 120) } : {}),
        ...(prof ? { profileUrl: prof.slice(0, 400) } : {}),
        ...(handleFrom ? { handle: p === "LI" ? `in/${decodeURIComponent(handleFrom)}` : `@${decodeURIComponent(handleFrom).replace(/^@/, "")}` } : {}),
        ...(prof ? { notes: "Added with the Add to pipeline browser button." } : {}),
      });
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
      setDmUsage(d.dmUsage ?? {});
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
      .then((d) => setScripts(((d.items ?? []) as ScriptLite[]).filter((s) => s.channel === "dm" || (s.platforms ?? []).some((p) => ["DM", "IG", "FB", "LI", "WA", "Email", "TXT"].includes(p)))))
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
  // scriptId "angle" is the personal DM angle from the card's qualification rather than a saved script.
  function openSend(cardId: string, scriptId: string, angle?: string) {
    const q = new URLSearchParams({ card: cardId, script: scriptId, board: board?.id ?? "", purpose });
    const w = window.open(`/dm-send?${q}`, "dm-send", "popup=yes,width=560,height=760,left=80,top=60");
    if (w) w.focus();
    else setSending({ cardId, scriptId, angle });
  }

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "dm-sent") return;
      const saved = e.data.card as Card;
      setCards((cs) => (cs ?? []).map((x) => (x.id === saved.id ? { ...x, ...saved } : x)));
      setOpenId(null);
      if (e.data.note) setMsg(String(e.data.note));
      if (e.data.dmUsage) setDmUsage(e.data.dmUsage as Record<string, DmUse>);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Coming back from the DM window (or another tab) refreshes the cards and the daily counters, even if the window's
  // message didn't arrive.
  useEffect(() => {
    let last = Date.now();
    const onFocus = () => {
      if (Date.now() - last < 4000 || document.visibilityState === "hidden") return;
      last = Date.now();
      void load(board?.id);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [load, board?.id]);

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

  // Every word typed must appear somewhere on the card, in any order, ignoring capitals and accents: "joanna lane"
  // finds "Joanna Z. Lane, PCC, CPCC" and "renee" finds "Renée".
  const fold = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visible = useMemo(() => {
    const words = fold(q).split(/[\s,]+/).filter(Boolean);
    return (cards ?? []).filter((c) => {
      if (!(filter === "All" || c.platform === filter) || (stageFilter && c.stage_id !== stageFilter)) return false;
      if (!words.length) return true;
      const hay = fold(`${c.name} ${c.handle ?? ""} ${c.email ?? ""} ${c.notes ?? ""} ${c.profile_url ?? ""}`);
      return words.every((w) => hay.includes(w));
    });
  }, [cards, filter, stageFilter, q]);
  const searching = Boolean(q.trim() || stageFilter || filter !== "All");
  // The same person on the account's other pipelines.
  useEffect(() => {
    const needle = q.trim();
    if (needle.length < 2) {
      setElsewhere([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/dm-pipeline/search?q=${encodeURIComponent(needle)}&purpose=${purpose}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setElsewhere(((d.results ?? []) as typeof elsewhere).filter((x) => x.boardId !== board?.id)))
        .catch(() => setElsewhere([]));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, purpose, board?.id]);
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

      {purpose === "outreach" && <DmLimitBar usage={dmUsage} onSetLimit={(pl, limit) => void post({ action: "dm-limit", platform: pl, limit }).then((r) => { const u = (r as { dmUsage?: Record<string, DmUse> } | null)?.dmUsage; if (u) setDmUsage(u); })} />}
      {purpose === "outreach" && <OutreachOverview refreshKey={`${board?.id ?? ""}:${cards?.length ?? 0}`} />}
      {purpose === "outreach" && stages?.some((st) => st.key === "followed_up" && /^Emails 2 and 3/.test(st.name)) && <ColdEmailSender boardId={board?.id ?? null} />}
      {purpose === "outreach" && <AddFaster boardId={board?.id ?? null} boardName={board?.name ?? ""} onAdded={() => void load(board?.id)} />}

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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, handle, email or notes"
          aria-label="Search this pipeline"
          className="h-9 w-72 max-w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 text-sm dark:bg-[#1a2b4a]/20"
        />
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} aria-label="Show one stage" className="h-9 rounded-lg border border-[#1a2b4a]/20 bg-white px-2 text-sm dark:bg-[#1a2b4a]/20">
          <option value="">All stages</option>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {searching && (
          <>
            <span className="text-xs text-[#7a8a99]">{visible.length} of {(cards ?? []).length} cards</span>
            <button onClick={() => { setQ(""); setStageFilter(""); setFilter("All"); }} className="text-xs font-medium text-[#2E7C83] hover:underline">Clear search</button>
          </>
        )}
      </div>
      {elsewhere.length > 0 && (
        <div className="mb-4 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-3 text-sm">
          <p className="mb-1 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Also on your other pipelines</p>
          <ul className="space-y-1">
            {elsewhere.slice(0, 8).map((r) => (
              <li key={r.id}>
                <button onClick={() => { setFilter("All"); setStageFilter(""); void load(r.boardId); }} className="text-left text-[#2E7C83] hover:underline">
                  {r.name}{r.handle ? ` (${r.handle})` : ""}
                </button>
                <span className="text-xs text-[#7a8a99]"> · {r.boardName} · {r.stageName}{r.platform ? ` · ${r.platform}` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cards && searching && visible.length === 0 && (
        <p className="mb-4 rounded-xl border border-[#1a2b4a]/10 bg-white p-4 text-sm text-[#5a6472] dark:bg-[#1a2b4a]/20 dark:text-[#b8c2cf]">
          No one on this pipeline matches. Every word you type has to appear on the card (name, handle, email, notes or profile link), so try fewer or shorter words, or press Clear search.
          {elsewhere.length > 0 ? " They are on one of your other pipelines: see the list above." : ""}
        </p>
      )}
      {!cards ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-3">
            {stages.filter((s) => !stageFilter || s.id === stageFilter).map((s) => {
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
                            {c.qual_priority && <span className="mb-1.5 ml-1.5 inline-block align-top" title={`Qualified: fit ${c.qual_fit ?? ""}${c.qual_level ? ` · ${c.qual_level}` : ""}`}><PriorityBadge priority={c.qual_priority} small /></span>}
                            <p className="font-semibold leading-snug text-[#1a2b4a] dark:text-[#F8F5F0]">{c.name}</p>
                            {c.handle && <p className="text-xs text-[#7b6b8d] truncate">{c.handle}</p>}
                            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                              {c.follow_up_on && (
                                <span className={`inline-flex items-center gap-1 ${overdue ? "text-[#A4523C] font-semibold" : due ? "text-[#8a6a15] font-semibold" : "text-[#7b6b8d]"}`}>
                                  <CalendarClock className="w-3 h-3" /> {overdue ? "Overdue · " : due ? "Today · " : ""}{shortDate(c.follow_up_on)}
                                </span>
                              )}
                              {c.last_contacted_at && <span className="text-[#7b6b8d]">Messaged {ago(c.last_contacted_at)}</span>}
                              {(c.dm_count ?? 0) > 0 && <span className="rounded-full bg-[#2E7C83]/10 px-1.5 font-semibold text-[#1F5E63]" title="DMs sent to them so far">{c.dm_count} DM{c.dm_count === 1 ? "" : "s"} sent</span>}
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
        const sc = sending.scriptId === "angle" && sending.angle ? angleScript(sending.angle) : scripts.find((x) => x.id === sending.scriptId);
        return c && sc ? (
          <SendDm
            key={`${c.id}-${sc.id}`}
            card={c}
            script={sc}
            stages={stages}
            sessionIso={nextSession}
            onClose={() => setSending(null)}
            onDone={(saved, note, use) => { setCards((cs) => (cs ?? []).map((x) => (x.id === saved.id ? { ...x, ...saved, dm_count: (x.dm_count ?? 0) + 1 } : x))); setSending(null); setOpenId(null); setMsg(note); if (use) setDmUsage(use); }}
            usage={dmUsage[c.platform ?? ""]}
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
      {open && <CardDetail card={open} stages={stages} scripts={scripts} qualOn={qualOn} onAngle={(text) => openSend(open.id, "angle", text)} onPick={(sid) => openSend(open.id, sid)} onClose={() => setOpenId(null)} onMove={(sid) => void move(open.id, sid)} onSaved={(c) => setCards((cs) => (cs ?? []).map((x) => (x.id === c.id ? { ...x, ...c } : x)))} onDeleted={() => { setCards((cs) => (cs ?? []).filter((x) => x.id !== open.id)); setOpenId(null); }} post={post} />}
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

// The personal DM angle from a card's qualification, shaped like a saved script so the DM window can show it.
export const angleScript = (text: string): ScriptLite => ({ id: "", title: "Personal DM angle", platforms: [], channel: "dm", content: text });

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

const clock = (iso: string) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

// "LinkedIn 3 / 25": DMs sent on each platform in the last 24 hours against the daily limit you set.
// Two quick ways to get people onto the board: LinkedIn connection requests read from the inbox (Microsoft 365), and a
// browser button that sends whoever's profile you are looking at to the Add card window. Nothing here touches LinkedIn.
function AddFaster({ onAdded, boardId, boardName }: { onAdded: () => void; boardId: string | null; boardName: string }) {
  // Paste a list: one person per line.
  const [listText, setListText] = useState("");
  const [listPlatform, setListPlatform] = useState("FB");
  const [listBusy, setListBusy] = useState(false);
  const [listNote, setListNote] = useState("");
  async function addList() {
    if (!listText.trim() || listBusy) return;
    setListBusy(true);
    setListNote("");
    const r = await fetch("/api/dm-pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk-add", boardId, platform: listPlatform, text: listText }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setListBusy(false);
    if (!r || !r.ok) return setListNote(d.error || "Couldn't add them. Please try again.");
    const dup = (d.duplicates ?? []).length;
    const skip = (d.skipped ?? []).length;
    setListNote(`Added ${d.added} ${d.added === 1 ? "person" : "people"} to ${d.stage}.${dup ? ` ${dup} already on this board.` : ""}${skip ? ` ${skip} line${skip === 1 ? "" : "s"} could not be read.` : ""}`);
    if (d.added) {
      setListText("");
      onAdded();
    }
  }
  function downloadTemplate() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([LIST_TEMPLATE_CSV], { type: "text/csv" }));
    a.download = "outreach-list-template.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState<{ on: boolean; microsoft: boolean; checkedAt: string | null; recent: { name: string; at: string }[] } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const code =
    "javascript:(function(){var h=location.href.split('?')[0];var p='LI';if(/instagram\\.com/.test(h))p='IG';else if(/facebook\\.com/.test(h))p='FB';else if(!/linkedin\\.com/.test(h)){alert('Open a LinkedIn, Instagram or Facebook profile first.');return}" +
    "var n=((document.querySelector('h1')||{}).innerText||document.title.replace(/\\s*[|\\-].*$/,'')).trim();" +
    "window.open('" + (typeof window !== "undefined" ? window.location.origin : "https://lccommandsuite.com") + "/dm-pipeline?add=1&platform='+p+'&name='+encodeURIComponent(n)+'&profile='+encodeURIComponent(h),'_blank');})();";
  useEffect(() => {
    linkRef.current?.setAttribute("href", code);
  }, [code, open]);
  useEffect(() => {
    if (!open || st) return;
    fetch("/api/dm-pipeline/linkedin-inbox", { cache: "no-store" }).then((r) => r.json()).then(setSt).catch(() => {});
  }, [open, st]);
  async function toggle(on: boolean) {
    setBusy(true);
    setNote("");
    const r = await fetch("/api/dm-pipeline/linkedin-inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setNote(d.error || "Couldn't change that.");
    setSt((s) => (s ? { ...s, on: d.on } : s));
    setNote(on ? d.note || "Switched on." : "Switched off. Nothing more will be read from your inbox.");
    if (on && d.added) onAdded();
  }
  return (
    <div className="mb-4">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-sm font-medium text-[#2E7C83] hover:underline">
        {open ? "Hide" : "Add people faster"}
      </button>
      {open && (
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/30">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">LinkedIn connection requests, from your inbox</p>
            <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">When someone asks to connect, LinkedIn emails you. Turn this on and each new request is added here as a card (To reach out, with their profile link and a reminder for today). Accept on LinkedIn, then send your first message from the card. We only read email from LinkedIn&rsquo;s invitation address, and we never touch your LinkedIn.</p>
            {st === null ? (
              <p className="mt-2 text-sm text-[#7a8a99]">Loading…</p>
            ) : !st.microsoft ? (
              <p className="mt-2 text-sm text-[#A4523C]">This reads a connected Microsoft 365 inbox. Connect yours in <Link href="/settings" className="underline">Settings &gt; Integrations</Link> first (a Gmail connection can send but not read).</p>
            ) : (
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                  <input type="checkbox" className="h-4 w-4" checked={st.on} disabled={busy} onChange={(e) => void toggle(e.target.checked)} />
                  Add LinkedIn connection requests from my inbox
                </label>
                {st.on && st.checkedAt && <p className="text-xs text-[#7a8a99]">Checked about every 15 minutes. Last check {new Date(st.checkedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.</p>}
                {st.recent.length > 0 && <p className="text-xs text-[#7a8a99]">Recently added: {st.recent.map((x) => x.name).join(", ")}</p>}
              </div>
            )}
            {note && <p className="mt-2 text-sm text-[#1F5E63]" role="status">{note}</p>}
          </div>
          <div className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/30">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">&ldquo;Add to pipeline&rdquo; browser button</p>
            <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">Drag this button to your browser&rsquo;s bookmarks bar. Then, on anyone&rsquo;s LinkedIn, Instagram or Facebook profile, click it: the Add card window opens with their name and profile link already filled in.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a ref={linkRef} href="#" onClick={(e) => e.preventDefault()} draggable className="inline-flex cursor-grab items-center rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-[#F8F5F0]">+ Add to my pipeline</a>
              <button onClick={() => { void navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {}); }} className="text-xs font-medium text-[#2E7C83] hover:underline">{copied ? "Copied" : "Copy the button code instead"}</button>
            </div>
            <p className="mt-2 text-xs text-[#7a8a99]">If dragging does not work: add any bookmark, edit it, and paste the copied code into its address field. Some browsers need the bookmarks bar shown first. You click it yourself, so nothing runs in the background and LinkedIn&rsquo;s rules are respected.</p>
          </div>
          <UploadList boardId={boardId} boardName={boardName} onAdded={onAdded} />
          <EmailStatus onDone={onAdded} boardId={boardId} />
          <div className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/30 md:col-span-2">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Paste a list</p>
            <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">One person per line: their name, then (if you have them) their profile link and a line about them. Paste straight from a spreadsheet or type it. They land in the first stage of this pipeline. Up to 100 at a time; anyone already on this board is skipped.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <textarea
                rows={6}
                value={listText}
                onChange={(e) => setListText(e.target.value)}
                aria-label="People to add, one per line"
                placeholder={"Jane Doe, https://www.facebook.com/jane.doe, Founder at Doe Studio\nSam Lee https://www.facebook.com/sam.lee\nAna Cruz"}
                className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]"
              />
              <div className="flex flex-col gap-2 sm:w-44">
                <label className="text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">
                  They are on
                  <select value={listPlatform} onChange={(e) => setListPlatform(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-2 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]">
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button onClick={() => void addList()} disabled={listBusy || !listText.trim()}>
                  {listBusy ? "Adding…" : "Add to my pipeline"}
                </Button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#7a8a99]">
              <button type="button" onClick={downloadTemplate} className="font-medium text-[#2E7C83] hover:underline">
                Download the spreadsheet template (.csv)
              </button>
              <span>Fill it in, then paste the rows here, or score the whole list first in the Audience Qualifier.</span>
            </div>
            {listNote && (
              <p className="mt-2 text-sm text-[#1F5E63]" role="status">
                {listNote}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


const CARD_CLS = "rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/30";
const TXT_CLS = "text-sm text-[#5a6472] dark:text-[#b8c2cf]";
const HEAD_CLS = "font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";

function saveText(text: string, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function UploadList({ boardId, boardName, onAdded }: { boardId: string | null; boardName: string; onAdded: () => void }) {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [platform, setPlatform] = useState("Email");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const preview = csv ? mapPeople(parseCsv(csv)) : null;
  async function pick(f: File | undefined) {
    setNote("");
    if (!f) return;
    if (f.size > 4_000_000) return setNote("That file is too large. Keep it under 4 MB (about 2,000 people) and upload the rest in a second file.");
    setFileName(f.name);
    setCsv(await f.text());
  }
  async function add() {
    if (!csv || busy) return;
    setBusy(true);
    setNote("");
    const r = await fetch("/api/dm-pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk-add-people", boardId, platform, csv }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) return setNote(d.error || "Couldn't add them. Please try again.");
    setNote(`Added ${d.added} ${d.added === 1 ? "person" : "people"} to ${d.stage}.${d.duplicates ? ` ${d.duplicates} already on this pipeline.` : ""}${d.stopped ? ` ${d.stopped} left out (unsubscribed or Do Not Contact).` : ""}${d.invalidCount ? ` ${d.invalidCount} row${d.invalidCount === 1 ? "" : "s"} could not be read.` : ""}`);
    if (d.added) {
      setCsv("");
      setFileName("");
      onAdded();
    }
  }
  return (
    <div className={CARD_CLS + " md:col-span-2"}>
      <p className={HEAD_CLS}>Upload a list (.csv)</p>
      <p className={`mt-1 ${TXT_CLS}`}>
        A spreadsheet with a header row: First name, Last name, Email, Company, Title, Location, Profile link (any of them; a name plus an email or a profile link is enough). Each person becomes a card in the first stage of the pipeline you have open
        {boardName ? <> (<b>{boardName}</b>)</> : null}, with their own personal MasterClass link. Nobody is added to your marketing contacts by an upload, and anyone unsubscribed or marked Do Not Contact is left out.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">
          Spreadsheet
          <input type="file" accept=".csv,.tsv,.txt,text/csv" onChange={(e) => void pick(e.target.files?.[0])} className="mt-1 block text-sm" />
        </label>
        <label className="text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">
          Reached by
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="mt-1 block rounded-lg border border-[#1a2b4a]/20 bg-white px-2 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]">
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={() => void add()} disabled={busy || !preview || !preview.rows.length}>
          {busy ? "Adding…" : preview && preview.rows.length ? `Add ${preview.rows.length} ${preview.rows.length === 1 ? "person" : "people"}` : "Add to this pipeline"}
        </Button>
      </div>
      {preview && (
        <p className="mt-2 text-xs text-[#7a8a99]">
          {fileName}: {preview.rows.length} people found ({preview.rows.filter((r) => r.email).length} with an email){preview.invalid.length ? `, ${preview.invalid.length} row${preview.invalid.length === 1 ? "" : "s"} will be skipped (${preview.invalid.slice(0, 2).join("; ")}${preview.invalid.length > 2 ? "; ..." : ""})` : ""}.
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7a8a99]">
        <button type="button" onClick={() => saveText(EMAIL_LIST_TEMPLATE_CSV, "outreach-email-list-template.csv")} className="font-medium text-[#2E7C83] hover:underline">
          Download the template (.csv)
        </button>
        {boardId && (
          <a href={`/api/dm-pipeline/export?kind=list&board=${boardId}`} className="font-medium text-[#2E7C83] hover:underline">
            Download this pipeline with personal links (.csv)
          </a>
        )}
        <a href="/api/dm-pipeline/export?kind=suppression" className="font-medium text-[#2E7C83] hover:underline">
          Download the do-not-email list (.csv)
        </a>
      </div>
      {note && (
        <p className="mt-2 text-sm text-[#1F5E63]" role="status">
          {note}
        </p>
      )}
    </div>
  );
}

function EmailStatus({ boardId, onDone }: { boardId: string | null; onDone: () => void }) {
  const [status, setStatus] = useState("emailed1");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  async function go() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setNote("");
    const r = await fetch("/api/dm-pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "email-status", boardId, status, text }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) return setNote(d.error || "Couldn't update them. Please try again.");
    setNote(`Moved ${d.moved} card${d.moved === 1 ? "" : "s"}.${d.alreadyFurther ? ` ${d.alreadyFurther} already further along.` : ""}${d.notFound ? ` ${d.notFound} address${d.notFound === 1 ? "" : "es"} not on any pipeline.` : ""}${status === "stop" ? " Anyone who asked to stop is now marked Do Not Contact." : ""}`);
    if (d.moved) {
      setText("");
      onDone();
    }
  }
  return (
    <div className={CARD_CLS + " md:col-span-2"}>
      <p className={HEAD_CLS}>Update from your cold-email tool</p>
      <p className={`mt-1 ${TXT_CLS}`}>
        Your cold-email tool sends the emails; this keeps every pipeline up to date. Paste the addresses (one per line, or a column from a spreadsheet), say what happened, and their cards move on every pipeline they are on. Cards only move forward. Choose
        &ldquo;Asked to stop&rdquo; and they are marked Do Not Contact too, so the Suite never emails them either.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-label="Email addresses" placeholder={"jane@example.com\nsam@example.org"} className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]" />
        <div className="flex flex-col gap-2 sm:w-52">
          <label className="text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">
            What happened
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-2 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]">
              <option value="emailed1">Email 1 sent</option>
              <option value="emailed2">Emails 2 and 3 sent</option>
              <option value="replied">They replied</option>
              <option value="stop">Asked to stop</option>
              <option value="bounced">Bounced (bad address)</option>
            </select>
          </label>
          <Button onClick={() => void go()} disabled={busy || !text.trim()}>
            {busy ? "Updating…" : "Update their cards"}
          </Button>
        </div>
      </div>
      {note && (
        <p className="mt-2 text-sm text-[#1F5E63]" role="status">
          {note}
        </p>
      )}
    </div>
  );
}

type OverviewData = { columns: { id: string; label: string }[]; channels: ({ channel: string } & Record<string, number>)[]; boards: ({ boardId: string; name: string } & Record<string, number>)[]; total: Record<string, number> | null };
function OutreachOverview({ refreshKey }: { refreshKey: string }) {
  const [open, setOpen] = useState(true);
  const [d, setD] = useState<OverviewData | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/dm-pipeline/overview", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => live && setD(x))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [refreshKey]);
  if (!d || !d.total || !d.total.added) return null;
  const cols = d.columns;
  const th = "px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#7a8a99] whitespace-nowrap";
  const td = "px-2 py-2 tabular-nums text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
  const table = (rows: { label: string; n: Record<string, number>; bold?: boolean }[], first: string) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-[#1a2b4a]/10">
            <th className={th}>{first}</th>
            {cols.map((c) => (
              <th key={c.id} className={th}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className={`border-b border-[#1a2b4a]/5 ${r.bold ? "font-semibold" : ""}`}>
              <td className={td + " whitespace-nowrap"}>{r.label}</td>
              {cols.map((c) => (
                <td key={c.id} className={td}>
                  {r.n[c.id] ?? 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="mb-4 rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/30">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between text-left">
        <span className={HEAD_CLS}>All outreach, every pipeline</span>
        <span className="text-xs font-medium text-[#2E7C83]">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          <p className={TXT_CLS}>Where everyone is right now, across all your pipelines. &ldquo;On the list&rdquo; is everyone; the other columns are the people sitting at that point today.</p>
          {table([...d.channels.map((c) => ({ label: c.channel, n: c })), { label: "All channels", n: d.total, bold: true }], "By channel")}
          {d.boards.length > 1 && table(d.boards.map((b) => ({ label: b.name, n: b })), "By pipeline")}
        </div>
      )}
    </div>
  );
}


type SenderRow = { id: string; account_key: string; email: string | null; daily_cap: number; paused: boolean; last_error: string | null; scanned_at: string | null; sentToday: number; todayCap: number };
type ColdData = { boardId: string | null; globalOn: boolean; enabled: boolean; steps: { day: number; subject: string; body: string }[]; windowStart: number; windowEnd: number; weekdaysOnly: boolean; footer: string; startedOn: string | null; senders: SenderRow[]; connections: { accountKey: string; email: string | null; canReadMail: boolean }[]; sentTotal: number };

function ColdEmailSender({ boardId }: { boardId: string | null }) {
  const [d, setD] = useState<ColdData | null>(null);
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<ColdData["steps"]>([]);
  const [foot, setFoot] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const r = await fetch("/api/cold-email", { cache: "no-store" }).catch(() => null);
    if (!r || !r.ok) return;
    const x = (await r.json()) as ColdData;
    setD(x);
    setSteps(x.steps);
    setFoot(x.footer);
  }
  useEffect(() => {
    void load();
  }, [boardId]);
  async function act(body: Record<string, unknown>, ok?: string) {
    setBusy(true);
    setNote("");
    const r = await fetch("/api/cold-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const x = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) setNote(x.error || "That did not work. Please try again.");
    else setNote(ok ?? (x.to ? `Test sent to ${x.to}.` : "Saved."));
    await load();
  }
  if (!d) return null;
  const free = d.connections.filter((c) => !d.senders.some((s) => s.account_key === c.accountKey));
  return (
    <div className={CARD_CLS + " mb-4"}>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between text-left">
        <span className={HEAD_CLS}>
          Cold email sender{" "}
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${d.enabled && d.globalOn ? "bg-[#2E7C83]/15 text-[#1F5E63]" : "bg-[#1a2b4a]/10 text-[#5a6472]"}`}>{d.enabled && d.globalOn ? "On" : "Off"}</span>
        </span>
        <span className="text-xs font-medium text-[#2E7C83]">{open ? "Hide" : "Set up"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          <p className={TXT_CLS}>
            Sends the three emails from your own Google mailboxes, never from the Suite&rsquo;s email. Each mailbox starts at 5 a day and grows to its cap over two weeks, only on weekdays inside the send window. Replies go to your own inbox (every email carries your main address as its reply address); the Suite reads them there through your connected Microsoft 365 inbox, stops the series for that person and moves their card. A request to stop is marked Do Not Contact too. The Suite cannot read the sending mailboxes, so
            bounces are not seen automatically: paste bounced addresses under Update from your cold-email tool. It stays off until you turn it on.
          </p>
          <div>
            <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Sending mailboxes</p>
            {d.senders.length === 0 && <p className={TXT_CLS}>None yet. Connect a Google mailbox under Settings &gt; Integrations, then add it here.</p>}
            {d.senders.map((s) => (
              <div key={s.id} className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-[#1a2b4a]/10 px-3 py-2 text-sm">
                <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{s.email ?? s.account_key}</span>
                <span className="tabular-nums text-[#5a6472]">{s.sentToday} of {s.todayCap} today</span>
                <label className="text-xs text-[#5a6472]">
                  Daily cap{" "}
                  <input type="number" min={1} max={100} defaultValue={s.daily_cap} onBlur={(e) => void act({ action: "update-sender", id: s.id, dailyCap: Number(e.target.value) })} className="ml-1 w-16 rounded border border-[#1a2b4a]/20 px-1 py-0.5 text-sm" />
                </label>
                <button onClick={() => void act({ action: "update-sender", id: s.id, paused: !s.paused })} className="text-xs font-medium text-[#2E7C83] hover:underline">
                  {s.paused ? "Resume" : "Pause"}
                </button>
                <button onClick={() => void act({ action: "remove-sender", id: s.id })} className="text-xs font-medium text-[#A4523C] hover:underline">
                  Remove
                </button>
                {s.last_error && <span className="w-full text-xs text-[#A4523C]">{s.last_error}</span>}
              </div>
            ))}
            {free.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {free.map((c) => (
                  <button key={c.accountKey} onClick={() => void act({ action: "add-sender", accountKey: c.accountKey }, `${c.email ?? "Mailbox"} added.${c.canReadMail ? "" : " It cannot read replies yet: reconnect it and allow reading mail."}`)} className="rounded-full border border-dashed border-[#2E7C83]/50 px-3 py-1 text-xs text-[#2E7C83]">
                    + Add {c.email ?? c.accountKey}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3">
            {steps.map((st, i) => (
              <div key={i} className="rounded-lg border border-[#1a2b4a]/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">
                  Email {i + 1}
                  {i === 0 ? " (day 0)" : ""}
                </p>
                {i > 0 && (
                  <label className="mt-1 block text-xs text-[#5a6472]">
                    Sent this many days after Email 1
                    <input type="number" min={1} max={60} value={st.day} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) } : x)))} className="ml-2 w-16 rounded border border-[#1a2b4a]/20 px-1 py-0.5 text-sm" />
                  </label>
                )}
                <Input value={st.subject} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)))} aria-label={`Email ${i + 1} subject`} />
                <textarea rows={9} value={st.body} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} aria-label={`Email ${i + 1} message`} className="mt-2 w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]" />
                <button onClick={() => void act({ action: "test", step: i })} disabled={busy} className="mt-1 text-xs font-medium text-[#2E7C83] hover:underline">
                  Send me a test of this email
                </button>
              </div>
            ))}
            <p className="text-xs text-[#7a8a99]">Merge fields: {"{{first_name}} {{at_company}} {{personal_link}} {{next_session_date}} {{booking_link}}"}. The footer and the unsubscribe line are added to every email.</p>
            <label className="block text-xs font-medium text-[#5a6472]">
              Footer (your postal address)
              <Input value={foot} onChange={(e) => setFoot(e.target.value)} />
            </label>
            <Button onClick={() => void act({ action: "save", steps, footer: foot })} disabled={busy}>
              Save the emails
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-[#1a2b4a]/10 pt-3">
            <Button onClick={() => void act({ action: "toggle", enabled: !d.enabled }, d.enabled ? "Switched off. Nothing more will be sent." : "Switched on. The first emails go out inside the send window.")} disabled={busy}>
              {d.enabled ? "Turn the sender off" : "Turn the sender on"}
            </Button>
            <span className="text-xs text-[#7a8a99]">{d.sentTotal} sent so far{d.startedOn ? ` · started ${d.startedOn}` : ""}</span>
            {d.enabled && !d.globalOn && <span className="text-xs text-[#A4523C]">The Suite-wide cold email switch is off, so nothing is sent yet.</span>}
          </div>
          {note && (
            <p className="text-sm text-[#1F5E63]" role="status">
              {note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DmLimitBar({ usage, onSetLimit }: { usage: Record<string, DmUse>; onSetLimit: (platform: string, limit: number) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const shown = PLATFORMS.filter((p) => ["IG", "FB", "LI", "WA"].includes(p.id) || (usage[p.id]?.sent ?? 0) > 0 || (usage[p.id]?.followUps ?? 0) > 0);
  if (!Object.keys(usage).length) return null;
  return (
    <div className="mb-4 flex flex-wrap gap-2" aria-label="DMs sent in the last 24 hours">
      {shown.map((p) => {
        const u = usage[p.id] ?? { sent: 0, limit: 25, opensAt: null };
        const pct = u.limit > 0 ? Math.min(100, Math.round((u.sent / u.limit) * 100)) : 100;
        const full = u.limit > 0 ? u.sent >= u.limit : true;
        const near = !full && pct >= 80;
        return (
          <div key={p.id} className={`min-w-[170px] flex-1 rounded-xl border p-2.5 sm:flex-none ${full ? "border-[#C76F56]/60 bg-[#C76F56]/5" : near ? "border-[#c9a227]/60 bg-[#c9a227]/5" : "border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40"}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.label} <span className="font-normal text-[#7a8a99]">new DMs</span></span>
              <span className="tabular-nums text-sm font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                {u.sent} / {editing === p.id ? (
                  <input
                    autoFocus
                    inputMode="numeric"
                    value={val}
                    onChange={(e) => setVal(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    onBlur={() => { setEditing(null); if (val !== "" && Number(val) !== u.limit) onSetLimit(p.id, Number(val)); }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setVal(""); setEditing(null); } }}
                    className="w-12 rounded border border-[#1a2b4a]/30 bg-white px-1 text-sm dark:bg-[#1a2b4a]/40"
                    aria-label={`${p.label} daily limit`}
                  />
                ) : (
                  <button onClick={() => { setVal(String(u.limit)); setEditing(p.id); }} title="Change the daily limit" className="underline decoration-dotted underline-offset-2">{u.limit}</button>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className={`h-full rounded-full ${full ? "bg-[#C76F56]" : near ? "bg-[#c9a227]" : "bg-[#2E7C83]"}`} style={{ width: `${pct}%` }} /></div>
            <p className={`mt-1 text-[11px] ${full ? "font-semibold text-[#A4523C]" : "text-[#7a8a99]"}`}>
              {full ? (u.opensAt ? `Daily limit reached. Next one opens at ${clock(u.opensAt)}` : "Daily limit reached") : `${u.limit - u.sent} left in the last 24 hours`}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-[#5a6472] dark:text-[#b8c2cf]" title="Follow-up DMs to people you have already messaged, in the last 24 hours">
              {u.followUps ?? 0} follow-up DM{(u.followUps ?? 0) === 1 ? "" : "s"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function DmLimitNote({ use, platform }: { use: DmUse; platform: string | null }) {
  if (use.limit <= 0 || use.sent < use.limit - 2) return null;
  const label = PLATFORMS.find((p) => p.id === platform)?.label ?? "this platform";
  const over = use.sent >= use.limit;
  return (
    <p className={`rounded-lg px-3 py-2 text-xs font-medium ${over ? "bg-[#C76F56]/10 text-[#A4523C]" : "bg-[#c9a227]/10 text-[#6b5410] dark:text-[#e6d28a]"}`}>
      {over
        ? `You've already sent ${use.sent} new DMs on ${label} in the last 24 hours, your limit of ${use.limit}.${use.opensAt ? ` The next slot opens at ${clock(use.opensAt)}.` : ""} Sending more risks a restriction on your account.`
        : `${use.sent} of ${use.limit} new DMs sent on ${label} in the last 24 hours. ${use.limit - use.sent} left.`}
    </p>
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
function nextStageKey(title: string, stages: Stage[]): string | null {
  // A LinkedIn connection note is a request, not a DM: it waits for them to accept.
  if (/connection opener/i.test(title) && stages.some((s) => s.key === "connect_sent")) return "connect_sent";
  if (/\b1 · /.test(title) || /^Personal DM angle$/.test(title)) return "sent";
  if (/\b2 · Invite/i.test(title)) return "invited";
  return null;
}

export function SendDm({ card, script, stages, sessionIso, onClose, onDone, post, standalone, usage }: { standalone?: boolean; card: Card; script: ScriptLite; stages: Stage[]; sessionIso: string | null; onClose: () => void; onDone: (c: Card, note: string, usage?: Record<string, DmUse>) => void; post: Post; usage?: DmUse }) {
  const [sessionDate, setSessionDate] = useState(sessionIso ? niceDate(sessionIso) : "");
  const [text, setText] = useState(() => fillScript(card, script, sessionIso ? niceDate(sessionIso) : ""));
  const cur = stages.find((s) => s.id === card.stage_id);
  const suggestKey = nextStageKey(script.title, stages);
  const suggested = stages.find((s) => s.key === suggestKey);
  const [moveTo, setMoveTo] = useState(suggested && cur && suggested.sortOrder > cur.sortOrder ? suggested.id : "");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const left = Array.from(new Set(text.match(/\[[^\]]+\]/g) ?? []));
  const short = script.title.replace(/^MasterClass DM · /, "");
  // The assistant rewrites this one message for this one person; they read it before they copy it.
  const original = useMemo(() => fillScript(card, script, sessionIso ? niceDate(sessionIso) : ""), [card, script, sessionIso]);
  const [ask, setAsk] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState("");
  async function customize(instruction: string) {
    setAiBusy(true);
    setAiNote("");
    try {
      const r = await fetch("/api/dm-pipeline/customize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId: card.id, text, instruction, scriptTitle: script.title }) });
      const d = await r.json().catch(() => ({}));
      if (d.needsKey) setAiNote("Connect your AI in Settings > AI to have your assistant customize messages.");
      else if (!r.ok || !d.message) setAiNote(d.error || "Couldn't rewrite it just now.");
      else {
        setText(d.message);
        setAsk("");
        setAiNote("Reworked for them. Read it, change anything, then copy it.");
      }
    } catch {
      setAiNote("Couldn't reach your assistant just now.");
    }
    setAiBusy(false);
  }
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
        <p className="text-xs font-semibold text-[#1F5E63]">
          {(card.dm_count ?? 0) > 0 || card.last_contacted_at
            ? `This will be follow-up DM ${Math.max(card.dm_count ?? 0, 1)} to ${firstNameOf(card.name)}. It is counted with your follow-ups, not your new DMs.`
            : `This is a NEW first DM to ${firstNameOf(card.name)}. It counts toward your daily limit of new DMs.`}
        </p>
        {usage && <DmLimitNote use={usage} platform={card.platform} />}
        {card.platform === "LI" && (
          <p className="rounded-lg bg-[#c9a227]/10 px-3 py-2 text-xs text-[#6b5410] dark:text-[#e6d28a]">
            {/new connection opener/i.test(script.title)
              ? "This is a connection request note, not a message. On their profile click Connect (it may be under More), choose Add a note, and paste. LinkedIn caps the note at 200 characters, and free accounts get only a few notes a month. Out of notes? Send the request with no note and use the Invite message once they accept."
              : "LinkedIn only lets you message someone once they have accepted your connection request. On a profile that isn't connected yet, the Message button opens a Sales Navigator upgrade, so send the Connect request first."}
          </p>
        )}
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
        <div className="rounded-xl bg-[#2E7C83]/10 p-3 space-y-2">
          <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Customize this message with your assistant</p>
          <div className="flex flex-wrap gap-2">
            {["Make it warmer", "Make it shorter", "Mention something personal from my notes", "End with a question", "Sound more like me"].map((p) => (
              <Button key={p} size="sm" variant="outline" disabled={aiBusy} onClick={() => void customize(p)}>{p}</Button>
            ))}
            {text !== original && (
              <Button size="sm" variant="ghost" disabled={aiBusy} onClick={() => { setText(original); setAiNote(""); }}>Back to the original</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Or tell it what to change (e.g. mention we both love hiking)" aria-label="What should the assistant change?" />
            <Button size="sm" disabled={aiBusy || !ask.trim()} onClick={() => void customize(ask)}>{aiBusy ? "Working…" : "Ask"}</Button>
          </div>
          {aiNote && <p className="text-xs text-[#1F5E63]" role="status">{aiNote}</p>}
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
                const r = (await post({ action: "dm-sent", cardId: card.id, scriptId: script.id, scriptTitle: script.title, stageId: moveTo || undefined })) as { card?: Card; dmUsage?: Record<string, DmUse> } | null;
                setBusy(false);
                if (r?.card) {
                  const dest = stages.find((s) => s.id === r.card!.stage_id);
                  onDone(r.card, `Logged "${short}" for ${card.name}${moveTo ? `, moved to ${dest?.name}` : ""}.`, r.dmUsage);
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

function CardDetail({ card, stages, scripts, qualOn, onAngle, onPick, onClose, onMove, onSaved, onDeleted, post }: { card: Card; stages: Stage[]; scripts: ScriptLite[]; qualOn: boolean; onAngle: (text: string) => void; onPick: (scriptId: string) => void; onClose: () => void; onMove: (stageId: string) => void; onSaved: (c: Card) => void; onDeleted: () => void; post: Post }) {
  const [d, setD] = useState({ name: card.name, handle: card.handle ?? "", profileUrl: card.profile_url ?? "", email: card.email ?? "", platform: card.platform ?? "", notes: card.notes ?? "", followUpOn: card.follow_up_on ?? "" });
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={card.name} onClose={onClose} wide={qualOn}>
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
        {qualOn && <CardQualify card={card} onAngle={onAngle} onScored={onSaved} />}
      </div>
    </Modal>
  );
}

// Qualify the person on this card against one of your Ideal Client Profiles: paste their profile, get fit, level,
// the gap, a DM angle and a priority. The latest result stays with the card.
function CardQualify({ card, onAngle, onScored }: { card: Card; onAngle: (text: string) => void; onScored: (c: Card) => void }) {
  const tz = typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Denver";
  const [icps, setIcps] = useState<{ id: string; name: string }[] | null>(null);
  const [q, setQ] = useState<Qual | null>(null);
  const [icpId, setIcpId] = useState("");
  const [text, setText] = useState("");
  const [warm, setWarm] = useState("");
  const [form, setForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch(`/api/qualifier?card=${card.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = (d?.icps ?? []) as { id: string; name: string }[];
        setIcps(list);
        setQ(d?.qualification ?? null);
        let last = "";
        try { last = localStorage.getItem("qualifier-icp") || ""; } catch { /* none */ }
        setIcpId(d?.qualification?.icp_id && list.some((i) => i.id === d.qualification.icp_id) ? d.qualification.icp_id : list.some((i) => i.id === last) ? last : list[0]?.id ?? "");
        setForm(!d?.qualification);
      })
      .catch(() => setIcps([]));
  }, [card.id]);
  if (!icps) return null;
  return (
    <div className="mt-2 border-t border-[#1a2b4a]/10 pt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Prospect Qualifier</h4>
        {q && !form && <button onClick={() => setForm(true)} className="text-sm font-medium text-[#2E7C83] hover:underline">Score again</button>}
      </div>
      {!icps.length ? (
        <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">Describe who you serve first: <Link href="/qualifier" className="text-[#2E7C83] hover:underline">create an Ideal Client Profile</Link>.</p>
      ) : form ? (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#5a6472]">Score against
            <select value={icpId} onChange={(e) => { setIcpId(e.target.value); try { localStorage.setItem("qualifier-icp", e.target.value); } catch { /* not remembered */ } }} className={`${box} h-10`}>
              {icps.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-[#5a6472]">Their profile text
            <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} className={box} placeholder="Open their profile, select everything on the page (Cmd+A), copy and paste here. Add their recent posts for the best read." />
          </label>
          <label className="block text-xs font-medium text-[#5a6472]">Have they engaged with you before? (optional)
            <Input value={warm} onChange={(e) => setWarm(e.target.value)} placeholder="e.g. accepted my connection, commented last week" />
          </label>
          {err && <p className="text-sm text-[#A4523C]">{err}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={busy || text.trim().length < 80 || !icpId}
              onClick={async () => {
                setBusy(true);
                setErr("");
                const r = await fetch("/api/qualifier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "qualify", cardId: card.id, icpId, profileText: text, warm, platform: card.platform, tz }) });
                const d = await r.json().catch(() => ({}));
                setBusy(false);
                if (!r.ok || !d.qualification) { setErr(d.error || "Couldn't score that. Try again."); return; }
                setQ(d.qualification);
                setText("");
                setForm(false);
                if (d.card) onScored(d.card as Card);
              }}
            >
              {busy ? "Scoring…" : "Score this prospect"}
            </Button>
            {card.profile_url && <a href={card.profile_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline">Open their profile <ExternalLink className="w-3.5 h-3.5" /></a>}
            {q && <button onClick={() => setForm(false)} className="text-sm text-[#5a6472] hover:underline">Cancel</button>}
          </div>
        </div>
      ) : q ? (
        <QualResult
          q={q}
          compact
          angleAction={q.dm_angle ? <button onClick={() => onAngle(q.dm_angle as string)} className="rounded-full bg-[#1a2b4a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1a2b4a]/90">Open in the DM window</button> : null}
        />
      ) : null}
    </div>
  );
}

function NewBoard({ onClose, onCreated, post }: { onClose: () => void; onCreated: (b: Board) => void; post: Post }) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [template, setTemplate] = useState<"dm" | "simple" | "coldemail">("dm");
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
          <div className="grid gap-2 sm:grid-cols-3">
            {([
              ["dm", "DM outreach stages", "To reach out, Sent, Followed up, In conversation, Invited, Booked, Nurture, Not now"],
              ["coldemail", "Cold email stages", "To email, Email 1 sent, Emails 2 and 3 sent, Replied, Invited, Registered, Attended, Booked, Client, Asked to stop"],
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
