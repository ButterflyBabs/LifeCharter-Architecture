import { NextResponse } from "next/server";
import { getClientKey, listAccounts, PostStreamError } from "@/lib/postStream";

export const dynamic = "force-dynamic";

// GET — the client's connected social accounts (channels) from PostStream.
export async function GET() {
  const key = await getClientKey();
  if (!key) return NextResponse.json({ connected: false, accounts: [] });
  try {
    const accounts = await listAccounts(key);
    return NextResponse.json({ connected: true, accounts });
  } catch (e) {
    const status = e instanceof PostStreamError ? e.status : 502;
    const message = e instanceof PostStreamError ? e.message : "Couldn't reach PostStream.";
    return NextResponse.json({ connected: true, accounts: [], error: message }, { status: status >= 500 ? 200 : 200 });
  }
}
