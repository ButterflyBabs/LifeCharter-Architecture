// Team Huddle: the weekly LifeCharter team call (agenda, to-dos, recording, transcript, AI summary).
// Pure helpers (no database or network) so the shape and the 30-minute rule can be tested.

export const HUDDLE_MAX_MINUTES = 30;

export interface AgendaItem { id: string; text: string; owner: string }
export interface AgendaSection { id: string; title: string; minutes: number; items: AgendaItem[] }
export interface HuddleAction { id: string; text: string; owner: string; due: string; done: boolean }
export interface HuddleSummary {
  summary: string;
  wins: string[];
  decisions: string[];
  hot_topics: string[];
  action_items: { text: string; owner: string; due: string }[];
  follow_ups: string[];
  made_at: string;
}
export interface Huddle {
  id: string;
  call_date: string;
  start_time: string;
  title: string;
  status: "upcoming" | "done";
  agenda: AgendaSection[];
  actions: HuddleAction[];
  notes: string;
  recording_url: string;
  transcript: string;
  summary: HuddleSummary | null;
  created_at: string;
  updated_at: string;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const s = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

export const totalMinutes = (agenda: AgendaSection[]) => agenda.reduce((sum, a) => sum + (Number.isFinite(a.minutes) ? a.minutes : 0), 0);

/** The standard 30-minute agenda for a new call. The sections add up to exactly 30 minutes. */
export function templateAgenda(): AgendaSection[] {
  const sec = (title: string, minutes: number, prompts: string[]): AgendaSection => ({
    id: uid(),
    title,
    minutes,
    items: prompts.map((text) => ({ id: uid(), text, owner: "" })),
  });
  return [
    sec("Head up: check-in 🦋", 3, ["One word for how you are, and one win from this week (everyone, 30 seconds each).", "Ground rules: 30 minutes, one owner per to-do, anything off-topic goes to the Parking lot."]),
    sec("Wins on the wall 🏆", 5, ["Wins since the last huddle (add them above the call, or say them out loud).", "Numbers worth knowing: registrations, DMs sent, bookings, sales."]),
    sec("Hot topics 🔥", 9, ["Topic 1: what is the decision or help needed?", "Topic 2: what is the decision or help needed?"]),
    sec("Urgent: needs us this week 🚨", 8, ["Anything with a date on it in the next 7 days.", "Anything blocked: who is stuck and what unblocks them?"]),
    sec("To-dos and owners ✅", 3, ["Read back every new to-do with ONE owner and a date."]),
    sec("Wings out: close 🦋", 2, ["One-line recap. What does each person do first?", "Next huddle date and time."]),
    { id: uid(), title: "Parking lot (not timed)", minutes: 0, items: [] },
  ];
}

/** Open to-dos from the previous call carry over to a new one (done items stay behind). */
export function carryOver(prev: HuddleAction[]): HuddleAction[] {
  return prev.filter((a) => !a.done).map((a) => ({ ...a, id: uid() }));
}

export function newAction(text = "", owner = ""): HuddleAction {
  return { id: uid(), text, owner, due: "", done: false };
}

/** Clean what comes from the browser: right shapes, bounded lengths, minutes 0 to 60. */
export function cleanAgenda(input: unknown): AgendaSection[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 20).map((raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const items = Array.isArray(r.items) ? r.items.slice(0, 40) : [];
    const minutes = typeof r.minutes === "number" && Number.isFinite(r.minutes) ? Math.max(0, Math.min(60, Math.round(r.minutes))) : 0;
    return {
      id: s(r.id, 24) || uid(),
      title: s(r.title, 120),
      minutes,
      items: items.map((it) => {
        const i = (it ?? {}) as Record<string, unknown>;
        return { id: s(i.id, 24) || uid(), text: s(i.text, 600), owner: s(i.owner, 60) };
      }),
    };
  });
}

export function cleanActions(input: unknown): HuddleAction[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 100).map((raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const due = s(r.due, 10);
    return { id: s(r.id, 24) || uid(), text: s(r.text, 600), owner: s(r.owner, 60), due: /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : "", done: r.done === true };
  });
}

const strList = (v: unknown, n = 12, len = 400): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).slice(0, n).map((x) => (x as string).trim().slice(0, len)) : [];

/** Turn the model's JSON into a safe summary object (never trusts shape or length). */
export function cleanSummary(raw: unknown, madeAt = new Date().toISOString()): HuddleSummary {
  const r = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(r.action_items) ? r.action_items.slice(0, 40) : [];
  return {
    summary: s(r.summary, 2500).trim(),
    wins: strList(r.wins),
    decisions: strList(r.decisions),
    hot_topics: strList(r.hot_topics),
    action_items: items
      .map((it) => {
        const i = (it ?? {}) as Record<string, unknown>;
        const due = s(i.due, 10);
        return { text: s(i.text, 400).trim(), owner: s(i.owner, 60).trim(), due: /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : "" };
      })
      .filter((i) => i.text),
    follow_ups: strList(r.follow_ups),
    made_at: madeAt,
  };
}

export const normEmail = (e: unknown) => (typeof e === "string" ? e.trim().toLowerCase() : "");
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Plain-text version of a call, used for the email to the team. */
export function huddleToText(h: Pick<Huddle, "title" | "call_date" | "start_time" | "agenda" | "actions" | "notes">): string {
  const lines: string[] = [];
  lines.push(`${h.title}`);
  lines.push(`${h.call_date} at ${h.start_time} MT. ${totalMinutes(h.agenda)} minutes.`);
  lines.push("");
  for (const a of h.agenda) {
    const range = a.minutes > 0 ? ` (${a.minutes} min)` : "";
    lines.push(`${a.title}${range}`);
    for (const it of a.items) if (it.text.trim()) lines.push(`  - ${it.text}${it.owner ? ` [${it.owner}]` : ""}`);
    lines.push("");
  }
  const open = h.actions.filter((x) => !x.done && x.text.trim());
  if (open.length) {
    lines.push("To-dos");
    for (const x of open) lines.push(`  - ${x.text}${x.owner ? ` [${x.owner}]` : ""}${x.due ? ` (due ${x.due})` : ""}`);
    lines.push("");
  }
  if (h.notes.trim()) lines.push("Notes", h.notes.trim(), "");
  lines.push("Head up. Wings out.");
  return lines.join("\n");
}
