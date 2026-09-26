import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { socialContext, isYmd, isStatus, str, shapePost, POST_COLUMNS, type PostRow } from "@/lib/social/server";
import { inviteLevelOf } from "@/lib/social/planner";
import { getClientKey, deletePost } from "@/lib/postStream";

export const dynamic = "force-dynamic";

// GET — planned posts, optionally ?from=YYYY-MM-DD&to=YYYY-MM-DD.
export async function GET(request: Request) {
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  // PostgREST caps a response at 1000 rows; page through so a full plan loads.
  const posts: PostRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    let q = ctx.supabase.from("social_posts").select(POST_COLUMNS).eq("master_plan_id", ctx.masterPlanId);
    if (isYmd(from)) q = q.gte("planned_date", from);
    if (isYmd(to)) q = q.lte("planned_date", to);
    const { data, error } = await q.order("planned_date").order("platform").order("id").range(offset, offset + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    posts.push(...((data || []) as PostRow[]));
    if (!data || data.length < 1000) break;
  }
  return NextResponse.json({ posts: posts.map(shapePost) });
}

// Fields a client may set on a post.
function editable(body: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (isYmd(body.date)) row.planned_date = body.date;
  if (typeof body.platform === "string" && body.platform.trim()) row.platform = body.platform.trim().slice(0, 40);
  if (typeof body.format === "string" && body.format.trim()) row.format = body.format.trim().slice(0, 40);
  if (isStatus(body.status)) {
    row.status = body.status;
    row.posted_at = body.status === "posted" ? new Date().toISOString() : null;
  }
  if (typeof body.title === "string") row.title = str(body.title, 300);
  if (typeof body.notes === "string") {
    row.notes = str(body.notes, 50000);
    row.invite_level = inviteLevelOf(row.notes as string);
  }
  if (typeof body.imagePrompt === "string") row.image_prompt = str(body.imagePrompt, 20000);
  if (typeof body.link === "string") row.link = str(body.link, 2000);
  if (typeof body.series === "string") row.series = str(body.series, 200);
  if (body.offerKey === null || typeof body.offerKey === "string") row.offer_key = body.offerKey || null;
  return row;
}

// POST — add a post to the plan.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const body = await request.json().catch(() => ({}));
  const row = editable(body);
  if (!row.planned_date || !row.platform) return NextResponse.json({ error: "A date and a platform are required." }, { status: 400 });

  const { data, error } = await ctx.supabase
    .from("social_posts")
    .insert({ ...row, master_plan_id: ctx.masterPlanId })
    .select(POST_COLUMNS)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: shapePost(data as PostRow) });
}

// PATCH — update a post ({ id, ...fields }).
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { data, error } = await ctx.supabase
    .from("social_posts")
    .update({ ...editable(body), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("master_plan_id", ctx.masterPlanId)
    .select(POST_COLUMNS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  return NextResponse.json({ post: shapePost(data as PostRow) });
}

// DELETE — remove a post (?id=...).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  // A post that's been sent to PostStream: if nothing else shares it and it
  // hasn't gone out yet, cancel it there too (deleting a scheduled post must
  // stop it publishing). Either way, remember it so the calendar sync doesn't
  // bring it back.
  const { data: row } = await ctx.supabase.from("social_posts").select("poststream_post_id, status").eq("id", id).eq("master_plan_id", ctx.masterPlanId).maybeSingle();
  const psId = (row?.poststream_post_id as string | null) || null;
  if (psId) {
    const { count } = await ctx.supabase.from("social_posts").select("id", { count: "exact", head: true }).eq("master_plan_id", ctx.masterPlanId).eq("poststream_post_id", psId).neq("id", id);
    if (!count) {
      if (row?.status !== "posted") {
        const key = await getClientKey();
        if (key) await deletePost(key, psId).catch(() => undefined);
      }
      await ctx.supabase.from("social_ps_ignored").upsert({ master_plan_id: ctx.masterPlanId, poststream_post_id: psId });
    }
  }
  const { error } = await ctx.supabase.from("social_posts").delete().eq("id", id).eq("master_plan_id", ctx.masterPlanId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
