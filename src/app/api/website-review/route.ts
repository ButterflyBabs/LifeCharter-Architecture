import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { crossOriginBlocked } from "@/lib/security";
import { isWebsiteAddress, siteKey, upgradeNote, websiteReviewCap } from "@/lib/websiteReviews";

export const dynamic = "force-dynamic";

// The signed-in client's own Website Alignment Reviews: one for each website their plan allows (Starter 1, Growth 2,
// VIP 5). The first website is the one kept on their workspace (the same field as Settings > Workspace > Website);
// the others are added here. Each site has its own Review, written by our team and published when it is ready.
async function account() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return null;
  const supabase = createServerClient();
  const { data: plan } = await supabase.from("client_master_plans").select("id, created_at").eq("id", masterPlanId).maybeSingle();
  const { data: ws } = await supabase.from("workspaces").select("id, website").eq("master_plan_id", masterPlanId).order("is_default", { ascending: false }).limit(1).maybeSingle();
  return { supabase, masterPlanId, enrolledAt: (plan?.created_at as string) ?? null, workspaceId: (ws?.id as string) ?? null, website: ((ws?.website as string) || "").trim() };
}
type Acct = NonNullable<Awaited<ReturnType<typeof account>>>;
interface Row { id: string; website: string; status: string; content: string | null; published_at: string | null; created_at: string }
const COLS = "id, website, status, content, published_at, created_at";

async function rows(a: Acct): Promise<Row[]> {
  const { data } = await a.supabase.from("website_reviews").select(COLS).eq("master_plan_id", a.masterPlanId).order("created_at", { ascending: true });
  return (data ?? []) as Row[];
}

// The workspace website always has a Review row, so it shows up in our queue.
async function ensureMain(a: Acct, list: Row[]): Promise<Row[]> {
  if (!a.website || list.some((r) => siteKey(r.website) === siteKey(a.website))) return list;
  const { data } = await a.supabase.from("website_reviews").insert({ master_plan_id: a.masterPlanId, website: a.website }).select(COLS).maybeSingle();
  return data ? [...list, data as Row] : list;
}

export async function GET() {
  const a = await account();
  if (!a) return NextResponse.json({ website: "", status: "none", sites: [], limit: 1, used: 0 });
  const list = await ensureMain(a, await rows(a));
  const cap = await websiteReviewCap(a.supabase, a.masterPlanId);
  const due = (r: Row, first: boolean) => {
    const from = first && a.enrolledAt ? a.enrolledAt : r.created_at;
    return new Date(new Date(from).getTime() + 14 * 86400_000).toISOString();
  };
  const sites = list.map((r, i) => ({
    id: r.id,
    website: r.website,
    status: r.status === "published" ? "published" : "in_progress",
    content: r.status === "published" ? r.content ?? "" : null,
    publishedAt: r.status === "published" ? r.published_at : null,
    due: due(r, i === 0),
  }));
  const main = sites.find((s) => siteKey(s.website) === siteKey(a.website)) ?? sites[0];
  // The top-level fields are for the pages that only need the main website (setup, the dashboard widget).
  return NextResponse.json({
    website: a.website || main?.website || "",
    status: main?.status === "published" ? "published" : a.website || main ? "in_progress" : "needs_website",
    content: main?.content ?? null,
    publishedAt: main?.publishedAt ?? null,
    due: main?.due ?? null,
    sites,
    limit: cap,
    used: sites.length,
    upgrade: sites.length >= cap ? upgradeNote(cap) : "",
  });
}

// POST { website }: add another website to be reviewed (within the plan's limit).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await account();
  if (!a) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const website = typeof body.website === "string" ? body.website.trim().slice(0, 300) : "";
  if (!website || !isWebsiteAddress(website)) return NextResponse.json({ error: "Please enter a website address, like yourbusiness.com." }, { status: 400 });
  const list = await ensureMain(a, await rows(a));
  if (list.some((r) => siteKey(r.website) === siteKey(website))) return NextResponse.json({ error: "That website is already on your list." }, { status: 400 });
  const cap = await websiteReviewCap(a.supabase, a.masterPlanId);
  if (list.length >= cap) {
    const up = upgradeNote(cap);
    return NextResponse.json({ error: `Your plan includes ${cap} website review${cap === 1 ? "" : "s"}, and you are using ${list.length === 1 ? "it" : "all of them"}.${up ? ` ${up}` : ""}`, limitReached: true }, { status: 403 });
  }
  const { error } = await a.supabase.from("website_reviews").insert({ master_plan_id: a.masterPlanId, website });
  if (error) return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 });
  // The first website a client adds is also their workspace website, so Settings agrees.
  if (!a.website && a.workspaceId) await a.supabase.from("workspaces").update({ website }).eq("id", a.workspaceId);
  return NextResponse.json({ ok: true, website });
}

// PATCH { website }: save the main website address (the workspace field).
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await account();
  if (!a?.workspaceId) return NextResponse.json({ error: "No workspace found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const website = typeof body.website === "string" ? body.website.trim().slice(0, 300) : "";
  if (!website || !isWebsiteAddress(website)) return NextResponse.json({ error: "Please enter a website address, like yourbusiness.com." }, { status: 400 });
  const list = await rows(a);
  // Changing the main address renames its Review if that Review is still unwritten; a delivered Review stays as it was.
  const old = list.find((r) => a.website && siteKey(r.website) === siteKey(a.website));
  if (old && old.status !== "published" && siteKey(old.website) !== siteKey(website) && !list.some((r) => siteKey(r.website) === siteKey(website))) {
    await a.supabase.from("website_reviews").update({ website, updated_at: new Date().toISOString() }).eq("id", old.id);
  }
  const { error } = await a.supabase.from("workspaces").update({ website }).eq("id", a.workspaceId);
  if (error) return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 });
  await ensureMain({ ...a, website }, await rows(a));
  return NextResponse.json({ ok: true, website });
}

// DELETE ?id=: take off a website whose Review has not been delivered (it frees a place).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await account();
  if (!a) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data: r } = await a.supabase.from("website_reviews").select("id, website, status").eq("id", id).eq("master_plan_id", a.masterPlanId).maybeSingle();
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (r.status === "published") return NextResponse.json({ error: "That Review has been delivered, so it stays on your list." }, { status: 400 });
  await a.supabase.from("website_reviews").delete().eq("id", id);
  if (a.workspaceId && siteKey(String(r.website)) === siteKey(a.website)) await a.supabase.from("workspaces").update({ website: null }).eq("id", a.workspaceId);
  return NextResponse.json({ ok: true });
}
