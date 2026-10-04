// "Go deeper" questions for each of the 8 operational pillars (Babs, 2026-09-28). Answers are saved
// on the client's pillar (operations_pillars.answers) and read by the Operations AI insights.
// Replaces four old one-off question pages that never saved.

export type DeeperQuestion =
  | { id: string; type: "choice"; q: string; options: string[] }
  | { id: string; type: "multi"; q: string; options: string[] }
  | { id: string; type: "text" | "textarea"; q: string; placeholder?: string };

export const DEEPER_QUESTIONS: Record<string, DeeperQuestion[]> = {
  acquisition: [
    { id: "channels", type: "multi", q: "Where do new clients come from today?", options: ["Referrals / word of mouth", "Organic social media", "Paid ads", "Content / SEO / podcast", "Speaking and events", "Partnerships / affiliates", "Networking", "Outreach (DMs, email, calls)"] },
    { id: "best_channel", type: "text", q: "Which one works best right now?" },
    { id: "leads_per_month", type: "choice", q: "About how many new leads do you get a month?", options: ["Fewer than 5", "5–15", "15–40", "40–100", "More than 100", "I don't track it"] },
    { id: "lead_to_client", type: "choice", q: "What share of leads become paying clients?", options: ["Under 5%", "5–10%", "10–25%", "25–50%", "Over 50%", "I don't track it"] },
    { id: "cac", type: "text", q: "Roughly what does it cost you to win one client (time and money)?", placeholder: "e.g. $300 in ads + 3 hours" },
    { id: "challenge", type: "textarea", q: "What's the biggest thing holding back new clients?" },
  ],
  "sales-journey": [
    { id: "steps", type: "textarea", q: "Walk through how someone goes from interested to paid.", placeholder: "e.g. DM → discovery call → proposal → payment link" },
    { id: "discovery_call", type: "choice", q: "Do you run a discovery or sales call?", options: ["Yes, with a set structure", "Yes, but it varies", "No, people buy without a call"] },
    { id: "close_rate", type: "choice", q: "Of the people you talk to about working together, how many say yes?", options: ["Under 10%", "10–25%", "25–50%", "Over 50%", "I don't track it"] },
    { id: "cycle", type: "choice", q: "How long from first conversation to paid?", options: ["Same day", "Under a week", "1–4 weeks", "1–3 months", "Longer than 3 months"] },
    { id: "follow_up", type: "choice", q: "How do you follow up with people who don't decide right away?", options: ["A set sequence I always use", "I follow up when I remember", "I rarely follow up"] },
    { id: "objection", type: "textarea", q: "What's the most common reason people say no or not yet?" },
  ],
  onboarding: [
    { id: "steps", type: "textarea", q: "What happens between someone paying and their first session or delivery?" },
    { id: "welcome", type: "choice", q: "How are new clients welcomed?", options: ["Automated welcome sequence", "One welcome email", "A personal message from me", "Nothing formal yet"] },
    { id: "time_to_start", type: "choice", q: "How long until a new client gets their first real result or session?", options: ["Same day", "1–3 days", "About a week", "2+ weeks", "It varies a lot"] },
    { id: "personal_touch", type: "textarea", q: "How do you make a new client feel personally looked after?" },
    { id: "drop_off", type: "textarea", q: "Where do new clients get confused or stall?" },
  ],
  support: [
    { id: "channels", type: "multi", q: "How do clients reach you for help?", options: ["Email", "Text / Voxer / WhatsApp", "Community or group", "Help desk / tickets", "Office hours", "Scheduled calls"] },
    { id: "response_time", type: "choice", q: "How fast do clients usually hear back?", options: ["Within a few hours", "Same business day", "Within 48 hours", "It depends on the week"] },
    { id: "hours", type: "text", q: "What hours or boundaries do clients know about?", placeholder: "e.g. Mon–Thu, 9–4 MT" },
    { id: "faqs", type: "textarea", q: "What questions do you answer over and over?" },
    { id: "who", type: "choice", q: "Who handles support?", options: ["Just me", "Me and a team member", "A team member or assistant", "Mostly automated"] },
  ],
  communication: [
    { id: "cadence", type: "choice", q: "How often do you check in with active clients outside sessions?", options: ["Weekly", "Every couple of weeks", "Monthly", "Only when they reach out"] },
    { id: "channels", type: "multi", q: "Which channels do you use with clients?", options: ["Email", "Text / Voxer / WhatsApp", "Client portal or app", "Community", "Newsletter", "Video messages"] },
    { id: "list", type: "choice", q: "How often do you email your wider list?", options: ["Weekly or more", "A few times a month", "Monthly", "Rarely", "I don't have a list yet"] },
    { id: "progress", type: "choice", q: "Do clients get regular progress updates or recaps?", options: ["Yes, after every session", "Now and then", "Not yet"] },
    { id: "gap", type: "textarea", q: "Where does communication most often slip?" },
  ],
  fulfillment: [
    { id: "delivery", type: "textarea", q: "How is your main offer delivered, step by step?" },
    { id: "templates", type: "choice", q: "How much of delivery runs on templates, checklists or systems?", options: ["Almost all of it", "About half", "A little", "Almost none, I rebuild each time"] },
    { id: "capacity", type: "text", q: "How many clients can you serve well at once?", placeholder: "e.g. 12 one-to-one, 40 in group" },
    { id: "results", type: "choice", q: "How do you measure whether clients got the result?", options: ["A set measure I track", "Check-ins and feedback", "Testimonials", "I don't measure it yet"] },
    { id: "bottleneck", type: "textarea", q: "What part of delivery takes the most of your time or energy?" },
  ],
  "internal-culture": [
    { id: "team_size", type: "choice", q: "Who's on your team?", options: ["Just me", "Me plus contractors", "2–5 people", "6–15 people", "More than 15"] },
    { id: "values", type: "textarea", q: "What are the values you run your business by?" },
    { id: "sops", type: "choice", q: "How much of your work is written down as how-to steps (SOPs)?", options: ["Most of it", "The key processes", "A few things", "Almost nothing yet"] },
    { id: "rhythm", type: "choice", q: "What's your planning rhythm?", options: ["Weekly planning and a monthly review", "Weekly planning only", "Monthly or quarterly", "As needed"] },
    { id: "delegation", type: "choice", q: "How comfortable are you handing work off?", options: ["Very, I delegate most things", "I delegate but check closely", "I want to but haven't yet", "I do nearly everything myself"] },
    { id: "three_words", type: "text", q: "Describe how it feels to work in your business, in three words." },
  ],
  referral: [
    { id: "program", type: "choice", q: "Do you have a referral program?", options: ["Yes, structured and tracked", "Informal, people just refer", "I'm planning one", "Not yet"] },
    { id: "share", type: "choice", q: "What share of new clients come from referrals?", options: ["Over 50%", "25–50%", "10–25%", "Under 10%", "I don't track it"] },
    { id: "ask", type: "multi", q: "When and how do you ask for referrals?", options: ["After a big win", "At the end of working together", "In an email sequence", "In the community", "I don't ask yet"] },
    { id: "thank", type: "text", q: "How do you thank people who refer?" },
    { id: "tracking", type: "choice", q: "How do you track who referred whom?", options: ["In my CRM", "A spreadsheet", "Unique links or codes", "I don't track it"] },
    { id: "blocker", type: "textarea", q: "What keeps you from getting more referrals?" },
  ],
};

