"use client";

import { useEffect, useRef, useState } from "react";
import { SALES_OUTCOMES, type SalesOutcomeKey } from "@/lib/salesCall";
import { useProspect } from "./ProspectContext";

interface Phase {
  time: string;
  title: string;
  body: React.ReactNode;
}

interface Draft {
  notes: Record<string, string>;
  pains: string[];
  objections: string[];
  tier: string;
  outcome: SalesOutcomeKey | "";
  followUpOn: string;
}
const emptyDraft = (): Draft => ({ notes: {}, pains: [], objections: [], tier: "", outcome: "", followUpOn: "" });
const field = "w-full rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2 text-sm text-[#F3EEE4] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]";

// A labelled note box that saves to the prospect's card.
function Note({ k, label, rows = 2, hint, d, set }: { k: string; label: string; rows?: number; hint?: string; d: Draft; set: (k: string, v: string) => void }) {
  return (
    <div className="mt-2">
      <label htmlFor={`sc-${k}`} className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#E3C27C]">{label}</label>
      <textarea id={`sc-${k}`} rows={rows} className={field} placeholder={hint} value={d.notes[k] || ""} onChange={(e) => set(k, e.target.value)} />
    </div>
  );
}

const phasesFor = (d: Draft, set: (k: string, v: string) => void): Phase[] => [
  {
    time: "0:00–1:30",
    title: "Open the call",
    body: (
      <>
        <p className="script-say">
          &ldquo;Hey [Name], thanks for making time. You were at the MasterClass on [date] — what
          stuck with you most from that?&rdquo;
        </p>
        <p className="script-note">Listen. Whatever they name is what already landed — work from it.</p>
        <Note k="stuck" label="What stuck from the MasterClass" d={d} set={set} hint="Their words" />
        <p className="script-say">
          &ldquo;Today I want to get a real picture of where things actually stand for you right
          now, so I can show you exactly what would help — not a generic pitch. Sound good?&rdquo;
        </p>
      </>
    ),
  },
  {
    time: "1:30–6:00",
    title: "Surface the pain — ask, then go quiet",
    body: (
      <>
        <p className="script-note">Ask 2–3 of these. Follow whichever one has real energy behind it.</p>
        <ul className="script-list">
          <li>&ldquo;Walk me through a normal Tuesday — where does your time actually go?&rdquo;</li>
          <li>&ldquo;What&rsquo;s the thing you know needs attention, but you keep putting off?&rdquo;</li>
          <li>&ldquo;If I looked at your tools right now — CRM, finance, content, tasks — how many separate logins am I looking at?&rdquo;</li>
          <li>&ldquo;What&rsquo;s the last thing that fell through the cracks and cost you real money or a real client?&rdquo;</li>
          <li>&ldquo;Picture this business a year from now, still running exactly like it runs today — how does that feel?&rdquo;</li>
        </ul>
        <Note k="typical" label="A normal Tuesday: where the time goes" d={d} set={set} />
        <Note k="putOff" label="What they keep putting off" d={d} set={set} />
        <Note k="tools" label="Tools and logins today" d={d} set={set} hint="CRM, finance, email, calendar, planning..." />
        <Note k="fellThrough" label="What fell through the cracks" d={d} set={set} />
        <Note k="yearOut" label="A year from now if nothing changes" d={d} set={set} />
      </>
    ),
  },
  {
    time: "6:00–7:00",
    title: "Mirror it back, then bridge",
    body: (
      <>
      <p className="script-say">
        &ldquo;So what I&apos;m hearing is [their exact words] — that&apos;s precisely the pattern
        LifeCharter Command Suite was built to break. Let me show you specifically how.&rdquo;
      </p>
      <Note k="pain" label="Their pain, in their own words" rows={3} d={d} set={set} />
      </>
    ),
  },
];

interface PainRow {
  pain: string;
  answer: string;
  feature: string;
}

