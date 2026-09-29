import { createServerClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/contactImport";
import { crmAccount } from "../../guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET → a CSV of the signed-in account's own contacts (filtered by planId).
// Cells that a spreadsheet would run as a formula are neutralised by toCsv.
export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const out: unknown[][] = [["Email", "First name", "Last name", "Phone", "Tags", "Source", "Created", "Unsubscribed"]];
  const PAGE = 1000;
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await db
      .from("seq_contacts")
      .select("email, first_name, last_name, phone, tags, source, created_at, unsubscribed_at")
      .eq("master_plan_id", a.planId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return new Response("Couldn't export your contacts. Please try again.", { status: 500 });
    for (const c of data ?? []) {
      out.push([c.email, c.first_name, c.last_name, c.phone, ((c.tags as string[]) ?? []).join("; "), c.source, c.created_at, c.unsubscribed_at ?? ""]);
    }
    if (!data || data.length < PAGE) break;
  }
  const filename = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
  // BOM so Excel opens accented names correctly.
  return new Response("﻿" + toCsv(out), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
