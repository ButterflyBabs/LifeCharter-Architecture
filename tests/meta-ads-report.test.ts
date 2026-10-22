import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_GOALS, breakEvenCpl, buildReport, daysBetween, guidance, suggestedTargetCpl, type AdRow, type Goals } from "../src/lib/metaAdsReport";
import { parseAdsExport } from "../src/lib/metaAdsCsv";

const P = { periodStart: "2026-10-10", periodEnd: "2026-10-21" };
// The MasterClass lead ads as Ads Manager showed them on Oct 22, 2026.
const rows: AdRow[] = [
  { adName: "Ad 2 BURIED", ...P, spend: 99.01, impressions: 1384, reach: 879, linkClicks: 35, leads: 10, frequency: 1.57 },
  { adName: "Ad 1 Founder-held", ...P, spend: 0.43, impressions: 17, reach: 15, linkClicks: 1, leads: 0, frequency: 1.13 },
  { adName: "Ad 5 Free Founder Training", ...P, spend: 6.74, impressions: 103, reach: 80, linkClicks: 1, leads: 0, frequency: 1.29 },
  { adName: "Ad 3 What you leave with.", ...P, spend: 2.85, impressions: 53, reach: 42, linkClicks: 0, leads: 0, frequency: 1.26 },
  { adName: "Ad 4 The part I avoided.", ...P, spend: 3.73, impressions: 43, reach: 39, linkClicks: 2, leads: 1, frequency: 1.1 },
];

test("days are counted inclusively", () => {
  assert.equal(daysBetween("2026-10-10", "2026-10-21"), 12);
  assert.equal(daysBetween("2026-10-10", "2026-10-10"), 1);
});

test("totals and cost per lead add up", () => {
  const r = buildReport({ rows })!;
  assert.equal(r.totals.spend, 112.76);
  assert.equal(r.totals.leads, 11);
  assert.equal(r.totals.cpl, 10.25);
  assert.equal(r.days, 12);
});

test("with no target set the ads are judged against the campaign average", () => {
  const r = buildReport({ rows })!;
  assert.equal(r.target.source, "campaign average");
  const by = Object.fromEntries(r.ads.map((a) => [a.adName, a]));
  assert.equal(by["Ad 2 BURIED"].verdict, "continue");
  assert.equal(by["Ad 4 The part I avoided."].verdict, "watch"); // one lead is a hint, not proof
  for (const n of ["Ad 1 Founder-held", "Ad 3 What you leave with."]) {
    assert.equal(by[n].verdict, "pause", n); // Meta is barely showing them and they produced nothing
    assert.match(by[n].why.join(" "), /no leads/);
  }
  assert.equal(by["Ad 5 Free Founder Training"].verdict, "watch"); // $6.74 is not yet twice the campaign's cost per lead
});

test("an ad that spent twice the target with no leads is paused, and stopped if it happened before", () => {
  const goals: Goals = { ...EMPTY_GOALS, targetCpl: 10 };
  const bad: AdRow = { adName: "Slow", ...P, spend: 25, impressions: 2000, reach: 1500, linkClicks: 10, leads: 0, frequency: 1.2 };
  const now = buildReport({ rows: [bad, rows[0]], goals })!;
  assert.equal(now.ads.find((a) => a.adName === "Slow")!.verdict, "pause");
  const before: AdRow = { ...bad, periodStart: "2026-10-03", periodEnd: "2026-10-09" };
  const again = buildReport({ rows: [bad, rows[0]], priorRows: [before], goals })!;
  assert.equal(again.ads.find((a) => a.adName === "Slow")!.verdict, "stop");
});

test("a cheap ad with enough leads and low frequency is scaled; a tired one is not", () => {
  const goals: Goals = { ...EMPTY_GOALS, targetCpl: 20 };
  const good: AdRow = { adName: "Good", ...P, spend: 60, impressions: 3000, reach: 2000, linkClicks: 90, leads: 6, frequency: 1.5 };
  assert.equal(buildReport({ rows: [good], goals })!.ads[0].verdict, "scale");
  assert.equal(buildReport({ rows: [{ ...good, frequency: 3.4 }], goals })!.ads[0].verdict, "continue");
});

test("an ad far above target with several leads is paused", () => {
  const goals: Goals = { ...EMPTY_GOALS, targetCpl: 5 };
  const dear: AdRow = { adName: "Dear", ...P, spend: 90, impressions: 3000, reach: 2000, linkClicks: 40, leads: 4, frequency: 1.4 };
  assert.equal(buildReport({ rows: [dear], goals })!.ads[0].verdict, "pause");
});

