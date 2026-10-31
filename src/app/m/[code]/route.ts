import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isHousePlan } from "@/lib/housePlan";

export const dynamic = "force-dynamic";

// A prospect's personal link: lccommandsuite.com/m/<code>. Counts the click on their outreach card, then sends them to the
// page set on that pipeline (Stages & settings). On Babs's own account, with none set, it goes to the MasterClass signup with
// their code, so registering moves their card to Registered; a Facebook card's link also carries the same campaign tags as the
// shared Facebook DM link (mc-fb), so those sign-ups still count as Facebook DMs in MasterClass Results.
export async function GET(request: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
  const origin = new URL(request.url).origin;
  if (!code) return NextResponse.redirect(`${origin}/masterclass-signup`);
  const db = createServerClient();
  const { data: card } = await db.from("dm_cards").select("id, link_clicks, platform, board_id, master_plan_id").eq("link_code", code).maybeSingle();
  const { data: board } = card ? await db.from("pipeline_boards").select("personal_link_url").eq("id", card.board_id).maybeSingle() : { data: null };
  const own = (board?.personal_link_url as string | null) ?? "";
  if (card && !own && !(await isHousePlan(card.master_plan_id as string, db))) return new NextResponse("This link is not set up yet.", { status: 404 });
  if (card) await db.from("dm_cards").update({ link_clicks: Number(card.link_clicks ?? 0) + 1, link_clicked_at: new Date().toISOString() }).eq("id", card.id);
  if (own) return NextResponse.redirect(own);
  const utm = card?.platform === "FB" ? "&utm_source=facebook&utm_medium=dm&utm_campaign=masterclass" : "";
  return NextResponse.redirect(`${origin}/masterclass-signup${card ? `?c=${code}${utm}` : ""}`);
}
