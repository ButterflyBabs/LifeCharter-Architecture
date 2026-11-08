"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, ClipboardList, Download, LifeBuoy, LogIn, LogOut, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { hm, weekStart } from "@/lib/timeTracking";
import ReviewSummary from "./ReviewSummary";
import { STATUS_LABEL, goalProgress, helpState, loggedMinutes, payFor, shiftMinutes, submitBlocker, type ShiftStatus } from "@/lib/workLog";


type Item = { id: string; what: string; quantity: number | null; unit: string | null; minutes: number | null; taskId: number | null; projectId: string | null; challenge: string | null; helpAskedOf: string | null; helpReceivedFrom: string | null; helpNote: string | null };
type Shift = { id: string; personEmail: string; personName: string; clockIn: string; clockOut: string | null; status: ShiftStatus; summary: string | null; submittedAt: string | null; reviewedAt: string | null; reviewedBy: string | null; reviewNote: string | null; hourlyRate?: number | null; items: Item[] };
type Data = {
  me: { email: string; name: string; reviewer: boolean };
  shifts: Shift[];
  clockedIn: string | null;
  waitingCount: number;
  projects: { id: string; name: string }[];
  tasks: { id: number; title: string; project_id: string | null }[];
  names: string[];
  rates?: Record<string, number>;
  goals?: Record<string, number>;
  team?: { name: string; email: string }[];
};

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898] mb-1";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0] dark:border-white/20";
const primary = "inline-flex items-center gap-1.5 rounded-full bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const h2 = "mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";
const muted = "text-sm text-[#5b5f73] dark:text-[#b8a898]";
const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const dayOf = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const localInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const STATUS_STYLE: Record<ShiftStatus, string> = {
  open: "bg-[#2E7C83]/12 text-[#1f5f66] dark:text-[#7fd0d6]",
  submitted: "bg-[#c9a227]/20 text-[#7a5f0c] dark:text-[#e0c35a]",
  approved: "bg-[#2f7d4f]/15 text-[#1f5f3a] dark:text-[#8fd6aa]",
  returned: "bg-[#8a2f2f]/12 text-[#8a2f2f] dark:text-[#f0a0a0]",
};

const minsOf = (s: Shift) => shiftMinutes({ clock_in: s.clockIn, clock_out: s.clockOut });

type Act = (body: Record<string, unknown>, ok?: string) => Promise<boolean>;

