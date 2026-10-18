import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { PORTAL_OPEN_TO_ALL } from "@/lib/portalFlag";
import { PORTAL_BUCKET } from "@/lib/portal";

export const dynamic = "force-dynamic";

// The owner opens a file in a client's portal (their own account's files only).
export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  if (!PORTAL_OPEN_TO_ALL && !a.isArchitect) return NextResponse.json({ error: "not found" }, { status: 404 });
  const db = createServerClient();
  const { data: it } = await db.from("portal_items").select("file_path, file_name").eq("id", new URL(request.url).searchParams.get("id") || "").eq("master_plan_id", a.planId).maybeSingle();
  if (!it?.file_path) return NextResponse.json({ error: "That file isn't here." }, { status: 404 });
  const { data } = await db.storage.from(PORTAL_BUCKET).createSignedUrl(it.file_path as string, 300, { download: (it.file_name as string) || true });
  return data?.signedUrl ? NextResponse.redirect(data.signedUrl) : NextResponse.json({ error: "The file couldn't be opened." }, { status: 500 });
}
