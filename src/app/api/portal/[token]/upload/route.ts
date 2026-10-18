import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { MAX_FILE, PORTAL_BUCKET, portalFor } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The client shares a file with the account owner from their portal (multipart: file, title?).
export async function POST(request: Request, { params }: { params: { token: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await portalFor(params.token);
  if (!ctx) return NextResponse.json({ error: "This portal link isn't active." }, { status: 404 });
  const { db, p } = ctx;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  if (file.size > MAX_FILE) return NextResponse.json({ error: "Files can be up to 50 MB." }, { status: 400 });
  const { count } = await db.from("portal_items").select("id", { count: "exact", head: true }).eq("contact_id", p.contact_id).eq("done_by", "client").eq("kind", "resource").gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  if ((count ?? 0) >= 20) return NextResponse.json({ error: "That's the most files for one day." }, { status: 429 });
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80) || "file";
  const path = `${p.master_plan_id}/${p.contact_id}/${Date.now()}-${safe}`;
  const { error } = await db.storage.from(PORTAL_BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) return NextResponse.json({ error: "The file didn't upload. Try again." }, { status: 500 });
  const title = String(form?.get("title") || "").trim().slice(0, 200) || file.name.slice(0, 200);
  await db.from("portal_items").insert({ master_plan_id: p.master_plan_id, contact_id: p.contact_id, kind: "resource", title, file_path: path, file_name: file.name.slice(0, 200), done_by: "client", position: 9999 });
  return NextResponse.json({ ok: true });
}
