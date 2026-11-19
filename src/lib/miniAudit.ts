// The Mini Command Audit: the free lead magnet at lccommandsuite.com/mini-command-audit.
//
// 48 canonical questions in 12 phases (src/config/business-command-audit/v1/questions.json, wording never edited), scored
// 0 to 4. A lead answers a QUICK set first (two questions per phase, one Build Completion and one Operating Health) and may
// then go deeper with the other two. The results STAND ALONE: they never feed the Suite's own 12 business dimensions, and
// the Suite's own Command Audit (Brain, Soul and Profit assessments, rated 1 to 5) keeps its own name.
import bank from "@/config/business-command-audit/v1/questions.json";

export type Measure = "Build Completion" | "Operating Health";
export type Question = { key: string; phaseKey: string; order: number; text: string; measure: Measure; risk: boolean; quick: boolean };
export type Phase = { key: string; order: number; name: string; blurb: string; questions: Question[] };

export const SCALE: { score: number; label: string }[] = bank.scoringScale.options;
export const NOT_SURE = "not_sure";
export const NOT_APPLICABLE = "not_applicable";
/** A saved answer: 0 to 4, or one of the two unscored choices. */
export type Answer = number | typeof NOT_SURE | typeof NOT_APPLICABLE;
export type Answers = Record<string, Answer>;

// What each phase covers, in a line, taken from its own questions (shown under the phase's score).
const BLURB: Record<string, string> = {
  "founder-leadership": "Your role and priorities, your values turned into practice, your leadership rhythm, and how your own capacity is protected.",
  "vision-strategy": "Where the business is going, the goals and 90-day priorities behind it, and how new opportunities are weighed against them.",
  "market-positioning": "Who your ideal client is, what they need, who else they could choose, and how clearly you stand apart.",
  "offers-pricing": "What each offer promises and includes, how it is priced, and whether everyone uses the current version.",
  "brand-messaging": "Your voice, promise and proof, and whether your message is used consistently everywhere your client meets you.",
  "sales-revenue": "Your pipeline, a repeatable sales process, the records behind it, and the numbers you watch.",
  "client-journey-delivery": "The journey from purchase to completion, who does what, and whether clients get what you promised.",
  "client-success-retention": "How you define client success, support progress and renewals, measure results and catch at-risk clients early.",
  "marketing-audience-growth": "Your audience and channels, a repeatable content system, and knowing what actually brings in leads.",
  "finance-legal-risk": "Your view of cash and profit, who handles money tasks, your contracts and protections, and the risks you track.",
  "operations-systems-technology": "Your documented workflows, tools that work together, protected systems, and how you measure operations.",
  "team-capacity": "Roles and ownership, workload and capacity, hiring and training, and dependence on any one person.",
};

type RawQ = { questionKey: string; displayOrder: number; text: string; primaryMeasure: string; riskEligible: boolean };
type RawPhase = { phaseKey: string; name: string; order: number; questions: RawQ[] };

export const PHASES: Phase[] = (bank.phases as RawPhase[])
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((p) => ({
    key: p.phaseKey,
    order: p.order,
    name: p.name,
    blurb: BLURB[p.phaseKey] ?? "",
    questions: p.questions
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((q) => ({
        key: q.questionKey,
        phaseKey: p.phaseKey,
        order: q.displayOrder,
        text: q.text,
        measure: q.primaryMeasure as Measure,
        risk: q.riskEligible,
        // The quick set: question 1 (is it defined?) and question 3 (is it practiced?) of every phase.
        quick: q.displayOrder === 1 || q.displayOrder === 3,
      })),
  }));

export const ALL_QUESTIONS: Question[] = PHASES.flatMap((p) => p.questions);
export const QUICK_QUESTIONS = ALL_QUESTIONS.filter((q) => q.quick);
export const DEEP_QUESTIONS = ALL_QUESTIONS.filter((q) => !q.quick);
const BY_KEY = new Map(ALL_QUESTIONS.map((q) => [q.key, q]));

// The profile questions asked first (not part of the audit's score): they tell Babs who she is talking to.
export const PROFILE_QUESTIONS = [
  { key: "stage", label: "Where is your business right now?", options: ["Still an idea", "Just launched (under 1 year)", "Growing (1 to 3 years)", "Established (3+ years)"] },
  { key: "revenue", label: "About how much does it bring in each year?", options: ["Not yet earning", "Under $50,000", "$50,000 to $150,000", "$150,000 to $500,000", "Over $500,000"] },
  { key: "team", label: "Who works in it with you?", options: ["Just me", "Me and contractors or part-time help", "A small team (2 to 5)", "A team of 6 or more"] },
] as const;
export type Profile = Record<string, string>;