export type DeeperAnswers = Record<string, string | string[]>;

// Keeps only answers to this pillar's questions, in the right shape.
export function cleanAnswers(pillarKey: string, raw: unknown): DeeperAnswers {
  const qs = DEEPER_QUESTIONS[pillarKey] ?? [];
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: DeeperAnswers = {};
  for (const q of qs) {
    const v = src[q.id];
    if (q.type === "multi") {
      if (Array.isArray(v)) {
        const picked = v.filter((x): x is string => typeof x === "string" && q.options.includes(x));
        if (picked.length) out[q.id] = picked;
      }
    } else if (q.type === "choice") {
      if (typeof v === "string" && q.options.includes(v)) out[q.id] = v;
    } else if (typeof v === "string" && v.trim()) {
      out[q.id] = v.trim().slice(0, q.type === "textarea" ? 3000 : 300);
    }
  }
  return out;
}

export function answeredCount(pillarKey: string, answers: DeeperAnswers | null | undefined) {
  const qs = DEEPER_QUESTIONS[pillarKey] ?? [];
  return { answered: qs.filter((q) => answers && answers[q.id] !== undefined).length, total: qs.length };
}

// Plain-text summary of a pillar's answers, for the AI.
export function answersText(pillarKey: string, answers: DeeperAnswers | null | undefined) {
  if (!answers) return "";
  return (DEEPER_QUESTIONS[pillarKey] ?? [])
    .filter((q) => answers[q.id] !== undefined)
    .map((q) => `${q.q} ${Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).join(", ") : answers[q.id]}`)
    .join(" | ");
}

