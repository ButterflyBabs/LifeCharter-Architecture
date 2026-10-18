import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { PORTAL_BUCKET } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// A landing page's main image (task 1153): multipart { id, file } to add or replace it, { id, remove: "1" } to take it off.
export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const form = await request.formData().catch(() => null);
  const id = String(form?.get("id") || "");
  const db = createServerClient();
  const { data: p } = /^[0-9a-f-]{36}$/i.test(id) ? await db.from("landing_pages").select("id, image_path").eq("id", id).eq("master_plan_id", a.planId).maybeSingle() : { data: null };
  if (!p) return NextResponse.json({ error: "That page could not be found." }, { status: 404 });
  const old = p.image_path as string | null;
  if (form?.get("remove")) {
    if (old) await db.storage.from(PORTAL_BUCKET).remove([old]).catch(() => null);
    await db.from("landing_pages").update({ image_path: null, updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true });
  }
  const file = form?.get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return NextResponse.json({ error: "Choose a PNG, JPG, WebP or GIF image." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Images can be up to 5 MB." }, { status: 400 });
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "png";
  const path = `${a.planId}/landing/${id}-${Date.now()}.${ext}`;
  const up = await db.storage.from(PORTAL_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return NextResponse.json({ error: "The image didn't upload. Try again." }, { status: 500 });
  await db.from("landing_pages").update({ image_path: path, updated_at: new Date().toISOString() }).eq("id", id);
  if (old) await db.storage.from(PORTAL_BUCKET).remove([old]).catch(() => null);
  return NextResponse.json({ ok: true });
}
