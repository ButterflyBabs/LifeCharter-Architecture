import { NextResponse } from "next/server";
import { getClientGcKey, listTags, createTag, GcError } from "@/lib/globalControl";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// List the client's Global Control tags (for the workflow picker).
export async function GET() {
  const key = await getClientGcKey();
  if (!key) return NextResponse.json({ connected: false, tags: [] });
  try {
    const tags = await listTags(key);
    return NextResponse.json({ connected: true, tags });
  } catch (e) {
    const status = e instanceof GcError ? e.status : 502;
    return NextResponse.json(
      { connected: true, tags: [], error: e instanceof GcError ? e.message : "Couldn't load tags." },
      { status }
    );
  }
}

// Create a new tag (optionally attached to existing workflows by id).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const key = await getClientGcKey();
  if (!key) return NextResponse.json({ error: "Global Control is not connected." }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const groupId = typeof body.groupId === "string" ? body.groupId.trim() : "";
  if (!name) return NextResponse.json({ error: "A tag name is required." }, { status: 400 });
  if (!groupId) return NextResponse.json({ error: "Choose a group for the tag." }, { status: 400 });

  const workflows = Array.isArray(body.workflows)
    ? (body.workflows as unknown[]).map((w) => String(w).trim()).filter(Boolean)
    : [];

  try {
    const tag = await createTag(key, {
      name,
      groupId,
      description: typeof body.description === "string" ? body.description : "",
      workflows,
    });
    return NextResponse.json({ tag });
  } catch (e) {
    const status = e instanceof GcError ? e.status : 502;
    return NextResponse.json(
      { error: e instanceof GcError ? e.message : "Couldn't create the tag." },
      { status }
    );
  }
}