test("projections hold cost per lead and the daily spend steady", () => {
  const r = buildReport({ rows })!;
  assert.equal(r.projections.dailySpend, 9.4);
  const [week, month, quarter] = r.projections.rows;
  assert.equal(week.spend, 65.8);
  assert.equal(month.spend, 282);
  assert.equal(quarter.spend, 855.4);
  assert.equal(week.leads, 6.4); // 65.8 / 10.25
});

test("the monthly limit warns when the pace would go over it", () => {
  const goals: Goals = { ...EMPTY_GOALS, monthlyLimit: 150 };
  const r = buildReport({ rows, goals })!;
  assert.match(r.projections.limitNote ?? "", /over the \$150\.00 limit/);
});

test("break-even and the suggested target come from client value and close rate", () => {
  const g: Goals = { ...EMPTY_GOALS, customerValue: 2000, answers: { closeRate: "2" } };
  assert.equal(breakEvenCpl(g), 40);
  assert.equal(suggestedTargetCpl(g), 20);
  assert.equal(breakEvenCpl(EMPTY_GOALS), null);
});

test("the funnel and the capture check use the Suite's own counts", () => {
  const r = buildReport({ rows, outcomes: { registered: 11, attended: 0, booked: 1, sold: 0, suiteLeads: 10 } })!;
  assert.equal(r.funnel![0].count, 11);
  assert.equal(r.funnel![3].costEach, 112.76);
  assert.equal(r.funnel![4].costEach, null);
  assert.match(r.checks.join(" "), /Meta counted 11 leads but the Suite received 10/);
  const unnamed = buildReport({ rows, outcomes: { registered: 11, attended: 0, booked: 0, sold: 0, suiteLeads: 11, named: 0 } })!;
  assert.match(unnamed.checks.join(" "), /arrive without the ad's name/);
});

test("guidance reacts to the answers", () => {
  const g: Goals = { ...EMPTY_GOALS, goalLeads: 30, goalBy: "2026-10-31", customerValue: 2000, answers: { closeRate: "2", quality: "wrong", followUp: "no", bestAd: "Ad 4 The part I avoided.", worthIt: "no" } };
  const r = buildReport({ rows, goals: g })!;
  const titles = guidance(g, r).map((x) => x.title);
  assert.ok(titles.includes("Your break-even"));
  assert.ok(titles.includes("Your sign-up goal"));
  assert.ok(titles.includes("Wrong people are signing up"));
  assert.ok(titles.includes("Follow up faster"));
  assert.ok(titles.includes("Your pick and the numbers disagree"));
  assert.ok(titles.includes("Your own answer"));
});

test("the Ads Manager file is read by column name, skipping the totals row", () => {
  const csv = [
    '"Reporting starts","Reporting ends","Ad name","Delivery","Results","Result indicator","Reach","Frequency","Amount spent (USD)","Impressions","Link clicks"',
    '"2026-10-10","2026-10-21","Ad 2 BURIED","active","10","actions:onsite_conversion.lead_grouped","879","1.57","99.01","1,384","35"',
    '"2026-10-10","2026-10-21","Ad 1 Founder-held","active","","actions:onsite_conversion.lead_grouped","15","1.13","0.43","17","1"',
    '"2026-10-10","2026-10-21","","","11","","1034","","112.76","1,600","39"',
  ].join("\n");
  const { rows: parsed, problems } = parseAdsExport(csv);
  assert.deepEqual(problems, []);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].spend, 99.01);
  assert.equal(parsed[0].impressions, 1384);
  assert.equal(parsed[0].leads, 10);
  assert.equal(parsed[1].leads, 0);
  assert.equal(parsed[0].periodStart, "2026-10-10");
});

test("a file without dates asks for them, and a file from the wrong tab is explained", () => {
  const noDates = '"Ad name","Results","Amount spent (USD)"\n"A","3","12.50"';
  assert.match(parseAdsExport(noDates).problems[0], /no reporting dates/);
  assert.equal(parseAdsExport(noDates, { start: "2026-10-01", end: "2026-10-07" }).rows[0].periodEnd, "2026-10-07");
  const campaigns = '"Campaign name","Results","Amount spent (USD)"\n"C","3","12.50"';
  assert.match(parseAdsExport(campaigns).problems[0], /Ad name/);
});

test("the budget against the goal says how far short or how far ahead", () => {
  const g: Goals = { ...EMPTY_GOALS, goalLeads: 30, goalBy: "2026-11-04", dailyBudget: 16, answers: { quality: "early", worthIt: "yes" } };
  const r = buildReport({ rows, goals: g })!;
  const gd = guidance(g, r);
  const budget = gd.find((x) => x.title === "Your daily budget and your goal")!;
  assert.match(budget.text, /19 more sign-ups in 14 days/);
  assert.match(budget.text, /Your \$16\.00 a day would bring about/);
  assert.ok(gd.some((x) => x.title === "Who is signing up"));
  assert.ok(gd.some((x) => x.title === "Your answer and the numbers agree"));
});
