import type { GuideEntry } from "./types";

// The User Guide search: runs in the browser over the guide's own words, so no keystroke ever costs an AI call.
// Forgives small typos and ignores the small words in "how do I add a task".
const SMALL_WORDS = new Set(["a", "add", "an", "and", "are", "can", "create", "do", "does", "find", "for", "get", "how", "i", "in", "is", "it", "make", "me", "my", "new", "of", "on", "or", "see", "set", "the", "to", "use", "what", "where", "with"]);

export const guideWords = (text: string) =>
  text.toLowerCase().replace(/[’']/g, "").split(/[^a-z0-9]+/).filter(Boolean);

// How many single-letter slips still count as the same word: none for short words, where a slip makes another word.
const allowedSlips = (word: string) => (word.length < 4 ? 0 : word.length < 8 ? 1 : 2);

// Edit distance, counting two swapped neighbours as one slip. Stops early once it is past `limit`.
export function slips(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let before: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) best = Math.min(best, before[j - 2] + 1);
      row[j] = best;
    }
    if (Math.min(...row) > limit) return limit + 1;
    before = prev;
    prev = row;
  }
  return prev[b.length];
}

// 3 = the whole word, 2 = the start of a word (suggestions as you type), 1 = a typo of a word, 0 = no match.
function wordMatch(term: string, words: string[]): number {
  let best = 0;
  for (const w of words) {
    if (w === term) return 3;
    if (term.length >= 2 && w.startsWith(term)) best = Math.max(best, 2);
    else if (best === 0 && slips(term, w.replace(/s$/, ""), allowedSlips(term)) <= allowedSlips(term)) best = 1;
  }
  return best;
}

export interface GuideHit {
  entry: GuideEntry;
  section?: { id: string; title: string };
  score: number;
}

export function searchGuide(query: string, entries: GuideEntry[], limit = 8): GuideHit[] {
  const all = guideWords(query);
  const terms = all.filter((w) => !SMALL_WORDS.has(w));
  const asked = terms.length ? terms : all;
  if (!asked.length) return [];
  const hits: GuideHit[] = [];
  for (const entry of entries) {
    const name = guideWords(entry.name);
    const keywords = guideWords(entry.keywords.join(" "));
    const body = guideWords(`${entry.what} ${entry.where}`);
    const sections = (entry.sections ?? []).map((s) => ({ s, words: guideWords(`${s.title} ${s.keywords.join(" ")}`) }));
    let score = 0;
    let matched = 0;
    const sectionScore = new Map<string, number>();
    for (const term of asked) {
      const inName = wordMatch(term, name) * 12;
      const inKeywords = wordMatch(term, keywords) * 9;
      const inBody = wordMatch(term, body) * 2;
      let inSection = 0;
      for (const { s, words } of sections) {
        const m = wordMatch(term, words) * 7;
        if (m) sectionScore.set(s.id, (sectionScore.get(s.id) ?? 0) + m);
        inSection = Math.max(inSection, m);
      }
      const top = Math.max(inName, inKeywords, inBody, inSection);
      if (top) {
        matched += 1;
        score += top;
      }
    }
    // Most of what was asked has to be there, so one shared word does not bring back half the guide.
    if (matched < Math.ceil(asked.length * 0.6)) continue;
    const bestSection = sections
      .map(({ s }) => ({ s, n: sectionScore.get(s.id) ?? 0 }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)[0];
    const nameLed = asked.every((t) => wordMatch(t, name) >= 2);
    hits.push({
      entry,
      score: score + matched * 100,
      ...(bestSection && !nameLed ? { section: { id: bestSection.s.id, title: bestSection.s.title } } : {}),
    });
  }
  // On a tie the shorter name is the closer match: Contacts before Contact record.
  return hits.sort((a, b) => b.score - a.score || a.entry.name.length - b.entry.name.length).slice(0, limit);
}

// The list at the top of the guide: what clients open most, once there is enough to go on, else the starter list.
export const GUIDE_FREQUENT_MIN_OPENS = 50;
export function guideHomeList<T extends { id: string; starter?: boolean }>(entries: T[], counts: { entry_id: string; opens: number }[]) {
  const total = counts.reduce((sum, c) => sum + c.opens, 0);
  const most = [...counts]
    .sort((a, b) => b.opens - a.opens)
    .flatMap((c) => entries.filter((e) => e.id === c.entry_id))
    .slice(0, 4);
  return total >= GUIDE_FREQUENT_MIN_OPENS && most.length === 4 ? { title: "Frequently used", list: most } : { title: "Good places to start", list: entries.filter((e) => e.starter) };
}

// A person's recent searches, newest first, no repeats (saved on their profile through /api/me/preferences).
export const GUIDE_RECENT_MAX = 8;
export function cleanGuideRecent(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const text = item.trim().slice(0, 80);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    out.push(text);
    if (out.length === GUIDE_RECENT_MAX) break;
  }
  return out;
}
