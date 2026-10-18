import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { PORTAL_OPEN_TO_ALL } from "@/lib/portalFlag";
import { MAX_FILE, PORTAL_BUCKET } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The owner shares a file in a client's portal (multipart: contactId, file, title?).
export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  if (!PORTAL_OPEN_TO_ALL && !a.isArchitect) return NextResponse.json({ error: "not found" }, { status: 404 });
  const form = await request.formData().catch(() => null);
  const contactId = String(form?.get("contactId") || "");
  const file = form?.get("file");
  const db = createServerClient();
  const { data: c } = await db.from("seq_contacts").select("id").eq("id", contactId).eq("master_plan_id", a.planId).maybeSingle();
  if (!c) return NextResponse.json({ error: "That contact could not be found." }, { status: 404 });
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  if (file.size > MAX_FILE) return NextResponse.json({ error: "Files can be up to 50 MB." }, { status: 400 });
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80) || "file";
  const path = `${a.planId}/${contactId}/${Date.now()}-${safe}`;
  const { error } = await db.storage.from(PORTAL_BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) return NextResponse.json({ error: "The file didn't upload. Try again." }, { status: 500 });
  const title = String(form?.get("title") || "").trim().slice(0, 200) || file.name.slice(0, 200);
  const { count } = await db.from("portal_items").select("id", { count: "exact", head: true }).eq("contact_id", contactId).eq("kind", "resource");
  await db.from("portal_items").insert({ master_plan_id: a.planId, contact_id: contactId, kind: "resource", title, file_path: path, file_name: file.name.slice(0, 200), done_by: "owner", position: count ?? 0 });
  return NextResponse.json({ ok: true });
}
