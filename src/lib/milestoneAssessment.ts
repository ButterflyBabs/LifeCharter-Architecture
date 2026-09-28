// Milestone assessment: a few short questions about one of the 12 dimensions.
// The client's own assistant reads the answers alongside their live scores and
// activity, then proposes this quarter's milestones (quarter goals on the Goal
// Ladder). Browser-safe (no database access).

import { DIMENSION_KEYS, type DimensionKey } from "@/lib/scoring/dimensionModel";

export interface MilestoneQuestion {
  id: string;
  q: string;
  hint: string;
}

export interface ProposedMilestone {
  title: string;
  target: string;
  why: string;
  firstStep: string;
}

// The one question that is specific to each area.
const FOCUS: Record<DimensionKey, { q: string; hint: string }> = {
  marketing: { q: "Where do most of your new leads come from right now?", hint: "Referrals, social, a podcast, your list… name what's actually working." },
  sales: { q: "How do people usually go from interested to paying you?", hint: "A call, a checkout page, a proposal. Where do they drop off?" },
  operations: { q: "Which part of delivering your work takes the most of your time?", hint: "The thing you'd hand off or streamline first." },
  finance: { q: "What number about your money do you most want to change this quarter?", hint: "Revenue, profit, cash on hand, debt, pay yourself…" },
  team: { q: "Who helps you run the business today, and where do you need more help?", hint: "Contractors, staff, family, nobody yet." },
  systems: { q: "Which tool or process breaks down most often for you?", hint: "Where things slip through the cracks." },
  leadership: { q: "Where do you feel least sure as the leader of your business?", hint: "Decisions, delegation, confidence, time." },
  vision: { q: "Where do you want the business to be a year from now?", hint: "In your own words; rough is fine." },
  product: { q: "Which offer do you most want to grow or improve?", hint: "Name it, and what's not quite right about it yet." },
  customer_experience: { q: "What do clients say they love, and what do they ask for that you don't offer yet?", hint: "Feedback, reviews, the questions you get most." },
  legal: { q: "What legal or compliance piece have you been putting off?", hint: "Contracts, terms, trademarks, insurance, business structure." },
  sustainability: { q: "What would make this business feel sustainable for you?", hint: "Hours, energy, margins, boundaries." },
};

export function milestoneQuestions(dimension: DimensionKey, label: string): MilestoneQuestion[] {
  return [
    { id: "focus", ...FOCUS[dimension] },
    { id: "win", q: `What would a real win in ${label} look like by the end of this quarter?`, hint: "Be as concrete as you can: a number, a launch, a habit in place." },
    { id: "blocker", q: `What's getting in the way in ${label} right now?`, hint: "Time, money, clarity, skills, someone else's part." },
    { id: "capacity", q: `How much time can you realistically give ${label} each week this quarter?`, hint: "An honest guess keeps the milestones doable." },
  ];
}

export const isDimension = (v: unknown): v is DimensionKey => typeof v === "string" && (DIMENSION_KEYS as readonly string[]).includes(v);
