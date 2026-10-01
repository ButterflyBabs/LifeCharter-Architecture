import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "@/app/api/crm/guard";
import { normalizeDestination, slugCode, uniqueShortCode } from "@/lib/shortLinks";

export const dynamic = "force-dynamic";

// Short links — this account's own list. Every account gets its own set,
// scoped by master_plan_id like the rest of the CRM; the short code itself
// is a single shared namespace (lccommandsuite.com/l/<code>), first come,
// first served, same as affiliate codes and calendar slugs.
export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { data } = await db
    .from("short_links")
    .select("id, code, destination_url, title, active, click_count, created_at, updated_at")
    .eq("master_plan_id", a.planId)
    .order("created_at", { ascending: false })
    .limit(500);
  return NextResponse.json({ links: data ?? [] });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const body = await request.json().catch(() => ({}));

  const destination = normalizeDestination(typeof body.destinationUrl === "string" ? body.destinationUrl : "");
  if (!destination) return NextResponse.json({ error: "Enter a valid destination URL." }, { status: 400 });

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : null;
  const wanted = typeof body.code === "string" ? slugCode(body.code) : "";
  if (wanted) {
    const { data: taken } = await db.from("short_links").select("id").eq("code", wanted).maybeSingle();
    if (taken) return NextResponse.json({ error: `lccommandsuite.com/l/${wanted} is already taken. Try another.` }, { status: 409 });
  }
  const code = await uniqueShortCode(db, wanted);

  const { data, error } = await db
    .from("short_links")
    .insert({ master_plan_id: a.planId, code, destination_url: destination, title })
    .select("id, code, destination_url, title, active, click_count, created_at, updated_at")
    .single();
  if (error || !data) {
    console.error("POST /api/short-links:", error?.message);
    return NextResponse.json({ error: "Couldn't create that link." }, { status: 500 });
  }
  return NextResponse.json({ link: data });
}
