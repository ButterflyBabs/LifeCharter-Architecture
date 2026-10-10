// Command Suite new-client welcome sequence: the copy. Written with Babs on the Master Punch
// List (Drafts tab, item cs144); change it there first, then here. Placeholders: {{GREETING}},
// {{INCLUDED}} (Email 1's plan-specific list) and {{REVIEW_DUE}}. Every email ends with Babs's
// sign-off, added by the sender (unless the body already closes with it).
// 2026-10-10: Email 1 is the New Client Setup Walkthrough, sent about 3 minutes after the account is created
// (src/lib/clientWalkthrough.ts). It replaces the old Email 1 and the old Day 1 ("Two things to do today").

export type WelcomeEmail = { key: string; day: number; subject: string; preview: string; body: string };

export const WELCOME_EMAILS: WelcomeEmail[] = [
  {
    "key": "welcome",
    "day": 0,
    "subject": "Your first hour in Command Suite, step by step",
    "preview": "Sign in, bookmark it, connect your AI, and take your three assessments.",
    "body": "{{GREETING}}\n\nWelcome to your LifeCharter Command Suite. Here is the order I would set it up in, the same way I walk someone through it on a call. Nothing here is hard, and every step saves as you go, so you can stop and pick it back up on any device.\n\n**Step 1: Sign in and bookmark it.**\nGo to [lccommandsuite.com/login](https://lccommandsuite.com/login) and use the email this message came to. If you haven't chosen a password yet, press \"Forgot or set your password?\" and we'll email you a link. Then click the star in your browser's address bar and put the Suite on your bookmarks bar. You stay signed in, so one click brings you back to the last page you were on. If a page ever looks out of date, press Command + Shift + R on a Mac, or Ctrl + Shift + R on a PC, to refresh the whole app.\n\n**Step 2: Open your Starter Guide and keep it beside you.**\nYou will find it in the left navigation under [Getting Started](https://lccommandsuite.com/setup), then **Starter Guide**. You can also [open it here](https://lccommandsuite.com/starter-guide.html). It is your 30-day checklist, with a time estimate for every day and where to click for each step. Bookmark it too and open it each day for your first 30 days. Your ticks are saved to your account, so it follows you to any device.\n\n**Step 3: Connect your AI (about 5 minutes).**\nOpen [Set up Suite](https://lccommandsuite.com/setup) under Getting Started in the left navigation (it sits at the top while you are new). Start with Connect your AI and add an OpenAI key. That is different from a ChatGPT login, and a ChatGPT login will not work here. I suggest creating a separate OpenAI key just for Command Suite so you can see exactly what it costs. Setting up your Command Suite is a one-time usage on OpenAI that should cost you less than $5, with the average day-to-day use being minimal at not more than $0.20 a day (based on full utilization of the Command Suite). Those are estimates, not guarantees: OpenAI bills your own account directly, and LifeCharter never sees or controls it. Only your AI Assistant uses your key. The Help & setup side of the Travel Partner costs you nothing (more on that just after Step 4).\n\n**Step 4: Name your assistant and teach it how you work.**\nGo to [Settings](https://lccommandsuite.com/settings?tab=ai) in the left navigation and open the **AI Assistant** tab. [Take me there](https://lccommandsuite.com/settings?tab=ai). After you save your key, give your assistant a name, and tell it how to reply and what it should know about you. A shortcut that works well: in ChatGPT or Claude, make a project called Command Suite with a folder called Admin. Drop in a screenshot of the page and ask it to draft the answers to \"How should [your assistant's name] reply?\" and \"How should [your assistant's name] know about you and how you work?\" It will be about 80 percent right. Edit it until it sounds like you, paste it into the Suite, and save.\n\n**Travel Partner and your AI Assistant: what is the difference?**\nThe **Travel Partner** is Command Suite's built-in helper. It knows how every feature works and will guide you on each and every page. It is the compass button docked in the corner of every page (lower right to start, and you can drag it wherever you like). It opens one small window with two tabs:\n- **Help & setup** is your guide to the Suite. It holds your setup checklist and a \"How do I...\" box that answers questions about how anything works from our Help library, and it can take you to the right page. It is free to use and does not touch your OpenAI key.\n- **Ask [your assistant's name]** is your **AI Assistant**, the one you just named. It knows your business, remembers your conversation, and can prepare work for you (always waiting for your approval). It runs on your OpenAI key, which is where the small usage cost comes from.\n\nSo when you want to know how something works, use Help & setup. When you want your business thinking or writing done, ask your AI Assistant.\n\n**Step 5: Take your three assessments, in order.**\nGo back to [Getting Started](https://lccommandsuite.com/setup) in the left navigation to reach your assessments, and take them in this order: **Brain, then Soul, then Profit.** Brain takes about 90 minutes, Soul about 60 and Profit about 45. Everything else in the Suite is built on them, and each one builds on the one before. They save as you go, so three or four short sittings works just as well. A faster way through: keep your ChatGPT or Claude project open on one half of your screen and the assessment on the other. Once your key is connected you can also press \"Fill this section with my AI,\" then read it and edit it in your own words.\n\n**Step 6: Make it yours.**\nIn [Settings](https://lccommandsuite.com/settings) in the left navigation, choose your time zone and email choices, add your photo, and pick the look that is easiest on your eyes: light or dark, your colours, and a small, medium or large font. Then connect your email and calendar (Microsoft 365 or Gmail). Depending on your plan you can connect more than one address, up to 10 on VIP.\n\n**One more thing: your complimentary website review.**\nReturn to [Set up Suite](https://lccommandsuite.com/setup) under Getting Started in the left navigation and give us your website address. It is how we prepare your complimentary website assessment, your Website Alignment Review, which we read against the positioning and offer you are building and send to you. You can also enter it on [Website Review](https://lccommandsuite.com/website-review), which is right there under Getting Started.\n\n**What you'll start to see.**\nOnce you are set up, the Suite emails you each morning with what needs your attention, such as a weekly review that is ready or a deal with an overdue next step, and the same things wait for you on [Executive Home](https://lccommandsuite.com/) in the left navigation. Your AI Assistant (you gave it a name in Step 4) can also listen and talk back.\n\n**Tell us what you'd change.**\nThis is a young product, and your honest feedback makes it better for everyone. When something is confusing or glitchy, or you wish it did one more thing, open [Help](https://lccommandsuite.com/help/contact) in the left navigation, then **Contact Support**. That page is where to send feedback, suggestions, glitches and support tickets: [go to Contact Support](https://lccommandsuite.com/help/contact). You can also click [the gold lifebuoy icon in the upper right of any page](https://lccommandsuite.com/help/contact) to be taken straight there. Anything we change shows up under What's New on the same page, and your Help library and your assistant learn it at the same time.\n\n**Save the date.**\nSales & Marketing Coaching is every Wednesday at 1 PM Mountain (3 PM Eastern, 12 PM Pacific). To join, click [The Collective](https://lccommandsuite.com/community) in the left navigation, then Events. Sales & Marketing Coaching is there, with the Zoom link and an add-to-calendar button.\n\n{{INCLUDED}}\n\nQuestions? Just reply. It comes straight to my team.\n\nHead up - Wings out,\n\nAmiLynne \"Babs\" Carroll\nExecutive, Alignment Architect, and Chief Travel Partner\nLifeCharter by AmiLynne Carroll"
  },
  {
    "key": "day3",
    "day": 3,
    "subject": "One connection, and one question",
    "preview": "Connect a tool, and tell us your website address.",
    "body": "{{GREETING}}\n\nTwo small things finish your setup.\n\n1. Connect one tool. Your calendar and email (Google or Microsoft), or PostStream. Any one of them completes setup, and it's what lets the Suite act for you, not just advise you.\n\n2. What's your website address? Open Getting Started, then Website Review (https://lccommandsuite.com/website-review), enter it and save. We'll read your site against the positioning and offer you're building, and send you your free Website Alignment Review.\n\nHaven't connected your AI yet? It's step one on the same page, and it takes about five minutes.\n\nStuck on any of it? Bring it to the weekly tech-support call, or just reply.\n\nFinish setup: https://lccommandsuite.com/setup"
  },
  {
    "key": "day5",
    "day": 5,
    "subject": "You're not building this alone",
    "preview": "Your community, and where the live sessions happen.",
    "body": "{{GREETING}}\n\nThe Suite gives you the map. The people make the journey lighter.\n\nYour private community, The Collective, lives right inside Command Suite. Click The Collective in the left menu (under Daily Operations), or go to https://lccommandsuite.com/community. Open the LifeCharter Command Suite space; it has rooms for exactly what you're doing:\n- Implementation Lab: what you're working on this week\n- Systems & Automation: set-ups, tools and shortcuts\n- Questions & Support: ask anything\n- Show Your Build: share what you've finished (please do; it helps everyone)\n\nEvery live session (group coaching, tech support, Growth Sessions, the Hope Seat) is under Events in The Collective, shown in your own time zone, with the Zoom link and an add-to-calendar button.\n\nSay hello today in Questions & Support. Tell us what you do and the one thing you most want to get aligned."
  },
  {
    "key": "day10",
    "day": 10,
    "subject": "Your website is next",
    "preview": "Your free Review arrives soon. Here's what comes with it.",
    "body": "{{GREETING}}\n\nYour Website Alignment Review is on its way. It's due by {{REVIEW_DUE}}, and I'll email you the moment it's in your account.\n\nHere's what it is: we read your website against the positioning, voice and offer you're building in the Suite, and give you the five changes that matter most. It's yours to keep and act on, whatever you decide next.\n\nIf you'd rather have it done for you, that's the Website Alignment Build:\n- Up to five pages, rewritten and rebuilt to match your aligned positioning\n- Live within 30 days, and I review it personally before it goes live\n- Founding price $1,997 (or two payments of $998.50) for clients who enroll by December 17\n- Only five Builds a month\n\nReply \"Build\" and we'll hold you a spot.\n\n(No website yet? Add your address on Website Review whenever you're ready, or reply and tell us what you have.)"
  },
  {
    "key": "day14",
    "day": 14,
    "subject": "Two weeks in",
    "preview": "What's next, and the rhythm that keeps you aligned.",
    "body": "{{GREETING}}\n\nTwo weeks. Look at what you've built already: your business mapped, your baseline set, and your AI writing in your voice.\n\nWhat's next:\n- Your Website Alignment Review is in your account (Website Review in the sidebar), or it lands in the next day or two.\n- Keep the rhythm: a Quick Pulse check-in every month, your Profit Assessment every quarter, Brain every six months, Soul once a year. The Suite reminds you, so you don't have to.\n- Two small things worth knowing: Logins & Passwords (under Settings) is a private, encrypted place for your logins that your AI never sees, and the Glossary (also under Settings) explains every Suite term in plain words.\n- Bring one thing to group coaching this week: the part of your business that still feels out of alignment. That's exactly what the room is for.\n\nAnd tell me: what's one win from your first two weeks? Just reply. I read every one."
  }
];

export const INCLUDED_BY_PLAN: Record<string, string> = {
  starter: `What's included in your membership:
- Weekly group coaching, plus a weekly tech-support call
- Growth Sessions and the Hope Seat, twice a month
- The full Suite: three assessments, Daily Compass, plans, finance and scripts
- Your private community, off Facebook
- A free Website Alignment Review within 14 days`,
  growth: `What's included in your membership:
- A 1:1 session with me every month, plus a done-with-you kickoff intensive
- Weekly group coaching, plus a weekly tech-support call
- Growth Sessions and the Hope Seat, twice a month
- Room for up to three businesses, plus a collaborator seat
- The full Suite: three assessments, Daily Compass, plans, finance and scripts
- Your private community, off Facebook
- A free Website Alignment Review within 14 days`,
  vip: `What's included in your membership:
- Two 1:1 sessions with me every month, plus direct access between sessions
- White-glove, ongoing done-with-you setup
- Weekly group coaching, plus a weekly tech-support call
- Growth Sessions and the Hope Seat, twice a month
- Unlimited businesses and team seats
- The full Suite: three assessments, Daily Compass, plans, finance and scripts
- Your private community, off Facebook
- A free Website Alignment Review within 14 days`,
};
