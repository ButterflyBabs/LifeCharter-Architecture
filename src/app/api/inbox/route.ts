import { NextResponse } from "next/server";
import { getValidAccessToken, fetchInbox } from "@/lib/google";

export const dynamic = "force-dynamic";

// Live Gmail inbox for the Executive Home Inbox card.
export async function GET() {
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ connected: false, emails: [] });
  }
  try {
    const emails = await fetchInbox(token);
    return NextResponse.json({ connected: true, emails });
  } catch (e) {
    console.error("GET /api/inbox:", e);
    return NextResponse.json({ connected: true, emails: [], error: String(e) });
  }
}
