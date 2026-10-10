// "Effective" and "Last updated" dates shown at the top of each legal page.
//
// The page text itself lives in src/app/legal/<page>/page.tsx. `hash` is a fingerprint of that file; the test in
// tests/legal-dates.test.ts fails if a legal page is edited without refreshing its date, so the date can never lag
// behind the text. After editing a legal page, run:  npm run legal:stamp
// (it sets "updated" to today, Mountain time, for each page whose text changed, and refreshes the hash).
export const LEGAL_PAGES = {
  "terms-of-sale": { effective: "October 1, 2026", updated: "October 10, 2026", hash: "35be2e5c30148856" },
  "privacy-policy": { effective: "October 10, 2026", updated: "October 10, 2026", hash: "6412475d250172c7" },
  "year-1-agreement": { effective: "October 1, 2026", updated: "October 10, 2026", hash: "566c8b70148e6590" },
  "community-guidelines": { effective: "September 23, 2026", updated: "September 23, 2026", hash: "d0628f1eb5edc8aa" },
} as const;
