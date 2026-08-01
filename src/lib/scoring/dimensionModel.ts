/**
 * The Dimension Model — single source of truth for how assessment answers
 * become 12-dimension business-health scores.
 *
 * Encodes the decisions in docs/scoring-decisions.md and the mapping in
 * docs/dimension-map-draft.md. The compute engine (computeScores.ts) reads
 * this; nothing else should hardcode weights or source mappings.
 */

// The twelve dimensions, keyed exactly as the dashboard / segment_dimensions use.
export const DIMENSION_KEYS = [
  "marketing",
  "sales",
  "operations",
  "finance",
  "team",
  "systems",
  "leadership",
  "vision",
  "product",
  "customer_experience",
  "legal",
  "sustainability",
] as const;

export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export const DIMENSION_LABEL: Record<DimensionKey, string> = {
  marketing: "Marketing",
  sales: "Sales",
  operations: "Operations",
  finance: "Finance",
  team: "Team",
  systems: "Systems",
  leadership: "Leadership",
  vision: "Vision",
  product: "Product",
  customer_experience: "Client Experience",
  legal: "Legal",
  sustainability: "Sustainability",
};

// A source contributes a 0-100 sub-score to a dimension, at a given weight.
// `method` tells the engine how to turn raw answers into that 0-100.
export type ScoreMethod =
  | "scale" // Likert / radio answers with numeric scores → arithmetic mean
  | "ai" // open-ended prose → scored by the LLM layer (Phase 2)
  | "formula" // computed from operational metrics
  | "completeness"; // % of a documented artifact filled in

export type SourceKind = "profit" | "brain" | "soul" | "pulse" | "operational" | "business_plan";

export interface DimensionSource {
  kind: SourceKind;
  method: ScoreMethod;
  weight: number; // relative weight within the dimension (need not sum to 100)
  /**
   * Which raw inputs feed this source:
   * - profit:      the Profit domain id (matches assessment `domain`)
   * - brain:       Brain section names (match assessment `section`)
   * - soul:        Soul section names (match assessment `section`)
   * - pulse:       Quick Pulse dimensionLabels (match check-in items)
   * - operational: metric keys understood by the formula layer
   */
  profitDomain?: string;
  brainSections?: string[];
  soulSections?: string[];
  pulseLabels?: string[];
  operationalMetrics?: string[];
  invert?: boolean; // e.g. "Operational Stress" — high answer = low health
  /** Soul only: sensitivity tier gate for this source. */
  soulTier?: "scoreable" | "private"; // flagged-sensitive answers always excluded upstream
}

export interface DimensionDefinition {
  key: DimensionKey;
  label: string;
  /** Freshness windows in days, per the staleness default. */
  staleDays: { assessment: number; pulse: number };
  sources: DimensionSource[];
}

// Likert 1-5 → 0-100 as authored in the Profit assessment.
export const LIKERT_TO_SCORE: Record<string, number> = {
  "1": 20,
  "2": 40,
  "3": 60,
  "4": 80,
  "5": 100,
};

const STALE = { assessment: 90, pulse: 14 };

/**
 * The full model. Weights are AmiLynne's accepted draft. Where a source is `ai`
 * (Soul prose, open Brain), it contributes nothing in Phase 1 and its weight
 * redistributes across sources that have data.
 */
