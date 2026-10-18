import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { PORTAL_OPEN_TO_ALL } from "@/lib/portalFlag";
import { MAX_FILE, PORTAL_BUCKET } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Attach a file to a program lesson (multipart: lessonId, file). Members download it from their portal once it opens.
export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  if (!PORTAL_OPEN_TO_ALL && !a.isArchitect) return NextResponse.json({ error: "not found" }, { status: 404 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const db = createServerClient();
  const { data: l } = await db.from("program_lessons").select("id, program_id, file_path, programs!inner(master_plan_id)").eq("id", String(form?.get("lessonId") || "")).maybeSingle();
  const plan = (l as { programs?: { master_plan_id?: string } } | null)?.programs?.master_plan_id;
  if (!l || plan !== a.planId) return NextResponse.json({ error: "That lesson could not be found." }, { status: 404 });
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  if (file.size > MAX_FILE) return NextResponse.json({ error: "Files can be up to 50 MB." }, { status: 400 });
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80) || "file";
  const path = `${a.planId}/programs/${l.program_id}/${Date.now()}-${safe}`;
  const up = await db.storage.from(PORTAL_BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (up.error) return NextResponse.json({ error: "The file didn't upload. Try again." }, { status: 500 });
  if (l.file_path) await db.storage.from(PORTAL_BUCKET).remove([l.file_path as string]).catch(() => null);
  await db.from("program_lessons").update({ file_path: path, file_name: file.name.slice(0, 200), updated_at: new Date().toISOString() }).eq("id", l.id);
  return NextResponse.json({ ok: true });
}
