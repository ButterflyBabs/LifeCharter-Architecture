// The Business Health Check: a free 25-question lead magnet at lccommandsuite.com/business-health-check.
//
// Six categories, four answers per question, each answer worth 0 to 3 points. The answers are written weakest to
// strongest, so the answer's position is its score. The results STAND ALONE (like the Mini Command Audit): they never feed
// a client's 12 business dimensions, and nothing here describes how the Command Suite is built or what it costs.
//
// The "advisor notes" and the action plan are written text chosen by the scores (no AI call, so a lead costs nothing to
// score and the same answers always give the same report). Pure, so the page, the API and the email all agree.

export type CategoryKey = "revenue" | "leads" | "operations" | "clients" | "team" | "owner";
export type Category = { key: CategoryKey; name: string; icon: string; blurb: string };
export type Question = { cat: CategoryKey; text: string; options: [string, string, string, string] };

export const CATEGORIES: Category[] = [
  { key: "revenue", name: "Revenue & Profit", icon: "💰", blurb: "How steady your income is, whether you know what each offer really earns, and the cash behind it." },
  { key: "leads", name: "Leads & Sales", icon: "📣", blurb: "Where new clients come from, how fast they hear back, and whether you can see what is working." },
  { key: "operations", name: "Operations & Systems", icon: "⚙️", blurb: "How much of the work is written down, connected and able to run without you in the middle of it." },
  { key: "clients", name: "Client Experience", icon: "⭐", blurb: "What it is like to be your client, what happens when it goes wrong, and what happens after." },
  { key: "team", name: "Team & Capacity", icon: "👥", blurb: "Who helps you, how they are brought on and held accountable, and how much more you can take on." },
  { key: "owner", name: "Founder Health", icon: "🧠", blurb: "Your hours, your energy, and how clear you are about where this is going." },
];

