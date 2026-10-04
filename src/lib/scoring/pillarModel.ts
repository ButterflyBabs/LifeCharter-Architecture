/**
 * The Operational Pillar Model: how the 8 operational pillars are scored.
 *
 * A pillar is never set by hand. Each one is scored 0-100 from the same kinds of input as the 12
 * dimensions (Profit, Brain, Soul, Quick Pulse, live data from the Suite, plan completeness) picked
 * for that pillar, plus the pillar's own "Go deeper" questions. A source with no data yet drops out
 * and its weight moves to the sources that have data, exactly like the dimensions. The Operations
 * dimension uses the average of the scored pillars as one of its inputs.
 */
import type { DimensionKey } from "./dimensionModel";
import { OPERATIONS_PILLARS } from "@/lib/operations";
import { deeperScore, type DeeperAnswers } from "@/lib/operationsDeeper";
import { phaseFor, type Phase } from "./phase";
import type { ScoringInputs } from "./computeScores";
import {
  acquisitionOps,
  salesJourneyOps,
  sopCoverage,
  communicationOps,
  cultureOps,
  referralOps,
} from "./operational";

type Kind = "profit" | "brain" | "soul" | "pulse" | "operational" | "business_plan" | "deeper";

interface PillarSource {
  kind: Kind;
  label: string; // plain-language name shown to the client
  weight: number;
  profitDomains?: string[];
  aiDimension?: DimensionKey; // cached AI score of the matching dimension's Brain or Soul answers
  pulseLabels?: string[];
  invert?: boolean;
  planType?: "business" | "marketing" | "sales" | "forecasting";
  ops?: (m: Record<string, number>) => number | null;
}

const P = (label: string, weight: number, profitDomains: string[]): PillarSource => ({ kind: "profit", label, weight, profitDomains });
const B = (weight: number, aiDimension: DimensionKey): PillarSource => ({ kind: "brain", label: "Brain assessment answers", weight, aiDimension });
const Q = (weight: number, pulseLabels: string[], invert = false): PillarSource => ({ kind: "pulse", label: "Quick Pulse check-in", weight, pulseLabels, invert });
const D = (weight: number): PillarSource => ({ kind: "deeper", label: "Your Go deeper answers", weight });
const L = (label: string, weight: number, ops: PillarSource["ops"]): PillarSource => ({ kind: "operational", label, weight, ops });

export const PILLAR_MODEL: Record<string, PillarSource[]> = {
  acquisition: [
    P("Profit assessment: Marketing", 25, ["marketing"]),
    B(15, "marketing"),
    Q(10, ["Marketing Effectiveness"]),
    { kind: "business_plan", label: "Marketing Plan completeness", weight: 10, planType: "marketing" },
    L("New leads and contacts (last 30 days)", 15, acquisitionOps),
    D(25),
  ],
  "sales-journey": [
    P("Profit assessment: Sales", 25, ["sales"]),
    B(15, "sales"),
    Q(10, ["Sales Confidence", "Pricing Power"]),
    { kind: "business_plan", label: "Sales Plan completeness", weight: 10, planType: "sales" },
    L("Win rate and pipeline follow-through", 15, salesJourneyOps),
    D(25),
  ],
  onboarding: [
    P("Profit assessment: Client", 25, ["client"]),
    B(20, "customer_experience"),
    Q(10, ["Client Quality"]),
    L("Onboarding SOP written", 15, (m) => sopCoverage(m, "onboarding")),
    D(30),
  ],
  support: [
    P("Profit assessment: Client", 25, ["client"]),
    B(15, "customer_experience"),
    Q(10, ["Client Quality"]),
    L("Support SOP written", 15, (m) => sopCoverage(m, "support")),
    D(35),
  ],
  communication: [
    P("Profit assessment: Client", 20, ["client"]),
    B(15, "customer_experience"),
    { kind: "soul", label: "Soul assessment: voice and communication", weight: 10, aiDimension: "customer_experience" },
    Q(10, ["Client Quality"]),
    L("Email sequences running and Communication SOP", 10, communicationOps),
    D(35),
  ],
  fulfillment: [
    P("Profit assessment: Product and Operations", 30, ["product", "operations"]),
    B(15, "product"),
    Q(10, ["Systems Clarity", "Operational Stress"]),
    L("Fulfillment SOP written", 15, (m) => sopCoverage(m, "fulfillment")),
    D(30),
  ],
  "internal-culture": [
    P("Profit assessment: Team and Systems", 25, ["team", "systems"]),
    B(20, "team"),
    Q(10, ["Team Capacity"]),
    L("SOPs written, reviews done, routines set", 15, cultureOps),
    D(30),
  ],
  referral: [
    P("Profit assessment: Client", 15, ["client"]),
    B(10, "customer_experience"),
    Q(10, ["Client Quality"]),
    L("Affiliates, referred contacts, testimonials", 20, referralOps),
    D(45),
  ],
};

