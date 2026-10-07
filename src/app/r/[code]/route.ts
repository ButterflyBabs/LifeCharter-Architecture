import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { AFF_COOKIE, AFF_COOKIE_DAYS, slugCode } from "@/lib/affiliates";
import { isHousePlan } from "@/lib/housePlan";

export const dynamic = "force-dynamic";

// An affiliate's tracked link: counts the click, remembers the affiliate for 365 days
// (so a sign-up or booking on this account's Suite pages is credited to them), then
// sends the visitor on with ?ref=<code> so the account's own site can pass it along.
export async function GET(request: Request, { params }: { params: { code: string } }) {
  const db = createServerClient();
  const code = slugCode(params.code);
  // The code is a product link (one per product) or an affiliate's own code.
  const { data: link } = code ? await db.from("affiliate_links").select("id, code, status, landing_url, affiliate_id, affiliates!inner(id, master_plan_id, code, status, landing_url)").eq("code", code).maybeSingle() : { data: null };
  const la = link?.affiliates as unknown as { id: string; master_plan_id: string; code: string; status: string; landing_url: string | null } | null | undefined;
  const { data: own } = !link && code ? await db.from("affiliates").select("id, master_plan_id, code, status, landing_url").eq("code", code).maybeSingle() : { data: null };
  const aff = link && la ? { id: la.id, master_plan_id: la.master_plan_id, code: link.code as string, status: link.status === "active" ? la.status : "paused", landing_url: (link.landing_url as string | null) || la.landing_url } : own;
  const origin = new URL(request.url).origin;
  if (!aff || aff.status !== "active") return NextResponse.redirect(`${origin}/`);

  await db.from("affiliate_clicks").insert({ affiliate_id: aff.id, master_plan_id: aff.master_plan_id, link_id: link ? (link.id as string) : null, referrer: (request.headers.get("referer") || "").slice(0, 300) || null });

  let dest = (aff.landing_url as string) || "";
  if (!/^https?:\/\//i.test(dest)) {
    if (await isHousePlan(aff.master_plan_id as string)) dest = "https://www.amilynnecarroll.com";
    else {
      const { data: ws } = await db.from("workspaces").select("website").eq("master_plan_id", aff.master_plan_id).order("is_default", { ascending: false }).limit(1).maybeSingle();
      const site = (ws?.website as string) || "";
      dest = /^https?:\/\//i.test(site) ? site : site ? `https://${site}` : origin;
    }
  }
  let url: URL;
  try {
    url = new URL(dest);
  } catch {
    url = new URL(origin);
  }
  url.searchParams.set("ref", aff.code as string);
  const res = NextResponse.redirect(url.toString());
  res.cookies.set(AFF_COOKIE, aff.code as string, { path: "/", maxAge: 60 * 60 * 24 * AFF_COOKIE_DAYS, sameSite: "lax", httpOnly: true, secure: true });
  return res;
}
