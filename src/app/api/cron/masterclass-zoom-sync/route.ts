import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { incubatorMeetingId, isZoomConfigured, listMasterclassRegistrants, masterclassMeetingId } from "@/lib/zoom";
import { upsertContact, logEvent } from "@/lib/crm";
import { ownerMasterPlanId } from "@/lib/sequences/engine";

export const dynamic = "force-dynamic";

/**
 * Replaces the old "register twice" flow (Global Control's own landing-page
 * capture form, separate from Zoom's registration). Zoom registration is now
 * the single front door — this cron polls its registrant list every 15
 * minutes and, for anyone new, fires the same lccs-masterclass tag Global
 * Control's confirmation/reminder workflow already runs on. Dedup ledger in
 * zoom_registrant_syncs keeps a repeat poll from re-tagging (and
 * re-triggering the workflow's emails for) someone already synced.
 *
 * This is step one — sync-in, so nobody falls through the gate. Matching
 * Zoom's post-session attendance report back to these registrants (the
 * actual "who showed up" tracking) is a separate follow-up job.
 */

const GC_FORM_BASE =
  process.env.GC_FORM_BASE || "https://api.globalcontrol.io/api/tag-form-submission";

// The live lccs-masterclass tag, confirmed 2026-09-16 by a real test
// registration (a second, identically-named tag exists in Global Control but
// carries no workflow tied to the actual confirmation/reminder sequence).
const MASTERCLASS_TAG_ID = process.env.GC_MASTERCLASS_TAG_ID || "6a73c0f94c33c83e76795cdc";

// The Incubator's Global Control tag (the one its confirmation/reminder workflow runs on).
// "LC-incubator-registration" (Babs, 2026-09-28).
const INCUBATOR_TAG_ID = process.env.GC_INCUBATOR_TAG_ID || "69fa1666f047865f2e391269";

async function fireMasterclassTag(email: string, firstName: string, lastName: string, tagId: string = MASTERCLASS_TAG_ID): Promise<string> {
  const apiKey = process.env.GLOBAL_CONTROL_API_KEY;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-KEY"] = apiKey;

  try {
    const res = await fetch(`${GC_FORM_BASE}/${encodeURIComponent(tagId)}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, firstName, lastName }),
    });
    const payload = await res.json().catch(() => null);
    // Global Control returns HTTP 200 even on failure — success must be
    // checked explicitly (see /api/sales/onboard-client for the same note).
    const succeeded = res.ok && payload?.data?.success === true;
    return succeeded ? "tagged" : "failed";
  } catch (err) {
    console.error("[masterclass-zoom-sync] tag fire error:", err);
    return "error";
  }
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!isZoomConfigured()) {
    return NextResponse.json({ error: "Zoom not configured (ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET)" }, { status: 500 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Every Zoom meeting whose registrants feed a Global Control tag.
  const events = [
    { key: "masterclass", meetingId: masterclassMeetingId(), tagId: MASTERCLASS_TAG_ID },
    { key: "incubator", meetingId: incubatorMeetingId(), tagId: INCUBATOR_TAG_ID },
  ];
  const results: Record<string, unknown>[] = [];
  // Registrants also land in the Suite CRM (Babs's Contacts), tagged, with no deal value:
  // a deal is only opened when they book an Executive Consultation (cs025).
  const housePlan = await ownerMasterPlanId().catch(() => null);

  for (const ev of events) {
    let registrants;
    try {
      registrants = await listMasterclassRegistrants(ev.meetingId);
    } catch (err) {
      console.error(`[zoom-sync] ${ev.key}: Zoom fetch failed:`, err);
      results.push({ event: ev.key, meetingId: ev.meetingId, error: "Zoom fetch failed", detail: String(err) });
      continue;
    }
    if (!ev.tagId) {
      if (registrants.length) console.error(`[zoom-sync] ${ev.key}: ${registrants.length} registrants waiting — set GC_${ev.key.toUpperCase()}_TAG_ID`);
      results.push({ event: ev.key, meetingId: ev.meetingId, checked: registrants.length, synced: 0, tag: "not_configured" });
      continue;
    }
    if (!registrants.length) {
      results.push({ event: ev.key, meetingId: ev.meetingId, checked: 0, synced: 0 });
      continue;
    }

    const { data: already } = await supabase
      .from("zoom_registrant_syncs")
      .select("zoom_registrant_id")
      .in("zoom_registrant_id", registrants.map((r) => r.id));
    const alreadySynced = new Set((already || []).map((r) => r.zoom_registrant_id as string));

    const toSync = registrants.filter((r) => !alreadySynced.has(r.id));
    let syncedCount = 0;

    for (const r of toSync) {
      const status = await fireMasterclassTag(r.email, r.firstName, r.lastName, ev.tagId);
      if (housePlan) {
        const c = await upsertContact({ masterPlanId: housePlan, email: r.email, firstName: r.firstName || null, lastName: r.lastName || null, source: `zoom:${ev.key}`, tags: [`${ev.key}-registered`] }).catch(() => null);
        if (c) await logEvent(housePlan, c.id, "form", `Registered for the ${ev.key === "incubator" ? "LifeCharter Incubator" : "Command Shift MasterClass"}`, { zoomMeeting: ev.meetingId }).catch(() => {});
      }
      await supabase.from("zoom_registrant_syncs").upsert(
        {
          zoom_registrant_id: r.id,
          zoom_meeting_id: ev.meetingId,
          email: r.email,
          gc_tag_status: status,
        },
        { onConflict: "zoom_registrant_id" }
      );
      if (status === "tagged") syncedCount++;
    }
    results.push({ event: ev.key, meetingId: ev.meetingId, checked: registrants.length, newRegistrants: toSync.length, synced: syncedCount });
  }

  return NextResponse.json({ results });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
