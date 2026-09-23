import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InviteForm } from "./InviteForm";

// Public marketing page for The LifeCharter Collective (lccommandsuite.com/collective).
// Server-rendered for search; the only client piece is the invitation form.

const URL_BASE = "https://lccommandsuite.com";
const PAGE_URL = `${URL_BASE}/collective`;
const TITLE = "The LifeCharter Collective — A Free Community for Purpose-Led Coaches & Founders";
const DESCRIPTION =
  "Stop building your life's work alone. Join The LifeCharter Collective — a free community for coaches, consultants and founders: weekly live sessions, accountability, a private alignment journal and aligned action.";

export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "community for coaches",
    "community for entrepreneurs",
    "purpose-driven business community",
    "accountability group for founders",
    "online community for consultants",
    "mastermind community",
    "alignment journal",
    "LifeCharter",
    "LifeCharter Collective",
    "aligned action",
  ],
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: "LifeCharter",
    title: "Stop Building Your Life's Work Alone — The LifeCharter Collective",
    description: "A free community for purpose-led coaches, consultants and founders. Weekly live sessions, real accountability and a private alignment journal.",
    locale: "en_US",
    images: [{ url: `${PAGE_URL}/og`, width: 1200, height: 630, alt: "Stop building your life's work alone — The LifeCharter Collective" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stop Building Your Life's Work Alone — The LifeCharter Collective",
    description: "A free community for purpose-led coaches, consultants and founders.",
    images: [`${PAGE_URL}/og`],
  },
  icons: { apple: "/community-icons/apple-touch-icon.png" },
};

const REASONS = [
  {
    title: "A weekly rhythm that holds you",
    body: "The Weekly Alignment Anchor is a live session where members reset, recommit and leave with one clear next step. Your week gets a spine.",
  },
  {
    title: "An intention you say out loud",
    body: "Every Monday, members name what they're aligning with this week. Saying it where others can see it changes whether it happens.",
  },
  {
    title: "Wins that get witnessed",
    body: "Progress that nobody sees is easy to dismiss. In Wins & Aligned Action, what you moved forward is noticed, celebrated and remembered.",
  },
  {
    title: "Answers from people who've done it",
    body: "Ask the Collective when you're stuck on an offer, a client situation or a decision. The replies come from people building the same kind of work.",
  },
  {
    title: "A private Alignment Journal",
    body: "Set your intention, capture your wins and reflect on your week in a journal only you can read. Share a headline with the Collective only when you choose to.",
  },
  {
    title: "Room to be seen for your work",
    body: "Connect & Collaborate and the weekly Share Your Offer thread give your launches, events and services a warm room instead of an algorithm.",
  },
  {
    title: "The LifeCharter Library",
    body: "Templates, worksheets, recordings and guides, in one place and always current. Built from the frameworks behind every LifeCharter program.",
  },
  {
    title: "Live sessions on your calendar",
    body: "RSVP in a tap, add sessions to your calendar and get a reminder before they start. Replays and resources stay in the Collective afterward.",
  },
  {
    title: "A doorway to every LifeCharter program",
    body: "The Command Shift MasterClass, the 21 Day Challenge, the LifeCharter Program, the Incubator and Coaching Certification each have a private home here.",
  },
  {
    title: "Mariposa, when you want her",
    body: "With Collective Plus, Mariposa, your LifeCharter AI coach, sharpens your intention, unpacks your wins and reviews your week. She prepares; you decide.",
  },
];

