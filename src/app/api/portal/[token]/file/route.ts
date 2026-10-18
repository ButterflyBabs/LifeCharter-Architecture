import { NextResponse } from "next/server";
import { PORTAL_BUCKET, portalFor } from "@/lib/portal";

export const dynamic = "force-dynamic";

// Open a file shared in the portal: a short-lived signed link to the private bucket, only for this client's own items.
export async function GET(request: Request, { params }: { params: { token: string } }) {
  const ctx = await portalFor(params.token);
  if (!ctx) return NextResponse.json({ error: "This portal link isn't active." }, { status: 404 });
  const id = new URL(request.url).searchParams.get("id") || "";
  const { data: item } = await ctx.db.from("portal_items").select("file_path, file_name").eq("id", id).eq("contact_id", ctx.p.contact_id).maybeSingle();
  if (!item?.file_path) return NextResponse.json({ error: "That file isn't here." }, { status: 404 });
  const { data } = await ctx.db.storage.from(PORTAL_BUCKET).createSignedUrl(item.file_path as string, 300, { download: (item.file_name as string) || true });
  if (!data?.signedUrl) return NextResponse.json({ error: "The file couldn't be opened." }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
