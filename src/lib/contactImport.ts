// Contact import/export helpers shared by the Contacts "Import contacts" screen
// (parsing runs in the browser) and the import API (row limits + validation).
// Pure functions only — no server or browser imports — so they can be checked
// with plain node.

// Same rule as EMAIL_RE in src/lib/crm.ts (kept here so this file stays importable in the browser).
export const IMPORT_EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const IMPORT_LIMITS = {
  maxRows: 5000,
  maxFileBytes: 5 * 1024 * 1024,
  batchSize: 500,
  email: 200,
  name: 80,
  phone: 40,
  tags: 20,
  tag: 60,
  company: 200,
  notes: 2000,
  file: 120,
} as const;

export type Target = "email" | "first" | "last" | "full" | "phone" | "tags" | "company" | "notes" | "ignore";

export const TARGET_LABELS: Record<Target, string> = {
  email: "Email *",
  first: "First name",
  last: "Last name",
  full: "Full name (split)",
  phone: "Phone",
  tags: "Tags",
  company: "Company",
  notes: "Notes",
  ignore: "Ignore",
};

// Targets that take only one column; tags and notes can gather several.
const SINGLE: Target[] = ["email", "first", "last", "full", "phone", "company"];

export interface Table {
  headers: string[];
  rows: string[][];
  /** Spreadsheet row number (or vCard number) of each row, for messages. */
  rowNumbers: number[];
  kind: "csv" | "vcard";
}

export interface ImportRow {
  row: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  company?: string;
  notes?: string;
}

// ── CSV / TSV / pasted spreadsheet ──────────────────────────────────────────

function detectDelimiter(text: string): string {
  // Look at the first logical line, outside quotes.
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQ = !inQ;
    else if (!inQ && (ch === "\n" || ch === "\r")) break;
    else if (!inQ && ch in counts) counts[ch]++;
  }
  if (counts["\t"] > 0 && counts["\t"] >= counts[","]) return "\t";
  if (counts[";"] > counts[","]) return ";";
  return ",";
}

/** RFC 4180-style parser: quoted fields, "" escapes, embedded delimiters/newlines, CRLF, BOM. */
export function parseDelimited(input: string, delimiter?: string, keepBlank = false): string[][] {
  const text = input.replace(/^﻿/, "");
  const d = delimiter || detectDelimiter(text);
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQ = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell.trim() === "") {
      inQ = true;
      cell = "";
    } else if (ch === d) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    out.push(row);
  }
  const trimmed = out.map((r) => r.map((c) => c.trim()));
  return keepBlank ? trimmed : trimmed.filter((r) => r.some((c) => c !== ""));
}

// ── vCard (.vcf) ─────────────────────────────────────────────────────────────

function decodeQP(s: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "=" && /^[0-9A-F]{2}$/i.test(s.slice(i + 1, i + 3))) {
      bytes.push(parseInt(s.slice(i + 1, i + 3), 16));
      i += 2;
    } else bytes.push(s.charCodeAt(i) & 0xff);
  }
  try {
    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  } catch {
    return s;
  }
}

const unescapeV = (s: string) => s.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim();

/** Splits a vCard value on unescaped `sep`. */
function splitV(s: string, sep: string): string[] {
  const parts: string[] = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && i + 1 < s.length) {
      cur += s[i] + s[i + 1];
      i++;
    } else if (s[i] === sep) {
      parts.push(cur);
      cur = "";
    } else cur += s[i];
  }
  parts.push(cur);
  return parts;
}

export const VCARD_HEADERS = ["Full name", "First name", "Last name", "Email", "Phone", "Company", "Notes", "Categories"];

/** Parses one or more vCards (2.1/3.0/4.0) into a table with VCARD_HEADERS. */
export function parseVCard(input: string): Table {
  const text = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  // Unfold: a line starting with space/tab continues the previous one. vCard 2.1
  // quoted-printable lines ending in "=" continue on the next line too.
  const raw = text.split("\n");
  const lines: string[] = [];
  for (const l of raw) {
    if (/^[ \t]/.test(l) && lines.length) lines[lines.length - 1] += l.slice(1);
    else if (lines.length && /QUOTED-PRINTABLE/i.test(lines[lines.length - 1].split(":")[0]) && lines[lines.length - 1].endsWith("=")) lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1) + l;
    else lines.push(l);
  }
  const rows: string[][] = [];
  let card: Record<string, string[]> | null = null;
  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const head = line.slice(0, colon);
    let value = line.slice(colon + 1);
    const [nameWithGroup, ...params] = head.split(";");
    const name = nameWithGroup.split(".").pop()!.toUpperCase();
    if (name === "BEGIN" && value.trim().toUpperCase() === "VCARD") {
      card = {};
      continue;
    }
    if (name === "END" && value.trim().toUpperCase() === "VCARD") {
      if (card) {
        const n = card.N?.[0] ? splitV(card.N[0], ";").map(unescapeV) : [];
        const emails = card.EMAIL ?? [];
        rows.push([
          card.FN?.[0] ? unescapeV(card.FN[0]) : "",
          n[1] || "",
          n[0] || "",
          emails[0] ? unescapeV(emails[0]) : "",
          card.TEL?.[0] ? unescapeV(card.TEL[0]) : "",
          card.ORG?.[0] ? unescapeV(splitV(card.ORG[0], ";")[0]) : "",
          card.NOTE?.[0] ? unescapeV(card.NOTE[0]) : "",
          (card.CATEGORIES ?? []).flatMap((c) => splitV(c, ",").map(unescapeV)).filter(Boolean).join(", "),
        ]);
      }
      card = null;
      continue;
    }
    if (!card) continue;
    const p = params.join(";").toUpperCase();
    if (/ENCODING=QUOTED-PRINTABLE|(^|;)QUOTED-PRINTABLE/.test(p)) value = decodeQP(value);
    if (name === "EMAIL" || name === "TEL") value = value.replace(/^(mailto|tel):/i, "");
    const list = (card[name] ??= []);
    // A preferred email/phone goes first.
    if (/PREF/.test(p) && (name === "EMAIL" || name === "TEL")) list.unshift(value);
    else list.push(value);
  }
  return { headers: [...VCARD_HEADERS], rows, rowNumbers: rows.map((_, i) => i + 1), kind: "vcard" };
}

