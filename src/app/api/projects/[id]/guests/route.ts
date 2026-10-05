import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { loadProject, clean, newGuestToken } from "@/lib/projects/server";

export const dynamic = "force-dynamic";

// Share a project with a client or a contractor: they get a private link (no account needed). Nothing is emailed.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  if (!(await loadProject(db, planId, params.id))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const name = clean(b.name, 120);
  const role = b.role === "contractor" ? "contractor" : b.role === "client" ? "client" : "";
  if (!name || !role) return NextResponse.json({ error: "Add their name and whether they are a client or a contractor." }, { status: 400 });
  const email = clean(b.email, 200).toLowerCase() || null;
  const { data, error } = await db.from("project_guests").insert({ project_id: params.id, master_plan_id: planId, name, email, role, token: newGuestToken() }).select("id, name, email, role, token").single();
  if (error || !data) return NextResponse.json({ error: "Couldn't share it." }, { status: 500 });
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
  return NextResponse.json({ guest: { id: data.id, name: data.name, email: data.email, role: data.role, link: `${app}/p/${data.token}` } });
}

// DELETE ?guest=<id> stops the link working (their assigned tasks stay, unassigned).
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const gid = new URL(request.url).searchParams.get("guest") || "";
  await createServerClient().from("project_guests").update({ revoked: true }).eq("id", gid).eq("project_id", params.id).eq("master_plan_id", planId);
  return NextResponse.json({ ok: true });
}
