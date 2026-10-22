import { buildCycles, buildMonths, type Cycle, type CycleSetup, type Month } from "@/lib/metaAdsCycles";

// The weekly Meta Ads report. Pure functions only: the rows come from the file exported from Ads Manager (meta_ad_stats),
// the goals from the guided questions (meta_ad_goals) and the outcomes from the Suite's own contacts. Every verdict
// carries its reason in plain words so the owner can disagree with it.

export type AdRow = {
  adName: string;
  campaign?: string | null;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
  spend: number;
  impressions: number;
  reach: number | null;
  linkClicks: number;
  leads: number;
  frequency: number | null;
  delivery?: string | null;
};

export type Goals = {
  targetCpl: number | null;
  dailyBudget: number | null;
  customerValue: number | null;
  goalLeads: number | null; // sign-ups wanted for each event
  goalBy: string | null; // older answer; the event date below replaces it
  monthlyLimit: number | null;
  eventAnchor: string | null; // date of any one event, e.g. 2026-10-22
  cycleDays: number | null; // days between events, e.g. 14 (null or 0 = not tied to events)
  cycleHour: number | null; // hour the count starts again on event day, Mountain time (default 19)
  answers: Record<string, string>;
};

export const EMPTY_GOALS: Goals = { targetCpl: null, dailyBudget: null, customerValue: null, goalLeads: null, goalBy: null, monthlyLimit: null, eventAnchor: null, cycleDays: null, cycleHour: null, answers: {} };

export function cycleSetup(g: Goals): CycleSetup | null {
  if (!g.eventAnchor || !g.cycleDays || g.cycleDays < 1) return null;
  return { anchor: g.eventAnchor, days: g.cycleDays, hour: g.cycleHour ?? 19, goal: g.goalLeads };
}

// What happened to the people the ads brought in, counted from the Suite's own contacts.
export type Outcomes = { registered: number; attended: number; booked: number; sold: number; suiteLeads: number; named?: number };

export type Verdict = "scale" | "continue" | "watch" | "pause" | "stop";

export type AdReport = {
  adName: string;
  spend: number;
  impressions: number;
  reach: number | null;
  frequency: number | null;
  linkClicks: number;
  leads: number;
  ctr: number | null; // link click-through rate, percent
  cpm: number | null;
  cpc: number | null;
  cpl: number | null;
  shareOfSpend: number; // percent
  shareOfLeads: number; // percent
  verdict: Verdict;
  headline: string;
  why: string[];
};

export type Totals = { spend: number; impressions: number; reach: number | null; linkClicks: number; leads: number; cpl: number | null; ctr: number | null; cpm: number | null };

export type Projection = { label: string; days: number; spend: number; leads: number | null };

export type Report = {
  periodStart: string;
  periodEnd: string;
  days: number;
  totals: Totals;
  prior: (Totals & { periodStart: string; periodEnd: string; days: number }) | null;
  ads: AdReport[];
  target: { cpl: number | null; source: "yours" | "break-even" | "campaign average" | "none" };
  campaign: { verdict: Verdict; headline: string; why: string[] };
  projections: { dailySpend: number; cpl: number | null; rows: Projection[]; limitNote: string | null };
  funnel: { stage: string; count: number; costEach: number | null }[] | null;
  checks: string[]; // things to look at that are not about a single ad
  cycles: Cycle[]; // the open event cycle first, then the ones before it
  months: Month[]; // running totals for each calendar month
};

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const money = (n: number) => `$${n.toFixed(2)}`;

