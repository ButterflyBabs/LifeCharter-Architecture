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
  let slug = new URL(request.url).searchParams.get("event") ?? "";
  if (!slug) {
    // No event named: use the event the Cold Email board's personal link points at (/e/<slug>).
    const { data: st } = await db.from("cold_email_settings").select("board_id").eq("master_plan_id", a.planId).maybeSingle();
    const { data: bd } = st?.board_id ? await db.from("pipeline_boards").select("personal_link_url").eq("id", st.board_id as string).maybeSingle() : { data: null };
    slug = /\/e\/([^/?#\s]+)/.exec((bd?.personal_link_url as string | null) ?? "")?.[1] ?? "";
  }
  let eventId: string | null = null;
  if (slug) {
    const { data } = await db.from("events").select("id").eq("master_plan_id", a.planId).eq("slug", slug).maybeSingle();
    eventId = (data?.id as string | undefined) ?? null;
  }
  const { data, error } = await db.rpc("cold_email_variant_report", { p_plan: a.planId, p_event: eventId });
  if (error) return NextResponse.json({ error: "Could not read the results just now." }, { status: 500 });
  // What each letter's Email 1 says (its subject line), so the results read as wordings, not just letters.
  const { data: cfg } = await db.from("cold_email_settings").select("steps").eq("master_plan_id", a.planId).maybeSingle();
  const first = ((cfg?.steps as { variants?: { key: string; subject: string }[] }[] | undefined) ?? [])[0];
  const names: Record<string, string> = {};
  for (const v of first?.variants ?? []) names[v.key] = v.subject;
  return NextResponse.json({ variants: data ?? [], names, event: slug || null });
}
