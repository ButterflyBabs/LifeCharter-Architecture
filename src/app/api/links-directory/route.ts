import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "@/app/api/crm/guard";

export const dynamic = "force-dynamic";

// Links & Forms (every account): the offers, forms, booking pages and short links of the signed-in account,
// read live from ITS OWN data so the list never goes stale. Only Babs's own account also gets the fixed
// pages (landing sites, legal, sign-in), which the page lists itself when `house` is true.
export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const plan = a.planId;

  const [offers, forms, calendars, shorts, domain] = await Promise.all([
    db.from("sales_offers").select("id, name, price, billing, status, link, format").eq("master_plan_id", plan).order("sort_order").order("created_at"),
    db.from("crm_forms").select("id, key, name, active, tags, sequence_key, description").eq("master_plan_id", plan).order("created_at"),
    db.from("booking_calendars").select("id, slug, name, active, duration_min, description").eq("master_plan_id", plan).order("created_at"),
    db.from("short_links").select("code, title, destination_url, active, click_count").eq("master_plan_id", plan).order("created_at", { ascending: false }).limit(300),
    db.from("client_master_plans").select("short_link_domain, short_link_domain_status").eq("id", plan).maybeSingle(),
  ]);
  const verified = domain.data?.short_link_domain_status === "verified" ? (domain.data.short_link_domain as string | null) : null;
  return NextResponse.json(
    {
      offers: offers.data ?? [],
      forms: forms.data ?? [],
      calendars: calendars.data ?? [],
      shortLinks: shorts.data ?? [],
      shortDomain: verified,
      house: a.house && a.isArchitect,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
