/* Ad-hoc smoke test for the scoring engine. Run: npx tsx scripts/scoring-smoke.ts */
import { computeDimensionScores, ScoringInputs } from "../src/lib/scoring/computeScores";

const inputs: ScoringInputs = {
  profitDomains: {
    marketing: { score: 80, answeredAt: new Date().toISOString() },
    finance: { score: 60, answeredAt: new Date().toISOString() },
    legal: { score: 40, answeredAt: new Date().toISOString() },
  },
  brain: [], // Brain is now AI-scored (see aiScores), not numeric
  pulse: [
    { label: "Marketing Effectiveness", score: 90, answeredAt: new Date().toISOString() },
    { label: "Operational Stress", score: 80, answeredAt: new Date().toISOString() }, // inverted → 20
  ],
  operational: {
    revenue: 10000, revenue_goal: 12000, expenses: 6000, cash_in_bank: 20000,
    hours_worked: 40, target_hours: 35, sops_created: 10, delegated_tasks: 5,
    leads: 30, conversion_rate: 20,
  },
  operationalAt: new Date().toISOString(),
  businessPlanCompleteness: null,
  // Composite-keyed AI sub-scores (dimension:kind).
  aiScores: {
    "marketing:brain": { score: 65, answeredAt: new Date().toISOString() },
    "leadership:soul": { score: 88, answeredAt: new Date().toISOString() },
  },
  now: new Date().toISOString(),
};

const out = computeDimensionScores(inputs);
console.log("overall:", out.overall, "| hasData:", out.hasData, "| partial:", out.partial);
for (const d of out.domains) {
  const srcs = d.sources
    .map((s) => `${s.kind}:${s.subScore ?? "-"}@${s.effectiveWeight}`)
    .join(" ");
  console.log(`${d.key.padEnd(20)} score=${String(d.score).padEnd(5)} partial=${d.partial ? "Y" : "n"}  [${srcs}]`);
}

// Assertions
const m = out.domains.find((d) => d.key === "marketing")!;
const ops = out.domains.find((d) => d.key === "operations")!;
const lead = out.domains.find((d) => d.key === "leadership")!;
const sust = out.domains.find((d) => d.key === "sustainability")!;
// marketing: profit 80@40%, brain(ai) 65@35%, pulse 90@25% — all present
const expectMarketing = Math.round(0.4 * 80 + 0.35 * 65 + 0.25 * 90); // 77
// leadership: only soul(ai)=88 present → 88 (brain/pulse absent, weight redistributes)
console.assert(m.score === expectMarketing, `marketing expected ${expectMarketing}, got ${m.score}`);
console.assert(ops.score === 20 && ops.partial, `operations expected 20/partial, got ${ops.score}/${ops.partial}`);
console.assert(lead.score === 88 && lead.partial, `leadership expected 88/partial, got ${lead.score}/${lead.partial}`);
console.assert(sust.score === null, `sustainability expected null, got ${sust.score}`);
const ok = m.score === expectMarketing && ops.score === 20 && ops.partial && lead.score === 88 && sust.score === null;
console.log("\nassertions passed:", ok);
