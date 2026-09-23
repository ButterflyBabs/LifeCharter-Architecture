import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Community Guidelines & Terms of Use — The LifeCharter Collective",
  description: "How we show up for each other in The LifeCharter Collective.",
};

const EFFECTIVE = "September 23, 2026";

const H2 = "font-display text-[28px] font-semibold leading-tight text-[#1F315B] mt-12 mb-3 scroll-mt-8";
const P = "text-[16px] text-[#3A4462] leading-relaxed mb-4";

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8923F]" />
      <span>{children}</span>
    </li>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 space-y-2.5 text-[16px] leading-relaxed text-[#3A4462]">{children}</ul>;
}

const SECTIONS = [
  ["why", "Why the Collective exists"],
  ["show-up", "How we show up"],
  ["confidentiality", "What's shared here stays here"],
  ["promotion", "Offers & promotion"],
  ["sessions", "Live sessions & recordings"],
  ["content", "Program content"],
  ["boundaries", "Where we draw the line"],
  ["advice", "Support, not professional advice"],
  ["account", "Your content & your account"],
  ["information", "Your information"],
  ["changes", "Changes & questions"],
] as const;

export default function CommunityGuidelinesPage() {
  return (
    <main className="min-h-screen bg-[#F8F5F0] font-ui text-[#1F315B]">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
        <Link href="/community" className="text-sm font-semibold text-[#A8873F] hover:underline">
          &larr; Back to the Collective
        </Link>

        <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#A8873F]">The LifeCharter Collective</p>
        <h1 className="mt-2 font-display text-[40px] font-semibold leading-[1.1] sm:text-[48px]">How we show up for each other.</h1>
        <p className="mt-2 text-[14px] text-[#8A8FA0]">Community Guidelines &amp; Terms of Use · Effective {EFFECTIVE}</p>

        <p className={`${P} mt-8 text-[17px]`}>
          The LifeCharter Collective is a private community for people creating lives and businesses of Purpose, Clarity and
          Aligned Action. It works because of how we treat each other. These guidelines are the agreement that keeps it that way.
        </p>
        <p className={P}>
          The Collective is operated by Sacred Kaleidoscope Community LLC, doing business as LifeCharter (&ldquo;LifeCharter,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;). By joining or using the Collective, you agree to these guidelines.
        </p>

        {/* The short version */}
        <div className="mt-8 rounded-2xl border border-[#E6C988] bg-gradient-to-br from-[#FFFDF8] to-[#FBF3DF] p-6 shadow-[0_12px_28px_-18px_rgba(31,49,91,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A8873F]">The short version</p>
          <ol className="mt-3 space-y-2 text-[16px] leading-relaxed text-[#1F315B]">
            <li><strong>Lead with respect.</strong> Offer perspective, not judgment.</li>
            <li><strong>What&rsquo;s shared here stays here.</strong> No screenshots, no reposting, no retelling.</li>
            <li><strong>Offers go in the weekly Share Your Offer thread.</strong> Never in someone&rsquo;s messages uninvited.</li>
            <li><strong>Only LifeCharter records sessions.</strong> No personal recordings or AI notetakers.</li>
            <li><strong>Harm ends membership.</strong> Harassment, hate, threats, scams and sexual content are removed immediately.</li>
          </ol>
        </div>

        <nav aria-label="Contents" className="mt-8 rounded-2xl border border-[#E9E2D3] bg-white p-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A8FA0]">Contents</p>
          <ol className="grid gap-x-6 gap-y-1.5 text-[14.5px] sm:grid-cols-2">
            {SECTIONS.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="text-[#1F315B] hover:text-[#A8873F] hover:underline">
                  {i + 1}. {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <h2 id="why" className={H2}>1. Why the Collective exists</h2>
        <p className={P}>
          Most of us have done the work of growth alone — carrying the vision, the decisions and the doubts in our own heads.
          The Collective exists so you don&rsquo;t have to. It is a place to create balance, build alignment and take command,
          alongside people who understand what that takes.
        </p>
        <p className={P}>
          Every channel and pathway here has a purpose. Wins go in Wins. Questions go in Ask the Collective. Intentions go in This Week&rsquo;s
          Intention. Keeping conversations where they belong is how the Collective stays useful — for you, and for the person who
          joins next month.
        </p>

        <h2 id="show-up" className={H2}>2. How we show up</h2>
        <List>
          <Item><strong>Lead with respect.</strong> Disagree with ideas, never with people. Assume good intent, then ask.</Item>
          <Item><strong>Offer perspective, not prescription.</strong> Share what worked for you, and let others choose what fits.</Item>
          <Item><strong>Celebrate aligned action.</strong> Small wins count. Cheer them as loudly as the big ones.</Item>
          <Item><strong>Be present, not perfect.</strong> You don&rsquo;t need a polished post. You need an honest one.</Item>
          <Item><strong>Protect the space.</strong> If something feels off, tell an admin. You&rsquo;re never &ldquo;making a fuss.&rdquo;</Item>
        </List>

        <h2 id="confidentiality" className={H2}>3. What&rsquo;s shared here stays here</h2>
        <p className={P}>
          Members bring real stories, real numbers and real struggles into the Collective. That trust is the foundation of
          everything else, so confidentiality here is strict.
        </p>
        <List>
          <Item>Don&rsquo;t screenshot, copy, forward or repost anyone&rsquo;s posts, replies, photos or messages outside the Collective.</Item>
          <Item>Don&rsquo;t retell another member&rsquo;s story or share details that could identify them — even without their name.</Item>
          <Item>If you&rsquo;d like to share something a member posted, ask them first and share only with their permission.</Item>
          <Item>Direct messages are private between the people in them. Treat them that way.</Item>
          <Item>
            Coaches and certification candidates: never share client names or identifying details in case discussions or the
            Practice Lab. Change or remove anything that could identify a client.
          </Item>
        </List>

        <h2 id="promotion" className={H2}>4. Offers &amp; promotion</h2>
        <p className={P}>
          Many of us are building businesses, and there is a place to share what you offer. It just isn&rsquo;t everywhere.
        </p>
        <List>
          <Item>
            <strong>Share Your Offer.</strong> Each week, a pinned Share Your Offer thread opens in Connect &amp; Collaborate. That&rsquo;s the
            place for launches, offers, events and links to your work.
          </Item>
          <Item>
            <strong>Everywhere else is for connection.</strong> &ldquo;I need someone who…&rdquo; and &ldquo;Does anyone have experience with…&rdquo;
            are welcome in Connect &amp; Collaborate. Sales pitches outside the weekly thread are removed.
          </Item>
          <Item><strong>No uninvited pitches in direct messages.</strong> If someone asks about your work, you&rsquo;re welcome to answer.</Item>
          <Item>No affiliate links, recruiting into other programs or communities, or collecting members&rsquo; contact details for marketing.</Item>
          <Item>LifeCharter admins may allow, limit or remove promotion anywhere in the Collective at their discretion.</Item>
        </List>

        <h2 id="sessions" className={H2}>5. Live sessions &amp; recordings</h2>
        <List>
          <Item>
            LifeCharter may record live sessions — including Alignment Anchors, office hours, workshops and Hope Seats — and share
            replays inside the Collective. If you&rsquo;d rather not appear in a recording, keep your camera off and use the chat.
          </Item>
          <Item>
            Members may not record, screenshot or transcribe live sessions — including with AI notetakers or meeting bots. Please
            remove any notetaker from your account before you join.
          </Item>
          <Item>Replays are for members of the channel they&rsquo;re posted in. Don&rsquo;t download, share or repost them.</Item>
        </List>

        <h2 id="content" className={H2}>6. Program content</h2>
        <p className={P}>
          Lessons, replays, worksheets, templates and other materials in the Collective and the LifeCharter Library are for your
          personal use while you&rsquo;re a member. They may not be shared, resold, taught or repackaged as your own. Access to a
          program&rsquo;s channel may end when your program or membership ends; your place in the wider Collective, and Alumni where
          it applies, continues.
        </p>

        <h2 id="boundaries" className={H2}>7. Where we draw the line</h2>
        <p className={P}>
          Most missteps are honest ones, so we start with a conversation. When a guideline is broken, here&rsquo;s what happens:
        </p>
        <ol className="mb-5 space-y-3 text-[16px] leading-relaxed text-[#3A4462]">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1F315B] text-[13px] font-bold text-[#E6C988]">1</span>
            <span><strong>A private reminder.</strong> An admin reaches out directly, and the content may be edited or removed.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1F315B] text-[13px] font-bold text-[#E6C988]">2</span>
            <span><strong>A pause.</strong> If it happens again, your membership may be paused while we talk it through.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1F315B] text-[13px] font-bold text-[#E6C988]">3</span>
            <span><strong>Removal.</strong> Continued violations end membership in the Collective.</span>
          </li>
        </ol>
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/70 p-5">
          <p className="font-semibold text-[#7F1D1D]">Immediate removal — no reminders</p>
          <p className="mt-1 text-[15px] leading-relaxed text-[#5B2323]">
            There is zero tolerance for harassment, bullying, hate speech, threats, sexual content, scams or fraud, impersonation,
            spam, or deliberately sharing another member&rsquo;s private information. Any of these may result in immediate removal
            without notice.
          </p>
        </div>
        <p className={P}>
          LifeCharter makes the final decision on moderation. Paused or removed members may lose access to program channels and
          content; any refund questions are handled under the terms of the program you purchased.
        </p>

        <h2 id="advice" className={H2}>8. Support, not professional advice</h2>
        <p className={P}>
          Conversations in the Collective — including those with coaches, admins and other members — are for education,
          reflection and support. They are not medical, mental-health, legal, tax or financial advice. Please consult a qualified
          professional for those needs.
        </p>
        <p className={P}>
          If you or someone you know is in crisis or thinking about self-harm, please reach out for immediate help: call or text
          988 in the United States, or contact your local emergency services.
        </p>

        <h2 id="account" className={H2}>9. Your content &amp; your account</h2>
        <List>
          <Item>You own what you post. By posting, you give LifeCharter permission to display it to the members who can see that channel.</Item>
          <Item>You can edit or delete your posts and replies at any time.</Item>
          <Item>You must be 18 or older to join, and you may hold only one account.</Item>
          <Item>Keep your password private. You&rsquo;re responsible for activity on your account.</Item>
          <Item>Only post photos, videos and files you have the right to share.</Item>
        </List>

        <h2 id="information" className={H2}>10. Your information</h2>
        <p className={P}>
          Your name, photo and profile details are visible to other members. Your email address and phone number are not. You
          can hide yourself from the member directory and turn off direct messages in your profile settings. See our{" "}
          <Link href="/legal/privacy-policy" className="text-[#A8873F] underline underline-offset-2">
            Privacy Policy
          </Link>{" "}
          for how we handle information.
        </p>

        <h2 id="changes" className={H2}>11. Changes &amp; questions</h2>
        <p className={P}>
          As the Collective grows, these guidelines may be updated. When something meaningful changes, we&rsquo;ll announce it in
          the Collective. Continuing to use the Collective means you accept the updated guidelines.
        </p>
        <p className={P}>
          If something doesn&rsquo;t feel right, tap <strong>Report</strong> on the post, reply, message or profile (or send a
          direct message to a LifeCharter admin). We read every report and act within 24 hours; the person reported is never
          told who reported them. You can also <strong>Block</strong> anyone from their profile so you no longer see each
          other&rsquo;s posts or messages.
        </p>
        <p className={P}>
          To keep the Collective safe, new posts and replies are checked by an automated filter. Anything it flags is reviewed by
          a person, and clearly harmful content is hidden until it is. Private messages are not scanned. Content that breaks
          these guidelines is removed, and members who post it may be paused or removed from the Collective.
        </p>
        <p className={P}>
          You can permanently delete your account at any time from <strong>Me → Delete my account</strong>.
        </p>

        <p className="mt-12 border-t border-[#E9E2D3] pt-6 font-editorial text-[18px] italic text-[#A8873F]">
          Create Balance. Build Alignment. Take Command. — together.
        </p>
      </div>
    </main>
  );
}
