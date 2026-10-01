import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { slugCode } from "@/lib/shortLinks";

export const dynamic = "force-dynamic";

// A short link's own redirect: counts the click (best-effort — never blocks
// the redirect), then sends the visitor straight to the real URL. Not found,
// turned off, or a malformed code all land on the home page rather than
// erroring, same as the affiliate tracked-link route this mirrors.
export async function GET(request: Request, { params }: { params: { code: string } }) {
  const db = createServerClient();
  const code = slugCode(params.code);
  const { data: link } = code
    ? await db.from("short_links").select("id, master_plan_id, destination_url, active").eq("code", code).maybeSingle()
    : { data: null };
  const origin = new URL(request.url).origin;
  if (!link || !link.active) return NextResponse.redirect(`${origin}/`);

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
    dest = `${origin}/`;
  }
  return NextResponse.redirect(dest);
}
