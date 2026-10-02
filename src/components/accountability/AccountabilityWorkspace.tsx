"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Heart, HandHeart, Sparkles, Send, Trash2, Plus, MessageSquare, Pause, Play, X, Flame, LifeBuoy } from "lucide-react";

type Side = "a" | "b";
interface Item {
  id: string;
  side: Side;
  kind: string;
  title: string;
  detail: string | null;
  due_on: string | null;
  status: "open" | "in_progress" | "done";
  committed: boolean;
  task_id: number | null;
  reward: string | null;
  if_missed: string | null;
  follow_through: "pending" | "done" | "skipped";
  completed_at: string | null;
}
interface Note { id: string; item_id: string | null; side: Side; body: string; created_at: string }
interface Nudge { id: string; from_side: Side | "system"; to_side: Side; item_id: string | null; kind: string; message: string; read_at: string | null; created_at: string }
interface Template { id: string; kind: string; message: string }
interface Agreement { how_held: string | null; tone: string; check_in: string | null; reward_self: string | null; reward_partner: string | null; miss_plan: string | null; stuck_plan: string | null; consequence_mode: string }
interface Checkin { id: string; side: Side; week_of: string; wins: string | null; stuck: string | null; next_commit: string | null }
interface Stats { open: number; done: number; overdue: number; streakWeeks: number }
export interface View {
  partnership: { id: string; status: "invited" | "active" | "paused" | "ended"; coachVisible: boolean; notify: boolean };
  viewer: Side | "coach";
  you: { side: Side; name: string };
  partner: { side: Side; name: string; isClient: boolean };
  today: string;
  items: Item[];
  notes: Note[];
  nudges: Nudge[];
  templates: Template[];
  agreements: { you: Agreement | null; partner: Agreement | null };
  checkins: Checkin[];
  stats: { you: Stats; partner: Stats };
  unread: number;
  invitedBy?: string;
  clientName?: string;
  business?: string;
}

const BUILT_IN = [
  { kind: "encourage", label: "You've got this", message: "You've got this. I'm in your corner." },
  { kind: "encourage", label: "Proud of you", message: "I'm proud of how you're showing up for this." },
  { kind: "nudge", label: "Quick check-in", message: "Quick check-in: how's it going? What's one step you can take today?" },
  { kind: "nudge", label: "Still on track?", message: "Still on track for your date? Tell me what you need." },
  { kind: "inspire", label: "Small steps", message: "Small steps count. What can you finish in the next 15 minutes?" },
  { kind: "inspire", label: "Remember why", message: "Remember why you started this. It matters." },
  { kind: "support", label: "Talk it through?", message: "Want to talk it through? I can help you find the next step." },
  { kind: "support", label: "Take something off your plate", message: "Is there anything I can take off your plate or help you think through?" },
  { kind: "celebrate", label: "You did it!", message: "You did it! That's worth celebrating." },
  { kind: "celebrate", label: "Big win", message: "Big win. Take a second to enjoy it." },
];
const KIND_LABEL: Record<string, string> = { encourage: "Encourage", nudge: "Nudge", inspire: "Inspire", support: "Support", celebrate: "Celebrate", stuck: "I'm stuck", reminder: "Reminder", custom: "Note" };
const ITEM_KINDS: [string, string][] = [["task", "Task"], ["milestone", "Milestone"], ["project", "Project"], ["deadline", "Deadline"], ["habit", "Habit"]];
const MODES: [string, string, string][] = [
  ["pledge", "A pledge", "I write what happens if I miss something. It's a promise, not tracked."],
  ["tracked", "Tracked", "On each commitment, my partner and I mark whether I followed through."],
  ["both", "Both", "A written pledge, plus tracking on each commitment."],
  ["none", "Keep it light", "No consequence. Encouragement and rewards only."],
];

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const dueLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const mondayOf = (ymd: string) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/30 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/20 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5 disabled:opacity-50";
const btnPrimary = "inline-flex items-center gap-1.5 rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-[#F8F5F0] hover:opacity-90 disabled:opacity-50";
const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40 p-5";

type Post = (body: Record<string, unknown>) => Promise<Record<string, unknown> | null>;

