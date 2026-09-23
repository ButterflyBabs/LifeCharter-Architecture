import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TEXT = 60000;

// Teaches Mariposa a Library item: pulls the text out of an uploaded PDF or
// text file into cm_resources.ai_text (kept alongside any notes the admin
// wrote). Admins, or moderators of the item's channel, only.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { id, notes } = await request.json().catch(() => ({}));
  if (typeof id !== "string") return NextResponse.json({ error: "Missing item." }, { status: 400 });

  const supabase = createServerClient();
  const { data: r } = await supabase.from("cm_resources").select("id, space_id, storage_path, mime_type, file_name").eq("id", id).maybeSingle();
  if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const [{ data: admin }, { data: mod }] = await Promise.all([
    supabase.from("cm_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    r.space_id
      ? supabase.from("cm_space_members").select("role").eq("user_id", user.id).eq("space_id", r.space_id).in("role", ["moderator", "admin"]).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!admin && !mod) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  let extracted = "";
  if (r.storage_path) {
    const name = String(r.file_name ?? r.storage_path).toLowerCase();
    const mime = String(r.mime_type ?? "");
    const { data: blob } = await supabase.storage.from("community").download(r.storage_path as string);
    if (blob) {
      try {
        if (mime === "application/pdf" || name.endsWith(".pdf")) {
          const { extractText, getDocumentProxy } = await import("unpdf");
          const pdf = await getDocumentProxy(new Uint8Array(await blob.arrayBuffer()));
          extracted = (await extractText(pdf, { mergePages: true })).text;
        } else if (mime.startsWith("text/") || /\.(txt|md|markdown|csv)$/.test(name)) {
          extracted = await blob.text();
        }
      } catch (e) {
        console.error("library learn extract:", e);
      }
    }
  }
  const manual = typeof notes === "string" ? notes.trim() : "";
  const ai_text = [manual, extracted.replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim()].filter(Boolean).join("\n\n").slice(0, MAX_TEXT) || null;
  const { error } = await supabase.from("cm_resources").update({ ai_text }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, chars: ai_text?.length ?? 0, fromFile: extracted.length > 0 });
}