const PAIN_MAP: PainRow[] = [
  {
    pain: "“I don’t really know where I stand.”",
    answer: "Score the business objectively instead of guessing.",
    feature: "12 live Business Dimensions + the Business Command Audit",
  },
  {
    pain: "“Too many logins, everything's taped together.”",
    answer: "One login replaces the whole pile.",
    feature: "Replaces CRM, QuickBooks, email/marketing tools, social schedulers, task apps, planning docs",
  },
  {
    pain: "“It all runs through me. No one else could run this.”",
    answer: "The machine gets documented, not just carried in your head.",
    feature: "8 Operational Pillars, each scored for you from your data — Acquisition, Onboarding, Fulfillment, Referral, and more",
  },
  {
    pain: "“I don’t actually know my numbers.”",
    answer: "Real numbers, live — not a spreadsheet nobody opens.",
    feature: "Live income & expense ledger, budgets, monthly review",
  },
  {
    pain: "“I’ve had coaches before. Nothing ever sticks.”",
    answer: "The insight from the call doesn’t evaporate by Thursday.",
    feature: "Architect-led coaching + the Suite that holds what you decide",
  },
  {
    pain: "“I’m doing this alone.”",
    answer: "A real room, every week — not just a login.",
    feature: "Weekly community coaching, weekly tech-support call, Hope Seat, private community",
  },
  {
    pain: "“I don’t have time to learn new software.”",
    answer: "The grind gets handled, not handed to you as more to do.",
    feature: "Built-in AI runs the day-to-day sorting, tracking, and follow-up",
  },
];

const TIER_FIT = [
  { tier: "Starter", when: "Wants structure, community, and a self-paced setup" },
  { tier: "Growth", when: "Wants a monthly 1:1 hand on the wheel + a done-with-you kickoff" },
  { tier: "VIP", when: "Wants it built with them, white-glove, multiple businesses or a team" },
];

const OBJECTIONS = [
  {
    said: "“I need to think about it.”",
    reframe: "“Totally fair — what specifically do you want to think through? Let’s talk it through right now while it’s fresh.”",
  },
  {
    said: "“That’s a lot of money.”",
    reframe: "“It replaces [the tools they named earlier] — what are you paying for those today, separately, half-used?”",
  },
  {
    said: "“I don’t have time to implement new software.”",
    reframe: "“That’s exactly why implementation is done with you, not something you figure out alone.”",
  },
];

