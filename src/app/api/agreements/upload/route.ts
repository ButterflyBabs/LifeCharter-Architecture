import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { PORTAL_BUCKET } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Upload a document to sign (task 1072): a PDF is kept as it is (signatures go on a page added at the end); a Word
// file (.docx) becomes editable text in the Suite. Drafts only.
export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const form = await request.formData().catch(() => null);
  const id = String(form?.get("id") || "");
  const file = form?.get("file");
  const db = createServerClient();
  const { data: doc } = /^[0-9a-f-]{36}$/i.test(id) ? await db.from("sign_documents").select("id, status, file_path").eq("id", id).eq("master_plan_id", a.planId).maybeSingle() : { data: null };
  if (!doc) return NextResponse.json({ error: "That document could not be found." }, { status: 404 });
  if (doc.status !== "draft") return NextResponse.json({ error: "Only a draft can be changed." }, { status: 409 });
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a PDF or Word file." }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Files can be up to 15 MB." }, { status: 400 });
  const name = file.name.slice(-120);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (/\.pdf$/i.test(name) || file.type === "application/pdf") {
    if (bytes.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({ error: "That file doesn't look like a PDF." }, { status: 400 });
    const path = `${a.planId}/agreements/${id}-${Date.now()}.pdf`;
    const up = await db.storage.from(PORTAL_BUCKET).upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (up.error) return NextResponse.json({ error: "The file didn't upload. Please try again." }, { status: 500 });
    await db.from("sign_documents").update({ source: "upload", file_path: path, file_name: name, body: null, updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true, kind: "pdf" });
  }
  if (/\.docx$/i.test(name)) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: bytes }).catch(() => ({ value: "" }));
    const text = value.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
    if (!text) return NextResponse.json({ error: "We couldn't read any text in that Word file." }, { status: 400 });
    await db.from("sign_documents").update({ source: "written", file_path: null, file_name: name, body: text.slice(0, 60000), updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true, kind: "word" });
  }
  return NextResponse.json({ error: "Use a PDF or a Word (.docx) file. For an older .doc, save it as .docx or PDF first." }, { status: 400 });
}
