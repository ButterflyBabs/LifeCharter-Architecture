import { createHmac, timingSafeEqual } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { isHousePlan } from "@/lib/housePlan";
import { ALIGNMENT_ARCHITECT_EMAIL } from "@/lib/authz";
import { notifyOwnerOfTextingDecision } from "@/lib/smsNotify";
import { SMS_CAP_BY_TIER, SMS_DEFAULT_CAP, consentText, DEFAULT_24H, segmentsOf, toE164, type Business } from "@/lib/sms";

// Text messages (task 1151), the server side. Plain Twilio REST (no SDK) with the Suite's own account
// (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN, set by Babs in Vercel). Each Command Suite account gets its own toll-free
// number with its own business verification; every text is logged, counted against the plan's monthly cap, and never
// sent to anyone who opted out.

type Db = ReturnType<typeof createServerClient>;
const APP = () => (process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com").replace(/\/$/, "");
const creds = () => ({ sid: process.env.TWILIO_ACCOUNT_SID || "", token: process.env.TWILIO_AUTH_TOKEN || "" });
export const twilioReady = () => Boolean(creds().sid && creds().token);

export interface SmsAccount {
  master_plan_id: string;
  phone_number: string | null;
  phone_sid: string | null;
  verification_sid: string | null;
  status: "none" | "pending" | "in_review" | "approved" | "rejected" | "suspended";
  status_note: string | null;
  business: Business | Record<string, never>;
  reminders_on: boolean;
  reminder_24h: boolean;
  reminder_1h: boolean;
  template_24h: string | null;
  template_1h: string | null;
  submitted_at: string | null;
  approved_at: string | null;
}
export const SMS_COLUMNS = "master_plan_id, phone_number, phone_sid, verification_sid, status, status_note, business, reminders_on, reminder_24h, reminder_1h, template_24h, template_1h, submitted_at, approved_at";

async function twilio(method: "GET" | "POST", url: string, form?: Record<string, string | string[]>): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const { sid, token } = creds();
  if (!sid || !token) return { ok: false, status: 0, data: { message: "Texting isn't set up yet." } };
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(form ?? {})) for (const x of Array.isArray(v) ? v : [v]) if (x !== "") body.append(k, x);
  const r = await fetch(url, {
    method,
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: method === "POST" ? body : undefined,
    cache: "no-store",
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: r.ok, status: r.status, data };
}
const API = () => `https://api.twilio.com/2010-04-01/Accounts/${creds().sid}`;

