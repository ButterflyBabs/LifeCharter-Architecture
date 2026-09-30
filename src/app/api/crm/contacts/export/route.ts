import { createServerClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/contactImport";
import { crmAccount } from "../../guard";
import { resolveActor } from "@/lib/authz";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET → a CSV of the signed-in account's own contacts (filtered by planId).
// Cells that a spreadsheet would run as a formula are neutralised by toCsv.
export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  // Downloading the whole list is the account owner's call, not a team member's.
  if ((await resolveActor()).kind === "member") return new Response("Only the account owner can export contacts.", { status: 403 });
  const db = createServerClient();
  const { data: defs } = await db.from("crm_custom_fields").select("key, label").eq("master_plan_id", a.planId).order("position");
  const custom = (defs ?? []) as { key: string; label: string }[];
  const out: unknown[][] = [["Email", "First name", "Last name", "Phone", "Company", "Job title", "Website", "Address line 1", "Address line 2", "City", "State / region", "Postal code", "Country", "Birthday", "Facebook", "LinkedIn", "Instagram", "YouTube", "Relationships", "Tags", ...custom.map((f) => f.label), "Source", "Created", "Unsubscribed"]];
  const PAGE = 1000;
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await db
      .from("seq_contacts")
      .select("email, first_name, last_name, phone, company, job_title, website, address_line1, address_line2, city, region, postal_code, country, birthday, facebook, linkedin, instagram, youtube, relationships, custom, tags, source, created_at, unsubscribed_at")
      .eq("master_plan_id", a.planId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return new Response("Couldn't export your contacts. Please try again.", { status: 500 });
    for (const c of data ?? []) {
      const cv = (c.custom as Record<string, unknown>) ?? {};
      out.push([
        c.email, c.first_name, c.last_name, c.phone, c.company, c.job_title, c.website, c.address_line1, c.address_line2, c.city, c.region, c.postal_code, c.country, c.birthday, c.facebook, c.linkedin, c.instagram, c.youtube,
        ((c.relationships as string[]) ?? []).join("; "), ((c.tags as string[]) ?? []).join("; "), ...custom.map((f) => (cv[f.key] ?? "") as string),
        c.source, c.created_at, c.unsubscribed_at ?? "",
      ]);
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
