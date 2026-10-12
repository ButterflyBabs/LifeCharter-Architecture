import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import * as microsoft from "@/lib/microsoft";
import { syncLinkedInRequests } from "@/lib/linkedinRequests";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Every 15 minutes: for each account that switched on "add LinkedIn connection requests from my inbox", read the
// connected Microsoft 365 inbox for LinkedIn invitation emails and add each new person to the outreach pipeline.
// Same CRON_SECRET convention as the other crons.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const { data: plans } = await db.from("client_master_plans").select("id, user_id, metadata").eq("metadata->>linkedinRequestsOn", "true").not("user_id", "is", null).limit(300);
  let accounts = 0;
  let added = 0;
  let failed = 0;
  for (const p of (plans ?? []) as { id: string; user_id: string; metadata: Record<string, unknown> | null }[]) {
    try {
      const { data: prof } = await db.from("profiles").select("timezone").eq("id", p.user_id).maybeSingle();
      const conns = await microsoft.listConnections({ ownerId: p.user_id });
      for (const c of conns) {
        const token = await microsoft.getValidAccessToken({ ownerId: p.user_id, accountKey: c.accountKey });
        if (!token) continue;
        const r = await syncLinkedInRequests(db as never, p.id, token, (prof?.timezone as string | null) || "America/Denver");
        added += r.added;
      }
      accounts++;
      await db.from("client_master_plans").update({ metadata: { ...(p.metadata ?? {}), linkedinRequestsCheckedAt: new Date().toISOString() } }).eq("id", p.id);
    } catch (e) {
      failed++;
      console.error("linkedin-requests:", p.id, (e as Error).message);
    }
  }
  return NextResponse.json({ accounts, added, failed });
}
export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