export const QUESTIONS: Question[] = [
  // Revenue & Profit
  { cat: "revenue", text: "How predictable is your income from one month to the next?", options: ["Not at all. Some months are full and some are empty", "There are big swings I can't always explain", "Mostly steady, with a surprise now and then", "I can forecast it and it rarely surprises me"] },
  { cat: "revenue", text: "Do you know what each of your offers actually earns you after your costs and your time?", options: ["No idea", "A rough feeling, but I have never worked it out", "I know it, but I don't look at it regularly", "I know it for every offer and review it on a schedule"] },
  { cat: "revenue", text: "When did you last raise your prices?", options: ["Never. I'm afraid of losing people", "Only when my costs forced me to", "Every year or two", "On a regular schedule, based on the value I deliver"] },
  { cat: "revenue", text: "How much of your income repeats without you having to sell it again (retainers, memberships, renewals)?", options: ["None of it", "A little, but I didn't build it on purpose", "A real share of it, and I'm growing that", "A strong base that carries me through slow months"] },
  { cat: "revenue", text: "How would you describe your cash position right now?", options: ["Stressful. I often worry about covering expenses", "Tight but manageable", "Fine, with a small cushion", "Healthy reserves and steady cash in"] },
  // Leads & Sales
  { cat: "leads", text: "Where do most of your new clients come from?", options: ["Word of mouth only. I don't actively market", "Referrals plus the occasional push", "A mix of referrals, content and some paid or outreach", "Several channels I run on purpose and can name"] },
  { cat: "leads", text: "When someone reaches out about working with you, how quickly do they hear back?", options: ["Whenever I get to it, sometimes days later", "Within a day", "Within a few hours", "Within minutes, with an automatic first reply"] },
  { cat: "leads", text: "Do you have a clear next step for someone who is interested (a call, an offer, a booking link)?", options: ["No. It depends on the day", "I have something, but it is hard to find or inconsistent", "Yes, though it isn't used every time", "Yes, one clear path everyone is taken down"] },
  { cat: "leads", text: "How consistently do you show up in front of your audience (email, content, speaking, events)?", options: ["Rarely. Only when I have something to promote", "In bursts, when I have time", "Regularly, but without a plan behind it", "On a set rhythm that follows a plan"] },
  { cat: "leads", text: "Do you know which of your efforts actually bring in paying clients?", options: ["No tracking at all", "A rough idea in my head", "A basic list or spreadsheet", "A system that shows where every client came from"] },
  // Operations & Systems
  { cat: "operations", text: "How much of the way you work is written down?", options: ["None of it. It is all in my head", "A few notes, nothing anyone else could follow", "My main processes are written, others are not", "Clear steps for every major part of the business"] },
  { cat: "operations", text: "Could the business run for a week without you?", options: ["It would fall apart", "It would struggle badly", "It would run, but not well", "It would run smoothly"] },
  { cat: "operations", text: "How do you handle booking, onboarding and invoicing?", options: ["By hand, and it is often chaotic", "By hand, but I keep it organized", "With software, but I still do a lot of it manually", "Mostly automatic, from sign-up to paid"] },
  { cat: "operations", text: "Do your tools work together?", options: ["I'm not sure what I'm even paying for", "Separate tools, and I copy information between them", "Some are connected, some are not", "They are connected and I know where everything lives"] },
  { cat: "operations", text: "Can you see, at a glance, who is in your pipeline and what happens next with each person?", options: ["No. It is scattered across inboxes and notes", "I keep track in my head", "I have a list, but it isn't kept up", "Yes, one place that is always current"] },
  // Client Experience
  { cat: "clients", text: "How do your clients describe working with you? Do you ask?", options: ["I don't ask, so I don't really know", "Mostly good, but I hear complaints now and then", "Consistently strong feedback", "Glowing, and I have the proof to show for it"] },
  { cat: "clients", text: "What happens when a client is unhappy or stops engaging?", options: ["I deal with it if and when it comes up", "I try to make it right, but there is no set approach", "A general approach that I don't always follow", "A clear process that turns problems into loyalty"] },
  { cat: "clients", text: "What do you do when a client finishes working with you?", options: ["Nothing. The work ends and so does the contact", "I check in if I remember", "I follow up, but not every time", "Every client gets a check-in, a request for feedback and a next step"] },
  { cat: "clients", text: "Do clients have somewhere to go next (a renewal, a deeper offer, a way to refer someone)?", options: ["No. It is one engagement and done", "I mention it now and then", "I have options, but I don't actively offer them", "A planned path that most clients are invited onto"] },
  // Team & Capacity
  { cat: "team", text: "Who works in the business besides you?", options: ["No one, and I am the bottleneck", "A little part-time help, and it is overwhelming", "A good team with a few gaps", "A strong team with clear roles"] },
  { cat: "team", text: "How do you bring new help on and get them up to speed?", options: ["I figure it out as I go", "A basic approach, very inconsistent", "A decent approach that could be much stronger", "A written process for hiring, training and onboarding"] },
  { cat: "team", text: "How do you keep work moving and accountable when other people are involved?", options: ["I avoid it until it becomes a problem", "I step in when something goes wrong", "I have conversations, but no regular structure", "Clear expectations, regular check-ins and an owner for every task"] },
  // Founder Health
  { cat: "owner", text: "How many hours a week do you usually work?", options: ["60 or more. I'm close to burnout", "50 to 60. It feels necessary, but it is too much", "40 to 50. Workable, though not ideal", "Under 40, and the business doesn't need me everywhere"] },
  { cat: "owner", text: "How clear are you on where the business will be in three years?", options: ["Not clear. I'm getting through today", "A vague idea, nothing written", "A general vision, not yet a plan", "A written plan with milestones"] },
  { cat: "owner", text: "How do you feel about your work on a typical Monday morning?", options: ["Dreading it. I'm exhausted", "Low, but I push through", "Mostly fine, with some hard weeks", "Energized about where this is headed"] },
];

export const QUESTION_COUNT = QUESTIONS.length; // 25
export const MAX_POINTS = 3;

/** How many questions are in each category, in the order of CATEGORIES. */
const COUNT = CATEGORIES.map((c) => QUESTIONS.filter((q) => q.cat === c.key).length);

export type Answers = Array<number | null>;

/** Accepts only an array of 25 whole numbers from 0 to 3. Returns null when anything is missing or out of range. */
export function cleanAnswers(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length !== QUESTION_COUNT) return null;
  const out: number[] = [];
  for (const v of raw) {
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > MAX_POINTS) return null;
    out.push(v);
  }
  return out;
}

export type Grade = { grade: "A" | "B" | "C" | "D" | "F"; label: string; sub: string; tone: "strong" | "good" | "watch" | "low" };
export function gradeFor(pct: number): Grade {
  if (pct >= 85) return { grade: "A", label: "Peak performance", tone: "strong", sub: "Your business is running at a high level. The work now is to fine-tune it and protect what you have built." };
  if (pct >= 70) return { grade: "B", label: "Strong foundation", tone: "good", sub: "Solid bones with real room to grow. A few targeted fixes will make an outsized difference to your income and your freedom." };
  if (pct >= 55) return { grade: "C", label: "Growing pains", tone: "watch", sub: "There is real potential here, but some key systems are missing or inconsistent. The gaps are costing you, and they can be closed." };
  if (pct >= 40) return { grade: "D", label: "Needs attention", tone: "low", sub: "Several parts of the business are under strain. The good news is that fixing the right one first creates momentum quickly." };
  return { grade: "F", label: "Critical zone", tone: "low", sub: "The business is in survival mode. A clear plan and quick action on the right priority can turn this around." };
}

