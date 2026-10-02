"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, CalendarDays, Phone, Video, X, Zap, Repeat } from "lucide-react";

export interface CallView {
  id: string;
  kind: "recurring" | "one_off";
  title: string;
  status: "proposed" | "confirmed";
  mine: boolean;
  proposedBy: string;
  summary: string;
  durationMin: number;
  location: string | null;
  note: string | null;
  recurFreq: string | null;
  recurDays: number[] | null;
  next: { date: string; start: string; end: string }[];
  google: string;
}
type Post = (body: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
interface Props { calls: CallView[]; partnerName: string; partnershipId: string; canAdd: boolean; icsUrl: (id: string) => string; post: Post }

const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/30 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/20 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5 disabled:opacity-50";
const btnPrimary = "inline-flex items-center gap-1.5 rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-[#F8F5F0] hover:opacity-90 disabled:opacity-50";
const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40 p-5";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const myTz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver";
  } catch {
    return "America/Denver";
  }
};
export const fmtWhen = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
const isUrl = (s: string | null) => !!s && /^https?:\/\//i.test(s);
const roundUp = (d: Date, step = 5) => new Date(Math.ceil(d.getTime() / (step * 60_000)) * step * 60_000);

function presets(): { label: string; at: Date }[] {
  const now = new Date();
  const at = (days: number, h: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(h, 0, 0, 0);
    return d;
  };
  const out = [
    { label: "In 30 minutes", at: roundUp(new Date(now.getTime() + 30 * 60_000)) },
    { label: "In an hour", at: roundUp(new Date(now.getTime() + 60 * 60_000)) },
  ];
  if (now.getHours() < 17) out.push({ label: "This evening, 6 PM", at: at(0, 18) });
  out.push({ label: "Tomorrow, 9 AM", at: at(1, 9) }, { label: "Tomorrow, noon", at: at(1, 12) });
  return out;
}

