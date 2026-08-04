import { NextResponse } from "next/server";
import { getClientGcKey, listTagGroups, createTagGroup, GcError } from "@/lib/globalControl";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// List tag groups (a new tag must belong to a group).
export async function GET() {
  const key = await getClientGcKey();
  if (!key) return NextResponse.json({ connected: false, groups: [] });
  try {
    const groups = await listTagGroups(key);
    return NextResponse.json({ connected: true, groups });
  } catch (e) {
    const status = e instanceof GcError ? e.status : 502;
    return NextResponse.json(
      { connected: true, groups: [], error: e instanceof GcError ? e.message : "Couldn't load tag groups." },
      { status }
    );
  }
}

// Create a tag group.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const key = await getClientGcKey();
  if (!key) return NextResponse.json({ error: "Global Control is not connected." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "A group name is required." }, { status: 400 });
  try {
    const group = await createTagGroup(key, name);
    return NextResponse.json({ group });
  } catch (e) {
    const status = e instanceof GcError ? e.status : 502;
    return NextResponse.json(
      { error: e instanceof GcError ? e.message : "Couldn't create the group." },
      { status }
    );
  }
}
