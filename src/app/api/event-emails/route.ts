import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { EMAIL_KINDS, EVENT_KEYS, EVENT_SENDERS, eventSetting, eventTemplates, suiteEmailsLive } from "@/lib/eventEmails";

export const dynamic = "force-dynamic";

// Owner-only (Babs): the Suite's MasterClass / Incubator emails at a glance —
// templates, the Global Control → Suite switch per event, and counts.
export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const db = createServerClient();
  const templates = await eventTemplates(db);
  const events = await Promise.all(
    EVENT_KEYS.map(async (ev) => {
      const setting = await eventSetting(db, ev);
      const mine = templates.filter((t) => t.event_key === ev);
      const [{ count: onSuite }, ...sent] = await Promise.all([
        db.from("zoom_registrant_syncs").select("zoom_registrant_id", { count: "exact", head: true }).eq("event_key", ev).eq("suite_emails", true),
        ...EMAIL_KINDS.map((k) => db.from("event_email_sends").select("id", { count: "exact", head: true }).eq("event_key", ev).eq("kind", k).eq("status", "sent")),
      ]);
      return {
        event_key: ev,
        brand: EVENT_SENDERS[ev].brand,
        from: `${EVENT_SENDERS[ev].from_name} <${EVENT_SENDERS[ev].from_email}>`,
        setting,
        live: suiteEmailsLive(setting, mine),
        templates: mine,
        counts: {
          registrantsOnSuiteEmails: onSuite ?? 0,
          sent: Object.fromEntries(EMAIL_KINDS.map((k, i) => [k, sent[i].count ?? 0])),
        },
      };
    })
  );
  return NextResponse.json({ events });
}