export default function AccountabilityWorkspace({ mode, getUrl, postUrl, postExtra, tasksUrl, onGone }: { mode: "app" | "portal" | "coach"; getUrl: string; postUrl: string; postExtra?: Record<string, unknown>; tasksUrl?: string; onGone?: () => void }) {
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"commitments" | "encouragement" | "checkin" | "agreement" | "wins">("commitments");
  const [msg, setMsg] = useState("");
  const readOnly = mode === "coach";

  const load = useCallback(async () => {
    const r = await fetch(getUrl, { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error || "Couldn't load this.");
    setView(d as View);
  }, [getUrl]);
  useEffect(() => {
    void load();
  }, [load]);

  const post: Post = useCallback(
    async (body) => {
      setMsg("");
      const r = await fetch(postUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(postExtra || {}), ...body }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(d.error || "That didn't save. Try again.");
        return null;
      }
      if (d.deleted) {
        onGone?.();
        return d;
      }
      if (!String(body.action).startsWith("ai")) await load();
      return d;
    },
    [postUrl, postExtra, load, onGone]
  );

  // Opening the encouragement tab marks what's waiting as read.
  useEffect(() => {
    if (tab === "encouragement" && view && view.unread > 0 && !readOnly) void post({ action: "nudges-read" });
  }, [tab, view, readOnly, post]);

  if (error) return <p className="rounded-xl bg-[#b06a5a]/10 p-4 text-sm text-[#8a2f2f]">{error}</p>;
  if (!view) return <p className="text-sm text-[#7a8a99]">Loading…</p>;

  const { you, partner, partnership: ps } = view;
  const isA = view.viewer === "a";
  const tabs: [typeof tab, string][] = [
    ["commitments", "Commitments"],
    ["encouragement", view.unread > 0 ? `Encouragement (${view.unread})` : "Encouragement"],
    ["checkin", "Check-in"],
    ["agreement", "Our agreement"],
    ["wins", "Wins"],
  ];

  return (
    <div className="space-y-5">
      {mode === "coach" && <p className="rounded-xl bg-[#c9a227]/15 px-4 py-2 text-sm text-[#6b5410]">Read-only. {view.clientName} shared this partnership with you as their coach.</p>}

      {view.partnership.status === "invited" && view.viewer === "b" && (
        <div className="rounded-2xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-5">
          <p className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{view.invitedBy || partner.name} asked you to be their accountability partner</p>
          <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">You&apos;ll see only what they choose to share. You can add your own commitments too, and either of you can pause or end this whenever you like.</p>
          <div className="mt-3 flex gap-2">
            <button className={btnPrimary} onClick={() => post({ action: "accept" })}>Yes, I&apos;m in</button>
            <button className={btn} onClick={() => post({ action: "decline" }).then(() => onGone?.())}>Not right now</button>
          </div>
        </div>
      )}
      {view.partnership.status === "invited" && isA && <p className="rounded-xl bg-[#2E7C83]/10 px-4 py-3 text-sm text-[#1F5E63]">Waiting for {partner.name} to say yes. You can start adding commitments and writing your side of the agreement now.</p>}
      {ps.coachVisible && view.viewer !== "coach" && <p className="rounded-xl bg-[#1a2b4a]/5 px-4 py-3 text-sm text-[#5a6472] dark:text-[#b8c2cf]">{isA ? "Your coach can see this partnership (read-only)." : `${partner.name}'s coach can see this partnership (read-only).`}</p>}
      {ps.status === "paused" && <p className="rounded-xl bg-[#c9a227]/15 px-4 py-3 text-sm text-[#6b5410]">This partnership is paused. No reminders or emails go out until it&apos;s resumed.</p>}
      {ps.status === "ended" && <p className="rounded-xl bg-[#1a2b4a]/5 px-4 py-3 text-sm text-[#5a6472]">This partnership has ended and is read-only.</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard title={mode === "coach" ? `${you.name} (client)` : "You"} s={view.stats.you} />
        <StatCard title={partner.name} s={view.stats.partner} />
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#5a6472] dark:text-[#b8c2cf]">
          {ps.status === "active" && <button className={btn} onClick={() => post({ action: "pause" })}><Pause className="h-3 w-3" /> Pause</button>}
          {ps.status === "paused" && <button className={btn} onClick={() => post({ action: "resume" })}><Play className="h-3 w-3" /> Resume</button>}
          {ps.status !== "ended" && ps.status !== "invited" && <button className={btn} onClick={() => confirm("End this partnership? It becomes read-only for both of you.") && post({ action: "end" })}><X className="h-3 w-3" /> End</button>}
          {isA && ps.status === "ended" && <button className={btn} onClick={() => confirm("Delete this partnership and everything in it?") && post({ action: "delete" })}><Trash2 className="h-3 w-3" /> Delete</button>}
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={ps.notify} onChange={(e) => post({ action: "notify", value: e.target.checked })} /> Email me about this</label>
          {isA && mode === "app" && <label className="flex items-center gap-1.5"><input type="checkbox" checked={ps.coachVisible} onChange={(e) => post({ action: "coach-visible", value: e.target.checked })} /> Let my coach see this (read-only; {partner.name} will see a note that she can)</label>}
        </div>
      )}
      {msg && <p className="rounded-lg bg-[#b06a5a]/10 px-3 py-2 text-sm text-[#8a2f2f]">{msg}</p>}

      <div className="flex flex-wrap gap-1.5 border-b border-[#1a2b4a]/10 pb-3">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${tab === k ? "bg-[#1a2b4a] text-white dark:bg-[#c9a227] dark:text-[#1a2b4a]" : "text-[#5a6472] hover:bg-[#1a2b4a]/5 dark:text-[#b8c2cf]"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "commitments" && <Commitments view={view} post={post} readOnly={readOnly} tasksUrl={tasksUrl} />}
      {tab === "encouragement" && <Encouragement view={view} post={post} readOnly={readOnly} />}
      {tab === "checkin" && <CheckIn view={view} post={post} readOnly={readOnly} />}
      {tab === "agreement" && <AgreementTab view={view} post={post} readOnly={readOnly} />}
      {tab === "wins" && <Wins view={view} />}
    </div>
  );
}

