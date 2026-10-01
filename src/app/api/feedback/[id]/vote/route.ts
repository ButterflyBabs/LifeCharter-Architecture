import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Toggle my vote on a Suggestion or Feedback item (one vote per person;
// clicking again takes it back). Glitches aren't votable — they're a private
// report, not a community idea.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const db = createServerClient();

  const { data: item } = await db.from("feedback_items").select("id, kind").eq("id", params.id).maybeSingle();
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (item.kind === "glitch") return NextResponse.json({ error: "Glitch reports aren't votable." }, { status: 400 });

  const { data: existing } = await db.from("feedback_votes").select("item_id").eq("item_id", params.id).eq("user_id", user.id).maybeSingle();
  if (existing) await db.from("feedback_votes").delete().eq("item_id", params.id).eq("user_id", user.id);
  else await db.from("feedback_votes").insert({ item_id: params.id, user_id: user.id });

  const { count } = await db.from("feedback_votes").select("item_id", { count: "exact", head: true }).eq("item_id", params.id);
  const voteCount = count ?? 0;
  await db.from("feedback_items").update({ vote_count: voteCount, updated_at: new Date().toISOString() }).eq("id", params.id);
  return NextResponse.json({ voted: !existing, voteCount });
}
