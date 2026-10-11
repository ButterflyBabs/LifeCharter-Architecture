import { cookies } from "next/headers";
import type { ScheduleEvent } from "@/lib/google";
import { dayWindowUtc } from "@/lib/tz";

// The public demo (lc_demo cookie) must never show the signed-in person's real calendar or inbox: it is
// presented and recorded. These sample events belong to the demo business (Brand Alchemy Studio) and use
// the same people as its deals and affiliates.
export function inDemo(): boolean {
  try {
    return cookies().get("lc_demo")?.value === "1";
  } catch {
    return false; // no request scope
  }
}

// [hour, minute, minutes long, title]
const SETS: Array<Array<[number, number, number, string]>> = [
  [
    [8, 30, 30, "Brand Voice Workshop: final prep"],
    [10, 0, 45, "Discovery call: Harper & Co."],
    [12, 30, 45, "Lunch and check-in with Grace Okafor (affiliate)"],
    [14, 0, 45, "Proposal review: Nina Brooks"],
    [16, 0, 60, "Content batching: Instagram carousels"],
  ],
  [
    [9, 0, 60, "Strategy session: Signature Brand Build kickoff"],
    [11, 0, 30, "Follow-up call: Priya Shah"],
    [13, 30, 60, "Weekly Review"],
    [15, 30, 45, "Answer pricing questions: Sam Rivera"],
  ],
  [
    [8, 0, 45, "Plan the week: Goal Ladder check-in"],
    [10, 30, 60, "Brand Alchemy Intensive: session 1"],
    [13, 0, 30, "Send the revised proposal"],
    [15, 0, 45, "Podcast guest prep"],
  ],
];

export function demoScheduleEvents(timeZone: string, day = 0): ScheduleEvent[] {
  const { startISO } = dayWindowUtc(timeZone, 1, day);
  const dayStart = new Date(startISO).getTime();
  const set = SETS[((day % SETS.length) + SETS.length) % SETS.length];
  return set.map(([h, m, len, title], i) => {
    const start = new Date(dayStart + (h * 60 + m) * 60_000);
    const end = new Date(start.getTime() + len * 60_000);
    return {
      id: `demo-${day}-${i}`,
      title,
      time: start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone }),
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
    };
  });
}