/** The form for one line: what was done, how many, how long, challenges and help. */
function ItemForm({ d, shiftId, item, act, onDone }: { d: Data; shiftId: string; item?: Item; act: Act; onDone: () => void }) {
  const [what, setWhat] = useState(item?.what ?? "");
  const [qty, setQty] = useState(item?.quantity == null ? "" : String(item.quantity));
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [hours, setHours] = useState(item?.minutes ? String(Math.floor(item.minutes / 60)) : "");
  const [mins, setMins] = useState(item?.minutes ? String(item.minutes % 60) : "");
  const [projectId, setProjectId] = useState(item?.projectId ?? "");
  const [taskId, setTaskId] = useState(item?.taskId ? String(item.taskId) : "");
  const [challenge, setChallenge] = useState(item?.challenge ?? "");
  const [asked, setAsked] = useState(item?.helpAskedOf ?? "");
  const [got, setGot] = useState(item?.helpReceivedFrom ?? "");
  const [helpNote, setHelpNote] = useState(item?.helpNote ?? "");
  const [busy, setBusy] = useState(false);
  const id = `wl-${item?.id ?? shiftId}`;
  const total = (Number(hours) || 0) * 60 + (Number(mins) || 0);

  async function save() {
    setBusy(true);
    const ok = await act(
      { action: item ? "update_item" : "add_item", ...(item ? { id: item.id } : { shiftId }), what, quantity: qty === "" ? null : Number(qty), unit, minutes: hours === "" && mins === "" ? null : total, projectId: projectId || null, taskId: taskId ? Number(taskId) : null, challenge, helpAskedOf: asked, helpReceivedFrom: got, helpNote },
      item ? "Saved." : "Added to your log.",
    );
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#2E7C83]/30 bg-[#2E7C83]/5 p-4">
      <div>
        <label className={label} htmlFor={`${id}-what`}>What did you do?</label>
        <input id={`${id}-what`} className={input} value={what} maxLength={400} onChange={(e) => setWhat(e.target.value)} placeholder="Sent LinkedIn connection requests to new prospects" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={label} htmlFor={`${id}-qty`}>How many?</label>
          <input id={`${id}-qty`} inputMode="decimal" className={input} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="25" />
        </div>
        <div>
          <label className={label} htmlFor={`${id}-unit`}>What did you count?</label>
          <input id={`${id}-unit`} className={input} value={unit} maxLength={40} onChange={(e) => setUnit(e.target.value)} placeholder="DMs, posts, emails" />
        </div>
        <div>
          <label className={label} htmlFor={`${id}-h`}>How long: hours</label>
          <input id={`${id}-h`} inputMode="numeric" className={input} value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))} placeholder="0" />
        </div>
        <div>
          <label className={label} htmlFor={`${id}-m`}>How long: minutes</label>
          <input id={`${id}-m`} inputMode="numeric" className={input} value={mins} onChange={(e) => setMins(e.target.value.replace(/\D/g, ""))} placeholder="45" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`${id}-proj`}>Project (optional)</label>
          <select id={`${id}-proj`} className={input} value={projectId} onChange={(e) => { setProjectId(e.target.value); setTaskId(""); }}>
            <option value="">None</option>
            {d.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor={`${id}-task`}>Task (optional)</label>
          <select id={`${id}-task`} className={input} value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">None</option>
            {d.tasks.filter((t) => !projectId || t.project_id === projectId).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={label} htmlFor={`${id}-ch`}>Did anything get in the way?</label>
        <textarea id={`${id}-ch`} className={input} rows={2} value={challenge} maxLength={1000} onChange={(e) => setChallenge(e.target.value)} placeholder="Leave empty if nothing did. Example: the page kept timing out, so I could only send 10." />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor={`${id}-ask`}>Help I asked for, from</label>
          <input id={`${id}-ask`} list={`${id}-names`} className={input} value={asked} maxLength={120} onChange={(e) => setAsked(e.target.value)} placeholder="Name" />
        </div>
        <div>
          <label className={label} htmlFor={`${id}-got`}>Help I got, from</label>
          <input id={`${id}-got`} list={`${id}-names`} className={input} value={got} maxLength={120} onChange={(e) => setGot(e.target.value)} placeholder="Name" />
        </div>
        <div>
          <label className={label} htmlFor={`${id}-hn`}>What was the help about?</label>
          <input id={`${id}-hn`} className={input} value={helpNote} maxLength={1000} onChange={(e) => setHelpNote(e.target.value)} placeholder="How to find the right list" />
        </div>
        <datalist id={`${id}-names`}>{d.names.map((n) => <option key={n} value={n} />)}</datalist>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className={primary} disabled={busy || !what.trim()} onClick={() => void save()}><Check className="h-4 w-4" />{item ? "Save changes" : "Add to my log"}</button>
        <button className={btn} disabled={busy} onClick={onDone}>Cancel</button>
        {total > 0 && <span className={muted}>{hm(total)}</span>}
      </div>
    </div>
  );
}

