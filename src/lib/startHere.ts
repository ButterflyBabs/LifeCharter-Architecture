// The one-page "Getting Started" (Set up Suite + First 30 Days + Starter Guide + Welcome Overview + User Guide + Glossary
// together). Babs, 2026-11-04: existing clients (John, Franc) must not feel any change, so it applies only to accounts
// created on or after this moment, plus her own account so she can review it. Everyone else keeps today's menu and pages
// (their old addresses keep working either way). To bring an existing client over, add their plan id to START_HERE_PLAN_IDS.
export const START_HERE_FROM = "2026-11-05T07:00:00Z"; // midnight Mountain, Nov 5, 2026
export const START_HERE_PLAN_IDS: string[] = [];

export function startHereApplies(opts: { planId: string; createdAt: string | null; house: boolean; demo?: boolean }): boolean {
  if (opts.demo) return false; // the sales demo keeps its script: Getting Started > Set up Suite
  if (opts.house) return true;
  if (START_HERE_PLAN_IDS.includes(opts.planId)) return true;
  return Boolean(opts.createdAt && Date.parse(opts.createdAt) >= Date.parse(START_HERE_FROM));
}

// Menu items the one page replaces (they stay reachable by their addresses and from inside the page).
export const START_HERE_REPLACES = ["setup", "first30", "starter-guide", "welcome-overview", "glossary"];

export type SetupSteps = { ai: boolean; brain: boolean; soul: boolean; profit: boolean; tools: boolean };

// The 5 setup steps, in order, then the 20 later steps of the First 30 Days. The assessments count as done only when
// COMPLETE (the same rule as Set up Suite and the assessment lock), so a ticked step always means finished.
export interface StartStep { key: string; week: number; title: string; why?: string; time?: string; href: string; done: boolean; focus?: string }

export function combineSteps(first30: { key: string; week: number; title: string; why?: string; href: string; done: boolean; focus?: string }[], setup: SetupSteps): StartStep[] {
  const head: StartStep[] = [
    { key: "ai", week: 0, title: "Connect your AI", why: "Your own Claude or OpenAI key, about five minutes, so your assistant can draft, score and plan for you.", time: "About 5 minutes", href: "/settings?tab=ai", done: setup.ai },
    { key: "brain", week: 0, title: "Take the Brain assessment", why: "Maps your business systems in your own words.", time: "About 3 to 5 hours", href: "/assessments/brain", done: setup.brain },
    { key: "soul", week: 0, title: "Take the Soul assessment", why: "Your identity, values, calling and story: the heart your assistant writes from.", time: "About 2 to 3 hours", href: "/assessments/soul", done: setup.soul },
    { key: "profit", week: 0, title: "Take the Profit assessment", why: "Scores your 12 business dimensions and sets your baseline.", time: "About 1 to 2 hours", href: "/assessments/profit", done: setup.profit },
    { key: "tools", week: 0, title: "Connect your tools", why: "Your calendar and email, or PostStream, so the Suite can see your week.", time: "About 10 minutes", href: "/settings", done: setup.tools },
  ];
  const later = first30.filter((s) => s.week > 0).map((s) => ({ ...s }));
  return [...head, ...later];
}

export const WEEK_TITLES: Record<number, string> = {
  0: "Set up · Your first five steps",
  1: "Week 1 · Your foundation",
  2: "Week 2 · Money & rhythm",
  3: "Week 3 · Systems & plans",
  4: "Week 4 · Momentum",
};

// A week opens once the one before it is fully done.
export function weekLocked(steps: StartStep[], week: number): boolean {
  return week > 0 && steps.some((s) => s.week < week && !s.done);
}

export function nextStep(steps: StartStep[]): StartStep | null {
  const weeks = Array.from(new Set(steps.map((s) => s.week))).sort((a, b) => a - b);
  for (const w of weeks) {
    if (weekLocked(steps, w)) continue;
    const open = steps.filter((s) => s.week === w && !s.done).sort((a, b) => Number(!!b.focus) - Number(!!a.focus));
    if (open.length) return open[0];
  }
  return null;
}
