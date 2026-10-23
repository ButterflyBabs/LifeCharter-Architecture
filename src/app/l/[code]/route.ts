import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { slugCode } from "@/lib/shortLinks";
import { logEvent } from "@/lib/crm";

export const dynamic = "force-dynamic";

// A short link's own redirect: counts the click (best-effort — never blocks
// the redirect), then sends the visitor straight to the real URL. Reached
// either directly (lccommandsuite.com/l/<code>) or rewritten here by
// middleware from a client's own verified short-link domain — so a not-found
// or turned-off code answers with a plain 404 rather than redirecting
// anywhere: on a client's own domain, bouncing to "/" would either loop or
// flash lccommandsuite.com's branding under their address, neither of which
// belongs on their domain.
export async function GET(request: Request, { params }: { params: { code: string } }) {
  const db = createServerClient();
  const code = slugCode(params.code);
  const { data: link } = code
    ? await db.from("short_links").select("id, master_plan_id, destination_url, active, contact_id, purpose").eq("code", code).maybeSingle()
    : { data: null };
  if (!link || !link.active) return new NextResponse("Not found.", { status: 404 });

  try {
    await db
      .from("short_link_clicks")
      .insert({ short_link_id: link.id, master_plan_id: link.master_plan_id, referrer: (request.headers.get("referer") || "").slice(0, 300) || null });
    await db.rpc("increment_short_link_clicks", { p_id: link.id });
    // A personal link (class-day text): tag who clicked, once.
    if (link.contact_id && (link.purpose === "join" || link.purpose === "workbook")) {
      const tag = link.purpose === "join" ? "clicked-join-live" : "clicked-workbook";
      const { data: c } = await db.from("seq_contacts").select("tags").eq("id", link.contact_id).maybeSingle();
      const tags = ((c?.tags as string[] | null) ?? []);
      if (c && !tags.includes(tag)) {
        await db.from("seq_contacts").update({ tags: [...tags, tag] }).eq("id", link.contact_id);
        await logEvent(link.master_plan_id as string, link.contact_id as string, "tag", link.purpose === "join" ? "Clicked their join link (class-day text)" : "Clicked their workbook link (class-day text)", { code }, db);
      }
    }
  } catch {
    /* never block the redirect on the click log */
  }

  let dest: string;
  try {
    dest = new URL(link.destination_url as string).toString();
  } catch {
    dest = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";
  }
  return NextResponse.redirect(dest);
}
