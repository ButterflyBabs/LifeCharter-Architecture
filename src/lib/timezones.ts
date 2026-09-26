// Time zones offered in the dashboard picker and Settings. IANA ids, curated
// rather than the full ~400-entry list so the choice stays easy to scan.
export const TIMEZONES: { value: string; label: string }[] = [
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "America/Halifax", label: "Atlantic Time (Halifax)" },
  { value: "America/St_Johns", label: "Newfoundland (St. John's)" },
  { value: "America/Mexico_City", label: "Mexico City" },
  { value: "America/Bogota", label: "Bogotá" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Central Europe (Paris)" },
  { value: "Europe/Athens", label: "Eastern Europe (Athens)" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Africa/Lagos", label: "West Africa (Lagos)" },
  { value: "Africa/Cairo", label: "Cairo" },
  { value: "Africa/Johannesburg", label: "Johannesburg" },
  { value: "Africa/Nairobi", label: "Nairobi" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Asia/Bangkok", label: "Bangkok" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Seoul", label: "Seoul" },
  { value: "Australia/Perth", label: "Perth" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Pacific/Auckland", label: "Auckland" },
  { value: "UTC", label: "UTC" },
];

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// The curated list, plus the current value if it isn't in it (e.g. an
// auto-detected zone), so a <select> can always show what is in effect.
export function timezoneOptions(current?: string): { value: string; label: string }[] {
  if (current && !TIMEZONES.some((t) => t.value === current)) {
    return [{ value: current, label: current.replace(/_/g, " ") }, ...TIMEZONES];
  }
  return TIMEZONES;
}
