import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { sessionUser } from "@/lib/authz";
import { cleanBlocks, slugify } from "@/lib/customPages";

export const dynamic = "force-dynamic";

const demo = () => {
  try {
    return cookies().get("lc_demo")?.value === "1";
  } catch {
    return false;
  }
};

// Custom Pages: the pages in this account's own left menu.
//   GET            → the list (for the menu)
//   GET ?slug=     → one page with its blocks
//   POST { title, blocks? }            → a new page
//   PATCH { slug, title?, blocks? }    → edit a page
//   DELETE { slug }
export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ pages: [] });
  const db = createServerClient();
  const slug = new URL(request.url).searchParams.get("slug");
  if (slug) {
    const { data } = await db.from("custom_pages").select("slug, title, blocks, nav_section, updated_at").eq("master_plan_id", planId).eq("slug", slug).maybeSingle();
    if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ page: data });
  }
  const { data } = await db.from("custom_pages").select("slug, title, position, nav_section").eq("master_plan_id", planId).order("position").order("created_at");
  return NextResponse.json({ pages: data ?? [] });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (demo()) return NextResponse.json({ error: "The demo is view-only." }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const b = await request.json().catch(() => ({}));
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 80) : "";
  if (!title) return NextResponse.json({ error: "Name the page." }, { status: 400 });
  const db = createServerClient();
  const { count } = await db.from("custom_pages").select("id", { count: "exact", head: true }).eq("master_plan_id", planId);
  if ((count ?? 0) >= 40) return NextResponse.json({ error: "That's the most pages one account can hold." }, { status: 400 });
  const base = slugify(title);
  let slug = base;
  for (let i = 2; i < 30; i++) {
    const { data: hit } = await db.from("custom_pages").select("id").eq("master_plan_id", planId).eq("slug", slug).maybeSingle();
    if (!hit) break;
    slug = `${base}-${i}`;
  }
  const { data, error } = await db.from("custom_pages").insert({ master_plan_id: planId, slug, title, blocks: cleanBlocks(b.blocks), position: count ?? 0, created_by: (await sessionUser())?.email ?? null }).select("slug, title").single();
  if (error) return NextResponse.json({ error: "Couldn't create it." }, { status: 500 });
  return NextResponse.json({ page: data });
}

export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (demo()) return NextResponse.json({ error: "The demo is view-only." }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const b = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.title === "string" && b.title.trim()) patch.title = b.title.trim().slice(0, 80);
  if (b.blocks !== undefined) patch.blocks = cleanBlocks(b.blocks);
  const { data, error } = await createServerClient().from("custom_pages").update(patch).eq("master_plan_id", planId).eq("slug", String(b.slug || "")).select("slug, title, updated_at").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Couldn't save." }, { status: error ? 500 : 404 });
  return NextResponse.json({ page: data });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (demo()) return NextResponse.json({ error: "The demo is view-only." }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const b = await request.json().catch(() => ({}));
  await createServerClient().from("custom_pages").delete().eq("master_plan_id", planId).eq("slug", String(b.slug || ""));
  return NextResponse.json({ ok: true });
}