// ---- Scoring the "Go deeper" answers -----------------------------------------------------------
// Each choice answer carries a 0-100 value (best practice scores highest), listed in the same order as
// the question's options. null = a fact about the business, not a quality, so it isn't scored.
// Open-text answers are not scored (they inform the AI insights only).
const CHOICE_SCORES: Record<string, Record<string, (number | null)[]>> = {
  acquisition: {
    leads_per_month: [20, 40, 60, 80, 100, 30],
    lead_to_client: [20, 40, 60, 80, 100, 30],
  },
  "sales-journey": {
    discovery_call: [100, 60, 40],
    close_rate: [20, 40, 70, 100, 30],
    cycle: [100, 90, 70, 50, 30],
    follow_up: [100, 50, 20],
  },
  onboarding: {
    welcome: [100, 60, 70, 20],
    time_to_start: [100, 90, 70, 40, 30],
  },
  support: {
    response_time: [100, 80, 50, 30],
    who: [40, 60, 80, 80],
  },
  communication: {
    cadence: [100, 70, 45, 25],
    list: [100, 80, 60, 30, 20],
    progress: [100, 60, 25],
  },
  fulfillment: {
    templates: [100, 70, 40, 20],
    results: [100, 75, 60, 25],
  },
  "internal-culture": {
    team_size: [null, null, null, null, null],
    sops: [100, 80, 50, 20],
    rhythm: [100, 70, 50, 30],
    delegation: [100, 70, 45, 20],
  },
  referral: {
    program: [100, 60, 45, 20],
    share: [100, 80, 60, 35, 30],
    tracking: [100, 70, 90, 20],
  },
};

// Multi-select answers score on breadth (one channel is fragile, three or more is resilient);
// choosing only a "none yet" option scores low.
const NONE_OPTIONS = new Set(["I don't ask yet"]);
function multiScore(picked: string[]): number {
  const real = picked.filter((x) => !NONE_OPTIONS.has(x));
  if (real.length === 0) return 20;
  return real.length === 1 ? 50 : real.length === 2 ? 75 : 100;
}

export interface DeeperScore {
  score: number | null; // 0-100, or null when nothing scoreable is answered yet
  scored: number; // answers that counted toward the score
  answered: number;
  total: number;
}

export function deeperScore(pillarKey: string, answers: DeeperAnswers | null | undefined): DeeperScore {
  const qs = DEEPER_QUESTIONS[pillarKey] ?? [];
  const { answered, total } = answeredCount(pillarKey, answers);
  const vals: number[] = [];
  for (const q of qs) {
    const a = answers?.[q.id];
    if (a === undefined) continue;
    if (q.type === "choice" && typeof a === "string") {
      const table = CHOICE_SCORES[pillarKey]?.[q.id];
      const v = table ? table[q.options.indexOf(a)] : undefined;
      if (typeof v === "number") vals.push(v);
    } else if (q.type === "multi" && Array.isArray(a) && CHOICE_SCORES[pillarKey] !== undefined) {
      // Only the "channels" style questions are scored on breadth.
      if (q.id === "channels" || q.id === "ask") vals.push(multiScore(a));
    }
  }
  return { score: vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length) : null, scored: vals.length, answered, total };
}
