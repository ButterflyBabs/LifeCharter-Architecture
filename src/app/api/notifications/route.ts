import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { syncNotifications } from "@/lib/alerts";

export const dynamic = "force-dynamic";

// The bell's alerts (rules live in src/lib/alerts.ts).
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ items: [], unread: 0 });
  const rows = await syncNotifications(masterPlanId);
  const items = rows.map(({ id, type, title, body, href, read, created_at }) => ({ id, type, title, body, href, read, created_at }));
  const unread = items.filter((i) => !i.read).length;
  return NextResponse.json({ items, unread });
}

// POST — { action: "read" | "read_all" | "dismiss", id? }
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === "read_all") {
    await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("master_plan_id", masterPlanId)
      .eq("read", false);
    return NextResponse.json({ ok: true });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  if (action === "dismiss") {
    await supabase
      .from("notifications")
      .update({ dismissed: true, read: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("master_plan_id", masterPlanId);
    return NextResponse.json({ ok: true });
  }

  // Default: mark read.
  await supabase
    .from("notifications")
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);
  return NextResponse.json({ ok: true });
}
