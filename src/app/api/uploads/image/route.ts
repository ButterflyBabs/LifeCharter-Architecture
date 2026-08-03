import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Generic image upload to the public "assets" bucket via the service role (so
// it isn't blocked by storage RLS). Reused for workspace logos and team-member
// avatars. Returns { url } — the caller records it wherever it belongs.
//
// Optional form field "folder" namespaces the object (e.g. "logos",
// "members"); defaults to "misc".
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "please choose an image" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "image must be under 5MB" }, { status: 400 });
  }

  const rawFolder = (form.get("folder") as string) || "misc";
  const folder = rawFolder.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "misc";

  const supabase = createServerClient();
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from("assets").upload(path, bytes, {
    contentType: file.type || "image/png",
    cacheControl: "3600",
    upsert: true,
  });
  if (upErr) {
    console.error("asset upload:", upErr);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("assets").getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl });
}