// ── Reading any supported input into a table ─────────────────────────────────

export function looksLikeVCard(text: string): boolean {
  return /^\s*BEGIN:VCARD/i.test(text.replace(/^﻿/, ""));
}

/** Turns CSV/TSV/pasted text or a vCard into a table. A first row holding an email is treated as data, not headers. */
export function readTable(text: string): Table {
  if (looksLikeVCard(text)) return parseVCard(text);
  const numbered = parseDelimited(text, undefined, true)
    .map((cells, i) => ({ cells, n: i + 1 }))
    .filter((r) => r.cells.some((c) => c !== ""));
  if (!numbered.length) return { headers: [], rows: [], rowNumbers: [], kind: "csv" };
  const width = Math.max(...numbered.map((r) => r.cells.length));
  const pad = (r: string[]) => (r.length < width ? [...r, ...Array(width - r.length).fill("")] : r);
  const hasHeader = !numbered[0].cells.some((c) => IMPORT_EMAIL_RE.test(c.trim()));
  const data = hasHeader ? numbered.slice(1) : numbered;
  const headers = hasHeader ? pad(numbered[0].cells).map((h, i) => h || `Column ${i + 1}`) : Array.from({ length: width }, (_, i) => `Column ${i + 1}`);
  return { headers, rows: data.map((r) => pad(r.cells)), rowNumbers: data.map((r) => r.n), kind: "csv" };
}

// ── Guessing each column's target ────────────────────────────────────────────

const norm = (h: string) =>
  h
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Returns [target, score]; higher score wins when several columns want the same single target. */
function guessOne(header: string): [Target, number] {
  const h = norm(header);
  if (!h) return ["ignore", 0];
  const exact = (...xs: string[]) => xs.includes(h);
  if (exact("labels", "tags", "tag", "groups", "group", "group membership", "categories", "category", "lists", "list")) return ["tags", 5];
  if (exact("notes", "note", "comments", "comment")) return ["notes", 5];
  // Label/type columns ("E-mail 1 - Label"), ids and phonetic spellings aren't data we save.
  if (/\b(type|label|labels|display|yomi|phonetic|id|status|opt|consent|verified|domain)\b/.test(h)) return ["ignore", 0];
  const secondary = /\b([2-9]|1[0-9])\b/.test(h); // "E-mail 2 Address", "Phone 3 - Value"
  if (/\be ?mail\b|\bemail address\b/.test(h)) return secondary ? ["ignore", 0] : ["email", exact("email", "e mail", "email address", "e mail address") ? 10 : 8];
  if (exact("first name", "firstname", "first", "given name", "fname", "forename")) return ["first", 10];
  if (exact("last name", "lastname", "last", "family name", "surname", "lname")) return ["last", 10];
  if (/\bmiddle\b|\bnickname\b|\bmaiden\b|\bprefix\b|\bsuffix\b|\btitle\b/.test(h)) return ["ignore", 0];
  if (exact("name", "full name", "fullname", "contact name", "contact", "your name", "client name", "customer name")) return ["full", 10];
  if (/\bfax\b|\bpager\b/.test(h)) return ["ignore", 0];
  if (/\b(phone|mobile|cell|telephone|tel)\b/.test(h)) {
    if (secondary) return ["ignore", 0];
    return ["phone", /mobile|cell/.test(h) ? 9 : exact("phone", "phone number") || /\bphone 1\b/.test(h) ? 8 : 5];
  }
  if (/^(company|company name|organization|organisation|organization name|organisation name|organization 1 name|business|business name|employer)$/.test(h)) return ["company", 10];
  return ["ignore", 0];
}

