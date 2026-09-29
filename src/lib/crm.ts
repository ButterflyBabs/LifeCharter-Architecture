import { createServerClient } from "@/lib/supabase/server";
import { isValidTz, enrolContact } from "@/lib/sequences/engine";

// The Suite's own CRM. Contacts (seq_contacts) belong to one account
// (master_plan_id); every touch — a form, a purchase, a note, an email series —
// is logged on the contact's timeline (crm_events). Forms on any of the
// account's sites post here and land as contacts.

type Db = ReturnType<typeof createServerClient>;

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface ContactInput {
  masterPlanId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  timezone?: string | null;
  source?: string | null;
  tags?: string[];
  company?: string | null;
}

// Adds the contact, or merges into the existing one (tags add up; a known first
// name is never overwritten; unsubscribes are kept). Returns its id.
export async function upsertContact(i: ContactInput, db: Db = createServerClient()): Promise<{ id: string; unsubscribed: boolean; created: boolean } | null> {
  const email = i.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return null;
  const tz = i.timezone && isValidTz(i.timezone) ? i.timezone : null;
  const now = new Date().toISOString();
  const { data: existing } = await db
    .from("seq_contacts")
    .select("id, tags, unsubscribed_at, first_name, last_name, phone, company")
    .eq("master_plan_id", i.masterPlanId)
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    const tags = Array.from(new Set([...((existing.tags as string[]) ?? []), ...(i.tags ?? [])]));
    await db
      .from("seq_contacts")
      .update({
        tags,
        ...(i.firstName && !existing.first_name ? { first_name: i.firstName } : {}),
        ...(i.lastName && !existing.last_name ? { last_name: i.lastName } : {}),
        ...(i.phone && !existing.phone ? { phone: i.phone } : {}),
        ...(i.company && !existing.company ? { company: i.company } : {}),
        tag_source: i.source || null,
        ...(tz ? { timezone: tz } : {}),
        updated_at: now,
        last_activity_at: now,
      })
      .eq("id", existing.id);
    return { id: existing.id as string, unsubscribed: Boolean(existing.unsubscribed_at), created: false };
  }
  const { data: created } = await db
    .from("seq_contacts")
    .insert({
      master_plan_id: i.masterPlanId,
      email,
      first_name: i.firstName || null,
      last_name: i.lastName || null,
      phone: i.phone || null,
      company: i.company || null,
      timezone: tz || "America/Denver",
      source: i.source || null,
      tags: i.tags ?? [],
      last_activity_at: now,
    })
    .select("id")
    .single();
  return created ? { id: created.id as string, unsubscribed: false, created: true } : null;
}

export async function logEvent(
  masterPlanId: string,
  contactId: string,
  kind: "form" | "note" | "purchase" | "sequence" | "tag" | "email" | "manual" | "booking",
  title: string,
  detail: Record<string, unknown> = {},
  db: Db = createServerClient()
) {
  await db.from("crm_events").insert({ master_plan_id: masterPlanId, contact_id: contactId, kind, title: title.slice(0, 300), detail });
  await db.from("seq_contacts").update({ last_activity_at: new Date().toISOString() }).eq("id", contactId).eq("master_plan_id", masterPlanId);
}

// ── Forms ────────────────────────────────────────────────────────────────────

