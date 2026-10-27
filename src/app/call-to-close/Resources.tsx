"use client";

// Sales Resources for a Call to Close consultant. Written for the discovery and closing call; the pricing is left to the
// checkout itself so nothing here can go out of date.

const H = "mb-2 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";
const P = "mb-2 text-sm leading-relaxed text-[#3a4658] dark:text-[#d8dde6]";
const UL = "mb-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#3a4658] dark:text-[#d8dde6]";
const CARD = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/20";

const OBJECTIONS: [string, string][] = [
  ["I don't have time.", "The week you cannot spare is the reason to talk. You leave this call knowing your first move, whether or not we work together."],
  ["I've tried this before and it faded.", "Tools fade without a person. Coaching every weekday plus one system is the difference."],
  ["I don't want more software.", "You do not learn software here. Your coach tells you what to do, and the page is already open."],
  ["Is this just a sales pitch?", "It starts with discovery: your business, your bottleneck, what you have tried. I tell you honestly whether the Suite fits, and the next step is yours to decline."],
  ["Will it fit my business?", "It is not built around one industry. The audit starts from your business as it is."],
  ["I need to think about it.", "Of course. What would you need to see or know to feel sure? Let's book a follow-up call so you are not deciding alone. (Move their card to Follow-up call.)"],
  ["It's too much right now.", "Ask what 'too much' is: the fee, the timing, or the commitment. Don't talk past it. If it is timing, offer this Wednesday's free MasterClass and a follow-up call, and keep the door open."],
];

const PLANS: [string, string][] = [
  ["Starter", "Five live group executive coaching calls a week, the weekly tech-support call, the private community and the full Suite. No 1:1."],
  ["Growth", "Everything in Starter, plus a monthly 1:1, a done-with-you kickoff intensive and the quarterly intensive."],
  ["VIP", "Everything in Growth, plus two 1:1 sessions a month, direct access between sessions and white-glove ongoing setup."],
];

