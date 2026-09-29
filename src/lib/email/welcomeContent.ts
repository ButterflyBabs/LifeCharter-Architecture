// Command Suite new-client welcome sequence: the copy. Written with Babs on the Master Punch
// List (Drafts tab, item cs144); change it there first, then here. Placeholders: {{GREETING}},
// {{INCLUDED}} (Email 1's plan-specific list) and {{REVIEW_DUE}}. Every email ends with Babs's
// sign-off, added by the sender.

export type WelcomeEmail = { key: string; day: number; subject: string; preview: string; body: string };

export const WELCOME_EMAILS: WelcomeEmail[] = [
  {
    "key": "welcome",
    "day": 0,
    "subject": "You're in. Welcome to Command Suite.",
    "preview": "Your login, your first step, and when we meet.",
    "body": "{{GREETING}}\n\nYou're in, and I'm so glad you're here.\n\nCommand Suite is where your business gets clear, aligned and run on purpose. Over the next few weeks you'll map how your business really works, see where it's out of alignment, and build the plans, systems and rhythms that fix it. You won't be doing it alone: the cohort and I travel beside you the whole way.\n\nYour first hour:\n\n1. Sign in at https://lccommandsuite.com/login with this email address. If you already have a LifeCharter login (from the Command Shift, the Collective or the LifeCharter Program), it's the same password. First time signing in, or forgot your password? Click \"Forgot or set your password?\" on the sign-in page, and we'll email you a link to choose one.\n2. Open Set up Suite. It's the first thing you'll see. Step one is connecting your AI (about five minutes), then your Brain Assessment.\n3. Save the date: Sales & Marketing Coaching is every Wednesday at 1 PM Mountain (3 PM Eastern, 12 PM Pacific). To join, click The Collective in the left menu of the Suite, then Events. Sales & Marketing Coaching is there, with the Zoom link and an add-to-calendar button.\n\n{{INCLUDED}}\n\nQuestions? Just reply. It comes straight to my team (support@amilynnecarroll.com), Monday to Friday, 9 to 5 Mountain."
  },
  {
    "key": "day1",
    "day": 1,
    "subject": "Two things to do today",
    "preview": "Five minutes to connect your AI, then the assessment everything is built on.",
    "body": "{{GREETING}}\n\nTwo things today, in this order.\n\n1. Connect your AI (about five minutes). Add your OpenAI key under Settings › AI. Do it first, so the moment you finish your assessments, your guide is ready to turn them into plans, insights, reviews, captions and proposals, all written in your voice.\n\n2. Take your Brain Assessment. It maps how your business actually runs (marketing, sales, operations, finance and more) in your own words. It isn't a test. There are no wrong answers, only honest ones, and honest is what makes the rest of the Suite useful.\n\nThen, over the next few days:\n- Soul Assessment: your identity, values, calling and story. This is the heart your AI writes from, so everything it drafts sounds like you.\n- Profit Assessment: scores your 12 business dimensions and gives you your starting baseline.\n\nDid you do the Command Shift 21-day challenge? Bring that work in with one tap: in the left menu, open Alignment Profile (under Alignment) and click \"Bring in my Command Shift work.\" You'll also see a reminder on your Executive Home until it's done. It works when you joined the challenge with this same email, and it won't overwrite anything.\n\nStart here: https://lccommandsuite.com/setup"
  },
  {
    "key": "day3",
    "day": 3,
    "subject": "One connection, and one question",
    "preview": "Connect a tool, and tell us your website address.",
    "body": "{{GREETING}}\n\nTwo small things finish your setup.\n\n1. Connect one tool. Your calendar and email (Google or Microsoft), or PostStream. Any one of them completes setup, and it's what lets the Suite act for you, not just advise you.\n\n2. What's your website address? Add it on Set up Suite. We'll read your site against the positioning and offer you're building, and send you your free Website Alignment Review.\n\nHaven't connected your AI yet? It's step one on the same page, and it takes about five minutes.\n\nStuck on any of it? Bring it to the weekly tech-support call, or just reply.\n\nFinish setup: https://lccommandsuite.com/setup"
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
    "body": "{{GREETING}}\n\nYour Website Alignment Review is on its way. It's due by {{REVIEW_DUE}}, and I'll email you the moment it's in your account.\n\nHere's what it is: we read your website against the positioning, voice and offer you're building in the Suite, and give you the five changes that matter most. It's yours to keep and act on, whatever you decide next.\n\nIf you'd rather have it done for you, that's the Website Alignment Build:\n- Up to five pages, rewritten and rebuilt to match your aligned positioning\n- Live within 30 days, and I review it personally before it goes live\n- Founding price $1,997 (or two payments of $998.50) for clients who enroll by December 17\n- Only five Builds a month\n\nReply \"Build\" and we'll hold you a spot.\n\n(No website yet? Add your address on Set up Suite whenever you're ready, or reply and tell us what you have.)"
  },
  {
    "key": "day14",
    "day": 14,
    "subject": "Two weeks in",
    "preview": "What's next, and the rhythm that keeps you aligned.",
    "body": "{{GREETING}}\n\nTwo weeks. Look at what you've built already: your business mapped, your baseline set, and your AI writing in your voice.\n\nWhat's next:\n- Your Website Alignment Review is in your account (Website Review in the sidebar), or it lands in the next day or two.\n- Keep the rhythm: a Quick Pulse check-in every month, your Profit Assessment every quarter, Brain every six months, Soul once a year. The Suite reminds you, so you don't have to.\n- Bring one thing to group coaching this week: the part of your business that still feels out of alignment. That's exactly what the room is for.\n\nAnd tell me: what's one win from your first two weeks? Just reply. I read every one."
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
