import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cachedSchedule, incubatorMeetingId, isZoomConfigured, listMasterclassRegistrants, masterclassMeetingId, type ZoomSchedule } from "@/lib/zoom";
import { eventSetting, eventTemplates, sendDueEventEmails, suiteEmailsLive, type EventKey } from "@/lib/eventEmails";
import { upsertContact, logEvent } from "@/lib/crm";
import { ownerMasterPlanId } from "@/lib/sequences/engine";
import { advanceCards } from "@/lib/dmPipeline";
import { eventStage, sessionTag } from "@/lib/masterclass/followUp";
import { registrantOccurrence } from "@/lib/eventEmails";

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
 *
 * Suite emails (src/lib/eventEmails.ts): once an event's app_settings switch
 * `event_emails:<event>` is on (and its confirmation template is live), new
 * registrants skip the Global Control tag and get the Suite's own
 * confirmation + reminders instead. Registrants synced before the switch stay
 * with Global Control. With the switch off, everything below runs as before.
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
  const events: { key: EventKey; meetingId: string; tagId: string }[] = [
    { key: "masterclass", meetingId: masterclassMeetingId(), tagId: MASTERCLASS_TAG_ID },
    { key: "incubator", meetingId: incubatorMeetingId(), tagId: INCUBATOR_TAG_ID },
  ];
  const scheduleCache = new Map<string, Promise<ZoomSchedule>>(); // one Zoom meeting lookup per event per run
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
    const [setting, templates] = await Promise.all([eventSetting(supabase, ev.key), eventTemplates(supabase, ev.key)]);
    const suiteOn = suiteEmailsLive(setting, templates);
    if (!ev.tagId && !suiteOn) {
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
      // Switch on: first seen now → the Suite emails them, Global Control is never tagged.
      const status = suiteOn ? "suite" : await fireMasterclassTag(r.email, r.firstName, r.lastName, ev.tagId);
      if (housePlan) {
        // Registrants also get their session's own tag, e.g. lcmc-oct-8-registered or lci-nov-12-registered.
        const tags = [`${ev.key}-registered`];
        const occ = await cachedSchedule(ev.meetingId, scheduleCache).then((s) => registrantOccurrence(s, r.createTime || null)).catch(() => null);
        if (occ) tags.push(sessionTag(occ.start, "registered", ev.key));
        const c = await upsertContact({ masterPlanId: housePlan, email: r.email, firstName: r.firstName || null, lastName: r.lastName || null, source: `zoom:${ev.key}`, tags }).catch(() => null);
        if (c) await logEvent(housePlan, c.id, "form", `Registered for the ${ev.key === "incubator" ? "LifeCharter Incubator" : "Command Shift MasterClass"}`, { zoomMeeting: ev.meetingId }).catch(() => {});
        // Their card on that event's pipeline moves to Registered by itself.
        if (c) await advanceCards(supabase, housePlan, { contactId: c.id, email: r.email }, eventStage(ev.key, "registered")).catch((e) => console.error("[zoom-sync] card move:", e));
      }
      await supabase.from("zoom_registrant_syncs").upsert(
        {
          zoom_registrant_id: r.id,
          zoom_meeting_id: ev.meetingId,
          email: r.email,
          gc_tag_status: status,
          event_key: ev.key,
          join_url: r.joinUrl || null,
          registered_at: r.createTime || new Date().toISOString(),
          suite_emails: suiteOn,
        },
        { onConflict: "zoom_registrant_id" }
      );
      if (status === "tagged") syncedCount++;
    }
    let emails: unknown;
    try {
      emails = await sendDueEventEmails({ db: supabase, event: ev.key, meetingId: ev.meetingId, registrants, housePlan, templates, schedule: () => cachedSchedule(ev.meetingId, scheduleCache) });
    } catch (err) {
      console.error(`[zoom-sync] ${ev.key}: Suite emails failed:`, err);
      emails = { error: String(err) };
    }
    results.push({ event: ev.key, meetingId: ev.meetingId, checked: registrants.length, newRegistrants: toSync.length, synced: syncedCount, suiteEmails: suiteOn, emails });
  }

  return NextResponse.json({ results });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
