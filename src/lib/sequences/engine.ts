import { createServerClient } from "@/lib/supabase/server";
import { renderStep, unsubscribeApiUrl } from "@/lib/sequences/render";
import { EMAIL_RE, logEvent, upsertContact } from "@/lib/crm";
import { senderCache, type AccountSender } from "@/lib/email/accountSender";

// The Sequences engine: enrol a contact, then send each step on its day at the
// sequence's hour in the contact's own time zone (day 0 goes right away). Every
// send is claimed first, so nobody ever gets the same email twice.

type Db = ReturnType<typeof createServerClient>;

// Babs's own account now lives in @/lib/housePlan (re-exported for existing imports).
export { ownerMasterPlanId } from "@/lib/housePlan";

// US state → time zone (the zone most of the state uses), for buyers whose
// checkout gives a billing address. Everyone else defaults to Mountain.
const STATE_TZ: Record<string, string> = {
  AL: "America/Chicago", AK: "America/Anchorage", AZ: "America/Phoenix", AR: "America/Chicago", CA: "America/Los_Angeles", CO: "America/Denver",
  CT: "America/New_York", DE: "America/New_York", DC: "America/New_York", FL: "America/New_York", GA: "America/New_York", HI: "Pacific/Honolulu",
  ID: "America/Boise", IL: "America/Chicago", IN: "America/Indiana/Indianapolis", IA: "America/Chicago", KS: "America/Chicago", KY: "America/New_York",
  LA: "America/Chicago", ME: "America/New_York", MD: "America/New_York", MA: "America/New_York", MI: "America/Detroit", MN: "America/Chicago",
  MS: "America/Chicago", MO: "America/Chicago", MT: "America/Denver", NE: "America/Chicago", NV: "America/Los_Angeles", NH: "America/New_York",
  NJ: "America/New_York", NM: "America/Denver", NY: "America/New_York", NC: "America/New_York", ND: "America/Chicago", OH: "America/New_York",
  OK: "America/Chicago", OR: "America/Los_Angeles", PA: "America/New_York", RI: "America/New_York", SC: "America/New_York", SD: "America/Chicago",
  TN: "America/Chicago", TX: "America/Chicago", UT: "America/Denver", VT: "America/New_York", VA: "America/New_York", WA: "America/Los_Angeles",
  WV: "America/New_York", WI: "America/Chicago", WY: "America/Denver",
};
export function timezoneFor(address?: { country?: string | null; state?: string | null } | null): string {
  if (address?.country === "US" && address.state && STATE_TZ[address.state.toUpperCase()]) return STATE_TZ[address.state.toUpperCase()];
  if (address?.country === "CA") return "America/Toronto";
  if (address?.country === "GB") return "Europe/London";
  if (address?.country === "AU") return "Australia/Sydney";
  return "America/Denver";
}

export const isValidTz = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

