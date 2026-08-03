// Start and end of "today" in a given IANA timezone, returned as UTC ISO
// instants. Calendar APIs and time formatting run on the server (UTC), so we
// must anchor "today" and the displayed times to the viewer's real timezone.
export function dayWindowUtc(timeZone: string): { startISO: string; endISO: string } {
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
    endISO: midnightUtc(y, m, d + 1).toISOString(), // Date.UTC rolls month/year over
  };
}
