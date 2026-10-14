// Project import helpers: a Projects "Import a project" screen reads an export from Notion, ClickUp, Asana, Trello,
// Monday, Todoist, Jira, Airtable, a spreadsheet or a plain checklist, in the browser, and sends only the mapped
// tasks to /api/projects/import. Pure functions only (no server or browser imports) so they can be checked with
// plain node and shared by the screen and the API.

import { parseDelimited } from "@/lib/contactImport";

export const PROJECT_IMPORT_LIMITS = {
  maxTasks: 2000,
  maxFileBytes: 5 * 1024 * 1024,
  title: 200,
  description: 4000,
  name: 160,
  section: 120,
} as const;

export type SourceKey = "notion" | "clickup" | "asana" | "trello" | "monday" | "todoist" | "jira" | "airtable" | "sheet" | "list";

export const SOURCE_LABEL: Record<SourceKey, string> = {
  notion: "Notion",
  clickup: "ClickUp",
  asana: "Asana",
  trello: "Trello",
  monday: "Monday.com",
  todoist: "Todoist",
  jira: "Jira",
  airtable: "Airtable",
  sheet: "a spreadsheet",
  list: "a checklist",
};

export type Target = "title" | "description" | "status" | "priority" | "start" | "due" | "assignee" | "section" | "tags" | "link" | "done" | "parent" | "ignore";

export const TARGET_LABELS: Record<Target, string> = {
  title: "Task name *",
  description: "Notes",
  status: "Status",
  priority: "Priority",
  start: "Start date",
  due: "Due date",
  assignee: "Assigned to",
  section: "Section / list",
  tags: "Labels / tags",
  link: "Link or ID",
  done: "Done? (date or yes/no)",
  parent: "Parent task",
  ignore: "Ignore",
};

export type TaskStatus = "backlog" | "today" | "in_progress" | "waiting" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type SectionUse = "milestone" | "status" | "notes";
export type DateOrder = "mdy" | "dmy";

export const STATUS_LABEL: Record<TaskStatus, string> = { backlog: "Backlog", today: "Today", in_progress: "In progress", waiting: "Waiting", done: "Done" };

export interface PTable {
  headers: string[];
  rows: string[][];
  /** Spreadsheet row number of each row, for messages. */
  rowNumbers: number[];
  source: SourceKey;
  /** A name found in the file (a Trello board name, a file name) to suggest for the project. */
  projectName?: string;
}

export interface ImportTask {
  row: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDay: string | null;
  dueDay: string | null;
  section: string;
  assignee: string;
  completedDay: string | null;
}

// ── Reading files ───────────────────────────────────────────────────────────

const norm = (h: string) =>
  h
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function detectSource(headers: string[]): SourceKey {
  const h = new Set(headers.map(norm));
  const has = (...k: string[]) => k.every((x) => h.has(x));
  if (has("task id", "task name") || has("task name", "list name") || has("space name", "task name")) return "clickup";
  if (has("task id", "name") && (h.has("section column") || h.has("projects") || h.has("created at"))) return "asana";
  if (has("card name", "list name") || has("card id", "list name")) return "trello";
  if (has("type", "content") && (h.has("indent") || h.has("priority"))) return "todoist";
  if (h.has("issue key") || (h.has("summary") && (h.has("issue type") || h.has("issue id")))) return "jira";
  if (has("name") && (h.has("subitems") || h.has("person") || h.has("timeline") || h.has("people"))) return "monday";
  if (has("name") && (h.has("assign") || h.has("created time") || h.has("last edited time") || h.has("created by") || h.has("last edited by"))) return "notion";
  return "sheet";
}

