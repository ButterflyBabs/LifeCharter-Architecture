import { NextResponse } from "next/server";
import { getClientGcKey, listTags, GcError } from "@/lib/globalControl";

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
