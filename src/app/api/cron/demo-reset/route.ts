import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Hourly (vercel.json): restores the shared public demo ("Demo — Brand Alchemy Studio") to its saved
 * snapshot, so anything /demo visitors tried disappears (Babs chose this, 2026-09-27). The reset
 * itself is the demo_reset() database function; to change what the demo looks like, edit the demo
 * and then run demo_snapshot_take() to save it as the new baseline.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("demo_reset");
  if (error) {
    console.error("[demo-reset]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, restored: data });
}
