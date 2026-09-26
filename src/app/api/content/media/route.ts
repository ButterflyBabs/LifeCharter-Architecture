import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// Media for social posts. Files are too big to pass through a serverless
// function (Vercel caps request bodies at ~4.5 MB), so this route only issues
// a one-time signed upload URL into the account's own folder of the public
// "social-media" bucket; the browser uploads the file straight to Supabase.
// The public URL is what PostStream fetches when it publishes.
const BUCKET = "social-media";
const MAX_BYTES = 50 * 1024 * 1024; // matches the bucket's file_size_limit
const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

// POST { name, type, size } → { uploadUrl, publicUrl, kind }
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type : "";
  const size = Number(body.size);
  const ext = TYPES[type];
  if (!ext) return NextResponse.json({ error: "Use a PNG, JPEG, WebP or GIF image, or an MP4 or MOV video." }, { status: 400 });
  if (!Number.isFinite(size) || size <= 0) return NextResponse.json({ error: "That file looks empty." }, { status: 400 });
  if (size > MAX_BYTES) return NextResponse.json({ error: "That file is over 50 MB. Try a shorter or compressed version." }, { status: 400 });

  const base =
    (typeof body.name === "string" ? body.name : "")
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "media";
  const path = `${masterPlanId}/${randomUUID()}-${base}.${ext}`;

  const storage = createServerClient().storage.from(BUCKET);
  const { data, error } = await storage.createSignedUploadUrl(path);
  if (error || !data?.signedUrl) {
    console.error("POST /api/content/media:", error?.message);
    return NextResponse.json({ error: "Couldn't start the upload. Try again." }, { status: 500 });
  }
  const { data: pub } = storage.getPublicUrl(path);
  return NextResponse.json({
    uploadUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
    kind: type.startsWith("video/") ? "video" : "image",
  });
}
