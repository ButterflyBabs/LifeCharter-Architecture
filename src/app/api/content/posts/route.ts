import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import {
  getClientKey,
  listPosts,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  PLATFORMS,
  PostStreamError,
  type CreatePostInput,
} from "@/lib/postStream";

export const dynamic = "force-dynamic";

function fail(e: unknown) {
  const status = e instanceof PostStreamError ? e.status : 502;
  const message = e instanceof PostStreamError ? e.message : "Couldn't reach PostStream.";
  return NextResponse.json({ error: message }, { status: status >= 400 && status < 600 ? status : 502 });
}

const validPlatforms = (arr: unknown): string[] =>
  Array.isArray(arr) ? arr.map(String).filter((p) => (PLATFORMS as readonly string[]).includes(p)) : [];

// GET — list posts (optionally ?status=&platform=&search=).
export async function GET(request: Request) {
  const key = await getClientKey();
  if (!key) return NextResponse.json({ connected: false, posts: [] });
  const url = new URL(request.url);
  try {
    const posts = await listPosts(key, {
      status: url.searchParams.get("status") || undefined,
      platform: url.searchParams.get("platform") || undefined,
      search: url.searchParams.get("search") || undefined,
    });
    return NextResponse.json({ connected: true, posts });
  } catch (e) {
    return fail(e);
  }
}

// POST — create a post (draft, scheduled, or publish-now via status=published).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const key = await getClientKey();
  if (!key) return NextResponse.json({ error: "PostStream isn't connected. Add your key in Settings." }, { status: 400 });
  const body = await request.json().catch(() => ({}));

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const platforms = validPlatforms(body.platforms);
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
  if (platforms.length === 0) return NextResponse.json({ error: "Pick at least one platform." }, { status: 400 });

  const status: "draft" | "scheduled" | "published" =
    body.status === "scheduled" || body.status === "published" ? body.status : "draft";

  const input: CreatePostInput = {
    title,
    caption: typeof body.caption === "string" ? body.caption : "",
    platforms,
    status,
    scheduledAt: status === "scheduled" && typeof body.scheduledAt === "string" ? body.scheduledAt : null,
    mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls.map(String).filter(Boolean) : [],
    mediaType: ["image", "video", "carousel"].includes(body.mediaType) ? body.mediaType : undefined,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
  };

  try {
    const post = await createPost(key, input);
    return NextResponse.json({ post });
  } catch (e) {
    return fail(e);
  }
}

// PATCH — update a post, or publish it now (action: "publish").
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const key = await getClientKey();
  if (!key) return NextResponse.json({ error: "PostStream isn't connected." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  try {
    if (body.action === "publish") {
      const post = await publishPost(key, id);
      return NextResponse.json({ post });
    }
    const patch: Partial<CreatePostInput> = {};
    if (typeof body.title === "string") patch.title = body.title.trim();
    if (typeof body.caption === "string") patch.caption = body.caption;
    if (body.platforms !== undefined) patch.platforms = validPlatforms(body.platforms);
    if (body.status === "draft" || body.status === "scheduled" || body.status === "published") patch.status = body.status;
    if (typeof body.scheduledAt === "string") patch.scheduledAt = body.scheduledAt;
    if (Array.isArray(body.mediaUrls)) patch.mediaUrls = body.mediaUrls.map(String).filter(Boolean);
    const post = await updatePost(key, id, patch);
    return NextResponse.json({ post });
  } catch (e) {
    return fail(e);
  }
}

// DELETE — remove a post (?id=...).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const key = await getClientKey();
  if (!key) return NextResponse.json({ error: "PostStream isn't connected." }, { status: 400 });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  try {
    await deletePost(key, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
