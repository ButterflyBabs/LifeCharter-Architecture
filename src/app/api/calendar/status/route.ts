import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";

export const dynamic = "force-dynamic";

// Connection status for the calendar/email providers, for the Settings card.
export async function GET() {
  const [gConnected, mConnected] = await Promise.all([
    google.isConnected().catch(() => false),
    microsoft.isConnected().catch(() => false),
  ]);
  const [gEmail, mEmail, gCanWrite] = await Promise.all([
    gConnected ? google.connectedEmail().catch(() => null) : Promise.resolve(null),
    mConnected ? microsoft.connectedEmail().catch(() => null) : Promise.resolve(null),
    gConnected ? google.hasCalendarWriteScope().catch(() => false) : Promise.resolve(false),
  ]);

  return NextResponse.json({
    google: { connected: gConnected, email: gEmail, canWriteCalendar: gCanWrite },
    microsoft: { connected: mConnected, email: mEmail, canWriteCalendar: mConnected },
  });
}
