// Courses & Memberships (task 1152): the rules for what a member can open, the pure parts. A program is
//   cohort      a group with dates; a lesson opens on its date (opens_on)
//   course      self-paced; a lesson opens N days after the member joined (open_after_days), optionally for a set
//               number of days of access (access_days)
//   membership  ongoing; lessons drip the same way and access lasts while they stay a member (a cancelled
//               subscription ends it)
// Both a date and a day count may be set on one lesson; it opens when both have passed.

export type ProgramKind = "cohort" | "course" | "membership";
export const KINDS: { key: ProgramKind; label: string; blurb: string }[] = [
  { key: "cohort", label: "Group program", blurb: "A group that starts together: live sessions, lessons that open on dates, a group conversation." },
  { key: "course", label: "Self-paced course", blurb: "People start any time; each lesson opens a set number of days after they join. Optional access length." },
  { key: "membership", label: "Membership", blurb: "Ongoing access to a growing library for as long as they're a member." },
];
export const kindLabel = (k: string | null | undefined) => KINDS.find((x) => x.key === k)?.label ?? "Group program";

const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** When a lesson opens for one member (YYYY-MM-DD), or null if it's open from the start. */
export function lessonOpensOn(l: { opens_on: string | null; open_after_days: number | null }, kind: ProgramKind, joinedDay: string): string | null {
  const byDays = kind !== "cohort" && l.open_after_days ? addDays(joinedDay, l.open_after_days) : null;
  const byDate = l.opens_on || null;
  if (byDays && byDate) return byDays > byDate ? byDays : byDate;
  return byDays || byDate;
}

export const lessonOpen = (l: { opens_on: string | null; open_after_days: number | null }, kind: ProgramKind, joinedDay: string, today: string) => {
  const on = lessonOpensOn(l, kind, joinedDay);
  return !on || on <= today;
};

/** The last day of a member's access to a course with an access length (null = no end). */
export function accessEndsOn(kind: ProgramKind, accessDays: number | null, joinedDay: string): string | null {
  return kind === "course" && accessDays ? addDays(joinedDay, accessDays) : null;
}

export const accessEnded = (kind: ProgramKind, accessDays: number | null, joinedDay: string, today: string) => {
  const end = accessEndsOn(kind, accessDays, joinedDay);
  return Boolean(end && end < today);
};

/** Done lessons out of all lessons, as a whole percent. */
export const percent = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

/** Lessons grouped by module, keeping their order (lessons with no module sit under ""). */
export function byModule<T extends { module: string | null }>(lessons: T[]): { module: string; lessons: T[] }[] {
  const out: { module: string; lessons: T[] }[] = [];
  for (const l of lessons) {
    const m = (l.module || "").trim();
    const last = out[out.length - 1];
    if (last && last.module === m) last.lessons.push(l);
    else out.push({ module: m, lessons: [l] });
  }
  return out;
}
