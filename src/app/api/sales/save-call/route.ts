import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { sessionUser } from "@/lib/authz";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { logEvent, upsertContact } from "@/lib/crm";
import { SALES_CUSTOM_FIELDS, SALES_NOTE_FIELDS, SALES_OUTCOMES, SALES_TIERS } from "@/lib/salesCall";

export const dynamic = "force-dynamic";

// Saves a sales call from /sales-reference onto the prospect's contact card in Babs's Suite:
// a timeline note with every answer, the Sales fields (outcome, tier, pain, tools, objections,
// next step, follow-up date), tags, and the call logged as attended. Middleware keeps
// /api/sales/* to the owner and her own team, including the sales-only role.
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const db = createServerClient();
  const planId = await ownerMasterPlanId(db);
  if (!planId) return NextResponse.json({ error: "Owner account not found." }, { status: 500 });
  const user = await sessionUser().catch(() => null);

  const outcome = SALES_OUTCOMES.find((o) => o.key === b.outcome);
  if (!outcome) return NextResponse.json({ error: "Choose how the call ended before saving." }, { status: 400 });

  // The contact: one picked from the lookup, or a new one added by name and email.
  let contactId = str(b.contactId, 60);
  if (!contactId) {
    const nc = (b.newContact && typeof b.newContact === "object" ? b.newContact : {}) as Record<string, unknown>;
    const [first, ...rest] = str(nc.name, 120).split(/\s+/);
    const made = await upsertContact({ masterPlanId: planId, email: str(nc.email, 200), firstName: first || null, lastName: rest.join(" ") || null, source: "sales-call" }, db);
    if (!made) return NextResponse.json({ error: "Pick a contact, or enter a name and a valid email to add them." }, { status: 400 });
    contactId = made.id;
  }
  const { data: contact } = await db.from("seq_contacts").select("id, email, tags, custom, first_name, last_name").eq("id", contactId).eq("master_plan_id", planId).maybeSingle();
  if (!contact) return NextResponse.json({ error: "Contact not found." }, { status: 404 });

  const rep = user?.email ? ((await db.from("profiles").select("full_name").ilike("email", user.email).maybeSingle()).data?.full_name as string | undefined)?.split(/\s+/)[0] || user.email : "the team";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date());
  const notes = (b.notes && typeof b.notes === "object" ? b.notes : {}) as Record<string, unknown>;
  const pains = (Array.isArray(b.pains) ? b.pains : []).map((p) => str(p, 120)).filter(Boolean).slice(0, 10);
  const objections = (Array.isArray(b.objections) ? b.objections : []).map((p) => str(p, 120)).filter(Boolean).slice(0, 10);
  const tier = SALES_TIERS.find((t) => t === b.tier) || null;
  const followUpOn = /^\d{4}-\d{2}-\d{2}$/.test(String(b.followUpOn || "")) ? String(b.followUpOn) : "";

  // 1. The timeline note: a headline plus every answer as a labelled line.
  const data: Record<string, string> = { outcome: outcome.label, "call by": rep };
  if (tier) data["tier that fits"] = tier;
  if (pains.length) data["pain points that matched"] = pains.join(" | ");
  if (objections.length) data["objections raised"] = objections.join(" | ");
  for (const f of SALES_NOTE_FIELDS) {
    const v = str(notes[f.key], 2000);
    if (v) data[f.label] = v;
  }
  if (followUpOn) data["follow up on"] = followUpOn;
  await logEvent(planId, contactId, "note", `Sales call (${rep}) · ${outcome.label}${tier ? ` · ${tier} fits` : ""}`, { data, call: "sales" }, db);

  // 2. Custom fields: make sure the account has the Sales ones, then fill this contact's.
  const { data: defs } = await db.from("crm_custom_fields").select("key, position").eq("master_plan_id", planId);
  const have = new Set((defs ?? []).map((d) => d.key as string));
  let pos = Math.max(0, ...((defs ?? []).map((d) => Number(d.position) || 0))) + 1;
  const missing = SALES_CUSTOM_FIELDS.filter((d) => !have.has(d.key)).map((d) => ({ master_plan_id: planId, key: d.key, label: d.label, type: d.type, options: d.options ?? [], position: pos++ }));
  if (missing.length) await db.from("crm_custom_fields").insert(missing);
  const custom: Record<string, string> = { ...((contact.custom as Record<string, string>) ?? {}) };
  custom.sales_call_date = today;
  custom.sales_call_by = rep;
  custom.sales_outcome = outcome.label;
  if (tier) custom.sales_tier_fit = tier;
  if (objections.length) custom.sales_objections = objections.join(", ");
  if (followUpOn) custom.sales_follow_up_on = followUpOn;
  for (const f of SALES_NOTE_FIELDS) {
    if (!f.custom) continue;
    const v = str(notes[f.key], 2000);
    if (v) custom[f.custom] = v;
  }
  if (pains.length && !str(notes.pain, 2000)) custom.sales_pain = pains.join(", ");

  // 3. Tags: the latest outcome and tier replace an earlier one.
  const tags = new Set<string>(((contact.tags as string[]) ?? []).map((t) => t.toLowerCase()));
  for (const o of SALES_OUTCOMES) tags.delete(o.tag);
  for (const t of SALES_TIERS) tags.delete(`sales-tier-${t.toLowerCase()}`);
  tags.add("sales-call-done");
  tags.add(outcome.tag);
  if (tier) tags.add(`sales-tier-${tier.toLowerCase()}`);
  const { error } = await db.from("seq_contacts").update({ custom, tags: Array.from(tags), tag_source: `sales-call:${rep}`, updated_at: new Date().toISOString() }).eq("id", contactId).eq("master_plan_id", planId);
  if (error) return NextResponse.json({ error: "The note saved, but the contact card couldn't be updated. Try Save again." }, { status: 500 });

  // 4. The call counts as attended on their card.
  const { data: dup } = await db.from("contact_records").select("id").eq("contact_id", contactId).eq("kind", "attended").eq("title", "Sales call").eq("occurred_on", today).maybeSingle();
  if (!dup) await db.from("contact_records").insert({ master_plan_id: planId, contact_id: contactId, kind: "attended", title: "Sales call", occurred_on: today, note: `${outcome.label} (${rep})` });

  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || (contact.email as string);
  return NextResponse.json({ ok: true, id: contactId, name, outcome: outcome.label, tags: Array.from(tags).filter((t) => t.startsWith("sales-")) });
}
