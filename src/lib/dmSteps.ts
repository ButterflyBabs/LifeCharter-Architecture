// DM scripts are grouped by platform and numbered by the pipeline step they are sent from (Babs, 2026-11-04):
//   1 Opener (To reach out) · 2 Invite (Connected / DM sent / In conversation) · 3 Follow-up, no reply (Invited) ·
//   4 Welcome, just registered · 5 Reminder, the day before · 6 Reminder, the first day (Registered) ·
//   7 After, they came (Attended) · 8 After, they missed it (No-show) · Nurture 1 to 5 (Nurture).
// The number sits in the title ("Command Seat DM · LinkedIn 2 · Invite"), which is what the DM window reads.

export const DM_PREFIX = /^(MasterClass|Command Seat|Incubator) DM · /;
export const dmLabel = (title: string): string => title.replace(DM_PREFIX, "");

/** Order within a platform: steps 1 to 8, then Nurture 1 to 5, then anything else (day-before nudges, voice notes). */
export function stepOrder(title: string): number {
  const n = title.match(/\bNurture (\d)\b/i);
  if (n) return 100 + Number(n[1]);
  const s = title.match(/\b(\d{1,2}) · /);
  if (s) return Number(s[1]);
  return 500;
}

export const PLATFORM_NAMES: Record<string, string> = { LI: "LinkedIn", FB: "Facebook", IG: "Instagram", WA: "WhatsApp" };
export const PLATFORM_ORDER = ["LI", "FB", "IG", "WA"];

/** The one platform a DM script belongs to, or null when it is for all of them. */
export function scriptPlatform(platforms: string[] | null | undefined): string | null {
  const real = (platforms ?? []).filter((p) => PLATFORM_ORDER.includes(p));
  return real.length === 1 ? real[0] : null;
}

/** Which step a card in this stage is usually sent next (the picker offers it first). */
export function suggestedStep(stageKey: string | null | undefined): number | null {
  switch (stageKey) {
    case "to_reach": return 1;
    case "connected": case "sent": case "followed_up": case "conversation": return 2;
    case "invited": return 3;
    case "registered": return 4;
    case "attended": return 7;
    case "no_show": return 8;
    default: return null; // nurture is handled by the series; waiting stages have nothing to send
  }
}

// The nurture series: 5 DMs over 30 days (Days 0, 7, 14, 21 and 30), the same on every platform.
export const NURTURE_TOTAL = 5;
export const NURTURE_GAP_DAYS: Record<number, number | null> = { 1: 7, 2: 7, 3: 7, 4: 9, 5: null };