export type Tier = { label: "Strong" | "Developing" | "Gap"; tone: "strong" | "watch" | "low" };
export const tierFor = (pct: number): Tier => (pct >= 75 ? { label: "Strong", tone: "strong" } : pct >= 50 ? { label: "Developing", tone: "watch" } : { label: "Gap", tone: "low" });

export type CategoryScore = { key: CategoryKey; name: string; icon: string; blurb: string; pct: number; tier: Tier };
export type Priority = { title: string; desc: string; tag: "high" | "quick" | "medium" };
export type HealthResult = {
  overall: number;
  grade: Grade;
  categories: CategoryScore[];
  /** The two lowest categories, lowest first. */
  gaps: CategoryScore[];
  strongest: CategoryScore;
  priorities: Priority[];
};

export function computeResult(answers: number[]): HealthResult {
  const sums = CATEGORIES.map(() => 0);
  answers.forEach((a, i) => {
    sums[CATEGORIES.findIndex((c) => c.key === QUESTIONS[i].cat)] += a;
  });
  const categories: CategoryScore[] = CATEGORIES.map((c, i) => {
    const pct = Math.round((sums[i] / (COUNT[i] * MAX_POINTS)) * 100);
    return { ...c, pct, tier: tierFor(pct) };
  });
  const overall = Math.round((answers.reduce((s, a) => s + a, 0) / (QUESTION_COUNT * MAX_POINTS)) * 100);
  // Ties go to the category listed first, so the same answers always give the same report.
  const ranked = categories.map((c, i) => ({ c, i })).sort((a, b) => a.c.pct - b.c.pct || a.i - b.i).map((x) => x.c);
  const strongest = categories.map((c, i) => ({ c, i })).sort((a, b) => b.c.pct - a.c.pct || a.i - b.i)[0].c;
  return { overall, grade: gradeFor(overall), categories, gaps: ranked.slice(0, 2), strongest, priorities: buildPriorities(answers, ranked) };
}

// ── The written advice, one paragraph per category and tier (gap, developing, strong) ──
const ADVICE: Record<CategoryKey, [string, string, string]> = {
  revenue: [
    "Your income is unpredictable and you can't yet see what each offer really earns, so some of what you sell may be costing you more than it pays. Start small: work out the real margin on your last ten sales, counting your own time. Then check whether your prices cover your costs, your time and a profit.",
    "Your revenue works, but it is fragile. Two things would steady it: prices you trust, and a repeating part of your income, even a modest one. Income that renews without being resold takes a great deal of pressure off every slow month.",
    "Your revenue foundation is solid. The growth lever from here is the part of your income that repeats. A retainer, membership or renewal path turns good months into a base you can plan around.",
  ],
  leads: [
    "Lead generation is the most urgent place to look. If nearly all your clients arrive by referral, your income depends on other people remembering to talk about you. Choose one channel you will run on purpose, and give every inquiry a clear next step and a fast reply.",
    "Your marketing is working, but it leaks. People who are interested drift away when the reply is slow or the next step is unclear. Tighten the path from first message to first conversation before you spend more on getting attention.",
    "Your lead generation is strong. The next level is knowing which efforts close the most clients, not only which bring the most inquiries, and doubling down on those.",
  ],
  operations: [
    "Your operations depend on you being in the room. That is the single biggest ceiling on growth, because you can't scale what only you can run. This week, write down the three things you do most often. Then hand one of them off, imperfectly, within 30 days.",
    "Your operations work, but inconsistently, because the process lives in people's heads. The fix isn't complicated: checklists and written steps. A business that runs the same way whether or not its owner is present is worth far more, and is far calmer to run.",
    "Your operations are a real asset. Look next at the manual steps that remain, especially booking, onboarding, invoicing and follow-up. Every one you automate is a delay and a mistake removed.",
  ],
  clients: [
    "Client experience is a blind spot. You have no steady way to learn how clients feel, handle a problem, or invite them to what comes next. Start with the simplest piece: ask each finishing client for feedback and for a short testimonial while the result is fresh.",
    "Client experience is decent, but it is not yet a system. You get good feedback and don't capture it. Build a simple sequence for the end of an engagement: a thank-you, a request for feedback, and an invitation to a next step.",
    "Client experience is a genuine strength. Now turn it into growth: a renewal, a deeper offer and a simple way for happy clients to refer someone. Your satisfied clients are your best advocates.",
  ],
  team: [
    "Your capacity is limited by how much help you have. Every hour on admin, scheduling or follow-up is an hour you aren't earning. Decide which recurring task you would hand over first and write down what a good result looks like.",
    "Your team has potential and needs structure. Without clear roles and a way to bring people on, adding help adds confusion instead of capacity. Write one page per role: what it owns and how you will know it is going well.",
    "Your team is in good shape. Focus on keeping the people you have and on giving someone else the authority to decide without you.",
  ],
  owner: [
    "Your own health as the leader is at risk. At these hours, with no clear picture of where you are headed, you are running the business in crisis mode instead of growth mode. Block two hours this week and write down what you want the business and your life to look like in three years.",
    "You are working harder than where you want to go should require. More hours is not the path. Better systems are. For one week, note where your time goes, and you will see which hours something else could carry.",
    "Your clarity and energy are an asset. The work now is to protect them by building a business that grows without requiring you everywhere.",
  ],
};