export interface FormField {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "date" | "textarea" | "select";
  required?: boolean;
  options?: string[];
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function splitName(full: string) {
  const [first, ...rest] = full.trim().split(/\s+/);
  return { first: first || "", last: rest.join(" ") };
}

// Handles one public form submission: validate against the form's own fields,
// save the contact + submission, tag, log, enrol in the form's sequence, and
// email the account owner. Returns the message to show the visitor.
// `lead` is set only for a new submission (not a quick repeat), for the Meta Lead event.
export interface FormLead { email: string; firstName: string; lastName: string; phone: string | null; formKey: string; contactId: string; masterPlanId: string }
export async function submitForm(formId: string, raw: Record<string, unknown>, pageUrl: string | null): Promise<{ ok: true; message: string; lead?: FormLead } | { ok: false; error: string; status: number }> {
  const db = createServerClient();
  const { data: form } = await db.from("crm_forms").select("*").eq("id", formId).eq("active", true).maybeSingle();
  if (!form) return { ok: false, error: "This form isn't available.", status: 404 };

  const fields = (form.fields as FormField[]) ?? [];
  const data: Record<string, string> = {};
  for (const f of fields) {
    const v = raw[f.name];
    const s = typeof v === "string" ? v.trim().slice(0, f.type === "textarea" ? 5000 : 300) : "";
    if (f.options?.length && s && !f.options.includes(s)) continue;
    if (s) data[f.name] = s;
    else if (f.required) return { ok: false, error: `Please fill in ${f.label.toLowerCase()}.`, status: 400 };
  }
  const email = (data.email || "").toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address.", status: 400 };

  // A quick double-click or refresh doesn't make a second submission.
  const since = new Date(Date.now() - 60_000).toISOString();
  const { data: recent } = await db.from("crm_submissions").select("id, contact_id").eq("form_id", form.id).gte("created_at", since).limit(20);
  const name = data.name ? splitName(data.name) : { first: data.first_name || "", last: data.last_name || "" };
  const contact = await upsertContact(
    {
      masterPlanId: form.master_plan_id,
      email,
      firstName: name.first || null,
      lastName: name.last || null,
      phone: data.phone || null,
      timezone: typeof raw._tz === "string" ? raw._tz : null,
      source: `form:${form.key}`,
      tags: form.tags as string[],
    },
    db
  );
  if (!contact) return { ok: false, error: "Please enter a valid email address.", status: 400 };
  if ((recent ?? []).some((r) => r.contact_id === contact.id)) return { ok: true, message: form.success_message };

  await db.from("crm_submissions").insert({ form_id: form.id, contact_id: contact.id, data, page_url: pageUrl?.slice(0, 500) || null });
  await logEvent(form.master_plan_id, contact.id, "form", `Submitted “${form.name}”`, { form: form.key, data, page: pageUrl }, db);

  if (form.sequence_key && !contact.unsubscribed) {
    await enrolContact({ masterPlanId: form.master_plan_id, sequenceKey: form.sequence_key, email, source: `form:${form.key}` }).catch((e) => console.error("form enrol:", e));
  }

  if (form.notify) await notifyOwner(db, form, data, email, pageUrl).catch((e) => console.error("form notify:", e));
  return { ok: true, message: form.success_message, lead: { email, firstName: name.first, lastName: name.last, phone: data.phone || null, formKey: form.key, contactId: contact.id, masterPlanId: form.master_plan_id as string } };
}

async function notifyOwner(db: Db, form: { master_plan_id: string; name: string }, data: Record<string, string>, email: string, pageUrl: string | null) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", form.master_plan_id).maybeSingle();
  if (!plan?.user_id) return;
  const { data: prof } = await db.from("profiles").select("email").eq("id", plan.user_id).maybeSingle();
  if (!prof?.email) return;
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
  const rows = Object.entries(data)
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#7a8a99;vertical-align:top;white-space:nowrap">${esc(k.replace(/_/g, " "))}</td><td style="padding:6px 0;color:#1a2b4a">${esc(v).replace(/\n/g, "<br>")}</td></tr>`)
    .join("");
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "LifeCharter Command Suite <reminders@lccommandsuite.com>",
      to: prof.email,
      reply_to: email,
      subject: `New ${form.name}: ${data.name || [data.first_name, data.last_name].filter(Boolean).join(" ") || email}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;max-width:560px">
<p style="font-size:16px;color:#1a2b4a"><strong>${esc(form.name)}</strong></p>
<table cellpadding="0" cellspacing="0">${rows}</table>
${pageUrl ? `<p style="color:#7a8a99;font-size:12px">From ${esc(pageUrl)}</p>` : ""}
<p><a href="${app}/contacts" style="color:#2E7C83">Open Contacts in the Suite</a> · Reply to this email to answer them directly.</p></div>`,
    }),
  });
}
