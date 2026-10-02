import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { loadView, mountainToday, partnershipById, type Partnership } from "@/lib/accountability";

export const dynamic = "force-dynamic";

// Alignment Architect only (Babs): read-only view of accountability partnerships
// whose client has chosen to let their coach see them. Nothing here can change anything.
export async function GET(request: Request) {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not available." }, { status: 403 });
  const db = createServerClient();
  const id = new URL(request.url).searchParams.get("id");

  if (id) {
    const p = await partnershipById(db, id);
    if (!p || !p.coach_visible) return NextResponse.json({ error: "Not shared with you." }, { status: 404 });
    const { data: ws } = await db.from("workspaces").select("name").eq("master_plan_id", p.a_plan_id).order("is_default", { ascending: false }).limit(1).maybeSingle();
    return NextResponse.json({ ...(await loadView(db, p, "coach")), clientName: p.a_name, business: (ws?.name as string) || "" });
  }

  const { data } = await db.from("accountability_partnerships").select("*").eq("coach_visible", true).neq("status", "ended").order("created_at", { ascending: false });
  const rows = (data ?? []) as Partnership[];
  const ids = rows.map((r) => r.id);
  const { data: items } = ids.length ? await db.from("accountability_items").select("partnership_id, side, status, due_on").in("partnership_id", ids) : { data: [] };
  const today = mountainToday();
  return NextResponse.json({
    partnerships: rows.map((p) => {
      const mine = ((items ?? []) as { partnership_id: string; side: string; status: string; due_on: string | null }[]).filter((i) => i.partnership_id === p.id);
      const side = (s: string) => mine.filter((i) => i.side === s);
      return {
        id: p.id,
        client: p.a_name,
        partner: p.b_name,
        status: p.status,
        clientOpen: side("a").filter((i) => i.status !== "done").length,
        clientDone: side("a").filter((i) => i.status === "done").length,
        clientOverdue: side("a").filter((i) => i.status !== "done" && i.due_on && i.due_on < today).length,
        partnerOpen: side("b").filter((i) => i.status !== "done").length,
      };
    }),
  });
}