/** Twilio signs every webhook; refuse anything it didn't send. */
export function validTwilioSignature(url: string, params: Record<string, string>, signature: string | null): boolean {
  const { token } = creds();
  if (!token || !signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const want = createHmac("sha1", token).update(Buffer.from(data, "utf-8")).digest("base64");
  const a = Buffer.from(want);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** This account's monthly text allowance: by its plan (Starter 500, Growth 1,000, VIP 2,500); Babs's own is VIP. */
export async function smsCap(db: Db, planId: string): Promise<number> {
  if (await isHousePlan(planId)) return SMS_CAP_BY_TIER.vip;
  const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
  if (!plan?.user_id) return SMS_DEFAULT_CAP;
  const { data: sub } = await db.from("subscriptions").select("plan_id").eq("user_id", plan.user_id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const tier = String(sub?.plan_id || "");
  if (!tier) return SMS_DEFAULT_CAP;
  const { data: row } = await db.from("plans").select("capabilities").eq("id", tier).maybeSingle();
  const n = (row?.capabilities as Record<string, unknown> | null)?.sms_texts;
  return typeof n === "number" && n >= 0 ? n : SMS_CAP_BY_TIER[tier] ?? SMS_DEFAULT_CAP;
}

const monthStart = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
};
/** Texts sent this calendar month (failed ones don't count). */
export async function smsUsed(db: Db, planId: string): Promise<number> {
  const { count } = await db.from("sms_messages").select("id", { count: "exact", head: true }).eq("master_plan_id", planId).eq("direction", "out").gte("created_at", monthStart()).not("status", "in", "(failed,undelivered,blocked)");
  return count ?? 0;
}

export async function smsAccount(db: Db, planId: string): Promise<SmsAccount | null> {
  const { data } = await db.from("sms_accounts").select(SMS_COLUMNS).eq("master_plan_id", planId).maybeSingle();
  return (data as SmsAccount | null) ?? null;
}

/** Has anyone with this number opted out of this account's texts? */
async function optedOut(db: Db, planId: string, to: string): Promise<boolean> {
  const { data } = await db.from("seq_contacts").select("phone, sms_opted_out_at").eq("master_plan_id", planId).not("sms_opted_out_at", "is", null).limit(5000);
  return ((data ?? []) as { phone: string | null }[]).some((c) => toE164(c.phone) === to);
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string; code: "not_ready" | "opted_out" | "cap" | "bad_number" | "twilio" };

/** Send one text from the account's own number: checks approval, the number, opt-outs and the monthly cap; logs it. */
export async function sendSms(db: Db, planId: string, input: { to: string; body: string; kind: "reminder" | "manual" | "auto" | "system"; contactId?: string | null; bookingId?: string | null }): Promise<SendResult> {
  const acct = await smsAccount(db, planId);
  if (!acct || acct.status !== "approved" || !acct.phone_number) return { ok: false, code: "not_ready", error: "Texting isn't approved for this account yet." };
  const to = toE164(input.to);
  if (!to) return { ok: false, code: "bad_number", error: "That isn't a US or Canadian mobile number." };
  if (await optedOut(db, planId, to)) return { ok: false, code: "opted_out", error: "This person replied STOP, so they don't get texts." };
  const [cap, used] = await Promise.all([smsCap(db, planId), smsUsed(db, planId)]);
  if (used >= cap) return { ok: false, code: "cap", error: `This month's ${cap} texts are used. Texting starts again on the 1st.` };
  const body = input.body.trim().slice(0, 640);
  const { data: row } = await db
    .from("sms_messages")
    .insert({ master_plan_id: planId, contact_id: input.contactId ?? null, booking_id: input.bookingId ?? null, direction: "out", kind: input.kind, to_number: to, from_number: acct.phone_number, body, segments: segmentsOf(body), status: "sending" })
    .select("id")
    .single();
  const r = await twilio("POST", `${API()}/Messages.json`, { To: to, From: acct.phone_number, Body: body, StatusCallback: `${APP()}/api/sms/status` });
  if (!r.ok) {
    const error = String(r.data.message || "Twilio didn't accept the text.");
    if (row) await db.from("sms_messages").update({ status: "failed", error: error.slice(0, 300) }).eq("id", row.id);
    return { ok: false, code: "twilio", error };
  }
  if (row) await db.from("sms_messages").update({ status: String(r.data.status || "queued"), twilio_sid: String(r.data.sid || "") || null }).eq("id", row.id);
  return { ok: true, id: (row?.id as string) || "" };
}

/**
 * Get a texting number for an account and send it for Twilio's toll-free approval (about 5 to 15 business days).
 * Buys the number once; a rejected request is edited and sent again on the same number.
 */
export async function registerNumber(db: Db, planId: string, b: Business, sample: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!twilioReady()) return { ok: false, error: "Texting isn't set up on the Suite yet." };
  let acct = await smsAccount(db, planId);
  if (!acct) {
    await db.from("sms_accounts").insert({ master_plan_id: planId });
    acct = await smsAccount(db, planId);
  }
  if (!acct) return { ok: false, error: "Couldn't start. Please try again." };
  if (acct.status === "approved") return { ok: false, error: "Texting is already approved." };
  if (acct.status === "pending" || acct.status === "in_review") return { ok: false, error: "Your number is already waiting for approval." };

  // 1. The number (toll-free, text-capable). Replies come back to the Suite.
  let phoneSid = acct.phone_sid;
  let phone = acct.phone_number;
  if (!phoneSid) {
    const avail = await twilio("GET", `${API()}/AvailablePhoneNumbers/US/TollFree.json?SmsEnabled=true&PageSize=5`);
    const list = (avail.data.available_phone_numbers as { phone_number: string }[] | undefined) ?? [];
    if (!list.length) return { ok: false, error: "No texting numbers are free right now. Please try again in a few minutes." };
    const buy = await twilio("POST", `${API()}/IncomingPhoneNumbers.json`, { PhoneNumber: list[0].phone_number, SmsUrl: `${APP()}/api/sms/inbound`, SmsMethod: "POST", FriendlyName: `LCCS ${planId}` });
    if (!buy.ok) {
      const m = String(buy.data.message || "");
      // Twilio checks the Suite's own business identity (Trust Hub) once, before it sells any numbers.
      if (/compliance profile|trust hub|kyc/i.test(m)) return { ok: false, error: "Texting numbers aren't available yet: the LifeCharter Command Suite's own business check with our texting provider is still being finished. Nothing was charged. Please try again in a few days." };
      return { ok: false, error: m || "Couldn't get a number." };
    }
    phoneSid = String(buy.data.sid);
    phone = String(buy.data.phone_number);
    await db.from("sms_accounts").update({ phone_sid: phoneSid, phone_number: phone, updated_at: new Date().toISOString() }).eq("master_plan_id", planId);
  }

  // 2. The business behind it, for the carriers' approval.
  const name = b.dba || b.legalName;
  const form: Record<string, string | string[]> = {
    BusinessName: b.legalName,
    DoingBusinessAs: b.dba,
    BusinessWebsite: b.website,
    NotificationEmail: ALIGNMENT_ARCHITECT_EMAIL,
    UseCaseCategories: ["ACCOUNT_NOTIFICATIONS"],
    UseCaseSummary: `${name} texts appointment reminders (the day before and about an hour before) to clients who booked a session through ${name}'s online booking page and ticked a box agreeing to text reminders. Clients may reply to reach ${name}. Sent through the LifeCharter Command Suite.`,
    ProductionMessageSample: sample,
    OptInImageUrls: [`${APP()}/sms/opt-in-example.png`],
    OptInType: "WEB_FORM",
    OptInConfirmationMessage: "",
    MessageVolume: "1,000",
    TollfreePhoneNumberSid: phoneSid!,
    BusinessStreetAddress: b.street,
    BusinessStreetAddress2: b.street2,
    BusinessCity: b.city,
    BusinessStateProvinceRegion: b.state,
    BusinessPostalCode: b.postal,
    BusinessCountry: "US",
    BusinessContactFirstName: b.contactFirst,
    BusinessContactLastName: b.contactLast,
    BusinessContactEmail: b.contactEmail,
    BusinessContactPhone: toE164(b.contactPhone) || "",
    BusinessType: b.type,
    HelpMessageSample: `${name}: for help, reply to this text or email ${b.contactEmail}. Reply STOP to opt out.`,
    PrivacyPolicyUrl: b.privacyUrl,
    AdditionalInformation: `Opt-in wording shown next to an unticked box on the booking form: "${consentText(name)}"`,
    ExternalReferenceId: planId,
  };
  if (b.type !== "SOLE_PROPRIETOR") {
    form.BusinessRegistrationNumber = b.ein.replace(/\D/g, "");
    form.BusinessRegistrationAuthority = "EIN";
    form.BusinessRegistrationCountry = "US";
  }
  const url = acct.verification_sid ? `https://messaging.twilio.com/v1/Tollfree/Verifications/${acct.verification_sid}` : "https://messaging.twilio.com/v1/Tollfree/Verifications";
  const v = await twilio("POST", url, form);
  if (!v.ok) return { ok: false, error: String(v.data.message || "Twilio didn't accept the details. Please check them and try again.") };
  await db
    .from("sms_accounts")
    .update({ verification_sid: String(v.data.sid || acct.verification_sid), status: "pending", status_note: null, business: b, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("master_plan_id", planId);
  return { ok: true };
}

/** Ask Twilio where each waiting number stands (hourly). */
export async function checkVerifications(db: Db): Promise<number> {
  const { data } = await db.from("sms_accounts").select("master_plan_id, verification_sid, status").in("status", ["pending", "in_review"]).not("verification_sid", "is", null).limit(200);
  let changed = 0;
  for (const a of (data ?? []) as { master_plan_id: string; verification_sid: string; status: string }[]) {
    const r = await twilio("GET", `https://messaging.twilio.com/v1/Tollfree/Verifications/${a.verification_sid}`);
    if (!r.ok) continue;
    const st = String(r.data.status || "");
    const next = st === "TWILIO_APPROVED" ? "approved" : st === "TWILIO_REJECTED" ? "rejected" : st === "IN_REVIEW" ? "in_review" : "pending";
    const note = next === "rejected" ? String(r.data.rejection_reason || r.data.error_code || "Twilio didn't approve the details.") : null;
    await db.from("sms_accounts").update({ status: next, status_note: note, checked_at: new Date().toISOString(), ...(next === "approved" ? { approved_at: new Date().toISOString() } : {}) }).eq("master_plan_id", a.master_plan_id);
    if (next !== a.status) {
      changed++;
      if (next === "approved" || next === "rejected") await notifyOwnerOfTextingDecision(db, a.master_plan_id, next, note).catch(() => {});
    }
  }
  return changed;
}

export const sampleReminder = (business: string) => DEFAULT_24H.replace("{business}", business).replace("{event}", "Discovery Call").replace("{time}", "Tuesday 10:00 AM");
