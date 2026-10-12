import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { crossOriginBlocked } from "@/lib/security";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import * as microsoft from "@/lib/microsoft";
import { syncLinkedInRequests } from "@/lib/linkedinRequests";

export const dynamic = "force-dynamic";

// The "add LinkedIn connection requests from my inbox" switch for the signed-in account.
//   GET  -> { on, microsoft: boolean, checkedAt, recent: [{ name, at }] }
//   POST { on: boolean } -> turns it on or off (turning it on checks the inbox straight away)
export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const [{ data: plan }, { data: recent }, connected] = await Promise.all([
    db.from("client_master_plans").select("metadata").eq("id", a.planId).maybeSingle(),
    db.from("dm_inbound_log").select("person_name, created_at").eq("master_plan_id", a.planId).eq("source", "linkedin").not("person_name", "is", null).order("created_at", { ascending: false }).limit(5),
    microsoft.isConnected().catch(() => false),
  ]);
  const meta = (plan?.metadata as Record<string, unknown> | null) ?? {};
  return NextResponse.json({
    on: meta.linkedinRequestsOn === true,
    microsoft: connected,
    checkedAt: (meta.linkedinRequestsCheckedAt as string | undefined) ?? null,
    recent: ((recent ?? []) as { person_name: string; created_at: string }[]).map((r) => ({ name: r.person_name, at: r.created_at })),
  });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as { on?: boolean };
  const on = b.on === true;
  const db = createServerClient();
  const { data: plan } = await db.from("client_master_plans").select("metadata").eq("id", a.planId).maybeSingle();
  const meta = (plan?.metadata as Record<string, unknown> | null) ?? {};
  let added = 0;
  let note = "";
  if (on) {
    const token = await microsoft.getValidAccessToken().catch(() => null);
    if (!token) return NextResponse.json({ error: "Connect your Microsoft 365 email in Settings > Integrations first. Reading LinkedIn requests works with a connected Microsoft 365 inbox." }, { status: 400 });
    try {
      const tz = await resolveUserTimeZone(null);
      const r = await syncLinkedInRequests(db as never, a.planId, token, tz);
      added = r.added;
      note = r.seen ? `Checked your inbox: ${r.seen} LinkedIn email${r.seen === 1 ? "" : "s"}, ${r.added} new request${r.added === 1 ? "" : "s"} added.` : "Checked your inbox: no LinkedIn connection requests in the last 14 days.";
    } catch (e) {
      console.error("linkedin inbox first check:", (e as Error).message);
      note = "Switched on. The first check did not finish; it will run again within 15 minutes.";
    }
  }
  await db.from("client_master_plans").update({ metadata: { ...meta, linkedinRequestsOn: on, ...(on ? { linkedinRequestsCheckedAt: new Date().toISOString() } : {}) } }).eq("id", a.planId);
  return NextResponse.json({ ok: true, on, added, note });
}
