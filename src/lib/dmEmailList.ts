// Turns an uploaded spreadsheet (.csv) of prospects into people to add to an Outreach Pipeline, and sorts the cards of
// every pipeline into one set of columns so all outreach can be read on one page. Pure: shared by the page and the API.

export const EMAIL_RE = /^[^\s@,;:"'<>()[\]\\]+@[^\s@,;:"'<>()[\]\\]+\.[^\s@,;:"'<>()[\]\\]{2,}$/;

export interface PersonRow {
  name: string;
  email: string | null;
  profileUrl: string | null;
  notes: string | null;
}

// A small CSV reader: quoted fields, doubled quotes, commas or tabs or semicolons, CRLF.
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = first.includes("\t") ? "\t" : first.split(";").length > first.split(",").length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cur += ch;
  }
  row.push(cur);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "");
const HEADS: Record<string, string[]> = {
  first: ["firstname", "first", "givenname", "fname"],
  last: ["lastname", "last", "surname", "familyname", "lname"],
  name: ["name", "fullname", "contactname", "person"],
  email: ["email", "emailaddress", "enrichedemail", "workemail", "mail", "eaddress"],
  company: ["company", "companyname", "organization", "organisation", "business"],
  title: ["title", "positiontitle", "jobtitle", "position", "role", "headline"],
  location: ["location", "city", "region", "country"],
  url: ["url", "profile", "profilelink", "profileurl", "linkedin", "linkedinurl", "link", "website"],
  notes: ["notes", "note", "group", "segment"],
};

export function mapPeople(table: string[][], max = 2000): { rows: PersonRow[]; invalid: string[]; unreadable: boolean } {
  if (!table.length) return { rows: [], invalid: [], unreadable: true };
  const head = table[0].map(norm);
  const idx = (k: string) => head.findIndex((h) => HEADS[k].includes(h));
  const col = { first: idx("first"), last: idx("last"), name: idx("name"), email: idx("email"), company: idx("company"), title: idx("title"), location: idx("location"), url: idx("url"), notes: idx("notes") };
  const hasHeader = col.email >= 0 || col.name >= 0 || col.first >= 0 || col.url >= 0;
  // Without a header row, treat each cell that looks like an email or a link by its shape and the first other cell as the name.
  const body = hasHeader ? table.slice(1) : table;
  const rows: PersonRow[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const r of body) {
    if (rows.length >= max) {
      invalid.push(`Over the limit of ${max} (the rest were not read)`);
      break;
    }
    const cell = (i: number) => (i >= 0 ? (r[i] ?? "").replace(/\s+/g, " ").trim() : "");
    let email = cell(col.email);
    let url = cell(col.url);
    let name = cell(col.name) || [cell(col.first), cell(col.last)].filter(Boolean).join(" ");
    if (!hasHeader) {
      email = r.map((c) => c.trim()).find((c) => EMAIL_RE.test(c)) ?? "";
      url = r.map((c) => c.trim()).find((c) => /^https?:\/\//i.test(c)) ?? "";
      name = r.map((c) => c.trim()).find((c) => c && c !== email && c !== url) ?? "";
    }
    email = email.toLowerCase();
    const parts = [cell(col.company), cell(col.title), cell(col.location), cell(col.notes)].filter(Boolean);
    if (email && !EMAIL_RE.test(email)) {
      invalid.push(`${name || email}: not a valid email`);
      continue;
    }
    if (!name && email) name = email.split("@")[0].replace(/[._-]+/g, " ");
    if (!name || name.length < 2) {
      invalid.push(r.join(", ").slice(0, 60) || "(empty row)");
      continue;
    }
    if (!email && !url) {
      invalid.push(`${name}: needs an email or a profile link`);
      continue;
    }
    const key = email || url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ name: name.slice(0, 120), email: email || null, profileUrl: url ? url.slice(0, 500) : null, notes: parts.length ? parts.join(" · ").slice(0, 300) : null });
  }
  return { rows, invalid, unreadable: false };
}

export const EMAIL_LIST_TEMPLATE_CSV =
  "First name,Last name,Email,Company,Title,Location,Profile link\r\n" +
  "Jane,Example,jane@example.com,Example Studio,Founder,Denver Colorado,https://www.linkedin.com/in/jane-example\r\n";

// ── One page for all outreach ─────────────────────────────────────────────────────────────────────────────────────
// Every pipeline has its own stages, so the columns are fixed groups the stage KEYS fall into.
export const OVERVIEW_COLUMNS = [
  { id: "added", label: "On the list" },
  { id: "contacted", label: "Contacted" },
  { id: "conversation", label: "In conversation" },
  { id: "invited", label: "Invited" },
  { id: "registered", label: "Registered" },
  { id: "came", label: "Came" },
  { id: "missed", label: "Missed it" },
  { id: "booked", label: "Booked" },
  { id: "client", label: "Client" },
  { id: "stopped", label: "Not now / stopped" },
] as const;
export type OverviewColumn = (typeof OVERVIEW_COLUMNS)[number]["id"];

const GROUP: Record<string, OverviewColumn> = {
  to_reach: "added", prospect: "added", new: "added",
  connect_sent: "contacted", connected: "contacted", sent: "contacted", followed_up: "contacted", nurture: "contacted", in_progress: "contacted",
  conversation: "conversation", agreement: "conversation",
  invited: "invited",
  registered: "registered", lci_registered: "registered",
  attended: "came", lci_attended: "came", command_shift: "came",
  no_show: "missed", lci_no_show: "missed",
  booked: "booked",
  client: "client", affiliate_active: "client", done: "client",
  not_now: "stopped",
};
export function columnOf(stageKey: string | null | undefined, kind: string | null | undefined): OverviewColumn {
  const g = GROUP[stageKey ?? ""];
  if (g) return g;
  if (kind === "booked") return "booked";
  if (kind === "closed") return "stopped";
  return "contacted";
}

// "Added" is everyone on the list; each other column counts the people sitting there now.
export function summarize(
  cards: { board_id: string; stage_id: string; platform: string | null }[],
  stages: { id: string; key: string; kind: string }[],
  boards: { id: string; name: string }[],
  labelOf: (platform: string | null) => string,
) {
  const stage = new Map(stages.map((s) => [s.id, s]));
  const blank = () => Object.fromEntries(OVERVIEW_COLUMNS.map((c) => [c.id, 0])) as Record<OverviewColumn, number>;
  const byChannel = new Map<string, Record<OverviewColumn, number>>();
  const byBoard = new Map<string, Record<OverviewColumn, number>>(boards.map((b) => [b.id, blank()]));
  const total = blank();
  for (const c of cards) {
    const st = stage.get(c.stage_id);
    const col = columnOf(st?.key, st?.kind);
    const ch = labelOf(c.platform) || "No channel set";
    if (!byChannel.has(ch)) byChannel.set(ch, blank());
    for (const t of [byChannel.get(ch)!, byBoard.get(c.board_id) ?? (byBoard.set(c.board_id, blank()), byBoard.get(c.board_id)!), total]) {
      t.added++;
      if (col !== "added") t[col]++;
    }
  }
  return {
    channels: Array.from(byChannel.entries()).map(([channel, n]) => ({ channel, ...n })).sort((a, b) => b.added - a.added),
    boards: boards.map((b) => ({ boardId: b.id, name: b.name, ...(byBoard.get(b.id) ?? blank()) })),
    total,
  };
}
