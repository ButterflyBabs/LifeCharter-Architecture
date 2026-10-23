import { toE164 } from "@/lib/sms";

// Class-day texts for the Command Shift MasterClass (Babs approved the wording 2026-10-23). Four texts per class:
// the workbook about 3 hours before, then the Zoom link at 1 hour, 10 minutes and live. Each carries a link made
// for that one person (so a click can be tied to them) and ends with how to opt out. Only people who ticked
// "text me my reminders" (sms_consent_at) are texted, and only once the account's number is approved.

export const TEXT_KINDS = ["workbook", "hour_before", "ten_min", "live_now"] as const;
export type TextKind = (typeof TEXT_KINDS)[number];

const H = 3600_000;
const M = 60_000;

/** The texts due for a class that starts at `startIso`. The windows are at least 5 minutes wide (the sync runs every 5). */
export function dueTextKinds(startIso: string, now = new Date()): TextKind[] {
  const start = new Date(startIso).getTime();
  const t = now.getTime();
  const out: TextKind[] = [];
  if (t >= start - 3 * H && t < start - 2 * H) out.push("workbook");
  if (t >= start - 70 * M && t < start - 45 * M) out.push("hour_before");
  if (t >= start - 12 * M && t < start - 4 * M) out.push("ten_min");
  if (t >= start && t < start + 9 * M) out.push("live_now");
  return out;
}

/** "noon MT" or "2:30 PM MT". */
export function classTimeMT(startIso: string): string {
  const d = new Date(startIso);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(d);
  const get = (k: string) => parts.find((p) => p.type === k)?.value ?? "";
  if (get("hour") === "12" && get("minute") === "00" && get("dayPeriod") === "PM") return "noon MT";
  return `${get("hour")}:${get("minute")} ${get("dayPeriod")} MT`;
}

const STOP = "Reply STOP to opt out.";
export function textBody(kind: TextKind, o: { startIso: string; link: string }): string {
  const at = classTimeMT(o.startIso);
  switch (kind) {
    case "workbook":
      return `LifeCharter: today's MasterClass is at ${at}. Download and print your workbook, or open it on a tablet: ${o.link} ${STOP}`;
    case "hour_before":
      return `LifeCharter: your MasterClass starts at ${at}, in about an hour. Join here: ${o.link} ${STOP}`;
    case "ten_min":
      return `LifeCharter: starting in 10 minutes. Join here: ${o.link} ${STOP}`;
    case "live_now":
      return `LifeCharter: we're live now. Join here: ${o.link} ${STOP}`;
  }
}

/** A contact we may text: a valid US/Canada mobile, consent given, and no STOP. */
export function textable(c: { phone: string | null; sms_consent_at: string | null; sms_opted_out_at: string | null }): string | null {
  if (!c.sms_consent_at || c.sms_opted_out_at) return null;
  return toE164(c.phone);
}
