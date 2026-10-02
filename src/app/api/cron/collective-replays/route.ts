import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { syncCollectiveReplays } from "@/lib/community/replaySync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Hourly (vercel.json): attach each finished session's Zoom cloud recording to its
// Collective event as the replay. See lib/community/replaySync.ts.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const r = await syncCollectiveReplays(db);
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
