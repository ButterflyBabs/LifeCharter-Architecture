"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Search, Timer, UserRound } from "lucide-react";
import { CONCERNS, INTERESTS, type InterestKey } from "@/lib/preFounderCall";

interface Booking { id: string; contactId: string | null; name: string; email: string; startAt: string; status: string }
interface Found { id: string; email: string; first_name: string | null; last_name: string | null; company: string | null }
interface Card {
  contact: { id: string; email: string; first_name: string | null; last_name: string | null; phone: string | null; company: string | null; job_title: string | null; website: string | null; tags: string[]; custom: Record<string, string> };
  events: { id: string; kind: string; title: string; created_at: string }[];
}
type Notes = Record<string, string>;
interface Draft { notes: Notes; interest: InterestKey | ""; concerns: string[]; affiliate: boolean; priceCorrected: boolean; about: Record<string, string>; followUpOn: string }

const box = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/30 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40 p-5";
const say = "rounded-xl border-l-4 border-[#c9a227] bg-[#c9a227]/10 px-4 py-3 text-[15px] leading-relaxed text-[#1a2b4a] dark:text-[#F8F5F0]";
const ask = "text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";
const emptyDraft = (): Draft => ({ notes: {}, interest: "", concerns: [], affiliate: false, priceCorrected: false, about: {}, followUpOn: "" });
const nameOf = (c: { first_name: string | null; last_name: string | null; email: string }) => [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const localDay = (add = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + add);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PHASES = [
  { id: "open", time: "0:00", title: "Open" },
  { id: "business", time: "2:00", title: "Their business today" },
  { id: "bridge", time: "9:00", title: "Mirror and bridge" },
  { id: "offer", time: "11:00", title: "The Pre-Founder spot" },
  { id: "questions", time: "15:00", title: "Their questions" },
  { id: "decide", time: "19:00", title: "Their decision" },
  { id: "share", time: "23:00", title: "Who else, and the affiliate program" },
  { id: "close", time: "25:00", title: "Close" },
];

export default function PreFounderCall() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Found[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [cardData, setCardData] = useState<Card | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [saved, setSaved] = useState<string[] | null>(null);
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const loaded = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/pre-founder-call", { cache: "no-store" }).then((r) => r.json()).then((d) => setBookings(d.bookings ?? [])).catch(() => setBookings([]));
  }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    const d = await fetch(`/api/crm/contacts?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setFound((d.contacts ?? []).slice(0, 8));
  }

  const open = useCallback(async (id: string) => {
    setSel(id);
    setSaved(null);
    setMsg("");
    setCardData(null);
    const d = (await fetch(`/api/crm/contacts/${id}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null)) as Card | null;
    if (!d) return setMsg("Couldn't open that contact.");
    setCardData(d);
    let next = emptyDraft();
    try {
      const raw = localStorage.getItem(`pf-call:${id}`);
      if (raw) next = { ...next, ...JSON.parse(raw) };
    } catch {
      /* private mode */
    }
    const tags = d.contact.tags || [];
    if (!raw0(next) && (tags.includes("sneak-peek-attended") || tags.includes("sneak-peek-unable"))) next.priceCorrected = true;
    next.about = { company: d.contact.company || "", jobTitle: d.contact.job_title || "", phone: d.contact.phone || "", website: d.contact.website || "", ...next.about };
    loaded.current = id;
    setDraft(next);
  }, []);
  const raw0 = (d: Draft) => Object.keys(d.notes).length > 0 || d.interest !== "";

  // Notes are kept on this device as you type, so nothing is lost if the page closes mid-call.
  useEffect(() => {
    if (!sel || loaded.current !== sel) return;
    try {
      localStorage.setItem(`pf-call:${sel}`, JSON.stringify(draft));
    } catch {
      /* private mode */
    }
  }, [draft, sel]);

  const setNote = (k: string, v: string) => setDraft((d) => ({ ...d, notes: { ...d.notes, [k]: v } }));
  const n = (k: string) => draft.notes[k] || "";
  const first = cardData ? cardData.contact.first_name || "there" : "[Name]";
  const wasAtPeek = cardData?.contact.tags.includes("sneak-peek-attended");
  const wasInvited = cardData?.contact.tags.includes("sneak-peek-attended") || cardData?.contact.tags.includes("sneak-peek-unable");

  const elapsed = started ? Math.floor((now - started) / 1000) : 0;
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  const phaseNow = started ? [...PHASES].reverse().find((p) => elapsed >= Number(p.time.split(":")[0]) * 60)?.id : null;

  const concernLine = useMemo(() => draft.concerns.map((k) => CONCERNS.find((c) => c.key === k)?.label).filter(Boolean).join(", "), [draft.concerns]);

  async function save() {
    if (!sel || !draft.interest) return setMsg("Choose where they landed (Their decision) before saving.");
    setBusy(true);
    setMsg("");
    const notes = { ...draft.notes, concerns: [concernLine, draft.notes.concerns].filter(Boolean).join(". ") };
    const r = await fetch("/api/pre-founder-call", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: sel, interest: draft.interest, notes, affiliate: draft.affiliate, priceCorrected: draft.priceCorrected, about: draft.about }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setBusy(false);
      return setMsg(d.error || "That didn't save. Your notes are still here; try again.");
    }
    const done: string[] = [`Note added to ${d.name}'s timeline`, "Pre-Founder fields filled in on their card", `Tagged ${(d.tags as string[]).filter((t) => t.startsWith("pre-founder")).join(", ")}`, d.bookingCompleted ? "Booking marked completed" : "Call logged as attended"];
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const post = (body: Record<string, unknown>) => fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tz, ...body }) });
    if (draft.interest === "ready") {
      const t = await post({ title: `Issue Command Suite login for ${d.name} (Pre-Founder)`, description: `Confirm email: ${cardData?.contact.email}. ${n("nextStep")}`.trim(), status: "today", dueDay: localDay() }).catch(() => null);
      if (t?.ok) done.push("Task: issue their login and password");
    }
    if (draft.followUpOn) {
      const t = await post({ title: `Follow up with ${d.name}`, description: `Pre-Founder call: ${d.interest}. ${n("nextStep")}`.trim(), status: draft.followUpOn <= localDay() ? "today" : "backlog", dueDay: draft.followUpOn, followup: { channel: "task", contactId: sel, contactName: d.name, contactEmail: cardData?.contact.email || "" } }).catch(() => null);
      if (t?.ok) done.push(`Task: follow up on ${draft.followUpOn}`);
    }
    try {
      localStorage.removeItem(`pf-call:${sel}`);
    } catch {
      /* private mode */
    }
    setBusy(false);
    setSaved(done);
    setStarted(null);
  }

  const toggleConcern = (k: string) => setDraft((d) => ({ ...d, concerns: d.concerns.includes(k) ? d.concerns.filter((x) => x !== k) : [...d.concerns, k] }));
  const area = (k: string, label: string, rows = 2, hint?: string) => (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#7a8a99]" htmlFor={`pf-${k}`}>{label}</label>
      <textarea id={`pf-${k}`} className={box} rows={rows} value={n(k)} onChange={(e) => setNote(k, e.target.value)} placeholder={hint} />
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a]"><UserRound className="h-6 w-6 text-white" /></div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Pre-Founder 1:1 Call</h1>
          <p className="text-[#7a8a99]">Your script for the call. Type as you go; Save puts it all on their contact card.</p>
        </div>
      </div>

      <div className={`${card} mb-5`}>
        <p className={ask}>Who&apos;s on the call?</p>
        {bookings && bookings.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {bookings.map((b) => (
              <button key={b.id} disabled={!b.contactId} onClick={() => b.contactId && open(b.contactId)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${sel === b.contactId ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                <CalendarClock className="mr-1 inline h-3 w-3" />{b.name} · {fmt(b.startAt)}{b.status === "completed" ? " · done" : ""}
              </button>
            ))}
          </div>
        )}
        {bookings && bookings.length === 0 && <p className="mt-2 text-xs text-[#7a8a99]">No Pre-Founder Inquiry Calls booked yet. Search for anyone below.</p>}
        <form onSubmit={search} className="mt-3 flex gap-2">
          <input className={box} placeholder="Search by name, email or company" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search contacts" />
          <button className="inline-flex items-center gap-1.5 rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-[#F8F5F0]"><Search className="h-4 w-4" /> Find</button>
        </form>
        {found && (
          <ul className="mt-2 divide-y divide-[#1a2b4a]/10 text-sm">
            {found.length === 0 && <li className="py-2 text-[#7a8a99]">No one found.</li>}
            {found.map((c) => (
              <li key={c.id}><button className="w-full py-2 text-left hover:bg-[#1a2b4a]/5" onClick={() => { setFound(null); void open(c.id); }}><b>{nameOf(c)}</b> <span className="text-[#7a8a99]">{c.email}{c.company ? ` · ${c.company}` : ""}</span></button></li>
            ))}
          </ul>
        )}
      </div>

      {msg && <p className="mb-4 rounded-xl bg-[#b06a5a]/10 px-4 py-3 text-sm text-[#8a2f2f]">{msg}</p>}

      {saved && (
        <div className="mb-5 rounded-2xl border border-[#2c6b3f]/30 bg-[#2c6b3f]/10 p-5">
          <p className="flex items-center gap-2 text-base font-semibold text-[#2c6b3f]"><CheckCircle2 className="h-5 w-5" /> Saved to {cardData ? nameOf(cardData.contact) : "the contact"}&apos;s card</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{saved.map((s) => <li key={s}>{s}</li>)}</ul>
          <div className="mt-3 flex gap-3 text-sm font-semibold">
            <Link className="text-[#2E7C83] hover:underline" href="/contacts">Open Contacts</Link>
            <button className="text-[#2E7C83] hover:underline" onClick={() => { setSel(null); setCardData(null); setSaved(null); setDraft(emptyDraft()); }}>Start the next call</button>
          </div>
        </div>
      )}

      {!sel && !saved && <p className="text-sm text-[#7a8a99]">Pick someone above to open the script.</p>}

      {sel && cardData && !saved && (
        <div className="space-y-5">
          <div className={card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{nameOf(cardData.contact)}</p>
                <p className="text-sm text-[#7a8a99]">{cardData.contact.email}{cardData.contact.phone ? ` · ${cardData.contact.phone}` : ""}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Timer className="h-4 w-4 text-[#c9a227]" />
                {started ? <b className="tabular-nums">{clock}</b> : <button className="rounded-full border border-[#1a2b4a]/20 px-3 py-1 text-xs font-semibold" onClick={() => setStarted(Date.now())}>Start timer</button>}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">{cardData.contact.tags.map((t) => <span key={t} className="rounded-full bg-[#1a2b4a]/8 px-2 py-0.5 text-[11px] text-[#5a6472] dark:text-[#b8c2cf]">{t}</span>)}</div>
            {wasAtPeek ? <p className="mt-2 text-sm text-[#2c6b3f]">Was on the Sneak Peek call.</p> : cardData.contact.tags.includes("sneak-peek-unable") ? <p className="mt-2 text-sm text-[#6b5410]">Couldn&apos;t make the Sneak Peek; they got the replay.</p> : null}
            {cardData.events.filter((e) => e.kind === "note").slice(0, 2).map((e) => <p key={e.id} className="mt-2 text-xs text-[#5a6472] dark:text-[#b8c2cf]"><b>Earlier note:</b> {e.title.slice(0, 160)}</p>)}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(["company", "jobTitle", "phone", "website"] as const).map((k) => (
                <input key={k} className={box} aria-label={k} placeholder={{ company: "Company", jobTitle: "Role", phone: "Phone", website: "Website" }[k]} value={draft.about[k] || ""} onChange={(e) => setDraft((d) => ({ ...d, about: { ...d.about, [k]: e.target.value } }))} />
              ))}
            </div>
            <p className="mt-1 text-xs text-[#7a8a99]">Anything you fill in or fix here updates their card when you save.</p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
            {PHASES.map((p) => <a key={p.id} href={`#pf-${p.id}`} className={`rounded-full px-2.5 py-1 ${phaseNow === p.id ? "bg-[#c9a227] text-[#1a2b4a]" : "bg-[#1a2b4a]/8 text-[#5a6472] dark:text-[#b8c2cf]"}`}>{p.time} {p.title}</a>)}
          </div>

          <section id="pf-open" className={card}>
            <h2 className="mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Open <span className="text-xs font-normal text-[#7a8a99]">0:00 to 2:00</span></h2>
            <p className={say}>&ldquo;{first}, I&apos;m so glad you booked this. Thank you for being one of the first people I showed this to. Today is just the two of us. I want to hear about you and your business first. Then I&apos;ll tell you exactly what the Pre-Founder spot is, and by the end we&apos;ll know together if it&apos;s right for you and what happens next. Sound good?&rdquo;</p>
            <p className={`${ask} mt-4`}>&ldquo;What stood out for you from the Sneak Peek{wasAtPeek ? "" : " (or the replay)"}?&rdquo;</p>
            <div className="mt-2">{area("stoodOut", "What stood out", 2, "Their words")}</div>
          </section>

          <section id="pf-business" className={card}>
            <h2 className="mb-1 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Their business today <span className="text-xs font-normal text-[#7a8a99]">2:00 to 9:00</span></h2>
            <p className="mb-3 text-xs text-[#7a8a99]">Ask, then go quiet. Take two or three of these, and follow the one with energy behind it.</p>
            <div className="space-y-4">
              <div><p className={ask}>&ldquo;Tell me about your business: who you serve and how.&rdquo;</p>{area("business", "Their business", 2)}</div>
              <div><p className={ask}>&ldquo;Walk me through a normal week. Where does the time actually go?&rdquo;<br />&ldquo;What&apos;s the thing you know needs attention, but keeps getting put off?&rdquo;</p>{area("bottleneck", "Biggest bottleneck", 3)}</div>
              <div><p className={ask}>&ldquo;What are you using today for your calendar, email, contacts, tasks and money? How many logins is that?&rdquo;</p>{area("tools", "Tools they use today", 2, "Calendly, a spreadsheet, QuickBooks...")}</div>
              <div><p className={ask}>&ldquo;Picture this business a year from now, still running exactly like it runs today. How does that feel?&rdquo;</p>{area("yearOut", "A year from now", 2)}</div>
            </div>
          </section>

          <section id="pf-bridge" className={card}>
            <h2 className="mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Mirror and bridge <span className="text-xs font-normal text-[#7a8a99]">9:00 to 11:00</span></h2>
            <p className={say}>&ldquo;What I&apos;m hearing is [their words from above]. That is exactly the pattern the Command Suite was built to break. From what you saw, what would you use first?&rdquo;</p>
            <div className="mt-3">{area("firstUse", "What they would use first", 2)}</div>
          </section>

          <section id="pf-offer" className={card}>
            <h2 className="mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">The Pre-Founder spot <span className="text-xs font-normal text-[#7a8a99]">11:00 to 15:00</span></h2>
            <p className={say}>&ldquo;Here&apos;s exactly what the Pre-Founder spot is. You get a full VIP account: no implementation fee, and no monthly fee for your first six months. After six months it&apos;s $497 a month, and that rate is locked in for as long as you&apos;re with us. For a first year, that&apos;s more than $10,000 you&apos;re not paying. You also get Executive Coaching with me, with calls every weekday, because the app and the coaching are one thing. In return, I&apos;m asking you to actually use it, build your own business into it, and tell me honestly what works and what doesn&apos;t: your feedback, your suggestions, your insights as we keep building this together. It isn&apos;t perfect, and what we don&apos;t know, we figure out together.&rdquo;</p>
            <label className="mt-3 flex items-start gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              <input type="checkbox" className="mt-1" checked={draft.priceCorrected} onChange={(e) => setDraft((d) => ({ ...d, priceCorrected: e.target.checked }))} />
              <span><b>Correct the price</b>{wasInvited ? " (they were at the Sneak Peek, or watched the replay)" : ""}. Say: <i>&ldquo;One correction from the Sneak Peek: I said $397, and that was my mistake. The right number is $497 a month, locked in.&rdquo;</i></span>
            </label>
            <p className="mt-3 text-xs text-[#7a8a99]">Only this offer: if they ask about other levels, say &ldquo;the Pre-Founder VIP is the one I&apos;m talking about today.&rdquo;</p>
          </section>

          <section id="pf-questions" className={card}>
            <h2 className="mb-1 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Their questions <span className="text-xs font-normal text-[#7a8a99]">15:00 to 19:00</span></h2>
            <p className="mb-3 text-sm text-[#5a6472] dark:text-[#b8c2cf]">&ldquo;What questions come up for you? What would make this a yes, or a not yet?&rdquo; Tap what they raise to see your answer.</p>
            <div className="flex flex-wrap gap-2">
              {CONCERNS.map((c) => <button key={c.key} onClick={() => toggleConcern(c.key)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${draft.concerns.includes(c.key) ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>{c.label}</button>)}
            </div>
            <div className="mt-3 space-y-2">
              {draft.concerns.map((k) => { const c = CONCERNS.find((x) => x.key === k)!; return <p key={k} className={say}><b>{c.label}.</b> &ldquo;{c.say}{k === "overwhelm" ? (n("firstUse") || "[what they said they'd use first]") + "." : ""}&rdquo;</p>; })}
            </div>
            <div className="mt-3">{area("extra", "Questions and answers, anything else", 3)}</div>
          </section>

          <section id="pf-decide" className={card}>
            <h2 className="mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Their decision <span className="text-xs font-normal text-[#7a8a99]">19:00 to 23:00</span></h2>
            <p className={say}>&ldquo;Based on everything you told me, do you want to be one of my Pre-Founders?&rdquo;</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Where they landed">
              {INTERESTS.map((i) => (
                <label key={i.key} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${draft.interest === i.key ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                  <input type="radio" name="pf-interest" className="sr-only" checked={draft.interest === i.key} onChange={() => setDraft((d) => ({ ...d, interest: i.key }))} /> {i.label}
                </label>
              ))}
            </div>
            {draft.interest === "ready" && <p className={`${say} mt-3`}>&ldquo;Wonderful. Here&apos;s what happens next. I&apos;ll set up your account, and your login and password come to you by email right after we talk. Your first step is Set up Suite, which walks you through everything, and there&apos;s a New Client Launch Call every other Thursday for your first 30 days. Is {cardData.contact.email} the best email for your login?&rdquo;</p>}
            {draft.interest === "maybe" && <p className={`${say} mt-3`}>&ldquo;That&apos;s fair. What would you want to be true to say yes? When should I check back with you?&rdquo;</p>}
            {draft.interest === "not-now" && <p className={`${say} mt-3`}>&ldquo;No pressure at all. Can I keep you on my list? And I&apos;d love you to come to the free MasterClass on Thursday, October 8 at 5pm Mountain.&rdquo;</p>}
            {draft.interest === "not-a-fit" && <p className={`${say} mt-3`}>&ldquo;Thank you for telling me honestly. That helps me more than a polite yes. Is there anyone who comes to mind who it might fit?&rdquo;</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>{area("nextStep", "Agreed next step", 2, "Login goes out today / check back Oct 9...")}</div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#7a8a99]" htmlFor="pf-follow">Follow up on (adds a task)</label>
                <input id="pf-follow" type="date" className={box} min={localDay()} value={draft.followUpOn} onChange={(e) => setDraft((d) => ({ ...d, followUpOn: e.target.value }))} />
              </div>
            </div>
          </section>

          <section id="pf-share" className={card}>
            <h2 className="mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Who else, and the affiliate program <span className="text-xs font-normal text-[#7a8a99]">23:00 to 25:00</span></h2>
            <p className={say}>&ldquo;Who comes to mind who&apos;s a business owner stuck being their own bottleneck? Send them to the free MasterClass, Thursday, October 8 at 5pm Mountain. And if someone you refer signs up with the Command Suite, you earn 10% commission through our affiliate program. Want me to set you up?&rdquo;</p>
            <label className="mt-3 flex items-center gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]"><input type="checkbox" checked={draft.affiliate} onChange={(e) => setDraft((d) => ({ ...d, affiliate: e.target.checked }))} /> They want the affiliate link</label>
            <div className="mt-3">{area("referrals", "People who came to mind", 2)}</div>
          </section>

          <section id="pf-close" className={card}>
            <h2 className="mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Close <span className="text-xs font-normal text-[#7a8a99]">25:00</span></h2>
            <p className={say}>&ldquo;Thank you for the time and for being so honest with me. I&apos;ll follow up by email today. Head up, wings out.&rdquo;</p>
          </section>

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c9a227]/40 bg-white p-4 shadow-lg dark:bg-[#1a2b4a]">
            <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">Adds a note, fills their Pre-Founder fields, tags them and logs the call{draft.interest === "ready" ? ", and creates a task to issue their login" : ""}.</p>
            <button className="rounded-full bg-[#1a2b4a] px-5 py-2.5 text-sm font-semibold text-[#F8F5F0] disabled:opacity-50 dark:bg-[#c9a227] dark:text-[#1a2b4a]" disabled={busy || !draft.interest} onClick={save}>{busy ? "Saving…" : `Save to ${first === "[Name]" ? "contact" : first}'s card`}</button>
          </div>
        </div>
      )}
    </div>
  );
}
