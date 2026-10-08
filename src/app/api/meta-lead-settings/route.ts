import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";

export const dynamic = "force-dynamic";

// POST { boardId: string | null }: which Outreach Pipeline this account's Meta lead-ad people are added to.
export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const body = (await request.json().catch(() => ({}))) as { boardId?: string | null };
  const db = createServerClient();
  let boardId: string | null = null;
  if (body.boardId) {
    const { data: b } = await db.from("pipeline_boards").select("id").eq("id", body.boardId).eq("master_plan_id", a.planId).maybeSingle();
    if (!b) return NextResponse.json({ error: "Pipeline not found." }, { status: 404 });
    boardId = b.id as string;
  }
  const { error } = await db.from("meta_lead_settings").update({ board_id: boardId }).eq("master_plan_id", a.planId);
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