export const DIMENSION_MODEL: DimensionDefinition[] = [
  {
    key: "marketing",
    label: "Marketing",
    staleDays: STALE,
    sources: [
      { kind: "profit", method: "scale", weight: 40, profitDomain: "marketing" },
      {
        kind: "brain",
        method: "ai",
        weight: 35,
        brainSections: [
          "8. Marketing System",
          "6. Messaging, Positioning, and Brand Intelligence",
          "4. Ideal Clients and Market",
        ],
      },
      { kind: "pulse", method: "scale", weight: 25, pulseLabels: ["Marketing Effectiveness"] },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    staleDays: STALE,
    sources: [
      { kind: "profit", method: "scale", weight: 35, profitDomain: "sales" },
      { kind: "brain", method: "ai", weight: 25, brainSections: ["7. Sales System"] },
      {
        kind: "operational",
        method: "formula",
        weight: 20,
        operationalMetrics: ["leads", "conversion_rate"],
      },
      {
        kind: "pulse",
        method: "scale",
        weight: 20,
        pulseLabels: ["Sales Confidence", "Pricing Power"],
      },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    staleDays: STALE,
    sources: [
      { kind: "profit", method: "scale", weight: 40, profitDomain: "operations" },
      {
        kind: "brain",
        method: "ai",
        weight: 35,
        brainSections: ["10. Operations and Internal Systems"],
      },
      { kind: "pulse", method: "scale", weight: 25, pulseLabels: ["Operational Stress"], invert: true },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    staleDays: STALE,
    sources: [
      {
        kind: "operational",
        method: "formula",
        weight: 50,
        operationalMetrics: ["revenue", "revenue_goal", "expenses", "cash_in_bank"],
      },
      { kind: "profit", method: "scale", weight: 30, profitDomain: "finance" },
      {
        kind: "pulse",
        method: "scale",
        weight: 20,
        pulseLabels: ["Financial Visibility", "Revenue Stability"],
      },
    ],
  },
  {
    key: "team",
    label: "Team",
    staleDays: STALE,
    sources: [
      { kind: "profit", method: "scale", weight: 45, profitDomain: "team" },
      { kind: "brain", method: "ai", weight: 35, brainSections: ["11. Team and Roles"] },
      { kind: "pulse", method: "scale", weight: 20, pulseLabels: ["Team Capacity"] },
    ],
  },
  {
    key: "systems",
    label: "Systems",
    staleDays: STALE,
    sources: [
      {
        kind: "operational",
        method: "formula",
        weight: 45,
        operationalMetrics: ["hours_worked", "target_hours", "sops_created", "delegated_tasks"],
      },
      {
        kind: "brain",
        method: "ai",
        weight: 30,
        brainSections: ["12. Tech Stack and Access Map", "10. Operations and Internal Systems"],
      },
      { kind: "pulse", method: "scale", weight: 25, pulseLabels: ["Systems Clarity"] },
    ],
  },
  {
    key: "leadership",
    label: "Leadership",
    staleDays: STALE,
    sources: [
      {
        kind: "soul",
        method: "ai",
        weight: 50,
        soulSections: ["Values and Standards", "Emotional Texture and Presence"],
        soulTier: "private",
      },
      {
        kind: "brain",
        method: "ai",
        weight: 25,
        brainSections: ["3. Vision, Strategy, and Priorities"],
      },
      {
        kind: "pulse",
        method: "scale",
        weight: 25,
        pulseLabels: ["Decision Making", "Shadow Work", "Values Alignment"],
      },
    ],
  },
  {
    key: "vision",
    label: "Vision",
    staleDays: STALE,
    sources: [
      {
        kind: "soul",
        method: "ai",
        weight: 50,
        soulSections: ["Calling, Purpose, and Sacred Why", "Core Identity"],
        soulTier: "scoreable",
      },
      { kind: "profit", method: "scale", weight: 20, profitDomain: "vision" },
      {
        kind: "pulse",
        method: "scale",
        weight: 20,
        pulseLabels: ["Mission Connection", "Growth Trajectory"],
      },
      { kind: "business_plan", method: "completeness", weight: 10 },
    ],
  },
  {
    key: "product",
    label: "Product",
    staleDays: STALE,
    sources: [
      { kind: "profit", method: "scale", weight: 50, profitDomain: "product" },
      {
        kind: "brain",
        method: "ai",
        weight: 50,
        brainSections: ["5. Offers, Products, and Services"],
      },
    ],
  },
  {
    key: "customer_experience",
    label: "Client Experience",
    staleDays: STALE,
    sources: [
      { kind: "profit", method: "scale", weight: 40, profitDomain: "client" },
      {
        kind: "brain",
        method: "ai",
        weight: 30,
        brainSections: ["9. Customer Journey and Client Experience"],
      },
      {
        kind: "soul",
        method: "ai",
        weight: 15,
        soulSections: ["Client Transformation", "Voice and Communication Style"],
        soulTier: "scoreable",
      },
      { kind: "pulse", method: "scale", weight: 15, pulseLabels: ["Client Quality"] },
    ],
  },
  {
    key: "legal",
    label: "Legal",
    staleDays: STALE,
    sources: [{ kind: "profit", method: "scale", weight: 100, profitDomain: "legal" }],
  },
  {
    key: "sustainability",
    label: "Sustainability",
    staleDays: STALE,
    sources: [
      {
        kind: "soul",
        method: "ai",
        weight: 40,
        soulSections: ["Beliefs and Worldview", "Story Library"],
        soulTier: "scoreable",
      },
      { kind: "profit", method: "scale", weight: 35, profitDomain: "sustainability" },
      {
        kind: "pulse",
        method: "scale",
        weight: 25,
        pulseLabels: ["Energy Levels", "Inner Peace", "Joy & Fulfillment"],
      },
    ],
  },
];

export function getDimension(key: DimensionKey): DimensionDefinition {
  const d = DIMENSION_MODEL.find((x) => x.key === key);
  if (!d) throw new Error(`Unknown dimension: ${key}`);
  return d;
}

// Maps a Profit assessment `domain` id onto a dashboard dimension key.
export const PROFIT_DOMAIN_TO_DIMENSION: Record<string, DimensionKey> = {
  marketing: "marketing",
  sales: "sales",
  operations: "operations",
  finance: "finance",
  team: "team",
  systems: "systems",
  leadership: "leadership",
  vision: "vision",
  product: "product",
  client: "customer_experience",
  legal: "legal",
  sustainability: "sustainability",
};