function StatCard({ title, s }: { title: string; s: Stats }) {
  return (
    <div className={card}>
      <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        <span><b className="text-[#1a2b4a] dark:text-[#F8F5F0]">{s.open}</b> open</span>
        <span><b className="text-[#2c6b3f]">{s.done}</b> done</span>
        <span><b className={s.overdue ? "text-[#b3422f]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}>{s.overdue}</b> past date</span>
        <span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-[#c9a227]" /><b className="text-[#1a2b4a] dark:text-[#F8F5F0]">{s.streakWeeks}</b> week streak</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ commitments

function Commitments({ view, post, readOnly, tasksUrl }: { view: View; post: Post; readOnly: boolean; tasksUrl?: string }) {
  const mine = view.items.filter((i) => i.side === view.you.side);
  const theirs = view.items.filter((i) => i.side === view.partner.side);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7a8a99]">{readOnly ? `${view.you.name}'s commitments` : "Your commitments"}</h3>
        {!readOnly && view.partnership.status !== "ended" && <ItemForm view={view} post={post} tasksUrl={tasksUrl} />}
        {mine.length === 0 ? <p className="text-sm text-[#7a8a99]">Nothing here yet. Only what you add here is shared with {view.partner.name}.</p> : mine.map((i) => <ItemCard key={i.id} item={i} view={view} post={post} own readOnly={readOnly} tasksUrl={tasksUrl} />)}
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7a8a99]">{view.partner.name}&apos;s commitments</h3>
        {theirs.length === 0 ? <p className="text-sm text-[#7a8a99]">{view.partner.name} hasn&apos;t added anything yet.</p> : theirs.map((i) => <ItemCard key={i.id} item={i} view={view} post={post} own={false} readOnly={readOnly} />)}
      </section>
    </div>
  );
}

function ItemForm({ view, post, tasksUrl, item, onDone }: { view: View; post: Post; tasksUrl?: string; item?: Item; onDone?: () => void }) {
  const [open, setOpen] = useState(Boolean(item));
  const [title, setTitle] = useState(item?.title || "");
  const [kind, setKind] = useState(item?.kind || "task");
  const [dueOn, setDueOn] = useState(item?.due_on || "");
  const [committed, setCommitted] = useState(item?.committed || false);
  const [reward, setReward] = useState(item?.reward || "");
  const [ifMissed, setIfMissed] = useState(item?.if_missed || "");
  const [taskId, setTaskId] = useState("");
  const [tasks, setTasks] = useState<{ id: number; title: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState("");

  useEffect(() => {
    if (open && !item && tasksUrl && tasks === null) fetch(tasksUrl).then((r) => r.json()).then((d) => setTasks(d.tasks ?? [])).catch(() => setTasks([]));
  }, [open, item, tasksUrl, tasks]);

  async function save() {
    setBusy(true);
    const body = { title, kind, dueOn, committed, reward, ifMissed };
    const r = item ? await post({ action: "item-update", id: item.id, ...body }) : await post({ action: "item-add", ...body, taskId: taskId || undefined });
    setBusy(false);
    if (r) {
      if (!item) {
        setTitle("");
        setDueOn("");
        setCommitted(false);
        setReward("");
        setIfMissed("");
        setTaskId("");
        setOpen(false);
      }
      onDone?.();
    }
  }
  async function suggest() {
    if (!title.trim()) return setAiMsg("Add a title first.");
    setBusy(true);
    setAiMsg("");
    const d = await post({ action: "ai", kind: "reward", title, dueOn, notes: view.agreements.you?.how_held || "" });
    setBusy(false);
    if (!d) return;
    if (d.needsKey) return setAiMsg("Add your AI key in Settings → AI Assistant to use writing help.");
    setReward(String(d.reward || ""));
    setIfMissed(String(d.ifMissed || ""));
  }

  if (!open) return <button className={btn} onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add a commitment</button>;
  return (
    <div className="space-y-2 rounded-2xl border border-[#c9a227]/30 bg-white dark:bg-[#1a2b4a]/40 p-4">
      <input className={field} placeholder="What are you committing to?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      <div className="grid grid-cols-2 gap-2">
        <select className={field} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
          {ITEM_KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input type="date" className={field} value={dueOn} onChange={(e) => setDueOn(e.target.value)} aria-label="Due date" />
      </div>
      {!item && tasksUrl && tasks && tasks.length > 0 && (
        <select className={field} value={taskId} onChange={(e) => { setTaskId(e.target.value); const t = tasks.find((x) => String(x.id) === e.target.value); if (t && !title) setTitle(t.title); }} aria-label="Share one of your tasks">
          <option value="">Or share one of your tasks…</option>
          {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      )}
      <label className="flex items-center gap-2 text-sm text-[#5a6472] dark:text-[#b8c2cf]"><input type="checkbox" checked={committed} onChange={(e) => setCommitted(e.target.checked)} /> This is a promise, not just a to-do</label>
      <input className={field} placeholder="Reward when it's done (optional)" value={reward} onChange={(e) => setReward(e.target.value)} maxLength={300} />
      <input className={field} placeholder="If I don't, here's what happens (optional)" value={ifMissed} onChange={(e) => setIfMissed(e.target.value)} maxLength={300} />
      {aiMsg && <p className="text-xs text-[#8a2f2f]">{aiMsg}</p>}
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={save} disabled={busy || !title.trim()}>{item ? "Save" : "Add"}</button>
        <button className={btn} onClick={suggest} disabled={busy}><Sparkles className="h-3.5 w-3.5" /> Suggest a reward</button>
        <button className={btn} onClick={() => (item ? onDone?.() : setOpen(false))}>Cancel</button>
      </div>
    </div>
  );
}

function ItemCard({ item, view, post, own, readOnly, tasksUrl }: { item: Item; view: View; post: Post; own: boolean; readOnly: boolean; tasksUrl?: string }) {
  const [showNotes, setShowNotes] = useState(false);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const notes = view.notes.filter((n) => n.item_id === item.id);
  const overdue = item.status !== "done" && item.due_on && item.due_on < view.today;
  const ownerAg = own ? view.agreements.you : view.agreements.partner;
  const tracked = ownerAg && ["tracked", "both"].includes(ownerAg.consequence_mode);
  const ended = view.partnership.status === "ended";
  const authorOf = (s: Side) => (s === view.you.side ? (readOnly ? view.you.name : "You") : view.partner.name);

  if (editing) return <ItemForm view={view} post={post} item={item} tasksUrl={tasksUrl} onDone={() => setEditing(false)} />;

  return (
    <div className={`rounded-2xl border p-4 ${item.status === "done" ? "border-[#2c6b3f]/25 bg-[#2c6b3f]/5" : overdue ? "border-[#b3422f]/30 bg-white dark:bg-[#1a2b4a]/40" : "border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] ${item.status === "done" ? "line-through opacity-70" : ""}`}>{item.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded-full bg-[#1a2b4a]/8 px-2 py-0.5 font-semibold text-[#5a6472] dark:text-[#b8c2cf]">{ITEM_KINDS.find((k) => k[0] === item.kind)?.[1] || "Task"}</span>
            {item.committed && <span className="rounded-full bg-[#c9a227]/20 px-2 py-0.5 font-semibold text-[#6b5410]">Promise</span>}
            {item.due_on && <span className={overdue ? "font-semibold text-[#b3422f]" : "text-[#7a8a99]"}>{overdue ? "Past date · " : "Due "}{dueLabel(item.due_on)}</span>}
            {item.task_id && <span className="text-[#7a8a99]">from a task</span>}
          </div>
        </div>
        {own && !readOnly && !ended && (
          <div className="flex shrink-0 gap-1">
            <button className={btn} onClick={() => setEditing(true)}>Edit</button>
            <button className="rounded-full p-1.5 text-[#7a8a99] hover:text-[#b3422f]" aria-label="Remove" onClick={() => confirm("Remove this commitment?") && post({ action: "item-delete", id: item.id })}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      {item.detail && <p className="mt-2 text-sm text-[#5a6472] dark:text-[#b8c2cf]">{item.detail}</p>}
      {(item.reward || item.if_missed) && (
        <div className="mt-2 space-y-0.5 text-xs text-[#5a6472] dark:text-[#b8c2cf]">
          {item.reward && <p><b>When it&apos;s done:</b> {item.reward}</p>}
          {item.if_missed && <p><b>If it slips:</b> {item.if_missed}</p>}
        </div>
      )}

      {own && !readOnly && !ended && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(["open", "in_progress", "done"] as const).map((s) => (
            <button key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === s ? "bg-[#1a2b4a] text-white dark:bg-[#c9a227] dark:text-[#1a2b4a]" : "border border-[#1a2b4a]/20 text-[#5a6472] hover:bg-[#1a2b4a]/5 dark:text-[#b8c2cf]"}`} onClick={() => post({ action: "item-status", id: item.id, status: s })}>
              {s === "open" ? "Not started" : s === "in_progress" ? "In progress" : "Done"}
            </button>
          ))}
        </div>
      )}
      {!own && !readOnly && !ended && item.status !== "done" && view.partnership.status === "active" && <QuickCheer item={item} view={view} post={post} />}
      {own === false && readOnly && <p className="mt-2 text-xs text-[#7a8a99]">Status: {item.status === "done" ? "Done" : item.status === "in_progress" ? "In progress" : "Not started"}</p>}

      {tracked && (item.reward || item.if_missed) && (item.status === "done" || overdue) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#7a8a99]">Honored the reward or what happens if it slips?</span>
          {(["pending", "done", "skipped"] as const).map((v) => (
            <button key={v} disabled={readOnly || ended} className={`rounded-full px-2.5 py-1 font-semibold ${item.follow_through === v ? "bg-[#1a2b4a] text-white dark:bg-[#c9a227] dark:text-[#1a2b4a]" : "border border-[#1a2b4a]/20 text-[#5a6472]"}`} onClick={() => post({ action: "item-follow", id: item.id, value: v })}>
              {v === "pending" ? "Not yet" : v === "done" ? "Yes" : "Skipped"}
            </button>
          ))}
        </div>
      )}

      <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2E7C83] hover:underline" onClick={() => setShowNotes((s) => !s)}>
        <MessageSquare className="h-3.5 w-3.5" /> Notes {notes.length > 0 ? `(${notes.length})` : ""}
      </button>
      {showNotes && (
        <div className="mt-2 space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg bg-[#1a2b4a]/5 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              <p className="whitespace-pre-line">{n.body}</p>
              <p className="mt-0.5 text-[11px] text-[#7a8a99]">{authorOf(n.side)} · {when(n.created_at)}</p>
            </div>
          ))}
          {!readOnly && !ended && (
            <div className="flex gap-2">
              <input className={field} placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && note.trim() && post({ action: "note-add", itemId: item.id, body: note }).then(() => setNote(""))} maxLength={1000} />
              <button className={btn} disabled={!note.trim()} onClick={() => post({ action: "note-add", itemId: item.id, body: note }).then(() => setNote(""))}>Add</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickCheer({ item, view, post }: { item: Item; view: View; post: Post }) {
  const [sent, setSent] = useState("");
  async function send(kind: string, message: string) {
    const r = await post({ action: "nudge", kind, message, itemId: item.id });
    if (r) setSent(kind === "nudge" ? "Nudge sent" : "Sent");
  }
  if (sent) return <p className="mt-3 text-xs font-semibold text-[#2c6b3f]">{sent}</p>;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      <button className={btn} onClick={() => send("encourage", BUILT_IN[0].message)}><Heart className="h-3.5 w-3.5" /> Cheer {view.partner.name}</button>
      <button className={btn} onClick={() => send("nudge", `Quick check-in on "${item.title}": how's it going?`)}><HandHeart className="h-3.5 w-3.5" /> Nudge</button>
    </div>
  );
}

// ------------------------------------------------------------------ encouragement

function Encouragement({ view, post, readOnly }: { view: View; post: Post; readOnly: boolean }) {
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState("custom");
  const [itemId, setItemId] = useState("");
  const [sentMsg, setSentMsg] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [aiNote, setAiNote] = useState("");
  const theirOpen = view.items.filter((i) => i.side === view.partner.side && i.status !== "done");
  const active = view.partnership.status === "active";

  async function send(k = kind, m = message) {
    if (!m.trim()) return;
    setBusy(true);
    const r = await post({ action: "nudge", kind: k, message: m, itemId: itemId || undefined });
    setBusy(false);
    if (r) {
      setMessage("");
      setKind("custom");
      setOptions([]);
      setSentMsg(`Sent to ${view.partner.name}.`);
    }
  }
  async function ideas() {
    setBusy(true);
    setAiNote("");
    const ctx = itemId ? view.items.find((i) => i.id === itemId)?.title || "" : "";
    const d = await post({ action: "ai", kind: "nudge", purpose: kind === "custom" ? "encourage" : kind, context: ctx ? `Their commitment: ${ctx}` : "", tone: view.agreements.you?.tone || "gentle" });
    setBusy(false);
    if (!d) return;
    if (d.needsKey) return setAiNote("Add your AI key in Settings → AI Assistant to use writing help.");
    setOptions((d.messages as string[]) || []);
  }

  const kinds = Array.from(new Set(BUILT_IN.map((b) => b.kind)));
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-4">
        {!readOnly && (
          <div className={card}>
            <h3 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Send {view.partner.name} some support</h3>
            <p className="mt-0.5 text-xs text-[#7a8a99]">Tap a message to start from it, change it if you like, then send.</p>
            {kinds.map((k) => (
              <div key={k} className="mt-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7a8a99]">{KIND_LABEL[k]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {BUILT_IN.filter((b) => b.kind === k).map((b) => <button key={b.label} className={btn} onClick={() => { setMessage(b.message); setKind(k); }}>{b.label}</button>)}
                  {view.templates.filter((t) => t.kind === k).map((t) => (
                    <span key={t.id} className="inline-flex items-center rounded-full border border-[#c9a227]/50 text-xs font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                      <button className="px-3 py-1.5" onClick={() => { setMessage(t.message); setKind(k); }}>{t.message.length > 28 ? `${t.message.slice(0, 28)}…` : t.message}</button>
                      <button aria-label="Delete saved message" className="pr-2 text-[#7a8a99] hover:text-[#b3422f]" onClick={() => post({ action: "template-delete", id: t.id })}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <textarea className={`${field} mt-4`} rows={3} placeholder={`Write your own to ${view.partner.name}…`} value={message} onChange={(e) => { setMessage(e.target.value); if (kind !== "custom" && !BUILT_IN.some((b) => b.message === e.target.value)) setKind(kind); }} maxLength={500} />
            {theirOpen.length > 0 && (
              <select className={`${field} mt-2`} value={itemId} onChange={(e) => setItemId(e.target.value)} aria-label="About a commitment">
                <option value="">General (not about one commitment)</option>
                {theirOpen.map((i) => <option key={i.id} value={i.id}>About: {i.title}</option>)}
              </select>
            )}
            {options.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {options.map((o) => <button key={o} className="block w-full rounded-lg border border-[#2E7C83]/30 px-3 py-2 text-left text-sm text-[#1a2b4a] hover:bg-[#2E7C83]/5 dark:text-[#F8F5F0]" onClick={() => { setMessage(o); setOptions([]); }}>{o}</button>)}
              </div>
            )}
            {aiNote && <p className="mt-2 text-xs text-[#8a2f2f]">{aiNote}</p>}
            {sentMsg && <p className="mt-2 text-xs font-semibold text-[#2c6b3f]">{sentMsg}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={btnPrimary} disabled={busy || !active || !message.trim()} onClick={() => send()}><Send className="h-4 w-4" /> Send</button>
              <button className={btn} disabled={busy || !message.trim()} onClick={() => post({ action: "template-add", kind: kind === "custom" ? "encourage" : kind, message }).then((r) => r && setSentMsg("Saved to your messages."))}>Save as my own</button>
              <button className={btn} disabled={busy} onClick={ideas}><Sparkles className="h-3.5 w-3.5" /> Write some for me</button>
            </div>
            {!active && <p className="mt-2 text-xs text-[#7a8a99]">{view.partnership.status === "invited" ? "You can send encouragement once your partner says yes." : "Resume the partnership to send encouragement."}</p>}
          </div>
        )}
        {!readOnly && active && (
          <div className={card}>
            <h3 className="flex items-center gap-1.5 text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><LifeBuoy className="h-4 w-4 text-[#c9a227]" /> I&apos;m stuck</h3>
            <p className="mt-0.5 text-sm text-[#5a6472] dark:text-[#b8c2cf]">One tap asks {view.partner.name} for support. {view.agreements.you?.stuck_plan ? "Your own plan for this is in your agreement." : ""}</p>
            <button className={`${btn} mt-2`} disabled={busy} onClick={() => send("stuck", `I'm stuck and could use your help. ${view.agreements.you?.stuck_plan || ""}`.trim())}>Ask for support</button>
          </div>
        )}
      </div>

      <div className={card}>
        <h3 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Feed</h3>
        <div className="mt-3 space-y-2.5">
          {view.nudges.filter((n) => n.from_side !== "system" || n.to_side === view.viewer || view.viewer === "coach").length === 0 && <p className="text-sm text-[#7a8a99]">Nothing yet. The first kind word sets the tone.</p>}
          {view.nudges.filter((n) => n.from_side !== "system" || n.to_side === view.viewer || view.viewer === "coach").map((n) => {
            const mine = n.from_side === view.you.side;
            const from = n.from_side === "system" ? "Update" : mine ? (readOnly ? view.you.name : "You") : view.partner.name;
            return (
              <div key={n.id} className={`rounded-xl px-3 py-2 text-sm ${n.from_side === "system" ? "bg-[#1a2b4a]/5" : mine ? "bg-[#c9a227]/10" : "bg-[#2E7C83]/10"} ${n.to_side === view.viewer && !n.read_at ? "ring-1 ring-[#2E7C83]/40" : ""}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a8a99]">{from} · {KIND_LABEL[n.kind] || "Note"} · {when(n.created_at)}</p>
                <p className="mt-0.5 text-[#1a2b4a] dark:text-[#F8F5F0]">{n.message}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ weekly check-in

function CheckIn({ view, post, readOnly }: { view: View; post: Post; readOnly: boolean }) {
  const week = mondayOf(view.today);
  const mine = view.checkins.find((c) => c.side === view.you.side && c.week_of === week);
  const [wins, setWins] = useState(mine?.wins || "");
  const [stuck, setStuck] = useState(mine?.stuck || "");
  const [next, setNext] = useState(mine?.next_commit || "");
  const [saved, setSaved] = useState(false);
  const past = useMemo(() => view.checkins.filter((c) => c.week_of !== week || c.side !== view.you.side), [view.checkins, week, view.you.side]);
  const names = (s: Side) => (s === view.you.side ? (readOnly ? view.you.name : "You") : view.partner.name);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {!readOnly && (
        <div className={card}>
          <h3 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">This week&apos;s check-in</h3>
          <p className="mt-0.5 text-xs text-[#7a8a99]">Five minutes, once a week. {view.partner.name} sees it.</p>
          <label className="mt-3 block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">What went well?</label>
          <textarea className={field} rows={3} value={wins} onChange={(e) => setWins(e.target.value)} maxLength={1200} />
          <label className="mt-3 block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Where did I get stuck?</label>
          <textarea className={field} rows={3} value={stuck} onChange={(e) => setStuck(e.target.value)} maxLength={1200} />
          <label className="mt-3 block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">What I&apos;m committing to this week</label>
          <textarea className={field} rows={3} value={next} onChange={(e) => setNext(e.target.value)} maxLength={1200} />
          <button className={`${btnPrimary} mt-3`} disabled={view.partnership.status === "ended"} onClick={() => post({ action: "checkin-save", weekOf: week, wins, stuck, nextCommit: next }).then((r) => r && setSaved(true))}><Check className="h-4 w-4" /> Save check-in</button>
          {saved && <p className="mt-2 text-xs font-semibold text-[#2c6b3f]">Saved.</p>}
        </div>
      )}
      <div className={card}>
        <h3 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Check-ins</h3>
        <div className="mt-3 space-y-3">
          {(readOnly ? view.checkins : past).length === 0 && <p className="text-sm text-[#7a8a99]">No check-ins yet.</p>}
          {(readOnly ? view.checkins : past).map((c) => (
            <div key={c.id} className="rounded-xl bg-[#1a2b4a]/5 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a8a99]">{names(c.side)} · week of {when(c.week_of)}</p>
              {c.wins && <p className="mt-1"><b>Went well:</b> {c.wins}</p>}
              {c.stuck && <p className="mt-1"><b>Stuck on:</b> {c.stuck}</p>}
              {c.next_commit && <p className="mt-1"><b>This week:</b> {c.next_commit}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ agreement

function AgreementTab({ view, post, readOnly }: { view: View; post: Post; readOnly: boolean }) {
  const a = view.agreements.you;
  const [howHeld, setHowHeld] = useState(a?.how_held || "");
  const [tone, setTone] = useState(a?.tone || "gentle");
  const [checkIn, setCheckIn] = useState(a?.check_in || "");
  const [rewardSelf, setRewardSelf] = useState(a?.reward_self || "");
  const [rewardPartner, setRewardPartner] = useState(a?.reward_partner || "");
  const [missPlan, setMissPlan] = useState(a?.miss_plan || "");
  const [stuckPlan, setStuckPlan] = useState(a?.stuck_plan || "");
  const [mode, setMode] = useState(a?.consequence_mode || "pledge");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  async function draft() {
    setBusy(true);
    setInfo("");
    const d = await post({ action: "ai", kind: "agreement", notes, tone });
    setBusy(false);
    if (!d) return;
    if (d.needsKey) return setInfo("Add your AI key in Settings → AI Assistant to use writing help.");
    const x = d.draft as Record<string, string>;
    setHowHeld(x.howHeld || "");
    setCheckIn(x.checkIn || "");
    setRewardSelf(x.rewardSelf || "");
    setRewardPartner(x.rewardPartner || "");
    setMissPlan(x.missPlan || "");
    setStuckPlan(x.stuckPlan || "");
    setInfo("Here's a draft. Change anything, then save.");
  }

  const p = view.agreements.partner;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {!readOnly ? (
        <div className={card}>
          <h3 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">How I want to be held accountable</h3>
          <p className="mt-0.5 text-xs text-[#7a8a99]">Both of you write your own. You each read the other&apos;s.</p>
          <div className="mt-3 rounded-xl bg-[#c9a227]/10 p-3">
            <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Want help writing it?</p>
            <textarea className={`${field} mt-1`} rows={3} placeholder="A few words about how you work: what motivates you, what makes you avoid things, what kind of nudge helps…" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} />
            <button className={`${btn} mt-2`} disabled={busy} onClick={draft}><Sparkles className="h-3.5 w-3.5" /> {busy ? "Writing…" : "Draft it with AI"}</button>
            {info && <p className="mt-2 text-xs text-[#5a6472]">{info}</p>}
          </div>
          <Labeled label="How I want to be held accountable"><textarea className={field} rows={3} value={howHeld} onChange={(e) => setHowHeld(e.target.value)} maxLength={1200} /></Labeled>
          <Labeled label="The tone I respond to best">
            <select className={field} value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="gentle">Gentle: encouragement first</option>
              <option value="balanced">Balanced: kind and clear</option>
              <option value="direct">Direct: tell it to me straight</option>
            </select>
          </Labeled>
          <Labeled label="How and when we check in"><textarea className={field} rows={2} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} maxLength={400} /></Labeled>
          <Labeled label="Rewards I'll give myself"><textarea className={field} rows={2} value={rewardSelf} onChange={(e) => setRewardSelf(e.target.value)} maxLength={600} /></Labeled>
          <Labeled label={`How I'd like to celebrate with ${view.partner.name}`}><textarea className={field} rows={2} value={rewardPartner} onChange={(e) => setRewardPartner(e.target.value)} maxLength={600} /></Labeled>
          <Labeled label="When I'm stuck, I'll… and I'd like you to…"><textarea className={field} rows={2} value={stuckPlan} onChange={(e) => setStuckPlan(e.target.value)} maxLength={600} /></Labeled>
          <Labeled label="If I don't get something done">
            <div className="space-y-1.5">
              {MODES.map(([k, l, d]) => (
                <label key={k} className="flex items-start gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                  <input className="mt-1" type="radio" name="mode" checked={mode === k} onChange={() => setMode(k)} />
                  <span><b>{l}.</b> <span className="text-[#5a6472] dark:text-[#b8c2cf]">{d}</span></span>
                </label>
              ))}
            </div>
            {mode !== "none" && mode !== "tracked" && <textarea className={`${field} mt-2`} rows={2} placeholder="What it looks like, kindly and specifically" value={missPlan} onChange={(e) => setMissPlan(e.target.value)} maxLength={800} />}
            {mode === "both" && <p className="mt-1 text-xs text-[#7a8a99]">Your pledge above, plus a follow-through check on each commitment.</p>}
          </Labeled>
          <button className={`${btnPrimary} mt-4`} disabled={view.partnership.status === "ended"} onClick={() => post({ action: "agreement-save", howHeld, tone, checkIn, rewardSelf, rewardPartner, missPlan, stuckPlan, consequenceMode: mode }).then((r) => r && setInfo("Saved."))}><Check className="h-4 w-4" /> Save my agreement</button>
        </div>
      ) : (
        <AgreementRead title={`${view.you.name}'s agreement`} a={view.agreements.you} />
      )}
      <AgreementRead title={readOnly ? `${view.partner.name}'s agreement` : `${view.partner.name}'s agreement`} a={p} empty={`${view.partner.name} hasn't written theirs yet.`} />
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <label className="mb-1 block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{label}</label>
      {children}
    </div>
  );
}

function AgreementRead({ title, a, empty }: { title: string; a: Agreement | null; empty?: string }) {
  const rows: [string, string | null][] = a
    ? [
        ["How they want to be held accountable", a.how_held],
        ["Tone that works", a.tone === "gentle" ? "Gentle" : a.tone === "direct" ? "Direct" : "Balanced"],
        ["How and when we check in", a.check_in],
        ["Their own rewards", a.reward_self],
        ["Celebrating together", a.reward_partner],
        ["When they're stuck", a.stuck_plan],
        ["If something doesn't get done", a.consequence_mode === "none" ? "Keeping it light: no consequence." : [a.miss_plan, a.consequence_mode === "tracked" || a.consequence_mode === "both" ? "Tracked on each commitment." : ""].filter(Boolean).join(" ") || null],
      ]
    : [];
  return (
    <div className={card}>
      <h3 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</h3>
      {!a ? <p className="mt-2 text-sm text-[#7a8a99]">{empty || "Not written yet."}</p> : (
        <dl className="mt-3 space-y-3">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#7a8a99]">{k}</dt>
              <dd className="mt-0.5 whitespace-pre-line text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ wins

function Wins({ view }: { view: View }) {
  const done = view.items.filter((i) => i.status === "done" && i.completed_at).sort((a, b) => (b.completed_at! > a.completed_at! ? 1 : -1));
  return (
    <div className={card}>
      <h3 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Wins</h3>
      <p className="mt-0.5 text-xs text-[#7a8a99]">Everything either of you has finished. Worth looking back at on a hard week.</p>
      <div className="mt-3 space-y-2">
        {done.length === 0 && <p className="text-sm text-[#7a8a99]">The first finished commitment lands here.</p>}
        {done.map((i) => (
          <div key={i.id} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c6b3f]" />
            <div>
              <p className="text-[#1a2b4a] dark:text-[#F8F5F0]"><b>{i.side === view.you.side ? (view.viewer === "coach" ? view.you.name : "You") : view.partner.name}</b> finished {i.title}</p>
              <p className="text-[11px] text-[#7a8a99]">{when(i.completed_at!)}{i.reward ? ` · Reward: ${i.reward}` : ""}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
