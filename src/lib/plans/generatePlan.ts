import OpenAI from "openai";
import { openaiKey, ProseAnswer } from "@/lib/scoring/aiScore";
import { DIMENSION_LABEL, DimensionKey } from "@/lib/scoring/dimensionModel";

/**
 * Generates a living Business / Marketing / Sales plan for a client from their
 * own assessment evidence: the 12-dimension scores (where they're strong / weak)
 * plus the reflective + operational answers they gave. Output is a narrative
 * summary and a set of concrete, dimension-tied goals with measurable targets —
 * the checkable commitments a later check-in scores progress against.
 *
 * Sensitivity: callers MUST pass only non-flagged answers. The model is told to
 * describe themes, never quote answers verbatim.
 */

export type PlanType = "business" | "marketing" | "sales";

export interface GeneratedGoal {
  dimension_key: string | null;
  title: string;
  detail: string;
  target: string;
}
export interface GeneratedPlan {
  title: string;
  summary: string;
  goals: GeneratedGoal[];
}

// Which dimensions each plan is primarily responsible for. The generator is
// steered toward these, and goal dimension_keys are validated against them.
const PLAN_FOCUS: Record<PlanType, DimensionKey[]> = {
  business: [
    "vision", "leadership", "finance", "operations", "systems", "team",
    "sustainability", "product", "legal", "marketing", "sales", "customer_experience",
  ],
  marketing: ["marketing", "customer_experience", "product", "vision", "sales"],
  sales: ["sales", "finance", "product", "customer_experience", "operations"],
};

const PLAN_BRIEF: Record<PlanType, string> = {
  business:
    "a holistic business plan: where the business is going, the few highest-leverage priorities across operations, finance, team, systems, and the founder's own sustainability, sequenced so the weakest dimensions get attention first.",
  marketing:
    "a marketing plan: positioning and message clarity, the ideal client, the channels and content rhythm, and a repeatable lead-generation system — concrete enough to act on this quarter.",
  sales:
    "a sales plan: the offer ladder and pricing, a predictable pipeline and qualification process, conversion, and follow-up — concrete enough to act on this quarter.",
};

// Map a model-supplied dimension name to one of the allowed dimension keys.
// The model often returns a label ("Team & Culture") or a near-key
// ("team_culture") instead of the exact key ("team"); normalize and match by
// key, then by dimension label, so goals reliably tie to a dimension.
function resolveDimension(raw: unknown, focus: DimensionKey[]): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase().replace(/[\s&/]+/g, "_");
  if (!s) return null;
  for (const k of focus) {
    if (s === k || s.startsWith(k) || s.includes(k)) return k;
  }
  for (const k of focus) {
    const lbl = (DIMENSION_LABEL as Record<string, string>)[k]?.toLowerCase();
    if (lbl && (s.includes(lbl.replace(/\s+/g, "_")) || lbl.includes(raw.trim().toLowerCase()))) {
      return k;
    }
  }
  return null;
}

export interface PlanInputs {
  planType: PlanType;
  scores: Array<{ key: string; label: string; score: number | null }>;
  answers: ProseAnswer[];
}

export async function generatePlan(inputs: PlanInputs, apiKey?: string): Promise<GeneratedPlan | null> {
  const key = apiKey || openaiKey();
  if (!key) return null;

  const focus = PLAN_FOCUS[inputs.planType];
  const focusLabels = focus.map((k) => `${k} (${DIMENSION_LABEL[k]})`).join(", ");

  // Only the focus dimensions' scores, sorted weakest-first so the model leads
  // with what needs the most work.
  const relevantScores = inputs.scores
    .filter((s) => focus.includes(s.key as DimensionKey) && s.score !== null)
    .sort((a, b) => (a.score as number) - (b.score as number));
  const scoreLines = relevantScores.length
    ? relevantScores.map((s) => `- ${s.label}: ${s.score}/100`).join("\n")
    : "(no dimension scores yet)";

  const evidence = inputs.answers.length
    ? inputs.answers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join("\n\n")
    : "(no open-ended answers available)";

  const openai = new OpenAI({ apiKey: key });

  const system = `You are a seasoned business coach writing ${PLAN_BRIEF[inputs.planType]}
You write FOR this specific founder, grounded ONLY in the evidence provided (their dimension scores and their own answers). Be specific and practical, never generic. Prioritize their weakest relevant dimensions.
Each goal must be concrete and checkable, with a measurable target a monthly/quarterly check-in could mark as progressing, met, or slipped.
Tie each goal to the most relevant dimension key from this set: ${focus.join(", ")}. Use null only for a goal that fits none.
Do NOT quote the founder's answers verbatim; describe themes.
Return STRICT JSON: {"title": string, "summary": string (<=600 chars, plain prose), "goals": [{"dimension_key": string|null, "title": string (<=90 chars), "detail": string (<=280 chars), "target": string (<=120 chars, measurable)}]}. Return 4 to 7 goals.`;

  const user = `Focus dimensions: ${focusLabels}

Dimension scores (weakest first):
${scoreLines}

Founder's assessment evidence:
${evidence}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // Same stability lever as scoring: 0 by default so identical inputs
      // produce the same plan; SCORING_TEMPERATURE overrides.
      temperature: Number(process.env.SCORING_TEMPERATURE ?? "0"),
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      title?: unknown;
      summary?: unknown;
      goals?: unknown;
    };

    const goals: GeneratedGoal[] = Array.isArray(parsed.goals)
      ? (parsed.goals as Array<Record<string, unknown>>)
          .map((g) => {
            const dk = resolveDimension(g.dimension_key, focus);
            const title = typeof g.title === "string" ? g.title.trim().slice(0, 120) : "";
            if (!title) return null;
            return {
              dimension_key: dk,
              title,
              detail: typeof g.detail === "string" ? g.detail.trim().slice(0, 400) : "",
              target: typeof g.target === "string" ? g.target.trim().slice(0, 160) : "",
            } as GeneratedGoal;
          })
          .filter((g): g is GeneratedGoal => g !== null)
      : [];

    if (goals.length === 0) return null;

    return {
      title: typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim().slice(0, 120)
        : `${inputs.planType[0].toUpperCase()}${inputs.planType.slice(1)} Plan`,
      summary: typeof parsed.summary === "string" ? parsed.summary.trim().slice(0, 800) : "",
      goals,
    };
  } catch (e) {
    console.error(`generatePlan(${inputs.planType}):`, e);
    return null;
  }
}
