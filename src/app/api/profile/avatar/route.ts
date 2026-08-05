import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Uploads a profile headshot to the public "avatars" bucket via the service
// role (so it isn't blocked by storage RLS) and records it on the profile.
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

  const supabase = createServerClient();
  const { data: prof } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
  if (!prof?.id) return NextResponse.json({ error: "no profile" }, { status: 400 });

  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${prof.id}-${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, {
    contentType: file.type || "image/png",
    cacheControl: "3600",
    upsert: true,
  });
  if (upErr) {
    console.error("avatar upload:", upErr);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = pub.publicUrl;
  await supabase.from("profiles").update({ avatar_url: url }).eq("id", prof.id);
  return NextResponse.json({ url });
}

// Removes the profile headshot (best-effort delete of the stored object).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const { data: prof } = await supabase
    .from("profiles")
    .select("id, avatar_url")
    .limit(1)
    .maybeSingle();
  if (prof?.id) {
    const url = (prof.avatar_url as string) || "";
    const marker = "/avatars/";
    const idx = url.lastIndexOf(marker);
    if (idx >= 0) {
      try {
        await supabase.storage.from("avatars").remove([url.slice(idx + marker.length)]);
      } catch {
        /* best-effort */
      }
    }
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", prof.id);
  }
  return NextResponse.json({ ok: true });
}
