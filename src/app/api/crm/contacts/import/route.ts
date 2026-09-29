import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { EMAIL_RE, upsertContact, logEvent } from "@/lib/crm";
import { IMPORT_LIMITS as L } from "@/lib/contactImport";
import { crmAccount } from "../../guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Importing the account's existing contacts (Contacts → Import contacts).
// The browser parses the file; this route only ever touches the signed-in
// account's own contacts (every query filters by planId from crmAccount).
// POST is a write, so middleware already blocks view-only team members and the demo.
//
// POST { mode: "check", emails: string[] }
//   → { existing: string[], unsubscribed: string[] } — which of these emails are
//     already in the account (a dry run; nothing is saved).
// POST { mode: "import", consent: true, file, tag, importKey, rows: [{ row, email, firstName, lastName, phone, tags, company, notes }] }
//   → { created, merged, skipped, unsubscribed, errors: [{ row, reason }] }
//   Up to 500 rows per request; the browser sends batches. Re-running the same
//   file merges into the same contacts (upsertContact matches by email), and
//   the "Imported" timeline note is written once per contact per import.

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const tagOf = (v: unknown) =>
  str(v, 200)
    .toLowerCase()
    .replace(/[,;]/g, " ")
    .trim()
    .slice(0, L.tag);

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => null);
  if (!b || typeof b !== "object") return NextResponse.json({ error: "Nothing to import." }, { status: 400 });
  const db = createServerClient();
  const planId = a.planId;

  if (b.mode === "check") {
    const emails = Array.from(
      new Set((Array.isArray(b.emails) ? b.emails : []).map((e: unknown) => str(e, L.email).toLowerCase()).filter((e: string) => EMAIL_RE.test(e)))
    ) as string[];
    if (emails.length > L.maxRows) return NextResponse.json({ error: `Up to ${L.maxRows.toLocaleString()} contacts per import.` }, { status: 400 });
    const existing: string[] = [];
    const unsubscribed: string[] = [];
    for (let i = 0; i < emails.length; i += 200) {
      const { data, error } = await db.from("seq_contacts").select("email, unsubscribed_at").eq("master_plan_id", a.planId).in("email", emails.slice(i, i + 200));
      if (error) return NextResponse.json({ error: "Couldn't check your contacts. Please try again." }, { status: 500 });
      for (const c of data ?? []) {
        existing.push(c.email as string);
        if (c.unsubscribed_at) unsubscribed.push(c.email as string);
      }
    }
    return NextResponse.json({ existing, unsubscribed });
  }

  if (b.mode !== "import") return NextResponse.json({ error: "Unknown request." }, { status: 400 });
  if (b.consent !== true) return NextResponse.json({ error: "Please confirm these people have agreed to hear from you." }, { status: 400 });
  const rows = Array.isArray(b.rows) ? b.rows : [];
  if (!rows.length) return NextResponse.json({ created: 0, merged: 0, skipped: 0, unsubscribed: 0, errors: [] });
  if (rows.length > L.batchSize) return NextResponse.json({ error: `Send at most ${L.batchSize} rows at a time.` }, { status: 400 });

  const file = str(b.file, L.file).replace(/[\r\n<>]/g, "") || "file";
  const importTag = tagOf(b.tag);
  const importKey = str(b.importKey, 100) || `${file}|${importTag}`;
  const source = `Import (${file})`.slice(0, 200);

  type Clean = { row: number; email: string; firstName: string | null; lastName: string | null; phone: string | null; tags: string[]; company: string; notes: string };
  const errors: { row: number; reason: string }[] = [];
  const clean: Clean[] = [];
  const seen = new Set<string>();
  rows.forEach((r: Record<string, unknown>, i: number) => {
    const row = typeof r?.row === "number" && Number.isFinite(r.row) ? Math.floor(r.row) : i + 1;
    const rawEmail = typeof r?.email === "string" ? r.email.trim().toLowerCase() : "";
    if (!rawEmail) return errors.push({ row, reason: "No email address" });
    if (rawEmail.length > L.email || !EMAIL_RE.test(rawEmail)) return errors.push({ row, reason: "Email address isn't valid" });
    if (seen.has(rawEmail)) return errors.push({ row, reason: "Same email appears twice in this import" });
    seen.add(rawEmail);
    const rowTags = (Array.isArray(r.tags) ? r.tags : []).map(tagOf).filter(Boolean) as string[];
    const tags = Array.from(new Set([...(importTag ? [importTag] : []), ...rowTags])).slice(0, L.tags);
    clean.push({
      row,
      email: rawEmail,
      firstName: str(r.firstName, L.name) || null,
      lastName: str(r.lastName, L.name) || null,
      phone: str(r.phone, L.phone) || null,
      tags,
      company: str(r.company, L.company),
      notes: str(r.notes, L.notes),
    });
  });

  let created = 0;
  let merged = 0;
  let unsubscribed = 0;
  const toNote: { id: string; company: string; notes: string }[] = [];

  // A few at a time keeps a 500-row batch well inside the time limit.
  let next = 0;
  const worker = async () => {
    while (next < clean.length) {
      const c = clean[next++];
      try {
        const res = await upsertContact({ masterPlanId: planId, email: c.email, firstName: c.firstName, lastName: c.lastName, phone: c.phone, source, tags: c.tags, company: c.company || null }, db);
        if (!res) {
          errors.push({ row: c.row, reason: "Couldn't save this contact" });
          continue;
        }
        if (res.created) created++;
        else merged++;
        if (res.unsubscribed) unsubscribed++;
        if (res.created || c.company || c.notes) toNote.push({ id: res.id, company: c.company, notes: c.notes });
      } catch {
        errors.push({ row: c.row, reason: "Couldn't save this contact" });
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  // One "Imported" timeline note per contact per import (a re-run of the same import adds none).
  if (toNote.length) {
    const already = new Set<string>();
    for (let i = 0; i < toNote.length; i += 200) {
      const { data } = await db
        .from("crm_events")
        .select("contact_id")
        .eq("master_plan_id", a.planId)
        .eq("kind", "note")
        .eq("title", "Imported")
        .in("contact_id", toNote.slice(i, i + 200).map((n) => n.id))
        .contains("detail", { import: importKey });
      for (const e of data ?? []) already.add(e.contact_id as string);
    }
    let k = 0;
    const fresh = toNote.filter((n) => !already.has(n.id));
    const noteWorker = async () => {
      while (k < fresh.length) {
        const n = fresh[k++];
        const shown = { file, ...(n.company ? { company: n.company } : {}), ...(n.notes ? { notes: n.notes } : {}) };
        // `data` is what the contact timeline displays under the event.
        await logEvent(planId, n.id, "note", "Imported", { import: importKey, ...shown, data: shown }, db).catch(() => undefined);
      }
    };
    await Promise.all(Array.from({ length: 8 }, noteWorker));
  }

  errors.sort((x, y) => x.row - y.row);
  return NextResponse.json({ created, merged, skipped: errors.length, unsubscribed, errors });
}
