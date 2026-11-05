import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";

export const dynamic = "force-dynamic";

// How each wording (variant) of the cold email series is doing: people emailed, replies, stop requests, and, when an event is named
// (?event=<slug>), how many signed up for it and attended. Matching is by email address. Each account sees only its own.
export async function GET(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const slug = new URL(request.url).searchParams.get("event") ?? "";
  let eventId: string | null = null;
  if (slug) {
    const { data } = await db.from("events").select("id").eq("master_plan_id", a.planId).eq("slug", slug).maybeSingle();
    eventId = (data?.id as string | undefined) ?? null;
  }
  const { data, error } = await db.rpc("cold_email_variant_report", { p_plan: a.planId, p_event: eventId });
  if (error) return NextResponse.json({ error: "Could not read the results just now." }, { status: 500 });
  return NextResponse.json({ variants: data ?? [], event: slug || null });
}
