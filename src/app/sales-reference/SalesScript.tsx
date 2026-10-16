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

type Booking = NonNullable<ReturnType<typeof useProspect>["prefill"]>["booking"];

const phasesFor = (d: Draft, set: (k: string, v: string) => void, booking?: Booking): Phase[] => [
  {
    time: "0:00–1:30",
    title: "Open the call",
    body: (
      <>
        <p className="script-say">
          &ldquo;Hey [Name], thanks for jumping on! Look, I know these calls can sometimes feel like a pitch fest, but today
          is really just about you. I mean... would it be crazy to just use this time to unpack your current situation and
          see what&rsquo;s actually holding you back?&rdquo;
        </p>
        <p className="script-note">
          Every prospect booked through the MasterClass or Website page already answered their revenue range, #1 bottleneck,
          decision-maker status and timeline before this call. Look them up above before dialing, then open with THAT instead
          of a generic question.
        </p>
        {booking?.bottleneck && (
          <p className="rounded-lg border border-[#c9a227]/30 bg-[#c9a227]/5 px-3 py-2 text-[#F3EEE4]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#E3C27C]">They wrote when they booked: </span>
            &ldquo;{booking.bottleneck}&rdquo;
          </p>
        )}
        <p className="script-say">
          &ldquo;You mentioned {booking?.bottleneck ? "that" : "[their bottleneck]"} when you booked — still the main thing, or
          has something worse surfaced?&rdquo;
        </p>
        <Note k="stuck" label="Still the main thing from their booking form?" d={d} set={set} hint="Their words" />
        <p className="script-note">Listen. Permission granted — pause and move directly to diagnosis.</p>
      </>
    ),
  },
  {
    time: "1:30–4:30",
    title: "Surface the pain — ask, then go quiet",
    body: (
      <>
        <p className="script-note">
          Ask 2–3 of these. Follow whichever one has real energy behind it. Use mirroring (repeat their last 2–3 words with an
          upward inflection) to get them to expand.
        </p>
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
    time: "4:30–6:30",
    title: "Surface the desired outcome (future state)",
    body: (
      <>
        <p className="script-note">Pivot from the current mess to their ideal future. Quantify the gap before showing the solution.</p>
        <ul className="script-list">
          <li>&ldquo;If we waved a magic wand and got your operations properly architected during our initial 90-day build-out, what does your ideal workweek look like?&rdquo;</li>
          <li>&ldquo;If you got 10–12 hours a week back and had full visibility across your business, what does that unlock for your annual revenue and growth?&rdquo;</li>
          <li>&ldquo;How would your life outside the business change if you didn&rsquo;t have to carry every single operational decision in your head?&rdquo;</li>
        </ul>
        <Note k="futureWeek" label="Their ideal workweek once it is built" d={d} set={set} />
        <Note k="futureGain" label="What 10–12 hours back would unlock" d={d} set={set} />
        <Note k="futureLife" label="How life outside the business would change" d={d} set={set} />
      </>
    ),
  },
  {
    time: "6:30–7:30",
    title: "Label & trigger “That’s right”",
    body: (
      <>
        <p className="script-note">
          Don&rsquo;t just repeat their words. Use tactical empathy (labels) to capture their emotional state until they say
          &ldquo;That&rsquo;s right.&rdquo;
        </p>
        <p className="script-say">
          &ldquo;It sounds like you built this business to have freedom, but right now you feel like a high-paid prisoner to your
          own operational chaos. It seems like every single decision still bottlenecks at your desk.&rdquo;
        </p>
        <p className="script-note">Wait for them to say &ldquo;That&rsquo;s right!&rdquo; Then bridge:</p>
        <p className="script-say">
          &ldquo;That&rsquo;s precisely the pattern LifeCharter Command Suite was built to break. Let me show you specifically
          how.&rdquo;
        </p>
        <Note k="label" label="Their “that’s right” moment" d={d} set={set} hint="What they said when it landed" />
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
  const PHASES = phasesFor(d, setNote, prefill?.booking);

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
    <section
      className="mb-14 [&_[data-collapsed]>:not([data-fold-head])]:hidden [&_[data-collapsed]_.fold-chev]:-rotate-90"
      onClick={(e) => {
        const head = (e.target as HTMLElement).closest("[data-fold-head]");
        const card = head?.parentElement;
        if (!card) return;
        if (card.hasAttribute("data-collapsed")) card.removeAttribute("data-collapsed");
        else card.setAttribute("data-collapsed", "");
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const head = (e.target as HTMLElement).closest("[data-fold-head]");
        if (!head || e.target !== head) return;
        e.preventDefault();
        (head as HTMLElement).click();
      }}
    >
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
            <div data-fold-head className="flex cursor-pointer items-center gap-3" role="button" tabIndex={0}>
              <span className="text-[11px] font-mono text-[#c9a227] bg-[#c9a227]/10 rounded-full px-2.5 py-1">
                {phase.time}
              </span>
              <h3 className="text-sm font-semibold text-[#F8F5F0]">{phase.title}</h3>
          <span className="fold-chev ml-auto text-[#E3C27C] transition-transform" aria-hidden="true">▾</span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-[#d8d3c8] [&_.script-say]:italic [&_.script-say]:text-[#F3EEE4] [&_.script-note]:text-xs [&_.script-note]:text-[#b8a898] [&_.script-note]:uppercase [&_.script-note]:tracking-wide [&_.script-list]:list-disc [&_.script-list]:pl-5 [&_.script-list]:space-y-1.5">
              {phase.body}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
        <div data-fold-head className="flex cursor-pointer items-center gap-3" role="button" tabIndex={0}>
          <span className="text-[11px] font-mono text-[#c9a227] bg-[#c9a227]/10 rounded-full px-2.5 py-1">
            7:30–11:30
          </span>
          <h3 className="text-sm font-semibold text-[#F8F5F0]">Map their pain to the Suite</h3>
          <span className="fold-chev ml-auto text-[#E3C27C] transition-transform" aria-hidden="true">▾</span>
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
        <div data-fold-head className="flex cursor-pointer items-center gap-3" role="button" tabIndex={0}>
          <span className="text-[11px] font-mono text-[#c9a227] bg-[#c9a227]/10 rounded-full px-2.5 py-1">
            11:30–12:30
          </span>
          <h3 className="text-sm font-semibold text-[#F8F5F0]">Diffuse hesitation (accusation audit)</h3>
          <span className="fold-chev ml-auto text-[#E3C27C] transition-transform" aria-hidden="true">▾</span>
        </div>
        <div className="mt-3 space-y-2 text-sm text-[#d8d3c8]">
          <p className="text-xs uppercase tracking-wide text-[#b8a898]">Call out their unspoken fear before showing numbers to neutralize sales resistance.</p>
          <p className="italic text-[#F3EEE4]">
            &ldquo;Before we look at the numbers, you&rsquo;re probably sitting there thinking: &lsquo;I&rsquo;ve bought tools like
            Notion, Slack, or HubSpot before, and I&rsquo;ve tried coaching before — why isn&rsquo;t this just going to be another
            expensive project that sits on a shelf?&rsquo; Am I wrong?&rdquo;
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-[#141826] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E3C27C]">If they say “No / you’re right”</p>
              <p className="mt-1 italic text-[#F3EEE4]">
                &ldquo;I completely get it. That&rsquo;s actually why Babs built this as a guided architecture, not a self-serve
                software. Babs is your Alignment Architect — she builds this out with you directly, starting with a focused
                first-30-days setup, inside the Suite you&rsquo;re committing to for the year ahead, so it actually sticks.&rdquo;
              </p>
            </div>
            <div className="rounded-lg bg-[#141826] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E3C27C]">If they say “Yes / I trust Babs”</p>
              <p className="mt-1 italic text-[#F3EEE4]">&ldquo;Fair enough! In that case, let&rsquo;s look straight at how the implementation tiers work...&rdquo;</p>
            </div>
          </div>
          <Note k="hesitation" label="Their unspoken hesitation" d={d} set={setNote} hint="What they said back" />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
        <div data-fold-head className="flex cursor-pointer items-center gap-3" role="button" tabIndex={0}>
          <span className="text-[11px] font-mono text-[#c9a227] bg-[#c9a227]/10 rounded-full px-2.5 py-1">
            12:30–13:30
          </span>
          <h3 className="text-sm font-semibold text-[#F8F5F0]">Which tier fits</h3>
          <span className="fold-chev ml-auto text-[#E3C27C] transition-transform" aria-hidden="true">▾</span>
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

      <div className="mt-6 rounded-xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
        <div data-fold-head className="flex cursor-pointer items-center gap-3" role="button" tabIndex={0}>
          <span className="text-[11px] font-mono text-[#c9a227] bg-[#c9a227]/10 rounded-full px-2.5 py-1">
            13:30–14:30
          </span>
          <h3 className="text-sm font-semibold text-[#F8F5F0]">Temperature check (1 to 10 scale)</h3>
          <span className="fold-chev ml-auto text-[#E3C27C] transition-transform" aria-hidden="true">▾</span>
        </div>
        <div className="mt-3 space-y-2 text-sm text-[#d8d3c8]">
          <p className="text-xs uppercase tracking-wide text-[#b8a898]">A casual check so they sell themselves, or the real objection surfaces.</p>
          <p className="italic text-[#F3EEE4]">
            &ldquo;Based on everything we&rsquo;ve looked at, on a scale of 1 to 10 — 10 being &lsquo;let&rsquo;s build this
            today&rsquo; and 1 being &lsquo;this is totally wrong for me&rsquo; — where&rsquo;s your head at right now?&rdquo;
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-[#141826] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E3C27C]">If they say 8, 9 or 10 (the reverse flip)</p>
              <p className="mt-1 italic text-[#F3EEE4]">
                &ldquo;Oh wow, an [8/9]? Honestly, I was expecting you to say a 4 or 5 given how much operational chaos you&rsquo;re
                dealing with. What made you give it such a high score?&rdquo;
              </p>
              <p className="mt-1 text-xs text-[#b8a898]">Let them list their own reasons for needing the program. They are selling themselves.</p>
            </div>
            <div className="rounded-lg bg-[#141826] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E3C27C]">If they say 7 or below (clearing the gap)</p>
              <p className="mt-1 italic text-[#F3EEE4]">
                &ldquo;Fair enough. What would need to happen — or what would we need to clarify right now — to take that [5/6] up
                to an 8 or 9?&rdquo;
              </p>
              <p className="mt-1 text-xs text-[#b8a898]">Address the missing piece or misunderstanding, re-verify their score, then move forward.</p>
            </div>
          </div>
          <Note k="temperature" label="Their number (1 to 10) and why" d={d} set={setNote} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#c9a227]/40 bg-[#1C2236] p-5">
        <div data-fold-head className="flex cursor-pointer items-center gap-3" role="button" tabIndex={0}>
          <span className="text-[11px] font-mono text-[#c9a227] bg-[#c9a227]/10 rounded-full px-2.5 py-1">
            14:30–15:00+
          </span>
          <h3 className="text-sm font-semibold text-[#F8F5F0]">Transition to close (calibrated close)</h3>
          <span className="fold-chev ml-auto text-[#E3C27C] transition-transform" aria-hidden="true">▾</span>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-xs uppercase tracking-wide text-[#b8a898]">A statement plus a calibrated question gets them to commit to the action.</p>
          <p className="italic text-[#F3EEE4]">
            &ldquo;Based on everything you told me about [their main pain] and why [Tier] fits your goals, we&rsquo;ll start with
            the initial 90-day architecture build-out as part of your Year-1 Operating Agreement.&rdquo;
          </p>
          <p className="italic text-[#F3EEE4]">
            &ldquo;Plus, when we lock this in today, Babs includes a full Website Alignment Review within your first 14 days at no
            extra cost to make sure your front-facing funnel matches your new backend architecture.&rdquo;
          </p>
          <p className="italic text-[#F3EEE4]">&ldquo;How do you see us moving forward with this?&rdquo;</p>
          <p className="text-xs text-[#b8a898]">(or)</p>
          <p className="italic text-[#F3EEE4]">&ldquo;How would having [Tier] implemented over the next 90 days change how you run your week?&rdquo;</p>
          <p className="rounded-lg bg-[#141826] p-3 text-xs text-[#b8a898]">
            Talk about the first 90 days of build-out, but don&rsquo;t let it sound like the whole relationship is 90 days. What they
            are about to sign is the Year-1 Agreement: a 12-month term, with an early-termination fee if they cancel early.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-emerald-400/40 bg-[#1C2236] p-5">
        <div data-fold-head className="flex cursor-pointer items-center gap-3" role="button" tabIndex={0}>
          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-400/10 rounded-full px-2.5 py-1">15:30+</span>
          <h3 className="text-sm font-semibold text-[#F8F5F0]">Execute the close live (do not let deals go cold)</h3>
          <span className="fold-chev ml-auto text-[#E3C27C] transition-transform" aria-hidden="true">▾</span>
        </div>
        <p className="mt-3 text-xs uppercase tracking-wide text-[#b8a898]">
          Do not hang up or offer to &ldquo;send a link after the call.&rdquo; Stay on the line to secure the agreement and onboarding.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#d8d3c8]">
          <li>
            <span className="font-semibold text-[#F8F5F0]">Pull up checkout.</span> Generate the combined Stripe checkout session
            (implementation fee + monthly subscription in one session) in the <a href="#pricing" className="text-[#E3C27C] underline">pricing section below</a>. Choose how they are paying (in full, 50/50 or annual), then confirm FIRSTMONTHFREE is auto-applied.
          </li>
          <li>
            <span className="font-semibold text-[#F8F5F0]">Send the link live.</span> Paste it in chat or SMS and stay on the call
            while they enter their payment details.
          </li>
          <li>
            <span className="font-semibold text-[#F8F5F0]">Launch onboarding immediately.</span> Once payment is confirmed, pull up
            the <a href="#new-client" className="text-[#E3C27C] underline">New Client Onboarding form</a> live on screen, confirm they see it, and walk them through their next step before ending the call.
          </li>
        </ol>
      </div>

      <div className="mt-6">
        <h3 data-fold-head className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-[#F8F5F0]" role="button" tabIndex={0}>Quick objection reframes <span className="fold-chev text-[#E3C27C] transition-transform" aria-hidden="true">▾</span></h3>
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
        <h3 data-fold-head className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-[#F8F5F0]" role="button" tabIndex={0}>How did it end? <span className="fold-chev text-[#E3C27C] transition-transform" aria-hidden="true">▾</span></h3>
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