export interface PillarSourceResult {
  kind: Kind;
  label: string;
  weightPct: number; // effective share of this pillar's score, 0-100
  subScore: number | null;
  note?: string;
}

export interface PillarResult {
  key: string;
  name: string;
  description: string;
  score: number | null;
  phase: Phase | null;
  partial: boolean;
  sources: PillarSourceResult[];
  deeper: { answered: number; total: number };
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function subScore(src: PillarSource, inputs: ScoringInputs, answers: DeeperAnswers | undefined, key: string): { v: number | null; note?: string } {
  switch (src.kind) {
    case "profit": {
      const v = mean((src.profitDomains ?? []).map((d) => inputs.profitDomains[d]?.score).filter((x): x is number => typeof x === "number"));
      return { v, note: v === null ? "Profit assessment not answered yet" : undefined };
    }
    case "brain":
    case "soul": {
      const ai = src.aiDimension ? inputs.aiScores?.[`${src.aiDimension}:${src.kind}`] : undefined;
      return { v: ai ? ai.score : null, note: ai ? undefined : "AI scoring pending" };
    }
    case "pulse": {
      const rows = inputs.pulse.filter((p) => (src.pulseLabels ?? []).includes(p.label));
      const v = mean(rows.map((r) => (src.invert ? 100 - r.score : r.score)));
      return { v, note: v === null ? "No Quick Pulse check-in yet" : undefined };
    }
    case "business_plan": {
      const v = inputs.planCompleteness?.[src.planType ?? "business"] ?? null;
      return { v, note: v === null ? "Plan not started" : undefined };
    }
    case "operational": {
      const v = inputs.operational && src.ops ? src.ops(inputs.operational) : null;
      return { v, note: v === null ? "No activity in the Suite to measure yet" : undefined };
    }
    case "deeper": {
      const d = deeperScore(key, answers);
      return { v: d.score, note: d.score === null ? "Answer the Go deeper questions" : undefined };
    }
  }
}

export function computePillarScores(inputs: ScoringInputs, answersByPillar: Record<string, DeeperAnswers | undefined>): PillarResult[] {
  return OPERATIONS_PILLARS.map((def) => {
    const sources = PILLAR_MODEL[def.key] ?? [];
    const raw = sources.map((s) => ({ s, ...subScore(s, inputs, answersByPillar[def.key], def.key) }));
    const present = raw.filter((r) => r.v !== null);
    const presentWeight = present.reduce((a, r) => a + r.s.weight, 0);
    const nominal = sources.reduce((a, s) => a + s.weight, 0);
    const score = present.length && presentWeight > 0 ? Math.round(present.reduce((a, r) => a + (r.s.weight / presentWeight) * (r.v as number), 0)) : null;
    const answers = answersByPillar[def.key];
    return {
      key: def.key,
      name: def.name,
      description: def.description,
      score,
      phase: score === null ? null : phaseFor(score),
      partial: present.length > 0 && presentWeight < nominal,
      sources: raw.map((r) => ({
        kind: r.s.kind,
        label: r.s.label,
        weightPct: r.v !== null && presentWeight > 0 ? Math.round((r.s.weight / presentWeight) * 100) : 0,
        subScore: r.v === null ? null : Math.round(r.v),
        note: r.note,
      })),
      deeper: (() => {
        const d = deeperScore(def.key, answers);
        return { answered: d.answered, total: d.total };
      })(),
    };
  });
}

export function averagePillarScore(pillars: PillarResult[]): number | null {
  const v = pillars.map((p) => p.score).filter((x): x is number => x !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}