/** Auto-maps headers to targets; each single target goes to its best column only. */
export function guessMapping(headers: string[], rows: string[][] = []): Target[] {
  const guesses = headers.map(guessOne);
  const out: Target[] = guesses.map(() => "ignore");
  const best: Partial<Record<Target, number>> = {};
  guesses.forEach(([t, s], i) => {
    if (t === "ignore") return;
    if (!SINGLE.includes(t)) {
      out[i] = t;
      return;
    }
    const cur = best[t];
    if (cur === undefined || s > guesses[cur][1]) best[t] = i;
  });
  for (const [t, i] of Object.entries(best)) out[i as number] = t as Target;
  // No email header? Pick the column whose values look most like emails.
  if (!out.includes("email") && rows.length) {
    let bestCol = -1;
    let bestHits = 0;
    headers.forEach((_, c) => {
      const hits = rows.slice(0, 50).filter((r) => IMPORT_EMAIL_RE.test((r[c] || "").trim())).length;
      if (hits > bestHits) {
        bestHits = hits;
        bestCol = c;
      }
    });
    if (bestCol >= 0) out[bestCol] = "email";
  }
  return out;
}

// ── Building the rows to save ────────────────────────────────────────────────

export function cleanTags(values: string[]): string[] {
  const tags = values
    .flatMap((v) => v.split(/:::|[,;|]/))
    .map((t) =>
      t
        .replace(/^\s*\*\s*/, "")
        .trim()
        .replace(/^["']+|["']+$/g, "")
        .trim()
        .toLowerCase()
        .slice(0, IMPORT_LIMITS.tag)
    )
    // Google's built-in groups aren't meaningful tags.
    .filter((t) => t && t !== "mycontacts" && t !== "starred" && t !== "other contacts");
  return Array.from(new Set(tags)).slice(0, IMPORT_LIMITS.tags);
}

export function splitFullName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  // "Carroll, Ami Lynne" → first "Ami Lynne", last "Carroll"
  if (full.includes(",")) {
    const [last, first] = full.split(",", 2).map((s) => s.trim());
    if (first) return { first, last };
  }
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export interface Skipped {
  row: number;
  email: string;
  reason: string;
  cells: string[];
}

export interface Built {
  rows: ImportRow[];
  skipped: Skipped[];
}

/** Applies the mapping, drops rows with no/invalid email and in-file duplicates. */
export function buildRows(table: Table, mapping: Target[]): Built {
  const rows: ImportRow[] = [];
  const skipped: Skipped[] = [];
  const seen = new Map<string, number>();
  const cols = (t: Target) => mapping.map((m, i) => (m === t ? i : -1)).filter((i) => i >= 0);
  const one = (r: string[], t: Target) => {
    const c = cols(t)[0];
    return c === undefined ? "" : (r[c] || "").trim();
  };
  const many = (r: string[], t: Target) => cols(t).map((c) => (r[c] || "").trim()).filter(Boolean);
  table.rows.forEach((cells, idx) => {
    const rowNo = table.rowNumbers[idx] ?? idx + 1;
    // Some exports put several addresses in one cell ("a@x.com ::: b@y.com").
    const rawEmail = one(cells, "email").split(/\s*(?::::|[,;\s])\s*/).find(Boolean) || "";
    const email = rawEmail.replace(/^mailto:/i, "").replace(/^<|>$/g, "").trim().toLowerCase();
    if (!email) return skipped.push({ row: rowNo, email: "", reason: "No email address", cells });
    if (!IMPORT_EMAIL_RE.test(email) || email.length > IMPORT_LIMITS.email) return skipped.push({ row: rowNo, email, reason: "Email address isn't valid", cells });
    const dup = seen.get(email);
    if (dup !== undefined) return skipped.push({ row: rowNo, email, reason: `Same email as row ${dup} in this file`, cells });
    seen.set(email, rowNo);
    let first = one(cells, "first");
    let last = one(cells, "last");
    const full = one(cells, "full");
    if (full && !first && !last) ({ first, last } = splitFullName(full));
    const tags = cleanTags(many(cells, "tags"));
    const notes = many(cells, "notes").join("\n\n");
    rows.push({
      row: rowNo,
      email,
      ...(first ? { firstName: first.slice(0, IMPORT_LIMITS.name) } : {}),
      ...(last ? { lastName: last.slice(0, IMPORT_LIMITS.name) } : {}),
      ...(one(cells, "phone") ? { phone: one(cells, "phone").slice(0, IMPORT_LIMITS.phone) } : {}),
      ...(tags.length ? { tags } : {}),
      ...(one(cells, "company") ? { company: one(cells, "company").slice(0, IMPORT_LIMITS.company) } : {}),
      ...(notes ? { notes: notes.slice(0, IMPORT_LIMITS.notes) } : {}),
    });
  });
  return { rows, skipped };
}

// ── CSV writing (skipped-rows download and the export route) ─────────────────

/** Quotes a cell and neutralises spreadsheet formulas (= + - @, tab, CR). */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
