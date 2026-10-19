// "Effective" and "Last updated" dates shown at the top of each legal page.
//
// The page text itself lives in src/app/legal/<page>/page.tsx. `hash` is a fingerprint of that file; the test in
// tests/legal-dates.test.ts fails if a legal page is edited without refreshing its date, so the date can never lag
// behind the text. After editing a legal page, run:  npm run legal:stamp
// (it sets "updated" to today, Mountain time, for each page whose text changed, and refreshes the hash).
export const LEGAL_PAGES = {
  "terms-of-sale": { effective: "October 1, 2026", updated: "October 18, 2026", hash: "9d3ce8aac446eda6" },
  "privacy-policy": { effective: "October 10, 2026", updated: "October 19, 2026", hash: "d93de28f510027d7" },
  "year-1-agreement": { effective: "October 1, 2026", updated: "October 14, 2026", hash: "a7e877eb84c39119" },
  "community-guidelines": { effective: "September 23, 2026", updated: "September 23, 2026", hash: "d0628f1eb5edc8aa" },
  "text-messaging-terms": { effective: "October 19, 2026", updated: "October 19, 2026", hash: "428e89b532544a61" },
} as const;
