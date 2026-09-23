// A soft colour per program channel, so program posts stand apart from
// Community posts in the Home feed. Stored as "r, g, b" and applied at low
// opacity, so it works on both the light and the dark theme.
const BY_SLUG: Record<string, string> = {
  "lifecharter-program": "123, 92, 168", // butterfly lavender
  "command-suite": "46, 124, 131", // teal
  "coaching-certification": "76, 122, 90", // sage
  "command-shift-masterclass": "196, 140, 40", // amber
  "command-shift-challenge": "200, 90, 70", // ember
  incubator: "60, 110, 180", // sky
  "soul-sessions": "150, 80, 130", // plum
  alumni: "184, 146, 63", // gold
  "certified-coaches": "90, 100, 120", // slate
};
const FALLBACK = ["110, 90, 160", "40, 130, 120", "180, 110, 60", "70, 110, 170", "150, 90, 110"];

export function tintFor(slug: string): string {
  if (BY_SLUG[slug]) return BY_SLUG[slug];
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FALLBACK[h % FALLBACK.length];
}
