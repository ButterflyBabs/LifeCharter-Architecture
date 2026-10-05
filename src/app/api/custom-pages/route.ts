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
//   PATCH { slug, title?, blocks?, review? }  → edit a page; review "approved" approves a page made for
//                                        review (and drops its "DRAFT ..." note), "draft" reopens it
//   DELETE { slug }
export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ pages: [] });
  const db = createServerClient();
  const slug = new URL(request.url).searchParams.get("slug");
  if (slug) {
    const { data } = await db.from("custom_pages").select("slug, title, blocks, nav_section, updated_at, review_status, approved_at").eq("master_plan_id", planId).eq("slug", slug).maybeSingle();
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
  const db = createServerClient();
  // A review page whose notes are approved one by one: the page is approved once every note is,
  // and its "DRAFT ..." note comes off then.
  if (patch.blocks !== undefined && b.review === undefined) {
    const { data: cur } = await db.from("custom_pages").select("review_status, blocks").eq("master_plan_id", planId).eq("slug", String(b.slug || "")).maybeSingle();
    // A tab opened before a note was put up for review doesn't know about it and would save the note
    // without its status. Keep the stored status for any block that arrives without one.
    const stored = new Map(cleanBlocks(cur?.blocks).filter((x) => x.review).map((x) => [x.id, x]));
    if (stored.size) {
      patch.blocks = (patch.blocks as ReturnType<typeof cleanBlocks>).map((x) => {
        const was = stored.get(x.id);
        return !x.review && was ? { ...x, review: was.review, ...(was.approvedAt ? { approvedAt: was.approvedAt } : {}) } : x;
      });
    }
    const notes = (patch.blocks as ReturnType<typeof cleanBlocks>).filter((x) => x.review);
    if (notes.length) {
      if (cur?.review_status) {
        const all = notes.every((x) => x.review === "approved");
        if (all && cur.review_status !== "approved") Object.assign(patch, { review_status: "approved", approved_at: new Date().toISOString() });
        if (!all && cur.review_status !== "draft") Object.assign(patch, { review_status: "draft", approved_at: null });
        if (all) patch.blocks = (patch.blocks as ReturnType<typeof cleanBlocks>).filter((x) => !(x.type === "callout" && /^\s*draft\b/i.test(x.text)));
      }
    }
  }
  if (b.review === "approved" || b.review === "draft") {
    const { data: cur } = await db.from("custom_pages").select("blocks, review_status").eq("master_plan_id", planId).eq("slug", String(b.slug || "")).maybeSingle();
    if (!cur) return NextResponse.json({ error: "Couldn't save." }, { status: 404 });
    if (!cur.review_status) return NextResponse.json({ error: "This page isn't waiting for approval." }, { status: 400 });
    patch.review_status = b.review;
    patch.approved_at = b.review === "approved" ? new Date().toISOString() : null;
    // Approving takes the "DRAFT for your approval" note off the page.
    if (b.review === "approved") patch.blocks = cleanBlocks(patch.blocks ?? cur.blocks).filter((x) => !(x.type === "callout" && /^\s*draft\b/i.test(x.text)));
  }
  const { data, error } = await db.from("custom_pages").update(patch).eq("master_plan_id", planId).eq("slug", String(b.slug || "")).select("slug, title, updated_at, blocks, review_status, approved_at").maybeSingle();
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