// A column heading → [target, score]; higher score wins when several columns want the same single target.
function guessOne(header: string, source: SourceKey): [Target, number] {
  const h = norm(header);
  if (!h) return ["ignore", 0];
  const exact = (...k: string[]) => k.includes(h);
  const part = (...k: string[]) => k.some((x) => h.includes(x));
  if (exact("task name", "card name", "name", "task", "title", "summary", "content", "item", "to do", "todo", "action", "action item", "task title")) return ["title", 10];
  if (part("parent")) return ["parent", 8];
  if (exact("description", "notes", "task content", "details", "card description", "desc", "body") || part("description")) return ["description", 9];
  if (exact("status", "state", "stage", "progress", "column") || h === "task status") return ["status", 9];
  if (exact("priority", "importance", "urgency") || h.endsWith(" priority")) return ["priority", 9];
  if (part("completed at", "date closed", "date done", "completed on", "resolved", "done at") || exact("completed", "done", "complete", "is done", "checked")) return ["done", 9];
  if (exact("start date", "start", "begin", "starts", "start on") || part("start date")) return ["start", 9];
  if (exact("due date", "due", "deadline", "date", "end date", "end", "finish", "target date") || part("due date", "deadline")) return ["due", exact("due date", "due") ? 10 : 8];
  if (part("timeline")) return ["due", 6];
  if (exact("assignee", "assigned to", "assign", "owner", "person", "people", "responsible", "members", "member") || part("assignee")) return ["assignee", 9];
  if (exact("section column", "section", "list name", "list", "board", "group", "project", "projects", "sprint", "folder name", "space name", "epic", "phase", "milestone") || part("section")) return ["section", exact("list name", "section", "section column") ? 9 : 6];
  if (exact("tags", "labels", "label", "tag", "category") || part("tags", "labels")) return ["tags", 8];
  if (exact("url", "link", "task id", "card id", "id", "issue key", "key", "card url", "short url") || part("url")) return ["link", 5];
  if (source === "todoist" && exact("indent")) return ["ignore", 0];
  return ["ignore", 0];
}

const SINGLE: Target[] = ["title", "status", "priority", "start", "due", "assignee", "done", "parent", "section"];

export function guessMapping(headers: string[], source: SourceKey): Target[] {
  const guesses = headers.map((h) => guessOne(h, source));
  const out: Target[] = guesses.map(([t]) => t);
  for (const t of SINGLE) {
    const idx = guesses.map((g, i) => (g[0] === t ? i : -1)).filter((i) => i >= 0);
    if (idx.length > 1) {
      const best = idx.reduce((a, b) => (guesses[b][1] > guesses[a][1] ? b : a));
      for (const i of idx) if (i !== best) out[i] = "ignore";
    }
  }
  // The same heading ("Date") is a due date; two dates with no clear start/due: the first is the start.
  return out;
}

function padTable(rows: string[][], headerIndex = 0): { headers: string[]; data: string[][]; rowNumbers: number[] } {
  const numbered = rows.map((cells, i) => ({ cells, n: i + 1 })).filter((r) => r.cells.some((c) => c.trim() !== ""));
  if (!numbered.length) return { headers: [], data: [], rowNumbers: [] };
  const width = Math.max(...numbered.map((r) => r.cells.length));
  const pad = (r: string[]) => (r.length < width ? [...r, ...Array(width - r.length).fill("")] : r);
  const head = pad(numbered[headerIndex].cells).map((h, i) => h.trim() || `Column ${i + 1}`);
  const data = numbered.slice(headerIndex + 1);
  return { headers: head, data: data.map((r) => pad(r.cells)), rowNumbers: data.map((r) => r.n) };
}

/** CSV, TSV or a pasted spreadsheet. */
export function tableFromDelimited(text: string): PTable {
  const rows = parseDelimited(text, undefined, true);
  const { headers, data, rowNumbers } = padTable(rows);
  const source = detectSource(headers);
  if (source === "todoist") {
    // A Todoist export mixes TYPE rows: "section" starts a section, "note" is a comment, "task" is the task itself.
    const iType = headers.findIndex((h) => norm(h) === "type");
    if (iType >= 0) {
      let section = "";
      const outRows: string[][] = [];
      const outNums: number[] = [];
      data.forEach((r, n) => {
        const type = (r[iType] ?? "").trim().toLowerCase();
        const content = r[headers.findIndex((h) => norm(h) === "content")] ?? "";
        if (type === "section") {
          section = content.trim();
          return;
        }
        if (type && type !== "task") return;
        outRows.push([...r, section]);
        outNums.push(rowNumbers[n]);
      });
      return { headers: [...headers, "Section"], rows: outRows, rowNumbers: outNums, source };
    }
  }
  return { headers, rows: data, rowNumbers, source };
}

