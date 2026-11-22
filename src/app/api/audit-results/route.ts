import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { EXEC_EVENT_TITLE, execRow, healthRow, miniRow, sortRows, toCsv, type ContactBits } from "@/lib/auditResults";

export const dynamic = "force-dynamic";

// Alignment Architect > Audit Results: every finished Mini Command Audit and Business Health Check, with the person's name
// and contact details. Babs only (isAlignmentArchitect). GET = the list as JSON; GET ?format=csv = the same as a spreadsheet.
// The database returns at most 1000 rows a call, so read it in pages until it runs out.
async function all<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await read(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function GET(request: Request) {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const db = createServerClient();
  try {
    const mini = await all((a, b) => db.from("mini_audit_runs").select("id, first_name, email, profile, result, attribution, email_status, contact_id, created_at").order("created_at", { ascending: false }).range(a, b));
    const health = await all((a, b) => db.from("health_check_runs").select("id, first_name, email, phone, business_name, result, attribution, email_status, contact_id, created_at").order("created_at", { ascending: false }).range(a, b));
    // The Mini Command Audit asks only for a name and email, so fill in the phone and business from the person's contact when it has them.
    const ids = Array.from(new Set(mini.map((m) => m.contact_id).filter((x): x is string => Boolean(x))));
    const contacts = new Map<string, ContactBits>();
    for (let i = 0; i < ids.length; i += 200) {
      const { data } = await db.from("seq_contacts").select("id, phone, company").in("id", ids.slice(i, i + 200));
      for (const c of data ?? []) contacts.set(c.id as string, { phone: (c.phone as string | null) ?? null, company: (c.company as string | null) ?? null });
    }
    // The Executive Business Assessment keeps its scores on the contact's timeline, so read those events and attach each person's details.
    const execEvents = await all((a, b) => db.from("crm_events").select("id, contact_id, detail, created_at").eq("title", EXEC_EVENT_TITLE).order("created_at", { ascending: false }).range(a, b));
    const execIds = Array.from(new Set(execEvents.map((e) => e.contact_id).filter((x): x is string => Boolean(x))));
    const people = new Map<string, { name: string; email: string; phone: string | null; company: string | null }>();
    for (let i = 0; i < execIds.length; i += 200) {
      const { data } = await db.from("seq_contacts").select("id, first_name, last_name, email, phone, company").in("id", execIds.slice(i, i + 200));
      for (const c of data ?? []) people.set(c.id as string, { name: [c.first_name, c.last_name].filter(Boolean).join(" ") || (c.email as string), email: c.email as string, phone: (c.phone as string | null) ?? null, company: (c.company as string | null) ?? null });
    }
    const rows = sortRows([
      ...execEvents.flatMap((e) => (e.contact_id && people.has(e.contact_id as string) ? [execRow(e as never, people.get(e.contact_id as string)!)] : [])),
      ...mini.map((m) => miniRow(m as never, m.contact_id ? contacts.get(m.contact_id as string) : null)),
      ...health.map((h) => healthRow(h as never)),
    ]);
    if (new URL(request.url).searchParams.get("format") === "csv") {
      return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="audit-results-${new Date().toISOString().slice(0, 10)}.csv"` } });
    }
    return NextResponse.json({ rows });
  } catch (e) {
    console.error("audit-results:", (e as Error).message);
    return NextResponse.json({ error: "We couldn't load the results just now." }, { status: 500 });
  }
}
