// Turns a client's stored assessment answers into the compact text the AI
// assistant reads. Pure (no database) so it can be tested on its own.

export interface AnswerRow {
  assessment_type: string;
  section_name: string | null;
  question_text: string;
  answer_text: string | null;
  answer_value: unknown;
  score: number | null;
  max_score: number | null;
  answered_at?: string | null;
}

const MAX_CHARS = 9000;

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

// Take up to `cap` items spread evenly across sections (round-robin) so one
// long section can't crowd out the rest. Rows arrive newest-first, so within a
// section the most recent answers win.
export function sampleBySection<T extends { section_name: string | null }>(items: T[], cap: number): T[] {
  const bySection = new Map<string, T[]>();
  for (const it of items) {
    const k = it.section_name || "";
    bySection.set(k, [...(bySection.get(k) ?? []), it]);
  }
  const lists = Array.from(bySection.values());
  const out: T[] = [];
  for (let i = 0; out.length < cap; i++) {
    let took = false;
    for (const l of lists) {
      if (l[i] && out.length < cap) {
        out.push(l[i]);
        took = true;
      }
    }
    if (!took) break;
  }
  return out;
}

const isSensitive = (r: AnswerRow) => (r.answer_value as { sensitive?: boolean } | null)?.sensitive === true;

export function formatAnswerSections(rows: AnswerRow[]): string {
  const usable = rows.filter((r) => !isSensitive(r) && oneLine(r.answer_text || "") !== "");
  const of = (t: string) => usable.filter((r) => r.assessment_type === t);
  const sections: string[] = [];

  const prose = (label: string, list: AnswerRow[], cap: number) => {
    const picked = sampleBySection(list, cap);
    if (!picked.length) return;
    sections.push(
      `From their ${label} assessment (their own answers${list.length > picked.length ? `; ${picked.length} of ${list.length} shown` : ""}):\n` +
        picked.map((r) => `- [${r.section_name || "General"}] ${clip(oneLine(r.question_text), 110)} → ${clip(oneLine(r.answer_text || ""), 320)}`).join("\n")
    );
  };
  prose("Brain", of("brain"), 26);
  prose("Soul", of("soul"), 22);

  const profit = of("profit_architecture");
  if (profit.length) {
    const scored = profit.filter((r) => r.score !== null && r.max_score);
    const weakest = scored.length
      ? [...scored].sort((a, b) => (a.score as number) / (a.max_score as number) - (b.score as number) / (b.max_score as number)).slice(0, 10)
      : sampleBySection(profit, 10);
    sections.push(
      `From their Profit assessment (${scored.length ? "lowest-rated answers first" : "sample"}):\n` +
        weakest
          .map(
            (r) =>
              `- [${r.section_name || "General"}] ${clip(oneLine(r.question_text), 110)} → ${clip(oneLine(r.answer_text || ""), 160)}` +
              (r.score !== null && r.max_score ? ` (${r.score}/${r.max_score})` : "")
          )
          .join("\n")
    );
  }

  return clip(sections.join("\n\n"), MAX_CHARS);
}
