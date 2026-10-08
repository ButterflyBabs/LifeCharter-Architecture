import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// A prospect's personal registration link: lccommandsuite.com/m/<code>. Counts the click on their outreach card,
// then sends them to the MasterClass signup with their code, so registering moves their card to Registered.
export async function GET(request: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
  const origin = new URL(request.url).origin;
  if (!code) return NextResponse.redirect(`${origin}/masterclass-signup`);
  const db = createServerClient();
  const { data: card } = await db.from("dm_cards").select("id, link_clicks").eq("link_code", code).maybeSingle();
  if (card) await db.from("dm_cards").update({ link_clicks: Number(card.link_clicks ?? 0) + 1, link_clicked_at: new Date().toISOString() }).eq("id", card.id);
  return NextResponse.redirect(`${origin}/masterclass-signup${card ? `?c=${code}` : ""}`);
}