export const cleanProfile = (raw: unknown): Profile => {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Profile = {};
  for (const q of PROFILE_QUESTIONS) {
    const v = typeof o[q.key] === "string" ? (o[q.key] as string) : "";
    if ((q.options as readonly string[]).includes(v)) out[q.key] = v;
  }
  return out;
};

/** Keeps only real question keys with a valid answer. */
export function cleanAnswers(raw: unknown, allowed: Question[] = ALL_QUESTIONS): Answers {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const ok = new Set(allowed.map((q) => q.key));
  const out: Answers = {};
  for (const [k, v] of Object.entries(o)) {
    if (!ok.has(k)) continue;
    if (v === NOT_SURE || v === NOT_APPLICABLE) out[k] = v;
    else if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 4) out[k] = v;
  }
  return out;
}

export const BANDS = bank.scoringRules.phaseOperatingHealth.bands as { minimum: number; maximum: number; label: string }[];
export type BandLabel = "At Risk" | "Needs Attention" | "Stable" | "Strong";
export function bandFor(avg: number | null): BandLabel | null {
  if (avg == null) return null;
  const b = BANDS.find((x) => avg >= x.minimum && avg <= x.maximum) ?? (avg > 4 ? BANDS[BANDS.length - 1] : BANDS[0]);
  return b.label as BandLabel;
}

export type PhaseResult = {
  key: string;
  name: string;
  order: number;
  blurb: string;
  /** Build Completion, 0 to 100 (average of the valid Build scores / 4 x 100), or null when nothing in that measure was scored. */
  build: number | null;
  /** Operating Health, 0 to 4 (average of the valid Health scores), or null. */
  health: number | null;
  band: BandLabel | null;
  /** The average of every valid score in the phase, used only to rank the phases. */
  overall: number | null;
  answered: number;
  total: number;
  /** A question the audit marks as a possible risk was answered 0 or 1. */
  risk: boolean;
};
export type AuditResult = {
  phases: PhaseResult[];
  /** The two lowest-scoring phases (the place to start), lowest first. Empty when fewer than two phases could be scored. */
  start: PhaseResult[];
  /** The two highest-scoring phases. */
  strong: PhaseResult[];
  /** "quick" = 2 questions a phase, "full" = all 4. */
  depth: "quick" | "full";
  scored: number;
  unsure: number;
  skipped: number;
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10);

/** The file's own rules: Not Sure and Not Applicable are left out of the average, and a measure with no valid score is "not assessed". */
export function computeResult(answers: Answers, depth: "quick" | "full"): AuditResult {
  const asked = (depth === "full" ? ALL_QUESTIONS : QUICK_QUESTIONS).map((q) => q.key);
  let scored = 0;
  let unsure = 0;
  let skipped = 0;
  const phases: PhaseResult[] = PHASES.map((p) => {
    const qs = p.questions.filter((q) => asked.includes(q.key));
    const valid = (m: Measure) => qs.filter((q) => q.measure === m).map((q) => answers[q.key]).filter((v): v is number => typeof v === "number");
    const build = avg(valid("Build Completion"));
    const health = avg(valid("Operating Health"));
    const all = [...valid("Build Completion"), ...valid("Operating Health")];
    for (const q of qs) {
      const a = answers[q.key];
      if (typeof a === "number") scored++;
      else if (a === NOT_SURE) unsure++;
      else if (a === NOT_APPLICABLE) skipped++;
    }
    return {
      key: p.key,
      name: p.name,
      order: p.order,
      blurb: p.blurb,
      build: build == null ? null : Math.round((build / 4) * 100),
      health: round1(health),
      band: bandFor(health),
      overall: avg(all),
      answered: all.length,
      total: qs.length,
      risk: qs.some((q) => q.risk && typeof answers[q.key] === "number" && (answers[q.key] as number) <= 1),
    };
  });
  const ranked = phases.filter((p) => p.overall != null).sort((a, b) => (a.overall as number) - (b.overall as number) || (a.health ?? 0) - (b.health ?? 0) || a.order - b.order);
  return {
    phases,
    start: ranked.length >= 2 ? ranked.slice(0, 2) : [],
    strong: ranked.length >= 4 ? ranked.slice(-2).reverse() : [],
    depth,
    scored,
    unsure,
    skipped,
  };
}

export const isComplete = (answers: Answers, depth: "quick" | "full") => (depth === "full" ? ALL_QUESTIONS : QUICK_QUESTIONS).every((q) => answers[q.key] !== undefined);
export const questionByKey = (k: string) => BY_KEY.get(k);
