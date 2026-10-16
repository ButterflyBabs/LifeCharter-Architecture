import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";

export const dynamic = "force-dynamic";

// Find a person on ANY of the account's outreach pipelines by name, handle, email or notes.
//   GET ?q=<text>&purpose=outreach|affiliate -> { results: [{ id, name, handle, platform, boardId, boardName, stageName, lastContactedAt }] }
export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const u = new URL(request.url);
  const q = (u.searchParams.get("q") || "").trim().replace(/[%,()]/g, "").slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });
  const purpose = u.searchParams.get("purpose") === "affiliate" ? "affiliate" : "outreach";
  const db = createServerClient();
  const { data: boards } = await db.from("pipeline_boards").select("id, name").eq("master_plan_id", a.planId).eq("purpose", purpose);
  const ids = ((boards ?? []) as { id: string; name: string }[]).map((b) => b.id);
  if (!ids.length) return NextResponse.json({ results: [] });
  // Every word has to appear on the card (name, handle, email or notes), in any order.
  const words = q.split(/[\s,]+/).filter(Boolean).slice(0, 6);
  let cq = db
    .from("dm_cards")
    .select("id, name, handle, platform, board_id, stage_id, last_contacted_at, email, notes")
    .eq("master_plan_id", a.planId)
    .in("board_id", ids);
  for (const w of words) cq = cq.or(`name.ilike.%${w}%,handle.ilike.%${w}%,email.ilike.%${w}%,notes.ilike.%${w}%`);
  const { data: cards } = await cq.order("updated_at", { ascending: false }).limit(40);
  const { data: stages } = await db.from("dm_stages").select("id, name").in("board_id", ids);
  const stageName = new Map(((stages ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name]));
  const boardName = new Map(((boards ?? []) as { id: string; name: string }[]).map((b) => [b.id, b.name]));
  return NextResponse.json({
    results: ((cards ?? []) as { id: string; name: string; handle: string | null; platform: string | null; board_id: string; stage_id: string; last_contacted_at: string | null }[]).map((c) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
      platform: c.platform,
      boardId: c.board_id,
      boardName: boardName.get(c.board_id) ?? "",
      stageName: stageName.get(c.stage_id) ?? "",
      lastContactedAt: c.last_contacted_at,
    })),
  });
}
