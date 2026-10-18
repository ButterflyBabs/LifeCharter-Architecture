import { NextResponse } from "next/server";
import { PORTAL_BUCKET, portalFor } from "@/lib/portal";
import { cleanLook } from "@/lib/portalLook";

export const dynamic = "force-dynamic";

// The logo or banner the owner chose for this client's portal (?k=logo|banner): a short-lived signed image link.
export async function GET(request: Request, { params }: { params: { token: string } }) {
  const ctx = await portalFor(params.token);
  if (!ctx) return NextResponse.json({ error: "not found" }, { status: 404 });
  const look = cleanLook(ctx.p.look ?? {});
  const k = new URL(request.url).searchParams.get("k");
  const path = k === "logo" ? look.logoPath : k === "banner" ? look.bannerPath : null;
  if (!path || !path.startsWith(`${ctx.p.master_plan_id}/`)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data } = await ctx.db.storage.from(PORTAL_BUCKET).createSignedUrl(path, 3600);
  if (!data?.signedUrl) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "private, max-age=1800" } });
}