function ItemRow({ d, i, editing, canEdit, canDelete, act, onEdit, onDone, shiftId }: { d: Data; i: Item; editing: boolean; canEdit: boolean; canDelete: boolean; act: Act; onEdit: () => void; onDone: () => void; shiftId: string }) {
  if (editing) return <li><ItemForm d={d} shiftId={shiftId} item={i} act={act} onDone={onDone} /></li>;
  const hs = helpState({ help_asked_of: i.helpAskedOf, help_received_from: i.helpReceivedFrom });
  const where = [i.projectId && d.projects.find((p) => p.id === i.projectId)?.name, i.taskId && d.tasks.find((t) => t.id === i.taskId)?.title].filter(Boolean).join(" · ");
  return (
    <li className="rounded-xl border border-[#1a2b4a]/10 p-3 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{i.what}</p>
          <p className={muted}>
            {[i.quantity != null ? `${i.quantity}${i.unit ? ` ${i.unit}` : ""}` : i.unit, i.minutes ? hm(i.minutes) : null, where || null].filter(Boolean).join(" · ") || "No count or time added"}
          </p>
        </div>
        {(canEdit || canDelete) && (
          <div className="flex gap-1.5">
            {canEdit && <button className={btn} aria-label={`Edit ${i.what}`} onClick={onEdit}><Pencil className="h-3.5 w-3.5" />Edit</button>}
            {canDelete && <button className={btn} aria-label={`Delete ${i.what}`} onClick={() => void act({ action: "delete_item", id: i.id })}><Trash2 className="h-3.5 w-3.5" /></button>}
          </div>
        )}
      </div>
      {i.challenge && (
        <p className="mt-2 flex gap-2 rounded-lg bg-[#c9a227]/15 px-3 py-2 text-sm text-[#5b4a0a] dark:text-[#e8d58a]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Challenge:</strong> {i.challenge}</span></p>
      )}
      {hs !== "none" && (
        <p className="mt-2 flex gap-2 rounded-lg bg-[#2E7C83]/10 px-3 py-2 text-sm text-[#1f5f66] dark:text-[#9fdde2]">
          <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {i.helpAskedOf && <><strong>Asked:</strong> {i.helpAskedOf}. </>}
            {i.helpReceivedFrom ? <><strong>Helped by:</strong> {i.helpReceivedFrom}. </> : <em>No help received yet. </em>}
            {i.helpNote}
          </span>
        </p>
      )}
    </li>
  );
}