// The strip shown above the tabs: a request waiting on you, then the next call with its Join and calendar buttons.
export function NextCallStrip({ calls, partnerName, icsUrl, post, onOpen }: { calls: CallView[]; partnerName: string; icsUrl: (id: string) => string; post: Post; onOpen: () => void }) {
  const ask = calls.find((c) => c.status === "proposed" && !c.mine);
  const next = calls.filter((c) => c.status === "confirmed")[0];
  if (!ask && !next) return null;
  return (
    <div className="space-y-2">
      {ask && (
        <div className="rounded-2xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-4">
          <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{ask.proposedBy} asked for a {ask.kind === "recurring" ? "standing call" : "call"}: {ask.title}</p>
          <p className="mt-0.5 text-sm text-[#5a6472] dark:text-[#b8c2cf]">{fmtWhen(ask.next[0].start)}{ask.kind === "recurring" ? ` · ${ask.recurFreq === "biweekly" ? "every other week" : "every week"}` : ""} · {ask.durationMin} min</p>
          <div className="mt-2 flex gap-2">
            <button className={btnPrimary} onClick={() => post({ action: "call-respond", id: ask.id, answer: "yes" })}>Yes, that works</button>
            <button className={btn} onClick={() => post({ action: "call-respond", id: ask.id, answer: "no" })}>Can&apos;t make it</button>
            <button className={btn} onClick={onOpen}>See details</button>
          </div>
        </div>
      )}
      {next && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2E7C83]/30 bg-[#2E7C83]/10 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1F5E63]">Next call with {partnerName}</p>
            <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{fmtWhen(next.next[0].start)} · {next.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isUrl(next.location) && (
              <a className={`${btnPrimary} !py-1.5 !text-xs`} href={next.location!} target="_blank" rel="noopener noreferrer"><Video className="h-3.5 w-3.5" /> Join</a>
            )}
            <a className={btn} href={icsUrl(next.id)}><CalendarPlus className="h-3 w-3" /> Add to calendar</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CallsTab({ calls, partnerName, partnershipId, canAdd, icsUrl, post }: Props) {
  const key = `acc-call-how:${partnershipId}`;
  const [how, setHow] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState("");
  const [showOne, setShowOne] = useState(false);
  const [showRec, setShowRec] = useState(calls.length === 0);
  const [answerHow, setAnswerHow] = useState<Record<string, string>>({});

  const now = new Date();
  const soon = roundUp(new Date(now.getTime() + 24 * 3_600_000));
  const [oneDate, setOneDate] = useState(ymd(soon));
  const [oneTime, setOneTime] = useState(hm(soon));
  const [oneTitle, setOneTitle] = useState("");
  const [recTitle, setRecTitle] = useState("Weekly check-in call");
  const [recDays, setRecDays] = useState<number[]>([new Date().getDay()]);
  const [recTime, setRecTime] = useState("16:00");
  const [recFreq, setRecFreq] = useState<"weekly" | "biweekly">("weekly");
  const [recDur, setRecDur] = useState(20);

  useEffect(() => {
    try {
      setHow(localStorage.getItem(key) || "");
    } catch {
      /* private mode */
    }
  }, [key]);
  const saveHow = (v: string) => {
    setHow(v);
    try {
      localStorage.setItem(key, v);
    } catch {
      /* private mode */
    }
  };

  async function add(body: Record<string, unknown>, okMsg: string) {
    setBusy(true);
    setSent("");
    const r = await post({ action: "call-add", tz: myTz(), location: how, note, ...body });
    setBusy(false);
    if (r) {
      setSent(okMsg);
      setNote("");
    }
  }
  const quick = (p: { label: string; at: Date }) => add({ kind: "one_off", title: "Quick call", date: ymd(p.at), time: hm(p.at), durationMin: 15 }, `Asked ${partnerName} for a quick call ${p.label.toLowerCase()}. They'll get an email, and it shows in their notifications.`);

  return (
    <div className="space-y-5">
      <div className={card}>
        <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">How will you two connect?</p>
        <input className={`${field} mt-2`} placeholder="Your Zoom or Meet link, or a phone number (optional)" value={how} onChange={(e) => saveHow(e.target.value)} maxLength={300} />
        <p className="mt-1 text-xs text-[#7a8a99]">Remembered on this device and added to the calls you set up below. {partnerName} can add theirs when they say yes.</p>
      </div>

      {canAdd && (
        <div className={card}>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><Zap className="h-4 w-4 text-[#c9a227]" /> Quick call</p>
          <p className="mt-0.5 text-xs text-[#7a8a99]">One tap. {partnerName} gets your request and can say yes or no.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {presets().map((p) => (
              <button key={p.label} className={btn} disabled={busy} onClick={() => quick(p)}>{p.label}</button>
            ))}
            <button className={btn} onClick={() => setShowOne((v) => !v)}><CalendarDays className="h-3 w-3" /> Pick a time</button>
          </div>
          {showOne && (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <input id="acc-one-date" className={field} type="date" value={oneDate} min={ymd(new Date())} onChange={(e) => setOneDate(e.target.value)} />
              <input id="acc-one-time" className={field} type="time" value={oneTime} onChange={(e) => setOneTime(e.target.value)} />
              <input id="acc-one-title" className={field} placeholder="What's it about? (optional)" value={oneTitle} onChange={(e) => setOneTitle(e.target.value)} maxLength={80} />
              <button className={`${btnPrimary} sm:col-span-3 justify-center`} disabled={busy || !oneDate || !oneTime} onClick={() => add({ kind: "one_off", title: oneTitle || "Accountability call", date: oneDate, time: oneTime, durationMin: 20 }, `Request sent to ${partnerName}.`)}>Ask {partnerName}</button>
            </div>
          )}
          <input className={`${field} mt-3`} placeholder="Add a note to your request (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          {sent && <p className="mt-2 rounded-lg bg-[#2E7C83]/10 px-3 py-2 text-sm text-[#1F5E63]">{sent}</p>}
        </div>
      )}

      {canAdd && (
        <div className={card}>
          <button className="flex w-full items-center justify-between text-left" onClick={() => setShowRec((v) => !v)}>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><Repeat className="h-4 w-4 text-[#2E7C83]" /> Set a standing call</span>
            <span className="text-xs text-[#7a8a99]">{showRec ? "Hide" : "Show"}</span>
          </button>
          {showRec && (
            <div className="mt-3 space-y-3">
              <input id="acc-rec-title" className={field} value={recTitle} onChange={(e) => setRecTitle(e.target.value)} maxLength={80} />
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d, i) => (
                  <button key={d} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${recDays.includes(i) ? "bg-[#1a2b4a] text-white dark:bg-[#c9a227] dark:text-[#1a2b4a]" : "border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`} onClick={() => setRecDays((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].slice(-3)))}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input id="acc-rec-time" className={field} type="time" value={recTime} onChange={(e) => setRecTime(e.target.value)} />
                <select id="acc-rec-freq" className={field} value={recFreq} onChange={(e) => setRecFreq(e.target.value as "weekly" | "biweekly")}>
                  <option value="weekly">Every week</option>
                  <option value="biweekly">Every other week</option>
                </select>
                <select id="acc-rec-dur" className={field} value={recDur} onChange={(e) => setRecDur(Number(e.target.value))}>
                  {[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
                </select>
              </div>
              <p className="text-xs text-[#7a8a99]">Times are in your timezone ({myTz().replace(/_/g, " ")}). {partnerName} sees them in theirs, and the call holds its clock time through daylight saving.</p>
              <button className={btnPrimary} disabled={busy || !recDays.length || !recTime} onClick={() => add({ kind: "recurring", title: recTitle, date: ymd(new Date()), time: recTime, days: recDays, freq: recFreq, durationMin: recDur }, `Standing call proposed to ${partnerName}. It's set once they say yes.`)}>Propose this to {partnerName}</button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">On the calendar</h3>
        {calls.length === 0 && <p className="text-sm text-[#7a8a99]">No calls yet. Set a standing weekly check-in, or ask for a quick one above.</p>}
        {calls.map((c) => (
          <div key={c.id} className={card}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.kind === "recurring" ? <Repeat className="h-4 w-4 text-[#2E7C83]" /> : <Phone className="h-4 w-4 text-[#c9a227]" />}{c.title}</p>
                <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">{c.kind === "recurring" ? `${c.recurFreq === "biweekly" ? "Every other " : "Every "}${[...(c.recurDays || [])].sort().map((d) => DAYS[d]).join(", ")} · ${c.durationMin} min` : `${c.durationMin} min`}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.status === "confirmed" ? "bg-[#2c6b3f]/15 text-[#2c6b3f]" : "bg-[#c9a227]/20 text-[#6b5410]"}`}>{c.status === "confirmed" ? "Confirmed" : c.mine ? `Waiting on ${partnerName}` : "Needs your answer"}</span>
            </div>
            <ul className="mt-2 space-y-0.5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              {c.next.map((o, i) => (
                <li key={o.start} className="flex items-center gap-2">
                  <span className={i === 0 ? "font-semibold" : "text-[#5a6472] dark:text-[#b8c2cf]"}>{fmtWhen(o.start)}</span>
                  {c.kind === "recurring" && c.status === "confirmed" && <button className="text-xs text-[#7a8a99] underline" onClick={() => confirm("Skip this one? The call stays on for the following weeks.") && post({ action: "call-skip", id: c.id, date: o.date })}>skip</button>}
                </li>
              ))}
            </ul>
            {c.location && <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">{isUrl(c.location) ? <a className="font-semibold text-[#2E7C83] hover:underline" href={c.location} target="_blank" rel="noopener noreferrer">{c.location}</a> : c.location}</p>}
            {c.note && <p className="mt-1 text-sm italic text-[#5a6472] dark:text-[#b8c2cf]">&ldquo;{c.note}&rdquo;</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {c.status === "proposed" && !c.mine && (
                <>
                  {!c.location && <input className={`${field} max-w-xs`} placeholder="Your call link or number (optional)" value={answerHow[c.id] ?? how} onChange={(e) => setAnswerHow((a) => ({ ...a, [c.id]: e.target.value }))} />}
                  <button className={btnPrimary} onClick={() => post({ action: "call-respond", id: c.id, answer: "yes", location: answerHow[c.id] ?? how })}>Yes, that works</button>
                  <button className={btn} onClick={() => post({ action: "call-respond", id: c.id, answer: "no" })}>Can&apos;t make it</button>
                </>
              )}
              {c.status === "confirmed" && (
                <>
                  {isUrl(c.location) && <a className={btn} href={c.location!} target="_blank" rel="noopener noreferrer"><Video className="h-3 w-3" /> Join</a>}
                  <a className={btn} href={icsUrl(c.id)}><CalendarPlus className="h-3 w-3" /> Apple / Outlook</a>
                  <a className={btn} href={c.google} target="_blank" rel="noopener noreferrer"><CalendarPlus className="h-3 w-3" /> Google Calendar</a>
                </>
              )}
              {canAdd && <button className={btn} onClick={() => confirm(c.kind === "recurring" ? "Cancel this standing call?" : "Cancel this call?") && post({ action: "call-cancel", id: c.id })}><X className="h-3 w-3" /> {c.status === "proposed" && c.mine ? "Withdraw" : "Cancel"}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
