import { NextResponse } from "next/server";
import { getValidAccessToken, fetchTodayEvents } from "@/lib/google";

export const dynamic = "force-dynamic";

// Live Google Calendar (today) for the Executive Home Today's Schedule card.
export async function GET() {
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ connected: false, events: [] });
  }
  try {
    const events = await fetchTodayEvents(token);
    return NextResponse.json({ connected: true, events });
  } catch (e) {
    console.error("GET /api/schedule:", e);
    return NextResponse.json({ connected: true, events: [], error: String(e) });
  }
}
