import OpenAI from "openai";
import { DimensionKey } from "./dimensionModel";

/**
 * AI scoring of open-ended (prose) assessment answers into a 0-100 sub-score
 * per dimension, with a short rationale. Used for the Soul-fed dimensions where
 * answers are narrative and can't be averaged arithmetically.
 *
 * Sensitivity: callers MUST pass only non-flagged answers. We additionally never
 * store or return verbatim quotes — only a score and a general rationale — so a
 * "private" tier source is honored the same as "scoreable".
 */

// Accept either casing of the env var (Vercel wouldn't allow uppercase for one
// user, so the key may be stored lowercase).
export function openaiKey(): string {
  return process.env.OPENAI_API_KEY || process.env.openai_api_key || "";
}
export function isAiConfigured(): boolean {
  return Boolean(openaiKey());
}

// Short scoring rubrics per dimension. Soul answers are reflective; Brain
// answers are operational — the same rubric applied to each answer set yields
// the appropriate sub-score for that source.
const RUBRIC: Partial<Record<DimensionKey, string>> = {
  vision:
    "Clarity of purpose and long-term direction; a coherent 'why'; evidence the founder knows where they are going and why it matters. Higher = clear, specific, energizing vision; lower = vague, absent, or conflicted.",
  leadership:
    "Self-awareness, values-driven decision-making, emotional steadiness, and standards. Higher = grounded, intentional, aware of patterns; lower = reactive, unclear standards, low self-awareness.",
  sustainability:
    "PERSONAL / energetic sustainability — capacity, energy, joy, and longevity in the work (NOT environmental). Higher = energized, resourced, sustainable pace; lower = depleted, near burnout, running on empty.",
  customer_experience:
    "Depth of understanding of the transformation delivered to clients, and clarity/authenticity of voice in serving them. Higher = vivid grasp of client change and clear voice; lower = fuzzy or generic.",
  marketing:
    "Brand clarity, message consistency, audience understanding, and a working lead-generation system. Higher = clear positioning and a repeatable pipeline; lower = unclear message, sporadic or absent lead gen.",
  sales:
    "Predictable sales process, qualification, conversion, and pricing confidence. Higher = a reliable, documented pipeline with clear pricing; lower = ad hoc, unpredictable, or discount-driven.",
  operations:
    "Documented, efficient, quality-controlled delivery that scales. Higher = processes are written down and run smoothly; lower = chaotic, founder-dependent, quality varies.",
  finance:
    "Cash-flow visibility, revenue predictability, margins, and financial preparedness. Higher = strong grasp of the numbers and healthy margins; lower = unclear cash flow, thin or unknown margins.",
  team:
    "Role clarity, hiring, culture, delegation, and retention. Higher = clear roles and a capable, retained team; lower = solo overload, unclear roles, turnover.",
  systems:
    "Automation, tooling, documentation (SOPs), and access/tech-stack clarity. Higher = well-documented, automated, low founder dependence; lower = manual, undocumented, fragile.",
  product:
    "Offer quality, market fit, innovation, and clarity of the product ladder. Higher = strong fit and a coherent offer suite; lower = unclear offers or weak fit.",
  legal:
    "Entity structure, contracts, IP protection, and compliance/risk management. Higher = solid legal foundation; lower = gaps in contracts, IP, or compliance.",
};

export interface AiDimensionScore {
  score: number; // 0-100
  rationale: string;
}

export interface ProseAnswer {
  question: string;
  answer: string;
}

export async function scoreDimensionFromProse(
  dimensionKey: DimensionKey,
  dimensionLabel: string,
  answers: ProseAnswer[],
  apiKey?: string
): Promise<AiDimensionScore | null> {
  const key = apiKey || openaiKey();
  if (!key || answers.length === 0) return null;

  const rubric = RUBRIC[dimensionKey] ?? `Overall strength of the "${dimensionLabel}" dimension.`;
  const openai = new OpenAI({ apiKey: key });

  const content = answers
    .map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`)
    .join("\n\n");

  const system = `You score one business-health dimension from a founder's reflective, open-ended answers.
Dimension: ${dimensionLabel}.
Rubric: ${rubric}
Return STRICT JSON: {"score": <integer 0-100>, "rationale": "<=280 chars, no direct quotes of the answers"}.
Base the score only on the evidence in the answers. If the answers are thin or absent, score conservatively and say so. Do not quote the answers verbatim; describe themes.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // Pinned to 0 for stable, repeatable scores (same answers → same score).
      // Toggle by setting SCORING_TEMPERATURE (e.g. 0.2) in the environment.
      temperature: Number(process.env.SCORING_TEMPERATURE ?? "0"),
      max_tokens: 220,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { score?: unknown; rationale?: unknown };
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score))));
    if (Number.isNaN(score)) return null;
    return {
      score,
      rationale: typeof parsed.rationale === "string" ? parsed.rationale.slice(0, 300) : "",
    };
  } catch (e) {
    console.error(`scoreDimensionFromProse(${dimensionKey}):`, e);
    return null;
  }
}
