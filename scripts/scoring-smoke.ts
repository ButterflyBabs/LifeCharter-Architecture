/* Ad-hoc smoke test for the scoring engine. Run: npx tsx scripts/scoring-smoke.ts */
import { computeDimensionScores, ScoringInputs } from "../src/lib/scoring/computeScores";

const inputs: ScoringInputs = {
  profitDomains: {
    marketing: { score: 80, answeredAt: new Date().toISOString() },
    finance: { score: 60, answeredAt: new Date().toISOString() },
    legal: { score: 40, answeredAt: new Date().toISOString() },
  },
  brain: [
    { section: "8. Marketing System", score: 70, answeredAt: new Date().toISOString() },
    { section: "6. Messaging, Positioning, and Brand Intelligence", score: 60, answeredAt: new Date().toISOString() },
  ],
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
const sust = out.domains.find((d) => d.key === "sustainability")!;
const expectMarketing = Math.round(0.4 * 80 + 0.35 * 65 + 0.25 * 90); // 77
console.assert(m.score === expectMarketing, `marketing expected ${expectMarketing}, got ${m.score}`);
console.assert(ops.score === 20 && ops.partial, `operations expected 20/partial, got ${ops.score}/${ops.partial}`);
console.assert(sust.score === null, `sustainability expected null, got ${sust.score}`);
console.log("\nassertions passed:", m.score === expectMarketing && ops.score === 20 && ops.partial && sust.score === null);
