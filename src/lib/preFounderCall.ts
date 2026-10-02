// The Pre-Founder 1:1 call guide: what it asks, how the answers land on the contact's
// card (a timeline note, custom fields, tags) and what Babs says. Shared by the page and
// the route so the labels in the note always match the form.

export const PF_CALENDAR_SLUG = "pre-founder-inquiry-call-with-babs";

export const INTERESTS = [
  { key: "ready", label: "Yes, I'm in", tag: "pre-founder-ready", login: "Ready to issue" },
  { key: "maybe", label: "Thinking about it", tag: "pre-founder-maybe", login: "Not yet" },
  { key: "not-now", label: "Not right now", tag: "pre-founder-not-now", login: "Not yet" },
  { key: "not-a-fit", label: "Not a fit", tag: "pre-founder-not-a-fit", login: "Not yet" },
] as const;
export type InterestKey = (typeof INTERESTS)[number]["key"];

// Every answer on the form: key, the label it carries on the card, and whether it is also
// kept as a custom field on the contact (so it can be searched, sorted and exported).
export const NOTE_FIELDS: { key: string; label: string; custom?: string }[] = [
  { key: "stoodOut", label: "What stood out from the Sneak Peek" },
  { key: "business", label: "Their business" },
  { key: "bottleneck", label: "Biggest bottleneck", custom: "pf_bottleneck" },
  { key: "tools", label: "Tools they use today", custom: "pf_tools" },
  { key: "yearOut", label: "A year from now if nothing changes" },
  { key: "firstUse", label: "What they would use first" },
  { key: "concerns", label: "Concerns raised", custom: "pf_concerns" },
  { key: "referrals", label: "People who came to mind" },
  { key: "nextStep", label: "Agreed next step", custom: "pf_next_step" },
  { key: "extra", label: "Anything else" },
];

// Custom fields created on Babs's account the first time a call is saved.
export const CUSTOM_FIELD_DEFS: { key: string; label: string; type: "text" | "long_text" | "date" | "select"; options?: string[] }[] = [
  { key: "pf_call_date", label: "Pre-Founder call date", type: "date" },
  { key: "pf_interest", label: "Pre-Founder interest", type: "select", options: INTERESTS.map((i) => i.label) },
  { key: "pf_login_status", label: "Pre-Founder login", type: "select", options: ["Not yet", "Ready to issue", "Issued"] },
  { key: "pf_bottleneck", label: "Biggest bottleneck", type: "long_text" },
  { key: "pf_tools", label: "Tools they use today", type: "long_text" },
  { key: "pf_concerns", label: "Pre-Founder concerns", type: "long_text" },
  { key: "pf_next_step", label: "Pre-Founder next step", type: "text" },
];

export const CONCERNS: { key: string; label: string; say: string }[] = [
  { key: "price", label: "Price after six months", say: "It replaces what you pay for today: calendar, email, CRM, short links, finance, planning. What are you paying for those now, separately and half-used? And $497 is locked in for as long as you're with us." },
  { key: "time", label: "No time to learn it", say: "That's why your first 30 days are guided, one week at a time. There's a New Client Launch Call every other Thursday, and Office Hours every Thursday where we build right alongside you." },
  { key: "tech", label: "Not techy", say: "You don't have to be. Set up Suite walks you through it step by step, and you never set it up alone." },
  { key: "ai", label: "Worried about AI", say: "The AI is a sit-beside. It drafts, sorts and reminds, and you stay in charge. It only knows what you teach it, and each account sees only its own information." },
  { key: "overwhelm", label: "Feels like a lot", say: "You don't use it all at once. Your first 30 days open one week at a time, and we start with the one screen that matters most to you: " },
  { key: "team", label: "Needs team access", say: "You invite your team in Settings and choose what each person can see and do." },
  { key: "not-coach", label: "I'm not a coach", say: "It was built by a coach, and it's running in other kinds of businesses right now. It's one place to run your day, see your whole business and grow your clients." },
  { key: "think", label: "Needs to think", say: "Of course. What specifically do you want to think through? Let's talk it through right now while it's fresh. And when should I check back with you?" },
];
