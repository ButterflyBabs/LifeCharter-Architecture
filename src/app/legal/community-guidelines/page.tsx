import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Community Guidelines & Terms of Use — The LifeCharter Collective",
  description: "How we show up for each other in The LifeCharter Collective.",
};

const H2 = "font-display text-[26px] font-semibold text-[#1F315B] mt-10 mb-2";
const P = "text-[#3A4462] leading-relaxed mb-4";
const LI = "flex gap-3";
const DOT = "mt-1 text-[#B8923F]";

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className={LI}>
      <span className={DOT}>&#9679;</span>
      <span>{children}</span>
    </li>
  );
}

export default function CommunityGuidelinesPage() {
  return (
    <main className="min-h-screen bg-[#F8F5F0] font-ui text-[#1F315B]">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/community" className="text-sm font-semibold text-[#A8873F] hover:underline">
          &larr; Back to the Collective
        </Link>
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A8873F]">The LifeCharter Collective</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Community Guidelines &amp; Terms of Use</h1>

        <p className={`${P} mt-6`}>
          The LifeCharter Collective is a private community for people creating lives and businesses of Purpose, Clarity and Aligned
          Action. It is operated by Sacred Kaleidoscope Community, doing business as LifeCharter (&ldquo;LifeCharter,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;). By joining or using the Collective you agree to these guidelines.
        </p>

        <h2 className={H2}>How we show up</h2>
        <ul className="mb-4 space-y-2.5 text-[#3A4462]">
          <Item>Lead with respect and generosity. Assume good intent, and offer perspective rather than judgment.</Item>
          <Item>Keep conversations purposeful — share wins, questions, reflections and aligned action.</Item>
          <Item>Protect privacy. What members share here stays here. Don&rsquo;t screenshot, copy or repost others&rsquo; posts or messages outside the Collective.</Item>
          <Item>Promotion belongs in Connect &amp; Collaborate, offered as genuine connection. No unsolicited pitches in direct messages.</Item>
          <Item>Program content, recordings and materials are for your personal use while you&rsquo;re a member, and may not be shared or resold.</Item>
        </ul>

        <h2 className={H2}>Zero tolerance</h2>
        <p className={P}>
          There is zero tolerance for objectionable content or abusive behavior, including harassment, hate speech, threats, sexual
          content, spam, scams, or impersonation. We may remove content and pause or end membership at our discretion, without notice,
          to keep the Collective safe.
        </p>

        <h2 className={H2}>Not professional advice</h2>
        <p className={P}>
          Conversations in the Collective — including from coaches and other members — are for education and support. They are not
          medical, mental-health, legal, tax or financial advice. Please consult a qualified professional for those needs.
        </p>

        <h2 className={H2}>Your content &amp; your account</h2>
        <p className={P}>
          You own what you post. By posting, you give LifeCharter permission to display it to the members who can see that space. You
          can edit or delete your posts at any time. Keep your password private; you&rsquo;re responsible for activity on your account.
          Access to program spaces may end when your program or membership ends.
        </p>

        <h2 className={H2}>Your information</h2>
        <p className={P}>
          Your name, photo and profile details are visible to other members; your email and phone number are not. See our{" "}
          <Link href="/legal/privacy-policy" className="text-[#A8873F] underline">
            Privacy Policy
          </Link>{" "}
          for how we handle information.
        </p>

        <h2 className={H2}>Questions or concerns</h2>
        <p className={P}>
          If something doesn&rsquo;t feel right, message a community admin directly in the Collective. We read every report.
        </p>
      </div>
    </main>
  );
}
