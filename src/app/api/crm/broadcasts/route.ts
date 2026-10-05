import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { BROADCAST_TEMPLATES, OWNER_TZ, templateByKey } from "@/lib/broadcasts/shared";
import { crmAccount } from "../guard";
import { senderProfile, senderVerdict, SENDING_SETUP_PATH } from "@/lib/email/accountSender";
import { accountTimezone } from "@/lib/broadcasts/engine";

export const dynamic = "force-dynamic";

// GET  → the account's broadcasts (newest first), the templates (Babs's account only:
//        they're her MasterClass emails), every tag in use, and who the account sends as
// POST { templateKey? | name } → a new draft (from a template, or blank)
export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const [{ data }, { data: all }, profile, tz] = await Promise.all([
    db
      .from("crm_broadcasts")
      .select("id, template_key, name, subject, status, scheduled_at, timezone, recipient_count, tags, tag_match, created_at, finished_at, offer")
      .eq("master_plan_id", a.planId)
      .order("created_at", { ascending: false })
      .limit(100),
    db.from("seq_contacts").select("tags").eq("master_plan_id", a.planId).limit(5000),
    senderProfile(a.planId, db),
    accountTimezone(db, a.planId, a.house),
  ]);
  const v = senderVerdict(profile, true);
  const tags = Array.from(new Set((all ?? []).flatMap((c) => (c.tags as string[]) ?? []))).sort();
  return NextResponse.json({
    broadcasts: data ?? [],
    tags,
    templates: a.house ? BROADCAST_TEMPLATES.map((t) => ({ key: t.key, name: t.name, description: t.description, schedule: t.schedule, slots: t.slots })) : [],
    timezone: tz,
    sender: profile.house
      ? { house: true, ok: true }
      : { house: false, ok: v.ok, reason: v.ok ? null : v.reason, setupPath: SENDING_SETUP_PATH, fromName: profile.senderName, fromEmail: profile.fromEmail, replyTo: profile.replyTo },
  });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const t = a.house ? templateByKey(typeof b.templateKey === "string" ? b.templateKey : null) : null; // Babs's templates stay hers
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 120) : "";
  if (!t && !name) return NextResponse.json({ error: "Give it a name." }, { status: 400 });
  const row: Record<string, unknown> = t
    ? {
        master_plan_id: a.planId,
        template_key: t.key,
        name: name || t.name,
        subject: t.subject,
        preview: t.preview,
        body: t.body,
        button_label: t.buttonLabel || null,
        button_url: t.buttonUrl || null,
        brand: t.brand,
        tags: t.tags,
        tag_match: t.tagMatch,
        skip_prior_template: t.skipPriorTemplate,
        variables: Object.fromEntries(t.slots.map((s) => [s.key, ""])),
        timezone: OWNER_TZ,
      }
    : a.house
      ? { master_plan_id: a.planId, name, timezone: OWNER_TZ, body: "{{greeting}}\n\n" }
      : await clientDraft(a.planId, name);
  const { data, error } = await createServerClient().from("crm_broadcasts").insert(row).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Couldn't create it." }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

// A client's blank broadcast: their own name, brand and reply-to (never Babs's
// LifeCharter defaults), in their own time zone. The From address is always their
// own verified domain at send time.
async function clientDraft(planId: string, name: string): Promise<Record<string, unknown>> {
  const db = createServerClient();
  const [p, tz] = await Promise.all([senderProfile(planId, db), accountTimezone(db, planId, false)]);
  return { master_plan_id: planId, name, timezone: tz, body: "{{greeting}}\n\n", brand: p.senderName, from_name: p.senderName, from_email: p.fromEmail ?? "", reply_to: p.replyTo };
}
