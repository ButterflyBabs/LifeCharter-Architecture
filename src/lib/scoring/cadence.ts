// Recommended cadence for each assessment / check-in. The app encourages
// clients to return on these rhythms so scores stay current — a light,
// recurring loop rather than a one-time grade.

export type Cadence = "monthly" | "quarterly" | "semiannual" | "annual";

export const CADENCE_LABEL: Record<Cadence, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannual: "Semi-annually",
  annual: "Annually",
};

export const CADENCE_DAYS: Record<Cadence, number> = {
  monthly: 30,
  quarterly: 91,
  semiannual: 182,
  annual: 365,
};

export interface AssessmentCadence {
  type: string; // assessment_type key used in the data
  label: string;
  href: string;
  cadence: Cadence;
  blurb: string;
}

// The four rhythms: a quick monthly pulse, a quarterly profit re-read, a
// semi-annual brain refresh, and a deep annual soul revisit.
export const ASSESSMENT_CADENCES: AssessmentCadence[] = [
  {
    type: "quick_pulse",
    label: "Quick Pulse Check-in",
    href: "/assessments/quick-pulse-checkin",
    cadence: "monthly",
    blurb: "A fast 18-question pulse to keep your scores and trend line current.",
  },
  {
    type: "profit_architecture",
    label: "Profit Assessment",
    href: "/assessments/profit",
    cadence: "quarterly",
    blurb: "Re-read your 12 business dimensions each quarter.",
  },
  {
    type: "brain",
    label: "Brain Assessment",
    href: "/assessments/brain",
    cadence: "semiannual",
    blurb: "Refresh the operational picture twice a year.",
  },
  {
    type: "soul",
    label: "Soul Assessment",
    href: "/assessments/soul",
    cadence: "annual",
    blurb: "A deep annual revisit of purpose, values, and story.",
  },
];

export type CheckinStatus = "never" | "due" | "soon" | "ok";

export function statusFor(lastTaken: string | null, cadence: Cadence, now = Date.now()): {
  status: CheckinStatus;
  nextDue: string | null;
  daysUntilDue: number | null;
} {
  if (!lastTaken) return { status: "never", nextDue: null, daysUntilDue: null };
  const last = new Date(lastTaken).getTime();
  if (Number.isNaN(last)) return { status: "never", nextDue: null, daysUntilDue: null };
  const dueMs = last + CADENCE_DAYS[cadence] * 24 * 60 * 60 * 1000;
  const daysUntilDue = Math.round((dueMs - now) / (24 * 60 * 60 * 1000));
  const status: CheckinStatus = daysUntilDue <= 0 ? "due" : daysUntilDue <= 7 ? "soon" : "ok";
  return { status, nextDue: new Date(dueMs).toISOString(), daysUntilDue };
}
