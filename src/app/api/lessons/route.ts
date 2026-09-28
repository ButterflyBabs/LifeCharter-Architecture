import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { isAlignmentArchitect } from "@/lib/authz";
import { DIMENSION_KEYS } from "@/lib/scoring/dimensionModel";

export const dynamic = "force-dynamic";

// Lessons per business dimension. Everyone reads the published ones; only the
// Alignment Architect sees drafts and can add, edit or remove lessons.
//   GET ?dimension=key   GET ?all=1 (architect)   POST / PATCH { id } / DELETE { id } (architect)

const DIMS = new Set<string>(DIMENSION_KEYS);
const SELECT = "id, dimension_key, title, summary, body, video_url, resource_url, sort_order, published, updated_at";
const url = (v: unknown) => (typeof v === "string" && /^https?:\/\//i.test(v.trim()) ? v.trim().slice(0, 500) : null);

function clean(b: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (typeof b.dimensionKey === "string" && DIMS.has(b.dimensionKey)) out.dimension_key = b.dimensionKey;
  if (typeof b.title === "string") out.title = b.title.trim().slice(0, 160);
  if (typeof b.summary === "string") out.summary = b.summary.trim().slice(0, 500) || null;
  if (typeof b.body === "string") out.body = b.body.trim().slice(0, 8000) || null;
  if (b.videoUrl !== undefined) out.video_url = url(b.videoUrl);
  if (b.resourceUrl !== undefined) out.resource_url = url(b.resourceUrl);
  if (b.sortOrder !== undefined && Number.isFinite(Number(b.sortOrder))) out.sort_order = Math.round(Number(b.sortOrder));
  if (b.published !== undefined) out.published = Boolean(b.published);
  return out;
}

export async function GET(request: Request) {
  const u = new URL(request.url);
  const db = createServerClient();
  if (u.searchParams.get("all") === "1") {
    if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const { data } = await db.from("dimension_lessons").select(SELECT).order("dimension_key").order("sort_order");
    return NextResponse.json({ lessons: data ?? [] });
  }
  const dim = u.searchParams.get("dimension") || "";
  if (!DIMS.has(dim)) return NextResponse.json({ lessons: [] });
  const { data } = await db.from("dimension_lessons").select(SELECT).eq("dimension_key", dim).eq("published", true).order("sort_order");
  return NextResponse.json({ lessons: data ?? [] });
}

async function guard(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return null;
}

export async function POST(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  const row = clean(await request.json().catch(() => ({})));
  if (!row.dimension_key || !row.title) return NextResponse.json({ error: "Choose an area and give the lesson a title." }, { status: 400 });
  const { data, error } = await createServerClient().from("dimension_lessons").insert(row).select(SELECT).single();
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ lesson: data });
}

export async function PATCH(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string") return NextResponse.json({ error: "Missing lesson." }, { status: 400 });
  const { data, error } = await createServerClient()
    .from("dimension_lessons")
    .update({ ...clean(body), updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select(SELECT)
    .single();
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ lesson: data });
}

export async function DELETE(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string") return NextResponse.json({ error: "Missing lesson." }, { status: 400 });
  await createServerClient().from("dimension_lessons").delete().eq("id", body.id);
  return NextResponse.json({ ok: true });
}
