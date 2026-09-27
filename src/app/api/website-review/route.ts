import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// The signed-in client's own Website Alignment Review: their website address (kept on their
// workspace, the same field as Settings > Workspace > Website) and, once published, the Review.
async function account() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return null;
  const supabase = createServerClient();
  const { data: plan } = await supabase.from("client_master_plans").select("id, created_at").eq("id", masterPlanId).maybeSingle();
  const { data: ws } = await supabase.from("workspaces").select("id, website").eq("master_plan_id", masterPlanId).order("is_default", { ascending: false }).limit(1).maybeSingle();
  return { supabase, masterPlanId, enrolledAt: (plan?.created_at as string) ?? null, workspaceId: (ws?.id as string) ?? null, website: ((ws?.website as string) || "").trim() };
}

export async function GET() {
  const a = await account();
  if (!a) return NextResponse.json({ website: "", status: "none" });
  const { data: r } = await a.supabase.from("website_reviews").select("status, content, published_at").eq("master_plan_id", a.masterPlanId).maybeSingle();
  const published = r?.status === "published";
  const due = a.enrolledAt ? new Date(new Date(a.enrolledAt).getTime() + 14 * 86400_000).toISOString() : null;
  return NextResponse.json({
    website: a.website,
    status: published ? "published" : a.website ? "in_progress" : "needs_website",
    content: published ? r?.content ?? "" : null,
    publishedAt: published ? r?.published_at ?? null : null,
    due,
  });
}

// PATCH { website }: save the client's website address.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await account();
  if (!a?.workspaceId) return NextResponse.json({ error: "No workspace found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const website = typeof body.website === "string" ? body.website.trim().slice(0, 300) : "";
  if (!website || !/^([a-z]+:\/\/)?[^\s/]+\.[^\s]+$/i.test(website)) return NextResponse.json({ error: "Please enter a website address, like yourbusiness.com." }, { status: 400 });
  const { error } = await a.supabase.from("workspaces").update({ website }).eq("id", a.workspaceId);
  if (error) return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true, website });
}
