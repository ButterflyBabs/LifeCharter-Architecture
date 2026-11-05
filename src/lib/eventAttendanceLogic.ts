// Who came to a live workshop session, from Zoom's list of participants and the people registered for it.
// Pure, so it can be tested: the server part (eventAttendance.ts) feeds it and acts on the answer.

export const MIN_MINUTES = 5; // as in the Collective call attendance: five minutes or more counts as attending

export interface Registrant { id: string; email: string; firstName: string | null; lastName: string | null }
export interface Participant { email: string; name: string; minutes: number } // one entry per person, minutes summed across joins

export const normName = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();

/** Merge a participant list (one row per join) into one row per person: by email when there is one, else by display name. */
export function mergeParticipants(rows: { email: string; name: string; durationSeconds: number }[]): Participant[] {
  const by = new Map<string, Participant>();
  for (const r of rows) {
    const email = (r.email || "").trim().toLowerCase();
    const key = email || `name:${normName(r.name)}`;
    if (key === "name:") continue;
    const mins = r.durationSeconds / 60;
    const cur = by.get(key);
    if (cur) cur.minutes += mins;
    else by.set(key, { email, name: r.name.trim(), minutes: mins });
  }
  return Array.from(by.values()).map((p) => ({ ...p, minutes: Math.round(p.minutes) }));
}

export interface Matched { attended: string[]; // registrant ids
  byEmail: number; byName: number; unmatched: Participant[]; emailCoverage: number }

/**
 * A registrant came when a participant with their email (or, failing that, their exact first and last name, and only when
 * that name belongs to ONE registrant) was in the session for at least MIN_MINUTES. Names alone are never guessed from a first name.
 */
export function matchAttendance(registrants: Registrant[], participants: Participant[]): Matched {
  const real = participants.filter((p) => p.minutes >= MIN_MINUTES);
  const byEmail = new Map(registrants.map((r) => [r.email.toLowerCase(), r]));
  const nameCount = new Map<string, number>();
  for (const r of registrants) {
    const n = normName(`${r.firstName ?? ""} ${r.lastName ?? ""}`);
    if (n.split(" ").length >= 2) nameCount.set(n, (nameCount.get(n) ?? 0) + 1);
  }
  const byName = new Map<string, Registrant>();
  for (const r of registrants) {
    const n = normName(`${r.firstName ?? ""} ${r.lastName ?? ""}`);
    if (n.split(" ").length >= 2 && nameCount.get(n) === 1) byName.set(n, r);
  }
  const hit = new Set<string>();
  let e = 0, n = 0;
  const unmatched: Participant[] = [];
  for (const p of real) {
    const viaEmail = p.email ? byEmail.get(p.email) : undefined;
    const viaName = !viaEmail ? byName.get(normName(p.name)) : undefined;
    const r = viaEmail ?? viaName;
    if (!r) { unmatched.push(p); continue; }
    if (!hit.has(r.id)) { hit.add(r.id); if (viaEmail) e++; else n++; }
  }
  const withEmail = real.filter((p) => p.email).length;
  return { attended: Array.from(hit), byEmail: e, byName: n, unmatched, emailCoverage: real.length ? withEmail / real.length : 1 };
}

/**
 * Registered people who were not there are called no-shows only when Zoom gave us emails for most of the room, because a
 * guest who joined under another name or without an email would otherwise be told "we missed you".
 */
export function canCallNoShows(m: Matched): boolean {
  return m.emailCoverage >= 0.8 && m.unmatched.length <= 2;
}

/** Has this session finished? A session counts once it is over by 10 minutes, so a still-running one is never judged. */
export function sessionOver(startIso: string, durationMin: number, now = Date.now()): boolean {
  return Date.parse(startIso) + (durationMin + 10) * 60_000 <= now;
}

/**
 * Which follow-up series a registered person starts when a workshop ends. Someone who showed up always gets the main series.
 * When the event has no separate no-show series, everyone gets the main one (as before). When it has one, a person who did not
 * show up is moved to it only if Zoom's attendance was reliable for every session; otherwise they are held (null) until it is.
 */
export function followUpKeyFor(a: { attended: boolean; followUpKey: string | null; missedKey: string | null; noShowsReliable: boolean }): string | null {
  if (a.attended) return a.followUpKey;
  if (!a.missedKey) return a.followUpKey;
  return a.noShowsReliable ? a.missedKey : null;
}

/** Were no-shows called with confidence for every day of the workshop? (one saved attendance report per session, each reliable) */
export function noShowsReliableFor(reportsJson: string[], days: number): boolean {
  const reports = reportsJson.map((j) => { try { return JSON.parse(j) as { noShowsMoved?: boolean }; } catch { return null; } }).filter(Boolean) as { noShowsMoved?: boolean }[];
  return reports.length >= Math.max(1, days) && reports.every((r) => r.noShowsMoved === true);
}
