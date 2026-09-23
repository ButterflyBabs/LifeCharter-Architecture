// The Alignment Journal — private weekly intentions, wins and reflections.

export type JournalKind = "intention" | "win" | "reflection";

export interface JournalEntry {
  id: string;
  user_id: string;
  kind: JournalKind;
  week_start: string; // YYYY-MM-DD, the Monday of that week
  headline: string | null;
  private_note: string | null;
  community_note: string | null;
  dimension: string | null;
  rating: number | null;
  carry_forward: string | null;
  shared_post_id: string | null;
  focus_id?: string | null;
  created_at: string;
  updated_at: string;
}

// A 90-day focus (Collective Plus): one bigger goal weekly intentions roll up into.
export interface JournalFocus {
  id: string;
  user_id: string;
  title: string;
  why: string | null;
  starts_on: string;
  ends_on: string;
  status: "active" | "done" | "released";
  created_at: string;
  updated_at: string;
}

export function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// The Monday (YYYY-MM-DD) of the week `d` falls in, in the member's own time zone.
export function weekStartOf(d = new Date()): string {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  local.setDate(local.getDate() - ((local.getDay() + 6) % 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
}

export function weekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const f = (x: Date, withYear = false) =>
    x.toLocaleDateString(undefined, { month: "short", day: "numeric", year: withYear ? "numeric" : undefined });
  return `${f(start)} – ${f(end, end.getFullYear() !== new Date().getFullYear())}`;
}

export const JOURNAL_PROMPTS: Record<JournalKind, { title: string; headline: string; note: string }> = {
  intention: {
    title: "This week's intention",
    headline: "What are you aligning with this week?",
    note: "Why this matters to you, what might get in the way, how you'll know it's done…",
  },
  win: {
    title: "A win",
    headline: "What did you move forward?",
    note: "What happened, how it felt, what made it possible…",
  },
  reflection: {
    title: "Weekly reflection",
    headline: "In a sentence, how was your week?",
    note: "What you noticed, what surprised you, what you'd do differently…",
  },
};

// Community pathway each shareable kind posts into (in the "commons" channel).
export const SHARE_PATHWAY: Partial<Record<JournalKind, string>> = {
  intention: "this-weeks-intention",
  win: "wins",
};
