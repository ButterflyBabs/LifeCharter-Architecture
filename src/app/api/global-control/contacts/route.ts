import { NextResponse } from "next/server";
import { getClientGcKey, listContacts, GcError } from "@/lib/globalControl";

export const dynamic = "force-dynamic";

// List the client's Global Control contacts (server-side, using their stored
// key). Returns { connected:false } when no key is set so the UI can prompt to
// connect rather than error.
export async function GET(request: Request) {
  const key = await getClientGcKey();
  if (!key) return NextResponse.json({ connected: false, contacts: [] });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const page = Number(searchParams.get("page") || "1") || 1;
  const limit = Math.min(Number(searchParams.get("limit") || "25") || 25, 100);

  try {
    const { contacts } = await listContacts(key, { search, page, limit });
    return NextResponse.json({ connected: true, contacts });
  } catch (e) {
    const status = e instanceof GcError ? e.status : 502;
    const message = e instanceof GcError ? e.message : "Couldn't load contacts.";
    return NextResponse.json({ connected: true, contacts: [], error: message }, { status });
  }
}
