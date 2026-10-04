// Ranks a client's open tasks the same way every time, so the AI assistant can answer
// "my top three priorities" and "the five easiest to finish" from facts instead of guessing.
// Pure (no database) so it can be tested on its own.

export interface RankTask {
  title: string;
  status: string; // backlog | today | in_progress | waiting
  priority: string | null; // critical | high | medium | low | optional
  energy: string | null; // low | medium | high: the effort level the client set
  dueDay: string | null; // YYYY-MM-DD in the client's time zone
  overdue: boolean;
}

const PRIORITY_WEIGHT: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, optional: 0 };
const ENERGY_WEIGHT: Record<string, number> = { low: 1, medium: 2, high: 3 };

const dayDiff = (a: string, b: string) => Math.round((Date.parse(a + "T00:00:00Z") - Date.parse(b + "T00:00:00Z")) / 86400000);

// Higher = more important to do now. Overdue and critical work first, then what is due soonest,
// then priority, then what the client already pulled into today or started.
export function priorityScore(t: RankTask, today: string): number {
  let s = (PRIORITY_WEIGHT[t.priority ?? "medium"] ?? 2) * 10;
  if (t.overdue) {
    const late = t.dueDay ? Math.max(1, dayDiff(today, t.dueDay)) : 1;
    s += 40 + Math.min(late, 10);
  } else if (t.dueDay) {
    const d = dayDiff(t.dueDay, today);
    if (d <= 0) s += 30;
    else if (d <= 3) s += 20;
    else if (d <= 7) s += 10;
  }
  if (t.status === "today") s += 8;
  else if (t.status === "in_progress") s += 6;
  return s;
}

function why(t: RankTask, today: string): string {
  const bits: string[] = [];
  if (t.priority) bits.push(t.priority);
  if (t.overdue && t.dueDay) bits.push(`overdue since ${t.dueDay}`);
  else if (t.dueDay) bits.push(t.dueDay === today ? "due today" : `due ${t.dueDay}`);
  if (t.status === "today") bits.push("on today's list");
  else if (t.status === "in_progress") bits.push("in progress");
  return bits.join(", ");
}

const q = (t: RankTask) => `"${t.title.slice(0, 80)}"`;

export function rankTasksText(all: RankTask[], today: string): string {
  const doable = all.filter((t) => t.status !== "waiting"); // tasks waiting on someone else can't be done now
  const waiting = all.filter((t) => t.status === "waiting");
  if (!all.length) return "";
  const lines: string[] = [];

  const byPriority = [...doable].sort((a, b) => priorityScore(b, today) - priorityScore(a, today));
  lines.push(
    "Their tasks, ranked by the Suite (use these exact lists when asked for top priorities or easiest tasks; do not re-rank):\n" +
      "TOP PRIORITY TO DO NEXT (overdue and critical first, then due soonest):\n" +
      byPriority.slice(0, 8).map((t, i) => `${i + 1}. ${q(t)} (${why(t, today)})`).join("\n")
  );

  // Easiest = the lowest effort level they set; among equals, the more important and sooner first.
  const easy = [...doable].sort(
    (a, b) =>
      (ENERGY_WEIGHT[a.energy ?? "medium"] ?? 2) - (ENERGY_WEIGHT[b.energy ?? "medium"] ?? 2) ||
      priorityScore(b, today) - priorityScore(a, today)
  );
  const lowCount = doable.filter((t) => t.energy === "low").length;
  lines.push(
    `EASIEST TO FINISH (lowest effort level they set first; ${lowCount} task${lowCount === 1 ? " is" : "s are"} marked low effort${lowCount < 5 ? ", so the rest of this list are medium effort, mention that honestly" : ""}):\n` +
      easy.slice(0, 8).map((t, i) => `${i + 1}. ${q(t)} (effort: ${t.energy ?? "medium"}${t.priority ? `, ${t.priority}` : ""}${t.dueDay ? `, due ${t.dueDay}` : ""})`).join("\n")
  );

  const counts = new Map<string, number>();
  for (const t of all) counts.set(t.status, (counts.get(t.status) ?? 0) + 1);
  lines.push(`Open tasks by status: ${Array.from(counts.entries()).map(([k, v]) => `${k.replace("_", " ")} ${v}`).join(", ")}.`);
  if (waiting.length) lines.push(`Waiting on someone else (not doable now): ${waiting.slice(0, 6).map(q).join(", ")}${waiting.length > 6 ? `, and ${waiting.length - 6} more` : ""}.`);
  lines.push(
    "Rules for task questions: name tasks exactly as written, give a few words on why each is ranked where it is, never invent time estimates (they only set a low/medium/high effort level, and most tasks default to medium), and if fewer tasks exist than they asked for say so. You can only read their tasks, not change them: point them to the Tasks page or Daily Compass to move one to today."
  );
  return lines.join("\n");
}
