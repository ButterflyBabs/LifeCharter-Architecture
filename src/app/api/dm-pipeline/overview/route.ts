import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { ensureBoards, platformLabel } from "@/lib/dmPipeline";
import { summarize, OVERVIEW_COLUMNS } from "@/lib/dmEmailList";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// All outreach on one page, whichever pipeline it sits in: how many people are where, by channel (LinkedIn, Facebook, Email ...)
// and by pipeline. Read-only; counts the people sitting in each stage group right now.
export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const boards = await ensureBoards(db, a.planId, "outreach");
  if (!boards.length) return NextResponse.json({ columns: OVERVIEW_COLUMNS, channels: [], boards: [], total: null });
  const ids = boards.map((b) => b.id);
  const { data: stages } = await db.from("dm_stages").select("id, key, kind").eq("master_plan_id", a.planId).in("board_id", ids);
  const cards: { board_id: string; stage_id: string; platform: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("dm_cards").select("board_id, stage_id, platform").eq("master_plan_id", a.planId).in("board_id", ids).order("id").range(from, from + 999);
    const rows = (data ?? []) as typeof cards;
    cards.push(...rows);
    if (rows.length < 1000) break;
  }
  const out = summarize(cards, (stages ?? []) as { id: string; key: string; kind: string }[], boards.map((b) => ({ id: b.id, name: b.name })), (p) => platformLabel(p));
  return NextResponse.json({ columns: OVERVIEW_COLUMNS, ...out });
}
