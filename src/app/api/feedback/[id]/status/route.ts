import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

const STATUSES = ["open", "under_review", "planned", "shipped", "closed"];

// Admin only (Babs): mark where a Suggestion, Feedback or Glitch stands —
// visible to everyone who can see that item.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  if (!STATUSES.includes(body.status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  const db = createServerClient();
  const { error } = await db.from("feedback_items").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", params.id);
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
