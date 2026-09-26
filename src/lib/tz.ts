// Start and end of "today" (or of the next `days` days, starting today) in a given IANA timezone, returned as UTC ISO
// instants. Calendar APIs and time formatting run on the server (UTC), so we
// must anchor "today" and the displayed times to the viewer's real timezone.
export function dayWindowUtc(timeZone: string, days = 1): { startISO: string; endISO: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const y = get("year");
  const m = get("month");
  const d = get("day");

  // The UTC instant at which the wall-clock in `timeZone` is midnight of y-m-d.
  const midnightUtc = (yy: number, mm: number, dd: number) => {
    const guess = Date.UTC(yy, mm - 1, dd, 0, 0, 0);
    const asTz = new Date(new Date(guess).toLocaleString("en-US", { timeZone }));
    const asUtc = new Date(new Date(guess).toLocaleString("en-US", { timeZone: "UTC" }));
    return new Date(guess - (asTz.getTime() - asUtc.getTime()));
  };

  return {
    startISO: midnightUtc(y, m, d).toISOString(),
    endISO: midnightUtc(y, m, d + days).toISOString(), // Date.UTC rolls month/year over
  };
}

// The UTC instant at which the wall clock in `timeZone` reads `day` (YYYY-MM-DD)
// at `time` (HH:MM).
export function zonedToUtcISO(day: string, time: string, timeZone: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  const asTz = new Date(new Date(guess).toLocaleString("en-US", { timeZone }));
  const asUtc = new Date(new Date(guess).toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess - (asTz.getTime() - asUtc.getTime())).toISOString();
}

// The calendar date (YYYY-MM-DD) an instant falls on in `timeZone`.
export function dayInTz(iso: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof iso === "string" ? new Date(iso) : iso
  );
}

// "3:00 PM" for an instant in `timeZone`.
export function timeInTz(iso: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(
    typeof iso === "string" ? new Date(iso) : iso
  );
}