// Today's date (YYYY-MM-DD) and hour in a zone.
function localNow(tz: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}
const addDays = (date: string, n: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export interface EnrolInput {
  masterPlanId: string;
  sequenceKey: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  timezone?: string | null;
  source?: string;
  sourceRef?: string | null;
  tags?: string[];
}

// Adds (or updates) the contact and enrols them. Unsubscribed contacts are never
// enrolled again. Returns the enrollment id, or null with a reason.
export async function enrolContact(i: EnrolInput): Promise<{ enrollmentId: string | null; contactId?: string; reason?: string }> {
  const db = createServerClient();
  const email = i.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { enrollmentId: null, reason: "invalid email" };
  const { data: seq } = await db.from("sequences").select("id, name, active").eq("master_plan_id", i.masterPlanId).eq("key", i.sequenceKey).maybeSingle();
  if (!seq) return { enrollmentId: null, reason: `no sequence "${i.sequenceKey}"` };

  const contact = await upsertContact({ masterPlanId: i.masterPlanId, email, firstName: i.firstName, lastName: i.lastName, phone: i.phone, timezone: i.timezone, source: i.source, tags: i.tags }, db);
  if (!contact) return { enrollmentId: null, reason: "couldn't save contact" };
  const contactId = contact.id;
  if (contact.unsubscribed) return { enrollmentId: null, contactId, reason: "unsubscribed" };
  const { data: c } = await db.from("seq_contacts").select("timezone").eq("id", contactId).maybeSingle();
  const tz = c?.timezone && isValidTz(c.timezone as string) ? (c.timezone as string) : "America/Denver";

  const { data: enr, error: enrErr } = await db
    .from("sequence_enrollments")
    .upsert(
      { sequence_id: seq.id, contact_id: contactId, start_date: localNow(tz).date, source: i.source || null, source_ref: i.sourceRef || null, status: "active" },
      { onConflict: "sequence_id,contact_id", ignoreDuplicates: true }
    )
    .select("id");
  if (enrErr) return { enrollmentId: null, contactId, reason: enrErr.message };
  const enrollmentId = (enr?.[0]?.id as string) ?? null;
  if (!enrollmentId) return { enrollmentId: null, contactId, reason: "already enrolled" };
  await logEvent(i.masterPlanId, contactId, "sequence", `Started “${seq.name}”`, { sequence: i.sequenceKey }, db).catch(() => {});
  // Day 0 goes out right away (if the sequence is live).
  if (seq.active) await processEnrollment(db, enrollmentId).catch((e) => console.error("sequence day-0:", e));
  return { enrollmentId, contactId };
}

interface Step {
  id: string;
  position: number;
  day_offset: number;
  subject: string;
  preview: string | null;
  body: string;
  button_label: string | null;
  button_url: string | null;
}
interface SeqRow {
  id: string;
  master_plan_id: string;
  name: string;
  brand: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  send_hour: number;
  active: boolean;
}

export async function sendRendered(
  seq: Pick<SeqRow, "from_name" | "from_email" | "reply_to">,
  to: string,
  contactId: string,
  mail: { subject: string; html: string; text: string }
): Promise<{ ok: boolean; id?: string; error?: string; status?: number }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY not set" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${seq.from_name} <${seq.from_email}>`,
      to,
      reply_to: seq.reply_to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      headers: { "List-Unsubscribe": `<${unsubscribeApiUrl(contactId)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  const out = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, id: out?.id, status: res.status } : { ok: false, error: out?.message || `Resend ${res.status}`, status: res.status };
}

// A client account's From/Reply-To (their own verified domain), in the shape sendRendered takes.
export function clientFrom(who: Extract<AccountSender, { ok: true; house: false }>) {
  return { from_name: `"${who.fromName}"`, from_email: who.fromEmail, reply_to: who.replyTo };
}

// Sends whatever is due for one enrollment: day 0 immediately, then at most one
// day-step per run (so a missed run catches up gently rather than in a burst).
// `sender` looks up who the account sends as (cached per cron run). A client
// account that can't send yet (no verified domain / no mailing address) is
// skipped before anything is claimed, and never falls back to a Babs address.
export async function processEnrollment(db: Db, enrollmentId: string, now = new Date(), sender: (planId: string, marketing: boolean) => Promise<AccountSender> = senderCache(db)): Promise<number> {
  const { data: enr } = await db
    .from("sequence_enrollments")
    .select("id, status, start_date, sequence_id, contact_id")
    .eq("id", enrollmentId)
    .maybeSingle();
  if (!enr || enr.status !== "active") return 0;
  const [{ data: seq }, { data: contact }, { data: steps }, { data: sent }] = await Promise.all([
    db.from("sequences").select("id, master_plan_id, name, brand, from_name, from_email, reply_to, send_hour, active").eq("id", enr.sequence_id).maybeSingle(),
    db.from("seq_contacts").select("id, email, first_name, timezone, unsubscribed_at").eq("id", enr.contact_id).maybeSingle(),
    db.from("sequence_steps").select("id, position, day_offset, subject, preview, body, button_label, button_url").eq("sequence_id", enr.sequence_id).order("position"),
    db.from("sequence_sends").select("step_id").eq("enrollment_id", enr.id),
  ]);
  const s = seq as SeqRow | null;
  if (!s || !s.active || !contact) return 0;
  const who = await sender(s.master_plan_id, true);
  if (!who.ok) return 0; // client account not ready to send: nothing goes out, nothing is claimed
  if (contact.unsubscribed_at) {
    await db.from("sequence_enrollments").update({ status: "stopped" }).eq("id", enr.id);
    return 0;
  }
  const done = new Set(((sent ?? []) as { step_id: string }[]).map((x) => x.step_id));
  const all = (steps ?? []) as Step[];
  const tz = isValidTz(contact.timezone as string) ? (contact.timezone as string) : "America/Denver";
  const { date: today, hour } = localNow(tz, now);

  const due = all.filter((st) => {
    if (done.has(st.id)) return false;
    if (st.day_offset <= 0) return true;
    const day = addDays(enr.start_date as string, st.day_offset);
    return today > day || (today === day && hour >= s.send_hour);
  });
  const toSend = [...due.filter((d) => d.day_offset <= 0), ...due.filter((d) => d.day_offset > 0).slice(0, 1)];

  let count = 0;
  for (const st of toSend) {
    const { data: claim } = await db
      .from("sequence_sends")
      .upsert({ enrollment_id: enr.id, step_id: st.id, status: "claimed" }, { onConflict: "enrollment_id,step_id", ignoreDuplicates: true })
      .select("id");
    if (!claim?.length) continue; // another run already has it
    const mail = renderStep({ brand: s.brand, subject: st.subject, preview: st.preview, body: st.body, buttonLabel: st.button_label, buttonUrl: st.button_url, contact: { id: contact.id as string, first_name: contact.first_name as string | null }, footer: who.house ? undefined : who.footer });
    const r = await sendRendered(who.house ? s : clientFrom(who), contact.email as string, contact.id as string, mail);
    await db
      .from("sequence_sends")
      .update(r.ok ? { status: "sent", resend_id: r.id ?? null, sent_at: new Date().toISOString() } : { status: "failed", error: (r.error || "").slice(0, 500) })
      .eq("id", claim[0].id);
    if (r.ok) {
      count++;
      done.add(st.id);
    }
  }
  if (all.length && all.every((st) => done.has(st.id))) {
    await db.from("sequence_enrollments").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", enr.id);
  }
  return count;
}

// The cron: every active enrollment in every live sequence.
export async function processDue(): Promise<{ checked: number; sent: number }> {
  const db = createServerClient();
  const { data: live } = await db.from("sequences").select("id").eq("active", true);
  const ids = ((live ?? []) as { id: string }[]).map((x) => x.id);
  if (!ids.length) return { checked: 0, sent: 0 };
  const { data: enrs } = await db.from("sequence_enrollments").select("id").eq("status", "active").in("sequence_id", ids).limit(2000);
  let sent = 0;
  const sender = senderCache(db);
  for (const e of (enrs ?? []) as { id: string }[]) {
    try {
      sent += await processEnrollment(db, e.id, new Date(), sender);
    } catch (err) {
      console.error("sequence send:", e.id, err);
    }
  }
  return { checked: (enrs ?? []).length, sent };
}