function ShiftCard({ d, s, act, live }: { d: Data; s: Shift; act: Act; live?: boolean }) {
  const mine = s.personEmail === d.me.email;
  const reviewer = d.me.reviewer;
  const editable = reviewer || (mine && (s.status === "open" || s.status === "returned"));
  const [adding, setAdding] = useState(!!live && s.items.length === 0);
  const [editId, setEditId] = useState<string | null>(null);
  const [summary, setSummary] = useState(s.summary ?? "");
  const [times, setTimes] = useState<{ cin: string; cout: string } | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mins = minsOf(s);
  const logged = loggedMinutes(s.items.map((i) => ({ minutes: i.minutes })));
  const pay = reviewer ? payFor(mins, s.hourlyRate) : null;
  const blocker = submitBlocker({ clock_out: s.clockOut }, s.items);

  async function run(body: Record<string, unknown>, ok?: string) {
    setBusy(true);
    const r = await act(body, ok);
    setBusy(false);
    return r;
  }

  return (
    <article className={`${card} space-y-3`} aria-label={`${s.personName}, ${dayOf(s.clockIn)}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{reviewer && !mine ? `${s.personName} · ` : ""}{dayOf(s.clockIn)}</p>
          <p className={muted}>
            {timeOf(s.clockIn)} to {s.clockOut ? timeOf(s.clockOut) : "still clocked in"} · {hm(mins)}
            {pay != null && <> · <strong>{usd(pay)}</strong> at {usd(Number(s.hourlyRate))}/h</>}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
      </div>

      {s.status === "returned" && s.reviewNote && (
        <p className="rounded-lg bg-[#8a2f2f]/10 px-3 py-2 text-sm text-[#8a2f2f] dark:text-[#f0a0a0]"><strong>Sent back{s.reviewedBy ? ` by ${s.reviewedBy}` : ""}:</strong> {s.reviewNote}</p>
      )}

      {s.items.length > 0 && (
        <ul className="space-y-2">
          {s.items.map((i) => (
            <ItemRow key={i.id} d={d} i={i} shiftId={s.id} editing={editId === i.id} canEdit={editable} canDelete={editable} act={act} onEdit={() => setEditId(i.id)} onDone={() => setEditId(null)} />
          ))}
        </ul>
      )}
      {s.items.length > 0 && <p className={muted}>Accounted for {hm(logged)} of {hm(mins)} on the clock.</p>}

      {editable && (adding ? (
        <ItemForm d={d} shiftId={s.id} act={act} onDone={() => setAdding(false)} />
      ) : (
        <button className={btn} onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" />{mine ? "Add what I did" : "Add a line"}</button>
      ))}

      {s.summary && !(mine && editable) && <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]"><strong>Note about the day:</strong> {s.summary}</p>}

      {mine && editable && (
        <div>
          <label className={label} htmlFor={`sum-${s.id}`}>A note about your day (optional)</label>
          <textarea id={`sum-${s.id}`} className={input} rows={2} value={summary} maxLength={2000} onChange={(e) => setSummary(e.target.value)} placeholder="Anything you want AmiLynne to know" />
        </div>
      )}

      {editable && (
        <details className="text-sm" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open && !times) setTimes({ cin: localInput(s.clockIn), cout: localInput(s.clockOut) }); }}>
          <summary className="cursor-pointer text-xs font-semibold text-[#2E7C83]">Fix clock times</summary>
          {times && (
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <div><label className={label} htmlFor={`ci-${s.id}`}>Clocked in</label><input id={`ci-${s.id}`} type="datetime-local" className={input} value={times.cin} onChange={(e) => setTimes({ ...times, cin: e.target.value })} /></div>
              <div><label className={label} htmlFor={`co-${s.id}`}>Clocked out</label><input id={`co-${s.id}`} type="datetime-local" className={input} value={times.cout} onChange={(e) => setTimes({ ...times, cout: e.target.value })} /></div>
              <div className="flex items-end"><button className={btn} disabled={busy} onClick={() => void run({ action: "update_shift", id: s.id, clockIn: times.cin ? new Date(times.cin).toISOString() : undefined, clockOut: times.cout ? new Date(times.cout).toISOString() : undefined }, "Times saved.")}>Save times</button></div>
            </div>
          )}
        </details>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {mine && editable && !s.clockOut && (
          <button className="inline-flex items-center gap-2 rounded-full bg-[#8a2f2f] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={() => void run({ action: "clock_out", id: s.id, summary }, "Clocked out. Add anything you still need to, then submit your day.")}><LogOut className="h-4 w-4" />Clock out</button>
        )}
        {mine && editable && s.clockOut && (
          <button className={primary} disabled={busy || !!blocker} onClick={async () => { if (await run({ action: "update_shift", id: s.id, summary })) await run({ action: "submit", id: s.id }, "Submitted. You'll see it marked Approved once it has been reviewed."); }}><Check className="h-4 w-4" />Submit for review</button>
        )}
        {mine && editable && s.clockOut && blocker && <span className={muted}>{blocker}</span>}
        {mine && editable && !s.clockOut && s.items.length > 0 && <span className={muted}>Clock out first, then submit.</span>}
        {reviewer && s.status === "submitted" && (
          <>
            <button className={primary} disabled={busy} onClick={() => void run({ action: "approve", id: s.id }, "Approved.")}><Check className="h-4 w-4" />Approved</button>
            <button className={btn} disabled={busy} onClick={() => setBack(back === null ? "" : null)}><Undo2 className="h-3.5 w-3.5" />Send back</button>
          </>
        )}
        {reviewer && s.status === "approved" && <button className={btn} disabled={busy} onClick={() => setBack(back === null ? "" : null)}><Undo2 className="h-3.5 w-3.5" />Send back to edit</button>}
      </div>
      {reviewer && back !== null && (
        <div className="space-y-2 rounded-xl border border-[#8a2f2f]/30 p-3">
          <label className={label} htmlFor={`bk-${s.id}`}>What should {s.personName.split(" ")[0]} change?</label>
          <textarea id={`bk-${s.id}`} className={input} rows={2} value={back} onChange={(e) => setBack(e.target.value)} />
          <button className={btn} disabled={busy || !back.trim()} onClick={async () => { if (await run({ action: "return", id: s.id, note: back }, "Sent back.")) setBack(null); }}>Send it back</button>
        </div>
      )}
      {s.status === "approved" && s.reviewedAt && <p className={muted}>Approved {dayOf(s.reviewedAt)}{s.reviewedBy ? ` by ${s.reviewedBy}` : ""}.</p>}
    </article>
  );
}

export default function WorkLog() {
  const [week, setWeek] = useState(() => weekStart());
  const [d, setD] = useState<Data | null>(null);
  const [person, setPerson] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [bump, setBump] = useState(0); // any change made here makes the Hours summary look again
  const [rateEdit, setRateEdit] = useState<Record<string, string>>({});
  const [goalEdit, setGoalEdit] = useState<Record<string, string>>({});
  const [, tick] = useState(0);

  const range = useMemo(() => ({ from: week.toISOString(), to: new Date(week.getTime() + 7 * 86_400_000).toISOString() }), [week]);
  const load = useCallback(async () => {
    const j = (await fetch(`/api/work-log?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null)) as Data | null;
    if (j && j.me) setD(j);
  }, [range]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const act: Act = async (body, ok) => {
    setMsg("");
    const r = await fetch("/api/work-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(j.error || "That didn't work.");
      return false;
    }
    if (ok) setMsg(ok);
    await load();
    setBump((n) => n + 1);
    return true;
  };

  const reviewer = !!d?.me.reviewer;
  const live = d?.shifts.find((s) => s.id === d.clockedIn) ?? null;
  const inRange = (d?.shifts ?? []).filter((s) => s.clockIn >= range.from && s.clockIn < range.to && (!person || s.personEmail === person));
  const myUnfinished = (d?.shifts ?? []).filter((s) => s.personEmail === d?.me.email && (s.status === "open" || s.status === "returned") && s.id !== live?.id && !inRange.some((x) => x.id === s.id));
  const waiting = (d?.shifts ?? []).filter((s) => s.status === "submitted");
  // The shift being worked now and the ones waiting for review already show above, so the week list leaves them out.
  const days = useMemo(() => {
    const m = new Map<string, Shift[]>();
    for (const s of inRange) {
      if (s.id === live?.id || (reviewer && s.status === "submitted")) continue;
      const k = new Date(s.clockIn).toLocaleDateString("en-CA");
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [inRange, live, reviewer]);

  const weekMin = inRange.reduce((n, s) => n + minsOf(s), 0);
  const weekPay = reviewer ? inRange.reduce((n, s) => n + (payFor(minsOf(s), s.hourlyRate) ?? 0), 0) : 0;
  // Weekly hours goal: a member sees their own; the owner sees everyone who has one, for the week on screen.
  const minsFor = (email: string) => (d?.shifts ?? []).filter((s) => s.personEmail === email && s.clockIn >= range.from && s.clockIn < range.to).reduce((n, s) => n + minsOf(s), 0);
  const myGoal = d ? goalProgress(minsFor(d.me.email), d.goals?.[d.me.email]) : null;
  const goalRows = reviewer ? (d?.team ?? []).map((m) => ({ m, g: goalProgress(minsFor(m.email), d?.goals?.[m.email]), mins: minsFor(m.email) })).filter((r) => r.g) : [];
  const acts = inRange.reduce((n, s) => n + s.items.length, 0);
  const challenges = inRange.reduce((n, s) => n + s.items.filter((i) => i.challenge).length, 0);
  const helpWaiting = inRange.reduce((n, s) => n + s.items.filter((i) => helpState({ help_asked_of: i.helpAskedOf, help_received_from: i.helpReceivedFrom }) === "waiting").length, 0);
  const people = Array.from(new Map((d?.shifts ?? []).map((s) => [s.personEmail, s.personName])).entries());
  const weekLabel = `${week.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${new Date(week.getTime() + 6 * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a2b4a] to-[#2E7C83]"><ClipboardList className="h-6 w-6 text-white" /></div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Daily Operations</p>
          <h1 className="text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Work Log</h1>
          <p className="mt-1 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">Clock in, list what you got done and how long it took, note anything that got in the way and any help you asked for or received, then clock out and submit your day.</p>
        </div>
      </header>
      {msg && <p className="rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm" role="status">{msg}</p>}
      {!d && <p className={muted}>Loading...</p>}

      {d && reviewer && <ReviewSummary refreshKey={`${bump}|${d.shifts.map((x) => `${x.id}${x.status}`).join()}`} renderShift={(s: Shift) => <ShiftCard d={d} s={s} act={act} />} />}

      {d && reviewer && waiting.length > 0 && (
        <section className="space-y-3" aria-label="Waiting for your review">
          <h2 className={h2}>Waiting for your review ({waiting.length})</h2>
          {waiting.map((s) => <ShiftCard key={s.id} d={d} s={s} act={act} />)}
        </section>
      )}

      {d && (
        <section className="space-y-3" aria-label="My shift">
          {live ? (
            <>
              <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2E7C83]">Clocked in</p>
                  <p className="text-3xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(minsOf(live))}</p>
                  <p className={muted}>Since {timeOf(live.clockIn)} on {dayOf(live.clockIn)}</p>
                </div>
              </div>
              <ShiftCard d={d} s={live} act={act} live />
            </>
          ) : (
            <div className={card}>
              <h2 className={h2}>Ready to start?</h2>
              <p className={`${muted} mb-3`}>Your day starts when you press Clock in. The date and time are saved for you.</p>
              <button className={primary} disabled={busy} onClick={async () => { setBusy(true); await act({ action: "clock_in" }, "You're clocked in."); setBusy(false); }}><LogIn className="h-4 w-4" />Clock in</button>
            </div>
          )}
          {myUnfinished.length > 0 && (
            <div className="space-y-3">
              <h2 className={h2}>Still to submit</h2>
              {myUnfinished.map((s) => <ShiftCard key={s.id} d={d} s={s} act={act} />)}
            </div>
          )}
        </section>
      )}

      {d && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button className={btn} aria-label="Previous week" onClick={() => setWeek(new Date(week.getTime() - 7 * 86_400_000))}><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{weekLabel}</span>
              <button className={btn} aria-label="Next week" onClick={() => setWeek(new Date(week.getTime() + 7 * 86_400_000))}><ChevronRight className="h-4 w-4" /></button>
              <button className={btn} onClick={() => setWeek(weekStart())}>This week</button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {reviewer && people.length > 1 && (
                <label className="flex items-center gap-1.5">Show
                  <select className={`${input} w-auto`} value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Show whose log">
                    <option value="">Everyone</option>
                    {people.map(([em, nm]) => <option key={em} value={em}>{nm}</option>)}
                  </select>
                </label>
              )}
              <a className={btn} href={`/api/work-log?format=csv&from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`}><Download className="h-3.5 w-3.5" />Download CSV</a>
            </div>
          </div>

          <div className={`grid gap-3 sm:grid-cols-2 ${reviewer ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
            <div className={card}><p className={label}>Hours on the clock</p><p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(weekMin)}</p></div>
            <div className={card}><p className={label}>Things done</p><p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{acts}</p></div>
            <div className={card}><p className={label}>Challenges noted</p><p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{challenges}</p></div>
            <div className={card}><p className={label}>Help still waiting</p><p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{helpWaiting}</p></div>
            {reviewer && <div className={card}><p className={label}>Estimated pay</p><p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(weekPay)}</p></div>}
          </div>


          {!reviewer && myGoal && d && (
            <section className={card} aria-label="My weekly hours goal">
              <p className={label}>My goal this week</p>
              <p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(minsFor(d.me.email))} <span className="text-base font-normal text-[#5b5f73] dark:text-[#b8a898]">of {hm(myGoal.goalMin)}</span></p>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1a2b4a]/10 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={myGoal.pct}><div className="h-full rounded-full bg-[#2E7C83]" style={{ width: `${myGoal.pct}%` }} /></div>
              <p className={`${muted} mt-2`}>{myGoal.shortMin > 0 ? `${hm(myGoal.shortMin)} to go this week.` : "You've reached your hours for the week."}</p>
            </section>
          )}
          {reviewer && goalRows.length > 0 && (
            <section className={card} aria-label="Weekly hours goals">
              <h2 className={h2}>Weekly hours goals</h2>
              <ul className="space-y-3">
                {goalRows.map(({ m, g, mins }) => (
                  <li key={m.email}>
                    <p className="text-sm"><span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{m.name}</span> · {hm(mins)} of {hm(g!.goalMin)} · {g!.shortMin > 0 ? `${hm(g!.shortMin)} short` : "goal reached"}</p>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1a2b4a]/10 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={g!.pct}><div className="h-full rounded-full bg-[#2E7C83]" style={{ width: `${g!.pct}%` }} /></div>
                  </li>
                ))}
              </ul>
              <p className={`${muted} mt-2`}>Counts time on the clock for the week on screen, approved or not.</p>
            </section>
          )}

          {days.length === 0 && inRange.length === 0 && <p className={muted}>Nothing logged this week yet.</p>}
          {days.map(([day, list]) => (
            <section key={day} className="space-y-3" aria-label={dayOf(`${day}T12:00:00`)}>
              <h2 className={h2}>{dayOf(`${day}T12:00:00`)}</h2>
              {list.map((s) => <ShiftCard key={s.id} d={d} s={s} act={act} />)}
            </section>
          ))}

          {reviewer && d.team && (
            <section className={card} aria-label="Hourly rates">
              <h2 className={h2}>Hourly rates and weekly goals</h2>
              <p className={`${muted} mb-3`}>Only you see the rates. A rate applies to every day that is not yet approved. Approved days keep the rate they were approved at. Leave the rate empty for someone paid a flat amount. A weekly hours goal shows that person their own progress and shows you everyone's.</p>
              {d.team.length === 0 && <p className={muted}>Add team members in Settings to set their rates.</p>}
              <ul className="space-y-2">
                {d.team.map((m) => (
                  <li key={m.email} className="flex flex-wrap items-center gap-2">
                    <span className="min-w-[10rem] font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{m.name}</span>
                    <label className="flex items-center gap-1.5 text-sm">$
                      <input aria-label={`${m.name} hourly rate`} inputMode="decimal" className={`${input} w-28`} value={rateEdit[m.email] ?? (d.rates?.[m.email] != null ? String(d.rates[m.email]) : "")} onChange={(e) => setRateEdit({ ...rateEdit, [m.email]: e.target.value })} placeholder="0.00" />/h
                    </label>
                    <button className={btn} onClick={async () => { const v = rateEdit[m.email]; if (await act({ action: "set_rate", email: m.email, rate: v === undefined ? (d.rates?.[m.email] ?? null) : v === "" ? null : Number(v) }, `Saved ${m.name}'s rate.`)) setRateEdit((r) => { const n = { ...r }; delete n[m.email]; return n; }); }}>Save rate</button>
                    <label className="flex items-center gap-1.5 text-sm">Goal
                      <input aria-label={`${m.name} weekly hours goal`} inputMode="decimal" className={`${input} w-20`} value={goalEdit[m.email] ?? (d.goals?.[m.email] != null ? String(d.goals[m.email]) : "")} onChange={(e) => setGoalEdit({ ...goalEdit, [m.email]: e.target.value })} placeholder="10" />hours/week
                    </label>
                    <button className={btn} onClick={async () => { const v = goalEdit[m.email]; if (await act({ action: "set_goal", email: m.email, hours: v === undefined ? (d.goals?.[m.email] ?? null) : v === "" ? null : Number(v) }, `Saved ${m.name}'s weekly goal.`)) setGoalEdit((r) => { const n = { ...r }; delete n[m.email]; return n; }); }}>Save goal</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