/** A checklist: markdown (Notion page export, a README) or plain lines. Headings are sections, checked boxes are done. */
export function tableFromList(text: string): PTable {
  const out: string[][] = [];
  const nums: number[] = [];
  let section = "";
  let parentAtDepth: string[] = [];
  text.replace(/^﻿/, "").split(/\r?\n/).forEach((raw, i) => {
    if (!raw.trim()) return;
    const head = raw.match(/^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/);
    if (head) {
      section = head[1].replace(/[*_`]/g, "").trim();
      parentAtDepth = [];
      return;
    }
    const m = raw.match(/^(\s*)(?:[-*+•]|\d+[.)])\s+(?:\[( |x|X)\]\s+)?(.*)$/);
    const plain = !m && !/^\s*[>|`]/.test(raw) && !/^\s*---+\s*$/.test(raw) ? raw.match(/^(\s*)(.*)$/) : null;
    const indent = (m ? m[1] : plain ? plain[1] : "").replace(/\t/g, "    ").length;
    const body = (m ? m[3] : plain ? plain[2] : "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1 ($2)").trim();
    if (!body) return;
    const depth = Math.min(3, Math.floor(indent / 2));
    const parent = depth > 0 ? parentAtDepth[depth - 1] || "" : "";
    parentAtDepth[depth] = body;
    parentAtDepth.length = depth + 1;
    out.push([body, section, m && m[2] && m[2].toLowerCase() === "x" ? "yes" : "", parent]);
    nums.push(i + 1);
  });
  return { headers: ["Task", "Section", "Done", "Parent task"], rows: out, rowNumbers: nums, source: "list" };
}

interface TrelloCard {
  id?: string;
  name?: string;
  desc?: string;
  due?: string | null;
  start?: string | null;
  dueComplete?: boolean;
  closed?: boolean;
  idList?: string;
  idLabels?: string[];
  labels?: { name?: string; color?: string }[];
  idMembers?: string[];
  idChecklists?: string[];
  shortUrl?: string;
}

/** A Trello board exported as JSON. Archived cards and lists are left out. */
export function tableFromTrello(json: unknown): PTable | null {
  const b = json as { name?: string; cards?: TrelloCard[]; lists?: { id: string; name: string; closed?: boolean }[]; members?: { id: string; fullName?: string; username?: string }[]; checklists?: { id: string; idCard?: string; name?: string; checkItems?: { name?: string; state?: string }[] }[]; labels?: { id: string; name?: string; color?: string }[] };
  if (!b || !Array.isArray(b.cards) || !Array.isArray(b.lists)) return null;
  const lists = new Map(b.lists.map((l) => [l.id, l]));
  const members = new Map((b.members ?? []).map((m) => [m.id, m.fullName || m.username || ""]));
  const labelName = new Map((b.labels ?? []).map((l) => [l.id, l.name || l.color || ""]));
  const checks = new Map<string, string[]>();
  for (const c of b.checklists ?? []) {
    if (!c.idCard) continue;
    const lines = (c.checkItems ?? []).filter((i) => i.name).map((i) => `${i.state === "complete" ? "[x]" : "[ ]"} ${i.name}`);
    if (lines.length) checks.set(c.idCard, [...(checks.get(c.idCard) ?? []), ...(c.name ? [`${c.name}:`] : []), ...lines]);
  }
  const rows: string[][] = [];
  const nums: number[] = [];
  b.cards.forEach((c, i) => {
    if (c.closed || !c.name?.trim()) return;
    const list = c.idList ? lists.get(c.idList) : undefined;
    if (list?.closed) return;
    const labels = (c.labels?.length ? c.labels.map((l) => l.name || l.color || "") : (c.idLabels ?? []).map((id) => labelName.get(id) || "")).filter(Boolean).join(", ");
    const people = (c.idMembers ?? []).map((id) => members.get(id) || "").filter(Boolean).join(", ");
    const desc = [c.desc?.trim() || "", ...(c.id && checks.get(c.id) ? ["", ...checks.get(c.id)!] : [])].join("\n").trim();
    rows.push([c.name.trim(), list?.name || "", desc, c.start || "", c.due || "", labels, people, c.dueComplete ? "yes" : "", c.shortUrl || ""]);
    nums.push(i + 1);
  });
  return { headers: ["Card name", "List name", "Description", "Start", "Due date", "Labels", "Members", "Done", "Link"], rows, rowNumbers: nums, source: "trello", projectName: b.name?.trim() || undefined };
}

/** Whatever the person gave us: CSV/TSV/pasted cells, a Trello JSON export, or a markdown/plain checklist. */
export function readProjectTable(text: string, fileName = ""): PTable | null {
  const t = text.replace(/^﻿/, "");
  const trimmed = t.trim();
  if (!trimmed) return null;
  const base = fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim();
  if (/^[\[{]/.test(trimmed) || /\.json$/i.test(fileName)) {
    try {
      const tr = tableFromTrello(JSON.parse(trimmed));
      if (tr) return { ...tr, projectName: tr.projectName || base || undefined };
    } catch {
      /* not JSON: fall through */
    }
  }
  const isMd = /\.(md|markdown|txt)$/i.test(fileName) && !/[,\t].*\n/.test(trimmed.split("\n").slice(0, 3).join("\n"));
  const looksList = isMd || /^\s*(#{1,6}\s|[-*+]\s+(\[[ xX]\]\s+)?\S)/m.test(trimmed.split("\n").slice(0, 8).join("\n")) && !/^[^\n]*,[^\n]*,[^\n]*\n/.test(trimmed);
  const table = looksList ? tableFromList(t) : tableFromDelimited(t);
  if (!table.headers.length || !table.rows.length) {
    const alt = looksList ? tableFromDelimited(t) : tableFromList(t);
    if (alt.rows.length) return { ...alt, projectName: base || undefined };
    return null;
  }
  return { ...table, projectName: base || undefined };
}

// ── Dates ───────────────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const pad2 = (n: number) => String(n).padStart(2, "0");

function validDay(y: number, m: number, d: number): string | null {
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function oneDay(raw: string, order: DateOrder, year: number): string | null {
  const s = raw.trim().replace(/\s+/g, " ");
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s,])/);
  if (m) return validDay(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (m) return validDay(+m[1], +m[2], +m[3]);
  // Jira and some spreadsheets: 15/Sep/26, 15-Sep-2026, 15 Sep 26.
  m = s.match(/^(\d{1,2})[\/.\s-]([A-Za-z]{3,9})\.?[\/.\s-](\d{2,4})(?:$|[\sT,])/);
  if (m && MONTHS[m[2].slice(0, 4).toLowerCase()] !== undefined || (m && MONTHS[m[2].slice(0, 3).toLowerCase()] !== undefined)) {
    const mon = MONTHS[m[2].slice(0, 4).toLowerCase()] ?? MONTHS[m[2].slice(0, 3).toLowerCase()];
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return validDay(y, mon, +m[1]);
  }
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (m) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    let a = +m[1];
    let b = +m[2];
    if (a > 12 && b <= 12) [a, b] = [b, a]; // clearly day first
    else if (order === "dmy" && b <= 12) [a, b] = [b, a];
    return validDay(y, a, b);
  }
  m = s.match(/^(?:[A-Za-z]{3,9},?\s+)?([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/);
  if (m && MONTHS[m[1].slice(0, 4).toLowerCase().replace(/\.$/, "")] !== undefined || (m && MONTHS[m[1].slice(0, 3).toLowerCase()] !== undefined)) {
    const mon = MONTHS[m[1].slice(0, 4).toLowerCase()] ?? MONTHS[m[1].slice(0, 3).toLowerCase()];
    return validDay(m[3] ? +m[3] : year, mon, +m[2]);
  }
  m = s.match(/^(?:[A-Za-z]{3,9},?\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?(?:\s+(\d{4}))?/);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()] !== undefined) return validDay(m[3] ? +m[3] : year, MONTHS[m[2].slice(0, 3).toLowerCase()], +m[1]);
  if (/^\d{13}$/.test(s)) {
    const d = new Date(Number(s));
    return validDay(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  if (/^\d{10}$/.test(s)) {
    const d = new Date(Number(s) * 1000);
    return validDay(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  return null;
}

/** One cell → a start and/or due day. A range ("Oct 13, 2026 → Oct 20, 2026") gives both. */
export function parseDays(raw: string, order: DateOrder = "mdy", year = new Date().getFullYear()): { start: string | null; due: string | null } {
  const s = (raw || "").trim();
  if (!s) return { start: null, due: null };
  const parts = s.split(/\s*(?:→|->|–|—)\s*|\s+to\s+|\s+-\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = oneDay(parts[0], order, year);
    const b = oneDay(parts[parts.length - 1], order, year);
    if (a && b) return { start: a <= b ? a : b, due: a <= b ? b : a };
  }
  return { start: null, due: oneDay(s, order, year) };
}

/** Day or month first? Look for a value that settles it; default to month first. */
export function guessDateOrder(values: string[]): DateOrder {
  let dmy = 0;
  let mdy = 0;
  for (const v of values) {
    const m = v.trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-]\d{2,4}/);
    if (!m) continue;
    if (+m[1] > 12) dmy++;
    else if (+m[2] > 12) mdy++;
  }
  return dmy > mdy ? "dmy" : "mdy";
}

// ── Status, priority, section ───────────────────────────────────────────────

const DONE_RE = /^(done|complete|completed|closed|resolved|finished|shipped|released|published|archived|approved|cancell?ed|won'?t do|wontfix|delivered|live|fixed)$/;
const PROGRESS_RE = /^(in progress|doing|started|active|working|working on|wip|in review|review|in development|testing|qa|ongoing|underway|in flight|open and in progress|in process|building|writing|editing|drafting)$/;
const WAIT_RE = /^(waiting|waiting on|waiting for|waiting on others|blocked|on hold|hold|paused|pending|stuck|later|deferred|parked|needs info|on deck)$/;
const TODAY_RE = /^(today|doing today|do today|this day)$/;
const BACKLOG_RE = /^(to do|todo|to-do|not started|open|backlog|new|planned|planning|idea|ideas|inbox|queued|up next|next|ready|unstarted|not yet started|someday|future)$/;

/** A status word → one of the five; null when it is not a word we know (the person can choose). */
export function mapStatus(raw: string): TaskStatus | null {
  const s = norm(raw);
  if (!s) return null;
  if (DONE_RE.test(s)) return "done";
  if (TODAY_RE.test(s)) return "today";
  if (WAIT_RE.test(s)) return "waiting";
  if (PROGRESS_RE.test(s) || /\bin progress\b|\bin review\b/.test(s)) return "in_progress";
  if (BACKLOG_RE.test(s)) return "backlog";
  if (/\bdone\b|\bcomplete/.test(s)) return "done";
  if (/\bwaiting\b|\bblocked\b|\bon hold\b/.test(s)) return "waiting";
  return null;
}

export function mapPriority(raw: string, source: SourceKey): TaskPriority | null {
  const s = norm(raw);
  if (!s) return null;
  if (source === "todoist" && /^[1-4]$/.test(s)) return ({ "1": "critical", "2": "high", "3": "medium", "4": "medium" } as const)[s as "1"];
  if (/^(urgent|critical|highest|p0|blocker|asap|emergency|top|very high)$/.test(s)) return "critical";
  if (/^(high|p1|major|important|hot|1)$/.test(s)) return "high";
  if (/^(normal|medium|med|p2|moderate|standard|default|2|3)$/.test(s)) return "medium";
  if (/^(low|lowest|p3|p4|minor|trivial|nice to have|someday|4)$/.test(s)) return "low";
  if (/\burgent\b|\bcritical\b/.test(s)) return "critical";
  if (/\bhigh\b/.test(s)) return "high";
  if (/\blow\b/.test(s)) return "low";
  return null;
}

const truthy = (v: string) => /^(yes|y|true|1|x|✓|✔|done|checked|complete|completed)$/i.test(v.trim());

/** How to treat the section column: as milestones, as the status, or just a note on each task. */
export function suggestSectionUse(sections: string[]): SectionUse {
  const distinct = Array.from(new Set(sections.map((s) => s.trim()).filter(Boolean)));
  if (!distinct.length) return "notes";
  // Words like "Planning" or "Review" name a phase of work as often as a status, so only the plain status words count.
  const AMBIGUOUS = /^(planning|planned|next|ready|open|new|idea|ideas|inbox|queued|later|future|someday|live|published|approved|review|in review|testing|qa|writing|editing|drafting|building|archived)$/;
  const known = distinct.filter((s) => mapStatus(s) !== null && !AMBIGUOUS.test(norm(s))).length;
  if (known / distinct.length > 0.5) return "status";
  if (distinct.length >= 2 && distinct.length <= 20) return "milestone";
  return "notes";
}

// ── Building the tasks ──────────────────────────────────────────────────────

export interface BuildOptions {
  source: SourceKey;
  order: DateOrder;
  sectionUse: SectionUse;
  /** The person's choice for each status word in the file (lowercase word → status). */
  statusMap: Record<string, TaskStatus>;
  year?: number;
}

export interface BuildResult {
  tasks: ImportTask[];
  skipped: { row: number; reason: string }[];
  statusValues: string[];
  sections: string[];
  assignees: string[];
  unreadableDates: number;
}

export function buildTasks(t: PTable, mapping: Target[], o: BuildOptions): BuildResult {
  const col = (target: Target) => mapping.indexOf(target);
  const cols = (target: Target) => mapping.map((m, i) => (m === target ? i : -1)).filter((i) => i >= 0);
  const iTitle = col("title");
  const iStatus = col("status");
  const iPriority = col("priority");
  const iStart = col("start");
  const iDue = col("due");
  const iAssignee = col("assignee");
  const iSection = col("section");
  const iDone = col("done");
  const iParent = col("parent");
  const year = o.year ?? new Date().getFullYear();
  const src = SOURCE_LABEL[o.source];
  const tasks: ImportTask[] = [];
  const skipped: { row: number; reason: string }[] = [];
  const statusValues = new Set<string>();
  const sections = new Set<string>();
  const assignees = new Set<string>();
  let unreadable = 0;

  t.rows.forEach((r, n) => {
    const row = t.rowNumbers[n] ?? n + 2;
    const cell = (i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    const title = cell(iTitle).replace(/\s+/g, " ").slice(0, PROJECT_IMPORT_LIMITS.title);
    if (!title) {
      if (r.some((c) => c.trim())) skipped.push({ row, reason: "No task name" });
      return;
    }
    const rawStatus = cell(iStatus);
    const rawSection = cell(iSection).slice(0, PROJECT_IMPORT_LIMITS.section);
    if (rawStatus) statusValues.add(rawStatus.toLowerCase());
    else if (rawSection && o.sectionUse === "status") statusValues.add(rawSection.toLowerCase());
    if (rawSection) sections.add(rawSection);

    let status: TaskStatus = "backlog";
    if (rawStatus) status = o.statusMap[rawStatus.toLowerCase()] ?? mapStatus(rawStatus) ?? "backlog";
    else if (rawSection && o.sectionUse === "status") status = o.statusMap[rawSection.toLowerCase()] ?? mapStatus(rawSection) ?? "backlog";
    const doneCell = cell(iDone);
    if (doneCell && (truthy(doneCell) || parseDays(doneCell, o.order, year).due)) status = "done";

    let start: string | null = null;
    let due: string | null = null;
    const dueRaw = cell(iDue);
    if (dueRaw) {
      const d = parseDays(dueRaw, o.order, year);
      if (!d.due) unreadable++;
      start = d.start;
      due = d.due;
    }
    const startRaw = cell(iStart);
    if (startRaw) {
      const d = parseDays(startRaw, o.order, year);
      if (d.due) start = d.start ?? d.due;
      else unreadable++;
    }
    if (start && due && start > due) [start, due] = [due, start];

    const notes: string[] = [];
    for (const i of cols("description")) if (cell(i)) notes.push(cell(i));
    const tags = cols("tags").flatMap((i) => cell(i).split(/[,;|]/).map((x) => x.trim()).filter(Boolean));
    if (tags.length) notes.push(`Labels: ${Array.from(new Set(tags)).join(", ")}`);
    if (rawSection && o.sectionUse === "notes") notes.push(`Section: ${rawSection}`);
    const parent = cell(iParent);
    if (parent) notes.push(`Part of: ${parent}`);
    const links = cols("link").map(cell).filter(Boolean);
    if (links.length) notes.push(`${src}: ${links.join(" · ")}`);
    const assignee = cell(iAssignee);
    if (assignee) for (const a of assignee.split(/[,;|]/).map((x) => x.trim()).filter(Boolean)) assignees.add(a);

    const priority = (iPriority >= 0 ? mapPriority(cell(iPriority), o.source) : null) ?? "medium";
    tasks.push({
      row,
      title,
      description: notes.join("\n").slice(0, PROJECT_IMPORT_LIMITS.description),
      status,
      priority,
      startDay: start,
      dueDay: due,
      section: o.sectionUse === "milestone" ? rawSection : "",
      assignee: assignee.slice(0, 160),
      completedDay: status === "done" ? (doneCell ? parseDays(doneCell, o.order, year).due : null) || due : null,
    });
  });

  return { tasks: tasks.slice(0, PROJECT_IMPORT_LIMITS.maxTasks), skipped, statusValues: Array.from(statusValues).slice(0, 40), sections: Array.from(sections), assignees: Array.from(assignees), unreadableDates: unreadable };
}

// ── What the screen shows people ────────────────────────────────────────────

export const HOW_TO: [string, string][] = [
  ["Notion", "Open the database (table, board or list), click the ••• menu at the top right, choose Export, set the format to CSV, then upload the .zip or the .csv inside it. A page with to-do boxes can be exported as Markdown."],
  ["ClickUp", "Open the Space, Folder or List, click the ••• menu (or your avatar > Workspace Settings > Export), choose Export, then Export to CSV."],
  ["Asana", "Open the project, click the arrow next to its name, choose Export / Print, then CSV."],
  ["Trello", "Open the board, Menu > ••• More > Print and export, then Export as JSON. Upload the .json file."],
  ["Monday.com", "Open the board, ••• > Export board to Excel, open it in Excel or Google Sheets, then File > Save as / Download > CSV."],
  ["Todoist", "Open the project, ••• > Export as CSV."],
  ["Jira", "Filters > View all issues, then Export > Export CSV."],
  ["Airtable, Google Sheets, Excel", "Download or save the table as CSV, or select the cells and paste them in."],
  ["Anything else", "Paste a list: one task per line. Use a heading line for a section and - [x] for finished ones."],
];
