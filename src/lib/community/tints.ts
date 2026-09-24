// A soft colour per program channel, so program posts stand apart from
// Community posts in the Home feed. Every channel wears its home brand
// (Collective board, Sept 2026). Stored as "r, g, b" and applied at low
// opacity, so it works on both the light and the dark theme.
const BY_SLUG: Record<string, string> = {
  // Shared spaces — warm gold
  "start-here": "212, 175, 99", // gold
  commons: "212, 175, 99", // gold
  // LifeCharter channels — deep teal
  "lifecharter-program": "15, 91, 99", // deep teal
  incubator: "15, 91, 99", // deep teal
  "soul-sessions": "15, 91, 99", // deep teal
  alumni: "15, 91, 99", // deep teal
  // Command Suite channels — indigo slate (#1F2B59, so an 8% wash shows)
  "command-suite": "31, 43, 89", // indigo
  "command-shift-masterclass": "31, 43, 89", // indigo
  "command-shift-challenge": "31, 43, 89", // indigo
  "coaching-certification": "31, 43, 89", // indigo
  "certified-coaches": "31, 43, 89", // indigo
};
const FALLBACK = "148, 163, 184"; // misty blue

export function tintFor(slug: string): string {
  return BY_SLUG[slug] ?? FALLBACK;
}