export function SalesScript() {
  const { prefill } = useProspect();
  const contactId = prefill?.contactId || "";
  const [d, setD] = useState<Draft>(emptyDraft());
  const [nc, setNc] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [saved, setSaved] = useState<string[] | null>(null);
  const loaded = useRef("");

  // Picking a contact brings back any unsaved notes for them; notes already typed carry over to a first pick.
  useEffect(() => {
    if (!contactId) return;
    try {
      const raw = localStorage.getItem(`sales-call:${contactId}`);
      if (raw) setD({ ...emptyDraft(), ...JSON.parse(raw) });
    } catch {
      /* private mode */
    }
    setSaved(null);
    setMsg("");
    loaded.current = contactId;
  }, [contactId]);
  // Notes are kept on this device as you type, so nothing is lost if the page closes mid-call.
  useEffect(() => {
    if (!contactId || loaded.current !== contactId) return;
    try {
      localStorage.setItem(`sales-call:${contactId}`, JSON.stringify(d));
    } catch {
      /* private mode */
    }
  }, [d, contactId]);

  const setNote = (k: string, v: string) => setD((x) => ({ ...x, notes: { ...x.notes, [k]: v } }));
  const toggle = (key: "pains" | "objections", v: string) => setD((x) => ({ ...x, [key]: x[key].includes(v) ? x[key].filter((i) => i !== v) : [...x[key], v] }));
  const PHASES = phasesFor(d, setNote);

  async function save() {
    if (!d.outcome) return setMsg("Choose how the call ended first.");
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/sales/save-call", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId, newContact: contactId ? undefined : nc, ...d }) });
    const res = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(res.error || "That didn't save. Your notes are still here; try again.");
    setSaved([`Note added to ${res.name}'s timeline`, "Sales fields filled in on their card", `Tagged ${(res.tags as string[]).join(", ")}`, "Call logged as attended"]);
    try {
      if (contactId) localStorage.removeItem(`sales-call:${contactId}`);
    } catch {
      /* private mode */
    }
    setD(emptyDraft());
    setNc({ name: "", email: "" });
  }

  return (
    <section className="mb-14">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-semibold text-[#F8F5F0]">15-Minute Call Script</h2>
        <span className="text-xs uppercase tracking-wide text-[#b8a898]">
          Discovery → pain → fit → close
        </span>
      </div>
      <p className="mt-2 text-sm text-[#b8a898] max-w-2xl">
        Ask, then go quiet. The prospect naming their own pain does more work than any pitch —
        your job is to mirror it back and point at the exact feature that answers it.
      </p>

      <div className="mt-6 space-y-4">
        {PHASES.map((phase) => (
          <div key={phase.title} className="rounded-xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#c9a227] bg-[#c9a227]/10 rounded-full px-2.5 py-1">
                {phase.time}
              </span>
              <h3 className="text-sm font-semibold text-[#F8F5F0]">{phase.title}</h3>
            </div>
            <div className="mt-3 space-y-2 text-sm text-[#d8d3c8] [&_.script-say]:italic [&_.script-say]:text-[#F3EEE4] [&_.script-note]:text-xs [&_.script-note]:text-[#b8a898] [&_.script-note]:uppercase [&_.script-note]:tracking-wide [&_.script-list]:list-disc [&_.script-list]:pl-5 [&_.script-list]:space-y-1.5">
              {phase.body}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#c9a227] bg-[#c9a227]/10 rounded-full px-2.5 py-1">
            7:00–12:00
          </span>
          <h3 className="text-sm font-semibold text-[#F8F5F0]">Map their pain to the Suite</h3>
        </div>
        <p className="mt-3 text-xs text-[#b8a898] uppercase tracking-wide">
          Whatever they said above, find the closest row and speak straight from it
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#b8a898] border-b border-[#F3EEE4]/10">
                <th className="py-2 pr-2 font-medium">Said it</th>
                <th className="py-2 pr-4 font-medium">If they said…</th>
                <th className="py-2 pr-4 font-medium">LCCS answers with…</th>
                <th className="py-2 font-medium">The feature</th>
              </tr>
            </thead>
            <tbody>
              {PAIN_MAP.map((row) => (
                <tr key={row.pain} className="border-b border-[#F3EEE4]/8 align-top">
                  <td className="py-3 pr-2"><input type="checkbox" aria-label={`They said: ${row.pain}`} checked={d.pains.includes(row.pain.replace(/[“”]/g, ""))} onChange={() => toggle("pains", row.pain.replace(/[“”]/g, ""))} /></td>
                  <td className="py-3 pr-4 italic text-[#F3EEE4] whitespace-normal">{row.pain}</td>
                  <td className="py-3 pr-4 text-[#d8d3c8]">{row.answer}</td>
                  <td className="py-3 text-[#E3C27C]">{row.feature}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#c9a227] bg-[#c9a227]/10 rounded-full px-2.5 py-1">
            12:00–14:00
          </span>
          <h3 className="text-sm font-semibold text-[#F8F5F0]">Which tier fits</h3>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Tier that fits">
          {TIER_FIT.map((t) => (
            <button type="button" key={t.tier} role="radio" aria-checked={d.tier === t.tier} onClick={() => setD((x) => ({ ...x, tier: x.tier === t.tier ? "" : t.tier }))} className={`rounded-lg border p-3 text-left ${d.tier === t.tier ? "border-[#c9a227] bg-[#c9a227]/10" : "bg-[#141826] border-[#F3EEE4]/10"}`}>
              <div className="text-sm font-semibold text-[#F8F5F0]">{t.tier}{d.tier === t.tier ? " ✓" : ""}</div>
              <div className="text-xs text-[#b8a898] mt-1">{t.when}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[#b8a898]">Tap the one that fits. It saves on their card.</p>
      </div>

      <div className="mt-6 rounded-xl border border-[#c9a227]/40 bg-[#1C2236] p-5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#c9a227] bg-[#c9a227]/10 rounded-full px-2.5 py-1">
            14:00–15:00
          </span>
          <h3 className="text-sm font-semibold text-[#F8F5F0]">Transition to close</h3>
        </div>
        <p className="mt-3 text-sm italic text-[#F3EEE4]">
          &ldquo;Based on everything you just told me, [tier] is built exactly for where you are.
          Let me show you the numbers—&rdquo; <span className="not-italic text-[#b8a898]">(scroll to pricing below)</span>{" "}
          &ldquo;—and we can get your implementation started today.&rdquo;
        </p>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-[#F8F5F0]">Quick objection reframes</h3>
        <div className="mt-3 space-y-2">
          {OBJECTIONS.map((o) => (
            <div key={o.said} className="rounded-lg bg-[#1C2236] border border-[#F3EEE4]/10 p-3.5 text-sm">
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" aria-label={`They said ${o.said}`} checked={d.objections.includes(o.said.replace(/[“”]/g, ""))} onChange={() => toggle("objections", o.said.replace(/[“”]/g, ""))} />
                <span><span className="text-[#b8a898]">If they say </span><span className="italic text-[#F3EEE4]">{o.said}</span></span>
              </label>
              <div className="mt-1.5 pl-6 text-[#E3C27C]">{o.reframe}</div>
            </div>
          ))}
        </div>
        <Note k="objectionNotes" label="Other objections and what you said" d={d} set={setNote} />
      </div>

      <div className="mt-6 rounded-xl border border-[#c9a227]/40 bg-[#1C2236] p-5">
        <h3 className="text-sm font-semibold text-[#F8F5F0]">How did it end?</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="How the call ended">
          {SALES_OUTCOMES.map((o) => (
            <label key={o.key} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold ${d.outcome === o.key ? "border-[#c9a227] bg-[#c9a227]/10 text-[#F8F5F0]" : "border-[#F3EEE4]/15 text-[#F3EEE4]"}`}>
              <input type="radio" name="sc-outcome" className="sr-only" checked={d.outcome === o.key} onChange={() => setD((x) => ({ ...x, outcome: o.key }))} /> {o.label}
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Note k="nextStep" label="Agreed next step" d={d} set={setNote} hint="Checkout sent today / call back Thursday..." />
          <div className="mt-2">
            <label htmlFor="sc-follow" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#E3C27C]">Follow up on</label>
            <input id="sc-follow" type="date" className={field} value={d.followUpOn} onChange={(e) => setD((x) => ({ ...x, followUpOn: e.target.value }))} />
          </div>
        </div>
        <Note k="extra" label="Anything else" d={d} set={setNote} />

        {!contactId && (
          <div className="mt-4 rounded-lg border border-[#F3EEE4]/12 bg-[#141826] p-3">
            <p className="text-xs text-[#b8a898]">No contact picked yet. Look them up at the top and press &ldquo;Use this contact,&rdquo; or add them here:</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input className={field} aria-label="Their name" placeholder="Their name" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} />
              <input className={field} aria-label="Their email" type="email" placeholder="Their email" value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} />
            </div>
          </div>
        )}
        {msg && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{msg}</p>}
        {saved && (
          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            <p className="font-semibold">Saved to their card.</p>
            <ul className="mt-1 list-disc pl-5">{saved.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-xs text-[#b8a898]">Saves a note on their timeline, fills the Sales fields on their contact card, tags them with the outcome and tier, and logs the call.</p>
          <button type="button" onClick={save} disabled={busy || !d.outcome || (!contactId && !nc.email.trim())} className="rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] px-5 py-2.5 text-sm font-semibold text-[#1a2b4a] disabled:opacity-50">{busy ? "Saving…" : "Save to their contact card"}</button>
        </div>
      </div>
    </section>
  );
}