const tierIndex = (pct: number) => (pct < 50 ? 0 : pct < 75 ? 1 : 2);
export const adviceFor = (c: CategoryScore) => ADVICE[c.key][tierIndex(c.pct)];

/** The extra, answer-specific observations (only when the answer was one of the two weakest). */
export function insightsFor(answers: number[]): string[] {
  const out: string[] = [];
  if (answers[6] <= 1) out.push("**Slow replies are costing you clients.** When someone reaches out and waits, they usually move on to whoever answers first. An automatic first reply, plus a promise you can keep about when they will hear from you, fixes this within a day.");
  if (answers[11] <= 1) out.push("**The business stops when you stop.** Until it can run for a week without you, you hold a job with overhead rather than a business you own. That is fixable, and it starts with writing things down.");
  if (answers[22] <= 1) out.push("**Long weeks are not a growth plan.** They are a slow burn. The answer isn't more discipline. It is systems and help that take on the workload.");
  return out;
}

const TAG_RANK: Record<Priority["tag"], number> = { high: 0, quick: 1, medium: 2 };
const BY_CATEGORY: Record<CategoryKey, Priority> = {
  revenue: { title: "Find out what each offer really earns", desc: "Take your last ten sales and work out the real margin: what came in, minus your costs and your own time. If an offer doesn't clear a healthy profit, fix its price before you add more volume.", tag: "high" },
  leads: { title: "Give every inquiry a fast reply and a clear next step", desc: "Choose one booking link or call-to-action, and set an automatic first reply so no one waits. Then check what happened to your last ten inquiries.", tag: "high" },
  operations: { title: "Write down your three most repeated processes", desc: "Describe, step by step, how your three most common pieces of work get done, from first contact to final invoice. Give them to someone else. If they can't follow it, add detail.", tag: "medium" },
  clients: { title: "Ask your last ten clients for feedback and a testimonial", desc: "Send a personal message to each, asking what changed for them and whether you may share it. It is quick, it builds proof, and it shows you what to improve.", tag: "quick" },
  team: { title: "Pick the first task to hand off", desc: "Write a one-page description of the recurring task that costs you the most time, including what good looks like. Then find the person, or the tool, to take it.", tag: "medium" },
  owner: { title: "Write your three-year picture this week", desc: "Block 90 minutes. Write what your income, your hours and your team look like in three years. With it, each decision has a direction. Without it, each one is a reaction.", tag: "medium" },
};

function buildPriorities(answers: number[], ranked: CategoryScore[]): Priority[] {
  const items: Priority[] = [];
  if (answers[6] <= 1) items.push({ title: "Promise a reply time and set an automatic first reply", desc: "A fast first answer is the cheapest improvement you can make. Decide the longest anyone should wait to hear from you, and make it automatic.", tag: "high" });
  if (answers[17] <= 1) items.push({ title: "Follow up with your last ten finished clients", desc: "A short, personal message asking how things went and what they would do next. Some will say yes to more, and some will refer someone.", tag: "quick" });
  if (answers[11] <= 1) items.push({ title: "Pick one task to delegate this week", desc: "Choose a recurring job that takes you more than an hour a week. Write down the steps, and hand it over.", tag: "medium" });
  if (answers[23] <= 1) items.push({ title: "Decide where the business is going", desc: "Without a destination, every week is reaction. Write down what you want in three years, then the one thing to do in the next 90 days.", tag: "medium" });
  for (const c of ranked) {
    if (items.length >= 5) break;
    const p = BY_CATEGORY[c.key];
    // The reply-time quick win already covers the Leads & Sales item, so don't list the same fix twice.
    if (c.key === "leads" && answers[6] <= 1) continue;
    if (!items.some((x) => x.title === p.title)) items.push(p);
  }
  // High impact first, then quick wins, then the longer work; the order they were found in breaks ties.
  return items.map((p, i) => ({ p, i })).sort((a, b) => TAG_RANK[a.p.tag] - TAG_RANK[b.p.tag] || a.i - b.i).map((x) => x.p).slice(0, 5);
}

export const TAG_LABEL: Record<Priority["tag"], string> = { high: "High impact", quick: "Quick win", medium: "Medium term" };
