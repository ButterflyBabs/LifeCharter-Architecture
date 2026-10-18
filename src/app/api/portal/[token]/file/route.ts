import { NextResponse } from "next/server";
import { PORTAL_BUCKET, portalFor } from "@/lib/portal";
import { isMember } from "@/lib/programs";
import { lessonOpen } from "@/lib/courses";

export const dynamic = "force-dynamic";

// Open a file shared in the portal: a short-lived signed link to the private bucket, only for this client's own items.
export async function GET(request: Request, { params }: { params: { token: string } }) {
  const ctx = await portalFor(params.token);
  if (!ctx) return NextResponse.json({ error: "This portal link isn't active." }, { status: 404 });
  const lessonId = new URL(request.url).searchParams.get("lesson");
  if (lessonId) {
    const { data: l } = await ctx.db.from("program_lessons").select("program_id, file_path, file_name, opens_on, open_after_days").eq("id", lessonId).maybeSingle();
    const m = l ? await isMember(ctx.db, ctx.p.master_plan_id, l.program_id as string, ctx.p.contact_id) : null;
    // Drip: the file opens when the lesson does (on its date, or N days after this member joined).
    const open = l && m && lessonOpen(l as { opens_on: string | null; open_after_days: number | null }, m.kind, m.joinedDay, new Date().toISOString().slice(0, 10));
    if (!l?.file_path || !open) return NextResponse.json({ error: "That file isn't here." }, { status: 404 });
    const { data } = await ctx.db.storage.from(PORTAL_BUCKET).createSignedUrl(l.file_path as string, 300, { download: (l.file_name as string) || true });
    return data?.signedUrl ? NextResponse.redirect(data.signedUrl) : NextResponse.json({ error: "The file couldn't be opened." }, { status: 500 });
  }
  const id = new URL(request.url).searchParams.get("id") || "";
  const { data: item } = await ctx.db.from("portal_items").select("file_path, file_name").eq("id", id).eq("contact_id", ctx.p.contact_id).maybeSingle();
  if (!item?.file_path) return NextResponse.json({ error: "That file isn't here." }, { status: 404 });
  const { data } = await ctx.db.storage.from(PORTAL_BUCKET).createSignedUrl(item.file_path as string, 300, { download: (item.file_name as string) || true });
  if (!data?.signedUrl) return NextResponse.json({ error: "The file couldn't be opened." }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
