interface Phase {
  time: string;
  title: string;
  body: React.ReactNode;
}

const PHASES: Phase[] = [
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
          <li>&ldquo;What's the thing you know needs attention, but you keep putting off?&rdquo;</li>
          <li>&ldquo;If I looked at your tools right now — CRM, finance, content, tasks — how many separate logins am I looking at?&rdquo;</li>
          <li>&ldquo;What's the last thing that fell through the cracks and cost you real money or a real client?&rdquo;</li>
          <li>&ldquo;Picture this business a year from now, still running exactly like it runs today — how does that feel?&rdquo;</li>
        </ul>
      </>
    ),
  },
  {
    time: "6:00–7:00",
    title: "Mirror it back, then bridge",
    body: (
      <p className="script-say">
        &ldquo;So what I&apos;m hearing is [their exact words] — that&apos;s precisely the pattern
        LifeCharter Command Suite was built to break. Let me show you specifically how.&rdquo;
      </p>
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
    feature: "8 Operational Pillars — Acquisition, Onboarding, Fulfillment, Referral, and more",
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
                <th className="py-2 pr-4 font-medium">If they said…</th>
                <th className="py-2 pr-4 font-medium">LCCS answers with…</th>
                <th className="py-2 font-medium">The feature</th>
              </tr>
            </thead>
            <tbody>
              {PAIN_MAP.map((row) => (
                <tr key={row.pain} className="border-b border-[#F3EEE4]/8 align-top">
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
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TIER_FIT.map((t) => (
            <div key={t.tier} className="rounded-lg bg-[#141826] border border-[#F3EEE4]/10 p-3">
              <div className="text-sm font-semibold text-[#F8F5F0]">{t.tier}</div>
              <div className="text-xs text-[#b8a898] mt-1">{t.when}</div>
            </div>
          ))}
        </div>
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
              <span className="text-[#b8a898]">If they say </span>
              <span className="italic text-[#F3EEE4]">{o.said}</span>
              <div className="mt-1.5 text-[#E3C27C]">{o.reframe}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
