import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { slugCode } from "@/lib/shortLinks";

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
    ? await db.from("short_links").select("id, master_plan_id, destination_url, active").eq("code", code).maybeSingle()
    : { data: null };
  if (!link || !link.active) return new NextResponse("Not found.", { status: 404 });

  try {
    await db
      .from("short_link_clicks")
      .insert({ short_link_id: link.id, master_plan_id: link.master_plan_id, referrer: (request.headers.get("referer") || "").slice(0, 300) || null });
    await db.rpc("increment_short_link_clicks", { p_id: link.id });
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
