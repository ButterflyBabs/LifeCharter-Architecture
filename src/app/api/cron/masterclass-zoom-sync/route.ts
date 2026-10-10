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
 * Zoom registration is the single front door for the MasterClass and the Incubator. Every 15 minutes this
 * polls Zoom's registrant list and, for anyone new, adds them to Contacts (tagged), moves their pipeline
 * card to Registered and sends the Suite's own confirmation, day-before and hour-before emails
 * (src/lib/eventEmails.ts). A ledger in zoom_registrant_syncs keeps a repeat poll from doing it twice.
 *
 * Global Control is no longer involved (Babs, 2026-09-28): nothing is tagged or pushed there. If an
 * event's `event_emails:<event>` switch is off or its confirmation template is not live, new registrants
 * simply wait and are picked up as soon as it is.
 */

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

  // Every Zoom meeting whose registrants are synced.
  const events: { key: EventKey; meetingId: string }[] = [
    { key: "masterclass", meetingId: masterclassMeetingId() },
    { key: "incubator", meetingId: incubatorMeetingId() },
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
    if (!suiteOn) {
      if (registrants.length) console.error(`[zoom-sync] ${ev.key}: ${registrants.length} registrants waiting; Suite emails are not live for this event`);
      results.push({ event: ev.key, meetingId: ev.meetingId, checked: registrants.length, synced: 0, suiteEmails: false });
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
      // First seen now: they go into Contacts and the Suite emails them.
      const status = "suite";
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
      syncedCount++;
    }
    let emails: unknown;
    try {
      emails = await sendDueEventEmails({ db: supabase, event: ev.key, meetingId: ev.meetingId, registrants, housePlan, templates, schedule: () => cachedSchedule(ev.meetingId, scheduleCache) });
    } catch (err) {
      console.error(`[zoom-sync] ${ev.key}: Suite emails failed:`, err);
      emails = { error: String(err) };
    }
    results.push({ event: ev.key, meetingId: ev.meetingId, checked: registrants.length, newRegistrants: toSync.length, synced: syncedCount, suiteEmails: true, emails });
  }

  return NextResponse.json({ results });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
