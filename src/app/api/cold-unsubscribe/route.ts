import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { boardStages, markDoNotContact, moveCard } from "@/lib/dmPipeline";

export const dynamic = "force-dynamic";

// The unsubscribe link at the foot of a cold email, and the one-click button mail apps show (they POST here).
// The personal code in the link is the key. Anyone who unsubscribes is marked Do Not Contact and their card is closed.
async function unsubscribe(code: string) {
  const c = code.replace(/[^a-z0-9]/gi, "").slice(0, 20);
  if (c.length < 5) return false;
  const db = createServerClient();
  const { data: card } = await db.from("dm_cards").select("id, master_plan_id, board_id, stage_id, name, email").eq("link_code", c).maybeSingle();
  if (!card?.email) return false;
  const stages = await boardStages(db, card.master_plan_id as string, card.board_id as string);
  const to = stages.find((s) => s.key === "not_now");
  const cur = stages.find((s) => s.id === card.stage_id);
  const { data: board } = await db.from("pipeline_boards").select("name").eq("id", card.board_id).maybeSingle();
  if (to && cur && cur.kind !== "closed") await moveCard(db, card.master_plan_id as string, card.id as string, to, (board?.name as string) || "Pipeline", "America/Denver");
  await markDoNotContact(db, card.master_plan_id as string, card.email as string, card.name as string);
  return true;
}

export async function POST(request: Request) {
  const c = new URL(request.url).searchParams.get("c") || "";
  return (await unsubscribe(c)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "That link did not work." }, { status: 400 });
}

export async function GET(request: Request) {
  const c = new URL(request.url).searchParams.get("c") || "";
  return (await unsubscribe(c)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "That link did not work." }, { status: 400 });
}
