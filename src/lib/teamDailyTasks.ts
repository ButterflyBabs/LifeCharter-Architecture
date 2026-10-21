// Weekday tasks the Suite hands to a team member by itself, and the end-of-day check on them (Babs, 2026-10-21):
// Sumbal's "work the Outreach pipelines" task is added to her Tasks every weekday morning, and if it is not checked
// off by 6:00 PM Mountain, Babs gets a bell notification and an email with the DM counts for the day.
// Pure helpers live here so they can be tested; the cron is src/app/api/cron/team-daily-tasks/route.ts.

export const TEAM_TZ = "America/Denver";

export interface TeamDailyTask {
  key: string;
  memberEmail: string;
  /** Local hour (Mountain) the task is added. */
  createHour: number;
  /** Local hour (Mountain) it is due and checked. */
  dueHour: number;
  title: (niceDay: string) => string;
  description: string;
}

export const OUTREACH_SOP_URL = "https://claude.ai/artifact/MsCsWMtkGEBrMHkVgDy6CC";

export const TEAM_DAILY_TASKS: TeamDailyTask[] = [
  {
    key: "outreach-daily",
    memberEmail: "sumbal@amilynnecarroll.com",
    createHour: 7,
    dueHour: 18,
    title: (d) => `Work the Outreach pipelines: DM, LinkedIn, Facebook (${d})`,
    description: [
      "Work AmiLynne's DM Outreach pipeline today (LinkedIn and Facebook; not Cold Email). Full steps: the DM Outreach SOP, Part 8 (daily routine).",
      "",
      "1. Text AmiLynne BEFORE you sign in to LinkedIn or Facebook if you are not already signed in.",
      "2. Replies first: LinkedIn messages and accepted connections, Facebook Messenger and Message requests, the LifeCharter Community Page inbox. Log and move each card.",
      "3. Follow-ups due: open the MasterClass Pipeline, use the follow-ups-due notice, send the follow-up, then reset each card's Follow up on date.",
      "4. New LinkedIn people: 25 connection requests with a note. Press 'I sent it' after every one.",
      "5. Facebook: import about 25 people with the note 'FB import DATE'. Message only people from an import AmiLynne has cleared.",
      "",
      "Tracking check before you finish: every message you sent is logged with 'I sent it'. The counters at the top of the pipeline page show today's new DMs and follow-up DMs for LinkedIn and Facebook. Every card you touched is in the right column with a true follow-up date.",
      "",
      "Report to AmiLynne: 'Today: LinkedIn __ new, Facebook __ imported, __ cleared Facebook messaged. Follow-ups sent __. Replies __. Accepted __. Invited __. Needs you: ... Problems: ... Feedback: ...'",
      "",
      "Check this task complete when all of that is done. If it is not checked complete by 6:00 PM Mountain, AmiLynne is notified.",
      `SOP: ${OUTREACH_SOP_URL}`,
    ].join("\n"),
  },
];

/** Mountain-time parts of an instant: calendar day, weekday (0 = Sunday) and hour (0-23). */
export function mountainParts(now: Date): { day: string; weekday: number; hour: number } {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: TEAM_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TEAM_TZ, hour: "numeric", hourCycle: "h23" }).format(now));
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: TEAM_TZ, weekday: "short" }).format(now);
  return { day, weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd), hour };
}

export const isWeekday = (weekday: number) => weekday >= 1 && weekday <= 5;

export const niceDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

export interface DmCount {
  newDms: number;
  followUps: number;
}

/** New and follow-up DMs sent, per platform, from the dm_sends rows of the day. */
export function tallyDms(rows: { platform: string | null; kind: string | null }[]): Record<string, DmCount> {
  const out: Record<string, DmCount> = {};
  for (const r of rows) {
    const p = r.platform || "Other";
    out[p] = out[p] ?? { newDms: 0, followUps: 0 };
    if (r.kind === "follow_up") out[p].followUps++;
    else out[p].newDms++;
  }
  return out;
}

const PLATFORM_NAME: Record<string, string> = { LI: "LinkedIn", FB: "Facebook", IG: "Instagram", WA: "WhatsApp", Email: "Email", DM: "DM" };

/** Plain-words line for the reminder: "LinkedIn 12 new, 4 follow-up. Facebook 0 new, 0 follow-up." */
export function countsLine(t: Record<string, DmCount>): string {
  const keys = Array.from(new Set(["LI", "FB", ...Object.keys(t)]));
  return keys.map((k) => `${PLATFORM_NAME[k] ?? k} ${t[k]?.newDms ?? 0} new, ${t[k]?.followUps ?? 0} follow-up`).join(". ") + ".";
}