export function daysBetween(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

function totalsOf(rows: { spend: number; impressions: number; reach: number | null; linkClicks: number; leads: number }[]): Totals {
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const linkClicks = rows.reduce((s, r) => s + r.linkClicks, 0);
  const leads = rows.reduce((s, r) => s + r.leads, 0);
  // Reach cannot be added across ads (the same person can see two ads), so the campaign figure is only the sum when that is all we have.
  const reach = rows.every((r) => r.reach != null) ? rows.reduce((s, r) => s + (r.reach ?? 0), 0) : null;
  return {
    spend: round(spend),
    impressions,
    reach,
    linkClicks,
    leads,
    cpl: leads > 0 ? round(spend / leads) : null,
    ctr: impressions > 0 ? round((linkClicks / impressions) * 100) : null,
    cpm: impressions > 0 ? round((spend / impressions) * 1000) : null,
  };
}

/** The most the owner can pay for one lead and still come out ahead, from what a client is worth and how many leads become clients. */
export function breakEvenCpl(g: Goals): number | null {
  const rate = Number(g.answers.closeRate);
  if (!g.customerValue || !(rate > 0)) return null;
  return round(g.customerValue * (rate / 100));
}

/** A target to aim for: half of break-even, so each client earns back about twice what was spent finding them. */
export function suggestedTargetCpl(g: Goals): number | null {
  const be = breakEvenCpl(g);
  return be == null ? null : round(be / 2);
}

export type PriorAd = { adName: string; spend: number; leads: number };

const SMALL_SHARE = 5; // an ad that gets under this percent of the impressions is barely being shown

export function judgeAd(
  ad: Omit<AdReport, "verdict" | "headline" | "why">,
  ctx: { target: number | null; campaignCpl: number | null; totalImpressions: number; prior: PriorAd | null },
): Pick<AdReport, "verdict" | "headline" | "why"> {
  const why: string[] = [];
  const { target, campaignCpl, totalImpressions, prior } = ctx;
  const judgeSpend = round((target ?? campaignCpl ?? 7.5) * 2, 2); // enough money spent that "no leads" means something
  const shareImpr = totalImpressions > 0 ? (ad.impressions / totalImpressions) * 100 : 0;
  const yardstick = target ?? campaignCpl;

  if (ad.leads === 0) {
    why.push(`${money(ad.spend)} spent, ${ad.impressions.toLocaleString("en-US")} impressions, no leads.`);
    if (ad.spend >= judgeSpend) {
      const priorBad = prior && prior.leads === 0 && prior.spend >= judgeSpend;
      if (priorBad) {
        why.push("Same result in the previous period too, so this is not a slow start.");
        return { verdict: "stop", headline: "Stop it and retire it", why: [...why, "Keep the idea if you like it, but run it as a new ad rather than turning this one back on."] };
      }
      why.push(`It has spent more than ${money(judgeSpend)} (twice ${target ? "your target" : "the campaign's cost per lead"}), enough to expect at least one lead.`);
      return { verdict: "pause", headline: "Pause it", why: [...why, "Look at the picture, the first line and the form before you turn it back on."] };
    }
    if (totalImpressions >= 500 && shareImpr < SMALL_SHARE) {
      why.push(`Meta is giving it ${round(shareImpr, 1)}% of the impressions, because it is putting the money on your stronger ad.`);
      return { verdict: "pause", headline: "Pause it (low risk)", why: [...why, "Pausing costs you nothing. Reuse its idea in a fresh ad with its own budget if you want a fair test."] };
    }
    return { verdict: "watch", headline: "Too early to judge", why: [...why, `Give it until it has spent about ${money(judgeSpend)} before you decide.`] };
  }

  if (ad.cpl != null) why.push(`${ad.leads} lead${ad.leads === 1 ? "" : "s"} at ${money(ad.cpl)} each.`);
  if (yardstick && ad.cpl != null) {
    why.push(target ? `Your target is ${money(target)} per lead.` : `The whole campaign averages ${money(yardstick)} per lead.`);
  }
  if (ad.leads < 3) why.push(`Only ${ad.leads} lead${ad.leads === 1 ? "" : "s"} so far. That is a hint, not proof.`);
  if (ad.frequency != null && ad.frequency >= 3) why.push(`Each person has seen it ${ad.frequency.toFixed(1)} times on average. That is where ads start to tire.`);

  if (!yardstick || ad.cpl == null) return { verdict: "continue", headline: "Keep running it", why };

  const tired = ad.frequency != null && ad.frequency >= 3;
  if (ad.cpl <= yardstick * 0.7 && ad.leads >= 3 && !tired) {
    return { verdict: "scale", headline: "Keep it and give it more budget", why: [...why, "It costs well under what you aim to pay, with enough leads to trust it. Raise the budget about 20% and check again next week."] };
  }
  if (ad.cpl <= yardstick) {
    if (ad.leads < 3) return { verdict: "watch", headline: "Promising: keep it running", why: [...why, "Do not change anything yet. Let it reach about 3 leads before you give it more money."] };
    return { verdict: "continue", headline: "Keep running it", why: [...why, tired ? "Plan a fresh picture or first line soon." : "It is doing its job."] };
  }
  if (ad.cpl <= yardstick * 1.5) {
    return { verdict: "watch", headline: "Watch it: a little over", why: [...why, "It costs somewhat more than you aim to pay. Try a new first line or picture on a copy of it before you cut it."] };
  }
  if (ad.leads >= 3) return { verdict: "pause", headline: "Pause it", why: [...why, "It costs much more than you aim to pay, and there are enough leads to know it is not a fluke."] };
  return { verdict: "watch", headline: "Watch it closely", why: [...why, "It costs much more than you aim to pay, but there are too few leads to be sure. Give it a little more spend, then decide."] };
}

export function buildReport(input: {
  rows: AdRow[]; // the latest period
  priorRows?: AdRow[]; // the period before it, if there is one
  goals?: Goals;
  outcomes?: Outcomes | null;
  signups?: Date[]; // when each sign-up arrived, from the Suite's own lead log
  allRows?: AdRow[]; // every period on file, to count spend by event cycle and month
  now?: Date;
}): Report | null {
  const rows = input.rows;
  if (!rows.length) return null;
  const goals = input.goals ?? EMPTY_GOALS;
  const periodStart = rows.reduce((m, r) => (r.periodStart < m ? r.periodStart : m), rows[0].periodStart);
  const periodEnd = rows.reduce((m, r) => (r.periodEnd > m ? r.periodEnd : m), rows[0].periodEnd);
  const days = daysBetween(periodStart, periodEnd);
  const totals = totalsOf(rows);
  const priorRows = input.priorRows ?? [];
  const prior = priorRows.length
    ? (() => {
        const ps = priorRows.reduce((m, r) => (r.periodStart < m ? r.periodStart : m), priorRows[0].periodStart);
        const pe = priorRows.reduce((m, r) => (r.periodEnd > m ? r.periodEnd : m), priorRows[0].periodEnd);
        return { ...totalsOf(priorRows), periodStart: ps, periodEnd: pe, days: daysBetween(ps, pe) };
      })()
    : null;

  const be = breakEvenCpl(goals);
  const target = goals.targetCpl ?? null;
  const targetUsed = target ?? null;
  const campaignCpl = totals.cpl;
  const targetInfo: Report["target"] = target
    ? { cpl: target, source: "yours" }
    : be
      ? { cpl: be, source: "break-even" }
      : campaignCpl
        ? { cpl: campaignCpl, source: "campaign average" }
        : { cpl: null, source: "none" };

  const priorByName = new Map(priorRows.map((r) => [r.adName, { adName: r.adName, spend: r.spend, leads: r.leads } as PriorAd]));
  const ads: AdReport[] = rows
    .map((r) => {
      const base = {
        adName: r.adName,
        spend: round(r.spend),
        impressions: r.impressions,
        reach: r.reach,
        frequency: r.frequency,
        linkClicks: r.linkClicks,
        leads: r.leads,
        ctr: r.impressions > 0 ? round((r.linkClicks / r.impressions) * 100) : null,
        cpm: r.impressions > 0 ? round((r.spend / r.impressions) * 1000) : null,
        cpc: r.linkClicks > 0 ? round(r.spend / r.linkClicks) : null,
        cpl: r.leads > 0 ? round(r.spend / r.leads) : null,
        shareOfSpend: totals.spend > 0 ? round((r.spend / totals.spend) * 100, 1) : 0,
        shareOfLeads: totals.leads > 0 ? round((r.leads / totals.leads) * 100, 1) : 0,
      };
      const j = judgeAd(base, { target: targetUsed ?? be, campaignCpl, totalImpressions: totals.impressions, prior: priorByName.get(r.adName) ?? null });
      return { ...base, ...j } satisfies AdReport;
    })
    .sort((a, b) => b.leads - a.leads || b.spend - a.spend);

  // The campaign as a whole.
  const cwhy: string[] = [];
  let cverdict: Verdict = "watch";
  let cheadline = "Too early to say";
  if (totals.leads === 0) {
    cwhy.push(`${money(totals.spend)} spent and no leads yet.`);
    cverdict = totals.spend >= (targetInfo.cpl ? targetInfo.cpl * 3 : 30) ? "pause" : "watch";
    cheadline = cverdict === "pause" ? "Pause the campaign and check the form and the offer" : "Keep it running a little longer";
  } else {
    cwhy.push(`${totals.leads} lead${totals.leads === 1 ? "" : "s"} for ${money(totals.spend)}, which is ${money(totals.cpl ?? 0)} each.`);
    if (targetInfo.cpl && targetInfo.source !== "campaign average") {
      cwhy.push(`${targetInfo.source === "yours" ? "Your target" : "Your break-even"} is ${money(targetInfo.cpl)} per lead.`);
      if ((totals.cpl ?? 0) <= targetInfo.cpl) { cverdict = "continue"; cheadline = "Keep the campaign running"; }
      else if ((totals.cpl ?? 0) <= targetInfo.cpl * 1.5) { cverdict = "watch"; cheadline = "Keep it running, and fix the weak ads"; }
      else { cverdict = "pause"; cheadline = "Pause the campaign until the ads are fixed"; }
    } else {
      cwhy.push("You have not set what a lead is worth to you yet, so I am comparing the ads with each other. Answer the guided questions below to get a real yes or no.");
      cverdict = "continue";
      cheadline = "Keep it running while you set your target";
    }
  }
  if (prior && prior.cpl != null && totals.cpl != null) {
    const change = ((totals.cpl - prior.cpl) / prior.cpl) * 100;
    cwhy.push(`Cost per lead ${change <= -3 ? "fell" : change >= 3 ? "rose" : "held steady"} from ${money(prior.cpl)} the period before${Math.abs(change) >= 3 ? ` (${change > 0 ? "+" : ""}${round(change, 0)}%)` : ""}.`);
  }

  // What the same spending would do if cost per lead stays the same.
  const dailySpend = round(totals.spend / days);
  const cpl = totals.cpl;
  const rows2: Projection[] = [
    { label: "Week", days: 7 },
    { label: "Month", days: 30 },
    { label: "Quarter", days: 91 },
  ].map((p) => {
    const spend = round(dailySpend * p.days);
    return { label: p.label, days: p.days, spend, leads: cpl ? round(spend / cpl, 1) : null };
  });
  let limitNote: string | null = null;
  if (goals.monthlyLimit) {
    const month = dailySpend * 30;
    limitNote = month > goals.monthlyLimit
      ? `At this pace you would spend about ${money(month)} a month, which is over the ${money(goals.monthlyLimit)} limit you set. Meta would stop the ads around day ${Math.max(1, Math.floor(goals.monthlyLimit / Math.max(dailySpend, 0.01)))}.`
      : `At this pace you would spend about ${money(month)} a month, inside the ${money(goals.monthlyLimit)} limit you set.`;
  }

  const o = input.outcomes ?? null;
  const funnel = o && o.registered > 0
    ? [
        { stage: "Leads from Meta", count: totals.leads, costEach: totals.cpl },
        { stage: "Registered in the Suite", count: o.registered, costEach: o.registered ? round(totals.spend / o.registered) : null },
        { stage: "Showed up", count: o.attended, costEach: o.attended ? round(totals.spend / o.attended) : null },
        { stage: "Booked a call", count: o.booked, costEach: o.booked ? round(totals.spend / o.booked) : null },
        { stage: "Became a client", count: o.sold, costEach: o.sold ? round(totals.spend / o.sold) : null },
      ]
    : null;

  const checks: string[] = [];
  if (o && totals.leads > 0) {
    if (o.suiteLeads < totals.leads) checks.push(`Meta counted ${totals.leads} leads but the Suite received ${o.suiteLeads}. ${totals.leads - o.suiteLeads} did not arrive: check your Make scenario, or add them from the Leads Center file.`);
    else checks.push(`Every lead Meta counted (${totals.leads}) arrived in the Suite.`);
    if (o.suiteLeads > 0 && o.named === 0) checks.push("Your leads arrive without the ad's name, so the Suite cannot tell which ad each person came from. In your Make scenario add the field ad_name and choose Ad name from the list (step 5 of the Make instructions below). Then each ad's sign-ups, show-ups and clients can be counted.");
  }
  const topFreq = ads.filter((a) => a.frequency != null && a.frequency >= 3).map((a) => a.adName);
  if (topFreq.length) checks.push(`${topFreq.join(", ")}: people are seeing it 3 or more times. Plan a fresh version.`);
  if (ads.length > 1 && totals.leads >= 3) {
    const lead = ads[0];
    if (lead.shareOfLeads >= 80) checks.push(`${lead.adName} brings ${round(lead.shareOfLeads, 0)}% of your leads. Everything rests on one ad: make two new ads in its style so you are not stuck if it tires.`);
  }
  if (!goals.targetCpl) checks.push("Set your target cost per lead (guided question 5) so every verdict compares with your own number.");

  const setup = cycleSetup(goals);
  const when = input.now ?? new Date();
  const spendRows = (input.allRows ?? rows).map((r) => ({ periodStart: r.periodStart, periodEnd: r.periodEnd, spend: r.spend }));
  const cycles = setup ? buildCycles(setup, input.signups ?? [], spendRows, when) : [];
  const months = buildMonths(setup ?? { anchor: "2026-01-01", days: 14, hour: 19, goal: null }, input.signups ?? [], spendRows, when).map((m) => (setup ? m : { ...m, events: [], goal: null }));
  if (!setup && goals.goalLeads) checks.push("Tell me the date of your next event and how often you hold it (guided questions) so the sign-up goal is counted for each event, starting again at zero after each one.");

  return { periodStart, periodEnd, days, totals, prior, ads, target: targetInfo, campaign: { verdict: cverdict, headline: cheadline, why: cwhy }, projections: { dailySpend, cpl, rows: rows2, limitNote }, funnel, checks, cycles, months };
}

// ---------------------------------------------------------------- guided questions

export type Question = {
  id: string;
  field?: "customerValue" | "goalLeads" | "eventAnchor" | "cycleDays" | "targetCpl" | "dailyBudget" | "monthlyLimit";
  kind: "choice" | "money" | "number" | "date" | "ad";
  text: string;
  why: string;
  choices?: { value: string; label: string }[];
};

export const QUESTIONS: Question[] = [
  { id: "purpose", kind: "choice", text: "What do you want these ads to do?", why: "The right number to watch depends on the job. Sign-ups for an event are judged differently from calls booked or things sold.",
    choices: [{ value: "event", label: "Fill a live event (registrations)" }, { value: "calls", label: "Book calls or consultations" }, { value: "sales", label: "Sell something directly" }, { value: "list", label: "Grow my email list" }] },
  { id: "goalLeads", field: "goalLeads", kind: "number", text: "How many sign-ups do you want for each event?", why: "A goal turns the report into a pace check: are you on track for this event or not? The count starts again at zero after each event." },
  { id: "eventDate", field: "eventAnchor", kind: "date", text: "What is the date of your next event, or the most recent one?", why: "Any one date of the event is enough. The report counts sign-ups for each event separately, and starts a fresh count when the event ends." },
  { id: "cycleDays", field: "cycleDays", kind: "choice", text: "How often do you hold it?", why: "This decides how long each count runs before it starts again.",
    choices: [{ value: "7", label: "Every week" }, { value: "14", label: "Every other week" }, { value: "28", label: "Every four weeks" }, { value: "0", label: "It is not tied to an event" }] },
  { id: "customerValue", field: "customerValue", kind: "money", text: "What is one new client worth to you in their first year? (dollars)", why: "This sets how much you can afford to pay to find one." },
  { id: "closeRate", kind: "number", text: "Out of 100 people who sign up, about how many become paying clients?", why: "If you are not sure, leave it blank and the report will use your real numbers once you have them. Most owners guess 1 to 5." },
  { id: "targetCpl", field: "targetCpl", kind: "money", text: "What is the most you would pay for one sign-up? (dollars)", why: "This is your yardstick. Every ad is judged against it. The suggestion below is half of your break-even, so each client earns back about twice what was spent." },
  { id: "dailyBudget", field: "dailyBudget", kind: "money", text: "What daily budget feels comfortable? (dollars)", why: "Budget decides how fast you learn. Too small and an ad cannot collect enough evidence." },
  { id: "monthlyLimit", field: "monthlyLimit", kind: "money", text: "What is the most you want to spend on ads in a month? (dollars)", why: "Meta stops your ads when you reach the account limit. The report warns you before that happens." },
  { id: "quality", kind: "choice", text: "Are the people who sign up the right people?", why: "A cheap lead who is the wrong person is not cheap. If they are not right, the fix is the message or the audience, not the budget.",
    choices: [{ value: "right", label: "Mostly the right people" }, { value: "mixed", label: "A mix" }, { value: "wrong", label: "Mostly not" }, { value: "early", label: "Too early to tell" }] },
  { id: "followUp", kind: "choice", text: "Do you or your team contact new sign-ups within a day?", why: "A lead you contact quickly is worth much more than one who waits. Speed is often a bigger lever than the ad itself.",
    choices: [{ value: "yes", label: "Yes, nearly always" }, { value: "some", label: "Sometimes" }, { value: "no", label: "Not yet" }] },
  { id: "bestAd", kind: "ad", text: "Which ad do you think speaks best to your people?", why: "Your instinct about your audience matters. If it disagrees with the numbers, that is worth knowing: either the numbers need more time, or the picture and first line are not saying what you mean." },
  { id: "worthIt", kind: "choice", text: "If the next month looks like this one, will you be glad you spent the money?", why: "The final check. The numbers inform the decision; this is the decision.",
    choices: [{ value: "yes", label: "Yes" }, { value: "unsure", label: "Not sure" }, { value: "no", label: "No" }] },
];

export type Guidance = { title: string; text: string };

/** Plain-language next steps from the owner's answers and this week's numbers. */
export function guidance(goals: Goals, report: Report | null): Guidance[] {
  const out: Guidance[] = [];
  const a = goals.answers;
  const be = breakEvenCpl(goals);
  if (be) out.push({ title: "Your break-even", text: `One client is worth ${money(goals.customerValue ?? 0)} and about ${a.closeRate} in 100 sign-ups become clients, so a sign-up is worth up to ${money(be)} to you. Paying less than that makes money; the suggested target is ${money(be / 2)}.` });
  const cur = report?.cycles.find((c) => c.current);
  if (report && cur && goals.goalLeads) {
    const goal = goals.goalLeads;
    const eventNice = new Date(`${cur.eventDate}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
    const pace = cur.projected ?? 0;
    const to = cur.signups >= goal ? "You have reached your goal for this event." : `At this pace you would reach about ${Math.round(pace)} by the event, ${pace >= goal ? "enough to get there." : `${Math.round(goal - pace)} short.`}`;
    out.push({ title: `Your goal for the ${eventNice} event`, text: `${cur.signups} of ${goal} sign-ups so far, on day ${cur.dayNumber} of ${cur.daysTotal} with ${cur.daysLeft} day${cur.daysLeft === 1 ? "" : "s"} left. ${to} The count starts again at zero when the event ends.` });
    const needed = Math.max(0, goal - cur.signups);
    const cpl = report.totals.cpl;
    if (goals.dailyBudget && cpl && cur.daysLeft > 0 && needed > 0) {
      const spendNeeded = needed * cpl;
      const atBudget = (goals.dailyBudget * cur.daysLeft) / cpl;
      out.push({
        title: "Your daily budget and this event",
        text: `You need about ${needed} more sign-ups in ${cur.daysLeft} days, roughly ${money(spendNeeded)} at today's cost per lead (${money(spendNeeded / cur.daysLeft)} a day). Your ${money(goals.dailyBudget)} a day would bring about ${Math.round(atBudget)}, ${atBudget >= needed ? "enough to get there." : `${Math.round(needed - atBudget)} short, so the goal needs a higher daily budget, a lower cost per lead, or more time.`}${report.projections.dailySpend + 0.5 < goals.dailyBudget ? ` You are actually spending about ${money(report.projections.dailySpend)} a day, so the budget is not being used fully: check that your ads are delivering.` : ""}`,
      });
    }
  } else if (goals.goalLeads && !cur) {
    out.push({ title: "Your sign-up goal", text: `You want ${goals.goalLeads} sign-ups for each event. Tell me the date of your event and how often you hold it so I can count each event on its own.` });
  }
  if (a.quality === "early") out.push({ title: "Who is signing up", text: "It is too early to tell. After your next live event, look at who actually showed up and who booked, and answer this question again." });
  if (a.quality === "wrong") out.push({ title: "Wrong people are signing up", text: "More money will not fix this. Change the first line and the picture so they speak to the person you want, and tighten the audience. Judge ads by who shows up, not by the cheapest lead." });
  if (a.quality === "mixed") out.push({ title: "A mixed audience", text: "Look at who showed up and who became a client, then write the next ad to that person." });
  if (a.followUp === "no" || a.followUp === "some") out.push({ title: "Follow up faster", text: "Contact every new sign-up within a day (a welcome message the same day is best). This usually raises results more than any change to the ad." });
  if (a.bestAd && report) {
    const best = report.ads[0];
    if (best && best.leads > 0 && best.adName !== a.bestAd) out.push({ title: "Your pick and the numbers disagree", text: `You picked ${a.bestAd}, but ${best.adName} is bringing the leads. Either give yours more time, or look at why the other one is landing.` });
    if (best && best.adName === a.bestAd && best.leads > 0) out.push({ title: "Your pick and the numbers agree", text: `${a.bestAd} is also your best performer. Write the next ads in its style.` });
  }
  if (a.worthIt === "no") out.push({ title: "Your own answer", text: "You said you would not be glad to spend another month like this one. Pause the campaign and fix the weakest link first (message, offer or follow-up) before spending more." });
  if (a.worthIt === "unsure") out.push({ title: "Your own answer", text: "You are not sure. Set a clear test: change one thing, run another week, and decide on the numbers." });
  if (a.worthIt === "yes" && report && report.campaign.verdict !== "pause") out.push({ title: "Your answer and the numbers agree", text: "You would be glad to spend another month like this, and the numbers do not argue with that. Keep going, fix the weakest ads, and check back next week." });
  if (a.worthIt === "yes" && report && report.campaign.verdict === "pause") out.push({ title: "Your answer and the numbers disagree", text: "You would be glad to continue, but this week's numbers say pause. Fix the weak ads first, then keep spending." });
  return out;
}
