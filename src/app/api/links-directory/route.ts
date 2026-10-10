import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { housePlanId } from "@/lib/housePlan";

export const dynamic = "force-dynamic";

// Links & Forms (Alignment Architect only): every offering, form, booking page and short link on Babs's own account,
// read live so the list never goes stale. The fixed pages (landing sites, legal, sign-in) are listed by the page itself.
export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const db = createServerClient();
  const house = await housePlanId(db);
  if (!house) return NextResponse.json({ offers: [], forms: [], calendars: [], shortLinks: [] });

  const [offers, forms, calendars, shorts] = await Promise.all([
    db.from("sales_offers").select("id, name, price, billing, status, link, format").eq("master_plan_id", house).order("sort_order").order("created_at"),
    db.from("crm_forms").select("id, key, name, active, tags, sequence_key, description").eq("master_plan_id", house).order("created_at"),
    db.from("booking_calendars").select("id, slug, name, active, duration_min, description").eq("master_plan_id", house).order("created_at"),
    db.from("short_links").select("code, title, destination_url, active, click_count").eq("master_plan_id", house).order("created_at", { ascending: false }).limit(300),
  ]);
  return NextResponse.json(
    {
      offers: offers.data ?? [],
      forms: forms.data ?? [],
      calendars: calendars.data ?? [],
      shortLinks: shorts.data ?? [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