export default function Resources({ consultant, bookingLink, shareLink }: { consultant: string; bookingLink: string; shareLink: string | null }) {
  return (
    <div className="space-y-5">
      <section className={CARD}>
        <h2 className={H}>Your job in one sentence</h2>
        <p className={P}>Find coaches and consultants who are the bottleneck in their own business, have a real discovery conversation with them, and, when it is a fit, enroll them. Executive coaching and the Command Suite are one offer: never present one without the other.</p>
        <ul className={UL}>
          <li>Find the right people using the Ideal Client Profile below.</li>
          <li>Book every discovery and closing call on your own calendar (My Calendar). Each call has its own Zoom link.</li>
          <li>Keep every prospect on your pipeline and update the stage the same day. If it isn&rsquo;t on the pipeline, it didn&rsquo;t happen.</li>
          <li>Enroll clients only through the buttons in their card, live on the call: they sign the Year-1 agreement while you are on the phone, then pay while you are on the phone. Never take payment any other way.</li>
        </ul>
        <p className={P}>Your booking page: <span className="font-mono text-xs">{bookingLink}</span>{shareLink ? <> · your referral link: <span className="font-mono text-xs">{shareLink}</span></> : null}</p>
      </section>

      <section className={CARD}>
        <h2 className={H}>Who to look for: the Ideal Client Profile</h2>
        <ul className={UL}>
          <li><b>Who:</b> coaches (and consultants) who are good at what they do, earning roughly $50,000 to $1 million a year, solo or with a small team, in the US or Canada.</li>
          <li><b>The problem:</b> they are the bottleneck. Decisions, follow-up and numbers all route through them. Strategy is in a notebook, leads are in a spreadsheet, and the owner is the only system.</li>
          <li><b>What they have:</b> expertise or credentials, a real offer, some audience, and a stack of tools or courses they only partly use.</li>
          <li><b>What they lack:</b> one operating system and one person who holds them to it.</li>
          <li><b>Ready for a call when:</b> they describe the problem in operational terms, have tried tools or coaches and want implementation, have already raised a hand, and own the decision.</li>
          <li><b>Not a fit right now:</b> wants a quick fix or software without coaching; doesn&rsquo;t respond; overwhelmed by tools and unwilling to simplify; can&rsquo;t commit to a year; already large with a team and a working system; no offer yet.</li>
        </ul>
        <h3 className="mb-1 mt-3 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Their words (use these)</h3>
        <ul className={UL}>
          <li>&ldquo;I&rsquo;m the bottleneck in my own business.&rdquo; &ldquo;Everything runs through me.&rdquo;</li>
          <li>&ldquo;I know what to do. I just can&rsquo;t keep up with doing it.&rdquo;</li>
          <li>&ldquo;I bought the CRM, the scheduler and the course platform and I use about a fifth of each.&rdquo;</li>
          <li>&ldquo;I can&rsquo;t tell if what I&rsquo;m doing is working.&rdquo;</li>
        </ul>
      </section>

      <section className={CARD}>
        <h2 className={H}>Prospecting: reaching out</h2>
        <ul className={UL}>
          <li>Add each prospect to your pipeline first (My Pipeline, Add a prospect). They are tagged with the month you added them.</li>
          <li>One ask per message: book the call. Lead with the pattern, not the program. Hooks that work: &ldquo;Does your business have the BURIED pattern?&rdquo; &ldquo;Run the Monday morning test.&rdquo; &ldquo;Founder-led should not have to mean founder-held.&rdquo;</li>
          <li>Be warm, direct and respectful. No pity, no hustle shame, no pressure, no urgency that is not true.</li>
          <li>When someone replies, send your booking link. When they book, their card moves to Discovery call booked by itself.</li>
          <li>Not ready? Invite them to this Wednesday&rsquo;s free MasterClass (noon MT), say &ldquo;this Wednesday,&rdquo; never promise a replay, and invite them to book when they are ready.</li>
          <li>Never message anyone who asked to stop or unsubscribed, and follow each platform&rsquo;s messaging rules.</li>
        </ul>
      </section>

      <section className={CARD}>
        <h2 className={H}>The discovery and closing call: a 30-minute outline</h2>
        <ol className="mb-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-[#3a4658] dark:text-[#d8dde6]">
          <li><b>Open (0 to 3 min).</b> Warm hello. Say how the time will go: &ldquo;I&rsquo;ll ask about your business, tell you honestly whether the Suite fits, and if it does, we&rsquo;ll talk about next steps. Fair?&rdquo; Check you may take notes.</li>
          <li><b>Discover (3 to 13 min).</b> Ask, then listen.
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Tell me about your business: who you serve and what you offer.</li>
              <li>What is the one thing that most holds the business up by you?</li>
              <li>What does a typical Monday look like? (Inbox first, decisions waiting, numbers you can&rsquo;t name.)</li>
              <li>What have you tried: tools, courses, coaches? What happened?</li>
              <li>If this were fixed in 90 days, what would be different?</li>
              <li>Who else is part of the decision?</li>
            </ul>
          </li>
          <li><b>Reflect (13 to 17 min).</b> Say back what you heard in their own words. &ldquo;So the real problem is…&rdquo; Get a yes. If it is not a fit, say so kindly and stop here.</li>
          <li><b>Present (17 to 24 min).</b> Coaching and the Suite as one offer: the audit shows where the business stands, the coach and client build the plan, the first 30 days install it, and live coaching calls every weekday keep it going. Match it to what they said, not a feature tour.</li>
          <li><b>Ask (24 to 28 min).</b> &ldquo;Based on what you told me, I&rsquo;d recommend [plan]. Would you like to get started?&rdquo; Then stop talking. Handle questions with the answers below.</li>
          <li><b>Next steps (28 to 30 min).</b> If yes: stay on the call and enroll them live. First they sign the Year-1 agreement while you are on the phone, then they pay while you are on the phone (steps below). If not yet: book a follow-up call before you hang up. Either way, update the card.</li>
        </ol>
      </section>

      <section className={CARD}>
        <h2 className={H}>The plans, in plain words</h2>
        <p className={P}>Pick the plan from what the prospect said. The checkout shows the exact price, so never quote one from memory.</p>
        <dl className="space-y-2 text-sm text-[#3a4658] dark:text-[#d8dde6]">
          {PLANS.map(([n, d]) => (
            <div key={n}><dt className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{n}</dt><dd>{d}</dd></div>
          ))}
        </dl>
        <p className={`${P} mt-2`}>Also included in every plan: the Business Command Audit, the plans, the 30-day Starter Guide, the AI assistant (always behind an Approve button), the community and the Website Alignment Review.</p>
      </section>

      <section className={CARD}>
        <h2 className={H}>When they push back</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[#7a8a99]"><tr><th className="py-2 pr-4">They say</th><th className="py-2">You say</th></tr></thead>
            <tbody>
              {OBJECTIONS.map(([a, b]) => <tr key={a} className="border-t border-[#1a2b4a]/8 align-top"><td className="py-2 pr-4 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{a}</td><td className="py-2 text-[#3a4658] dark:text-[#d8dde6]">{b}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className={CARD}>
        <h2 className={H}>Enrolling a client, step by step: all of it while you are on the phone</h2>
        <p className={`${P} font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]`}>Enrollment happens live, on the call. Never end the call and send the agreement or the payment link for later.</p>
        <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[#3a4658] dark:text-[#d8dde6]">
          <li>Before you ask, open their card and make sure their name, business and email are filled in, and save. Choose the plan and how they pay (fee in full, 50/50, or annual).</li>
          <li><b>Step 1, while you are on the phone: the Year-1 agreement.</b> Press <b>Step 1</b>. It goes to their email at once. Stay on the call while they open it and sign it. Wait until they say it is signed.</li>
          <li><b>Step 2, while you are on the phone: payment.</b> Press <b>Step 2</b>, copy the checkout link, and send it to them on the call. Stay on while they pay. The sale is credited to you.</li>
          <li>Once you have watched them sign and pay, press <b>Mark closed</b> with their plan. Their card moves to Closed and is tagged with the plan and the date.</li>
          <li>Their account is made after payment and signature. You don&rsquo;t create it.</li>
        </ol>
      </section>

      <section className={CARD}>
        <h2 className={H}>After every call</h2>
        <ul className={UL}>
          <li><b>Attended or no-show:</b> it is read from Zoom for you. If it hasn&rsquo;t updated within 30 minutes, press Mark attended or Mark no-show on the card.</li>
          <li><b>No-show:</b> message them the same day: &ldquo;I missed you. Want to pick another time? [your booking link]&rdquo;</li>
          <li><b>Follow-up call:</b> book it before you hang up, set the follow-up date on the card, and move them to Follow-up call.</li>
          <li><b>Not now:</b> move them to Not now with a note on why and when to try again.</li>
          <li><b>Write notes on the card.</b> What they said in their own words is the most useful thing you will have next time.</li>
        </ul>
        <p className={P}>Close every message the way we always do: Head up - Wings out.</p>
      </section>

      <section className={CARD}>
        <h2 className={H}>Honest selling: the rules</h2>
        <ul className={UL}>
          <li>No income promises or guarantees. Say what the Suite and the coaching do, not what you hope they&rsquo;ll earn.</li>
          <li>Executive coaching and the software are always one offer.</li>
          <li>Never take payment outside the checkout link, and never create an account yourself.</li>
          <li>Anyone on the Do Not Contact list or who has unsubscribed is never contacted again.</li>
          <li>Keep prospect information private. Don&rsquo;t share or export it.</li>
          <li>{consultant}, if you are ever unsure, ask. A slower yes is better than a wrong one.</li>
        </ul>
      </section>
    </div>
  );
}
