import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { PORTAL_BUCKET } from "@/lib/portal";

export const dynamic = "force-dynamic";

// A landing page's main image (task 1153): a short-lived signed link to the private file. Drafts show it too, so the
// owner's preview works; the page id is not secret, but the image is meant to be public once the page is.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return new NextResponse("Not found.", { status: 404 });
  const db = createServerClient();
  const { data } = await db.from("landing_pages").select("image_path, status").eq("id", params.id).maybeSingle();
  if (!data?.image_path || data.status === "archived") return new NextResponse("Not found.", { status: 404 });
  const { data: signed } = await db.storage.from(PORTAL_BUCKET).createSignedUrl(data.image_path as string, 3600);
  if (!signed?.signedUrl) return new NextResponse("Not found.", { status: 404 });
  return NextResponse.redirect(signed.signedUrl, { headers: { "Cache-Control": "public, max-age=1800" } });
}