const FAQS = [
  {
    q: "Is The LifeCharter Collective really free?",
    a: "Yes. Membership is free: the community, live sessions, your private Alignment Journal, messages, events and the Library. Collective Plus is an optional upgrade for members who want Mariposa, the LifeCharter AI coach.",
  },
  {
    q: "Who is the Collective for?",
    a: "Coaches, consultants, speakers, mentors, course creators and founders who lead with purpose, and anyone who wants to live and build with more clarity and aligned action. You don't need to be a LifeCharter client.",
  },
  {
    q: "Why do I need an invitation?",
    a: "The Collective is a private community, not an open forum. Request an invitation on this page and you'll receive your personal link and invite code by email in under a minute.",
  },
  {
    q: "Is my journal private?",
    a: "Completely. Your Alignment Journal is visible only to you. When you choose to share, only the headline and a note you write for the Collective are posted; your private journal never is.",
  },
  {
    q: "What is Collective Plus?",
    a: "An optional membership for $9.99 a month or $99 a year that adds Mariposa, the LifeCharter AI coach, plus a Sunday week-in-review, a monthly alignment report, Ask the Library, a 90-day focus and journal export. The first 100 founding members keep $7 a month for as long as they stay.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. The Collective works in any browser and installs to your phone's home screen like an app, with notifications for replies, messages and upcoming sessions.",
  },
  {
    q: "How is this different from LifeCharter Command Suite?",
    a: "The Collective is the community. Command Suite is the business operating system for founder-led companies. Command Suite clients get every Collective Plus feature included, running on their own AI connection.",
  },
];

const STEPS = [
  { n: "01", title: "Request your invitation", body: "Enter your name and email. Your personal link and invite code arrive in under a minute." },
  { n: "02", title: "Accept it", body: "Create your free account with your code. It takes about a minute." },
  { n: "03", title: "Introduce yourself", body: "Say hello in Start Here. The Collective will say hello back." },
  { n: "04", title: "Set your first intention", body: "Open your Alignment Journal and name what you're aligning with this week." },
];

const PROGRAMS = ["Command Shift MasterClass", "Command Shift 21 Day Challenge", "The LifeCharter Program", "LifeCharter Incubator", "Coaching Certification", "SOUL Sessions"];

function JsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "LifeCharter",
      legalName: "Sacred Kaleidoscope Community LLC",
      url: URL_BASE,
      logo: `${URL_BASE}/lifecharter-collective-mark.png`,
      founder: { "@type": "Person", name: "AmiLynne Carroll" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: TITLE,
      url: PAGE_URL,
      description: DESCRIPTION,
      isPartOf: { "@type": "WebSite", name: "LifeCharter", url: URL_BASE },
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "The LifeCharter Collective",
      description: "A private community for purpose-led coaches, consultants and founders.",
      brand: { "@type": "Brand", name: "LifeCharter" },
      offers: [
        { "@type": "Offer", name: "Collective membership", price: "0", priceCurrency: "USD", url: PAGE_URL, availability: "https://schema.org/InStock" },
        { "@type": "Offer", name: "Collective Plus (monthly)", price: "9.99", priceCurrency: "USD", url: PAGE_URL, availability: "https://schema.org/InStock" },
        { "@type": "Offer", name: "Collective Plus (annual)", price: "99", priceCurrency: "USD", url: PAGE_URL, availability: "https://schema.org/InStock" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

const HERO_BG: React.CSSProperties = {
  background: `radial-gradient(1100px 700px at 12% -10%, rgba(212,175,99,0.24), transparent 60%),
    radial-gradient(900px 700px at 110% 30%, rgba(31,49,91,0.13), transparent 60%), #F8F5F0`,
};

export default function CollectiveLanding({ searchParams }: { searchParams?: { deleted?: string } }) {
  return (
    <div className="min-h-screen bg-[#F8F5F0] font-ui text-[#1F315B] [font-variant-numeric:lining-nums]">
      <JsonLd />

      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6" aria-label="Main">
          <Link href="/collective" className="flex items-center gap-2.5">
            <Image src="/lifecharter-collective-mark.png" alt="" width={803} height={772} className="h-9 w-auto" priority />
            <span className="leading-tight">
              <span className="block text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#A8873F]">The LifeCharter</span>
              <span className="block font-display text-[19px] font-semibold">Collective</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/community/sign-in" className="text-[13.5px] font-semibold text-[#5B6275] hover:text-[#1F315B]">
              Sign in
            </Link>
            <a href="#invite" className="hidden rounded-full bg-[#1F315B] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0F1A38] sm:inline-block">
              Request an invitation
            </a>
          </div>
        </nav>
      </header>

      <main>
        {searchParams?.deleted === "1" && (
          <p role="status" className="fixed inset-x-0 top-0 z-20 bg-[#1F315B] px-4 py-2.5 text-center text-[13.5px] text-white">
            Your account has been deleted. Thank you for being part of the Collective.
          </p>
        )}
        {/* Hero */}
        <section style={HERO_BG} className="px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[#A8873F]">A free community for purpose-led coaches, consultants &amp; founders</p>
              <h1 className="mt-3 font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.01em] sm:text-[64px]">Stop building your life&rsquo;s work alone.</h1>
              <p className="mt-5 max-w-xl font-editorial text-[20px] leading-relaxed text-[#2A3552] sm:text-[22px]">
                The LifeCharter Collective is where people who lead with purpose set their intention each week, share what moved, and build alongside others who
                understand the work.
              </p>
              <p className="mt-4 font-editorial text-[18px] italic text-[#A8873F]">Create Balance. Build Alignment. Take Command.</p>
            </div>
            <div id="invite" className="scroll-mt-24 rounded-[26px] border border-[#E9E2D3] bg-white/90 p-6 shadow-[0_2px_4px_rgba(31,49,91,0.05),0_30px_60px_-30px_rgba(31,49,91,0.45)] backdrop-blur sm:p-8">
              <p className="font-display text-[28px] font-semibold leading-tight">Request your invitation</p>
              <p className="mb-4 mt-1 text-[14.5px] text-[#5B6275]">Membership is free. Your personal link and invite code arrive by email.</p>
              <InviteForm source="landing-hero" />
            </div>
          </div>
        </section>

        {/* The three-beat problem */}
        <section className="px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="why">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="why" className="sr-only">
              Why a community matters
            </h2>
            <p className="font-display text-[30px] font-semibold leading-snug sm:text-[40px]">
              At first, working alone feels like focus.
              <br />
              <span className="text-[#5B6275]">Then it becomes isolation.</span>
              <br />
              <span className="text-[#A8873F]">Eventually, it becomes the ceiling.</span>
            </p>
            <p className="mx-auto mt-6 max-w-2xl font-editorial text-[19px] leading-relaxed text-[#2A3552]">
              You are not short on wisdom, ideas or commitment. What&rsquo;s missing is a rhythm, and people who hold you to it. Not another group chat. A structure
              for aligned action, held by people who understand the work.
            </p>
          </div>
        </section>

        {/* Top 10 */}
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="reasons">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[#A8873F]">What changes inside</p>
            <h2 id="reasons" className="mx-auto mt-2 max-w-3xl text-center font-display text-[36px] font-semibold leading-tight sm:text-[48px]">
              10 reasons purpose-led founders are joining the Collective
            </h2>
            <ol className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {REASONS.map((r, i) => (
                <li key={r.title} className="flex gap-5 border-t border-[#E9E2D3] pt-6">
                  <span className="font-display text-[40px] font-semibold leading-none text-[#D4AF63]" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-[23px] font-semibold leading-tight">{r.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[#5B6275]">{r.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-12 text-center">
              <a
                href="#invite"
                className="inline-block rounded-xl bg-gradient-to-br from-[#E6C988] via-[#D4AF63] to-[#B8923F] px-7 py-4 text-[15.5px] font-semibold text-[#0F1A38] shadow-[0_14px_30px_-14px_rgba(184,146,63,0.95)] hover:brightness-105"
              >
                Request your free invitation
              </a>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="how">
          <div className="mx-auto max-w-6xl">
            <h2 id="how" className="text-center font-display text-[36px] font-semibold sm:text-[44px]">
              From invitation to your first intention
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-[15.5px] text-[#5B6275]">Four steps, about five minutes.</p>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-2xl border border-[#E9E2D3] bg-white p-5 shadow-[0_2px_4px_rgba(31,49,91,0.04),0_18px_36px_-24px_rgba(31,49,91,0.35)]">
                  <span className="text-[12px] font-semibold tracking-[0.18em] text-[#A8873F]">{s.n}</span>
                  <h3 className="mt-1 font-display text-[22px] font-semibold leading-tight">{s.title}</h3>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#5B6275]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Membership */}
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="membership">
          <div className="mx-auto max-w-5xl">
            <h2 id="membership" className="text-center font-display text-[36px] font-semibold sm:text-[44px]">
              Start free. Add Mariposa when you&rsquo;re ready.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="rounded-[22px] border border-[#E9E2D3] bg-[#FBF8F2] p-7">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#A8873F]">Membership</p>
                <p className="mt-1 font-display text-[44px] font-semibold leading-none">Free</p>
                <ul className="mt-5 space-y-2 text-[15px] text-[#2A3552]">
                  {["The whole community and every conversation", "Live sessions, reminders and replays", "Your private Alignment Journal", "Messages and the member directory", "The LifeCharter Library", "The app on your phone"].map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="text-[#A8873F]" aria-hidden="true">
                        ✓
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
                <a href="#invite" className="mt-6 inline-block rounded-xl bg-[#1F315B] px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-[#0F1A38]">
                  Request your invitation
                </a>
              </div>
              <div className="rounded-[22px] bg-[#1F315B] p-7 text-[#F8F5F0] shadow-[0_30px_60px_-30px_rgba(15,26,56,0.8)]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#E6C988]">Collective Plus</p>
                <p className="mt-1 font-display text-[44px] font-semibold leading-none">
                  $9.99<span className="text-[18px] font-normal text-[#EDE6D6]/75">/month</span>
                </p>
                <p className="mt-1 text-[13.5px] text-[#EDE6D6]/80">or $99 a year · founding members keep $7 a month for as long as they stay</p>
                <ul className="mt-5 space-y-2 text-[15px]">
                  {["Everything in membership", "Mariposa, your LifeCharter AI coach", "Sunday week-in-review", "Monthly alignment report", "Ask the Library", "Your 90-day focus and journal export"].map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="text-[#E6C988]" aria-hidden="true">
                        ✓
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[13px] leading-relaxed text-[#EDE6D6]/75">Join free first, then add Plus from inside the Collective whenever you like. Mariposa prepares; you decide.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Programs */}
        <section className="px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="programs">
          <div className="mx-auto max-w-4xl text-center">
            <h2 id="programs" className="font-display text-[32px] font-semibold sm:text-[40px]">
              The home of every LifeCharter program
            </h2>
            <p className="mx-auto mt-2 max-w-2xl font-editorial text-[18.5px] leading-relaxed text-[#2A3552]">
              When you join a LifeCharter program, its private space opens right here, alongside the people you already know.
            </p>
            <ul className="mt-7 flex flex-wrap justify-center gap-2.5">
              {PROGRAMS.map((p) => (
                <li key={p} className="rounded-full border border-[#DCD3C1] bg-white px-4 py-2 text-[14px] font-semibold">
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[14px] text-[#5B6275]">Hosted by AmiLynne Carroll, founder of LifeCharter.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="faq">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq" className="text-center font-display text-[36px] font-semibold sm:text-[44px]">
              Questions, answered
            </h2>
            <div className="mt-8 divide-y divide-[#E9E2D3] border-y border-[#E9E2D3]">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[21px] font-semibold leading-snug">
                    {f.q}
                    <span className="text-[22px] text-[#A8873F] transition group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#5B6275]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#0F1A38] px-4 py-16 text-[#F8F5F0] sm:px-6 sm:py-24" aria-labelledby="join">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
            <div>
              <h2 id="join" className="font-display text-[38px] font-semibold leading-tight sm:text-[50px]">
                Your work deserves a room like this.
              </h2>
              <p className="mt-3 font-editorial text-[19px] leading-relaxed text-[#EDE6D6]/85">
                Set your intention on Monday. Share what moved on Friday. Build the rest of it with people who understand the work.
              </p>
            </div>
            <InviteForm source="landing-footer" dark />
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E9E2D3] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-[13px] text-[#8A8FA0] sm:flex-row">
          <p>© {new Date().getFullYear()} Sacred Kaleidoscope Community LLC · LifeCharter</p>
          <nav className="flex gap-4" aria-label="Legal">
            <Link href="/legal/community-guidelines" className="hover:text-[#1F315B]">
              Community Guidelines
            </Link>
            <Link href="/legal/privacy-policy" className="hover:text-[#1F315B]">
              Privacy
            </Link>
            <Link href="/community/sign-in" className="hover:text-[#1F315B]">
              Member sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
