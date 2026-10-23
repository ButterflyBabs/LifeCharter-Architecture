import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { syncCollectiveReplays } from "@/lib/community/replaySync";
import { syncMasterclassReplayLinks } from "@/lib/masterclass/replayLinks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Hourly (vercel.json): attach each finished session's Zoom cloud recording to its
// Collective event as the replay (lib/community/replaySync.ts), and put each MasterClass recording's
// Vimeo link on MasterClass Results (lib/masterclass/replayLinks.ts).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const r = await syncCollectiveReplays(db);
  // MasterClass and Incubator recordings: fill the replay link on MasterClass Results (never emails anyone).
  const mc = await syncMasterclassReplayLinks(db).catch((e) => ({ ok: false, error: String(e), added: [], waiting: [] }));
  return NextResponse.json({ ...r, masterclass: mc }, { status: r.ok ? 200 : 502 });
}
