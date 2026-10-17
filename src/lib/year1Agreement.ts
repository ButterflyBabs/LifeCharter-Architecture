import { createServerClient } from "@/lib/supabase/server";
import { logEvent, upsertContact } from "@/lib/crm";

// Sends the Year-1 Operating Agreement for signature through BoldSign. Used by the Sales Reference page (Marcello, on a
// call) and by the self-serve Starter sign-up (automatic, right after payment). The BoldSign template is
// "LCCS Year-1 Operating Agreement": role 1 is the Client (signs first), role 2 is the Company (AmiLynne countersigns).
// Everything we know about the client is filled in; the template locks those fields, so the client only signs.
// Needs BOLDSIGN_API_KEY on Vercel; BOLDSIGN_TEMPLATE_ID, BOLDSIGN_API_BASE and BOLDSIGN_COMPANY_SIGNER_EMAIL can override.

const TEMPLATE_ID = process.env.BOLDSIGN_TEMPLATE_ID || "aacf6304-86ae-4585-9ead-47823a4e0aa5";
const API_BASE = (process.env.BOLDSIGN_API_BASE || "https://api.boldsign.com").replace(/\/$/, "");
const COMPANY_NAME = "AmiLynne Carroll";
const COMPANY_EMAIL = process.env.BOLDSIGN_COMPANY_SIGNER_EMAIL || "amilynne@amilynnecarroll.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

// Field ids in the BoldSign template (BoldSign numbers them in the order they were placed).
export const TIER_FIELD: Record<string, string> = { Starter: "CheckBox1", Growth: "CheckBox2", VIP: "CheckBox3" };
export const PAYMENT_FIELD: Record<string, string> = { full: "CheckBox4", split: "CheckBox5", annual: "CheckBox6" };

export interface AgreementInput {
  masterPlanId: string;
  contactId?: string | null;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  tier: string;
  payment: string;
  by?: string | null; // who or what sent it, for the timeline
  welcomeCallLink?: boolean; // add the Welcome Call booking link to the email (automatic sends; on a call it is booked live)
  redirectUrl?: string; // where BoldSign sends the client after signing (self-serve: back to the page that opens their account)
  accountOpensOnSigning?: boolean; // self-serve: the Suite account is created only once they sign, and the email says so
}

export type AgreementResult = { ok: true; documentId: string } | { ok: false; status: number; error: string };

export const agreementConfigured = () => Boolean(process.env.BOLDSIGN_API_KEY);

export async function sendYear1Agreement(i: AgreementInput): Promise<AgreementResult> {
  const key = process.env.BOLDSIGN_API_KEY;
  if (!key) return { ok: false, status: 503, error: "Sending from this page isn't switched on yet (the BoldSign key hasn't been added). Ask Babs, or send it from BoldSign for now." };
  const name = i.name.trim().slice(0, 120);
  const email = i.email.trim().toLowerCase().slice(0, 200);
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, status: 400, error: "Enter the client's name and a valid email." };
  if (email === COMPANY_EMAIL.toLowerCase()) return { ok: false, status: 400, error: "That is the company signer's email. Enter the client's." };
  const tier = TIER_FIELD[i.tier] ? i.tier : "";
  const payment = PAYMENT_FIELD[i.payment] ? i.payment : "";

  const db = createServerClient();
  let contactId = i.contactId || "";
  if (!contactId) {
    const [first, ...rest] = name.split(/\s+/);
    const made = await upsertContact({ masterPlanId: i.masterPlanId, email, firstName: first || null, lastName: rest.join(" ") || null, source: "sales-call" }, db);
    contactId = made?.id ?? "";
  }
  // One agreement per client within a day: stops a double click (or a replayed payment event) from sending it twice.
  if (contactId) {
    const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
    const { data: recent } = await db.from("crm_events").select("id").eq("master_plan_id", i.masterPlanId).eq("contact_id", contactId).eq("title", "Year-1 Operating Agreement sent for signature").gte("created_at", since).limit(1);
    if (recent?.length) return { ok: false, status: 409, error: "The agreement was already sent to this client in the last 24 hours. Check BoldSign before sending it again." };
  }

  const prefill: { id: string; value: string }[] = [
    { id: "Name1", value: name },
    { id: "Email1", value: email },
    { id: "Name2", value: name },
    ...(i.businessName?.trim() ? [{ id: "TextBox1", value: i.businessName.trim().slice(0, 160) }] : []),
    ...(i.phone?.trim() ? [{ id: "TextBox2", value: i.phone.trim().slice(0, 40) }] : []),
    ...(tier ? [{ id: TIER_FIELD[tier], value: "on" }] : []),
    ...(payment ? [{ id: PAYMENT_FIELD[payment], value: "on" }] : []),
  ];
  const first = name.split(/\s+/)[0];
  const message =
    `Hi ${first}, welcome to LifeCharter Command Suite! Please review and sign your Year-1 Operating Agreement. It takes about two minutes. ` +
    (i.accountOpensOnSigning ? `Your Command Suite account opens the moment you sign, and we will email you right after so you can book your 1:1 Welcome Call with me. ` : "") +
    (i.welcomeCallLink ? `After you sign, please choose a time for your 1:1 Welcome Call with me: ${APP_URL}/book/new-client-welcome-call?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)} ` : "") +
    `If you have any questions, reply to this email or write to support@lccommandsuite.com. Head up - Wings out. Babs`;

  const send = (withRedirect: boolean) =>
    fetch(`${API_BASE}/v1/template/send?templateId=${encodeURIComponent(TEMPLATE_ID)}`, {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        title: "LifeCharter Command Suite Year-1 Operating Agreement",
        message,
        roles: [
          { roleIndex: 1, signerName: name, signerEmail: email, signerType: "Signer", existingFormFields: prefill, ...(withRedirect && i.redirectUrl ? { redirectUrl: i.redirectUrl } : {}) },
          { roleIndex: 2, signerName: COMPANY_NAME, signerEmail: COMPANY_EMAIL, signerType: "Signer" },
        ],
      }),
    }).catch(() => null);
  // The redirect after signing is a nicety: if BoldSign doesn't accept it on a template send, send without it.
  let res = await send(true);
  if (res?.status === 400 && i.redirectUrl) res = await send(false);
  const out = (await res?.json().catch(() => ({}))) as { documentId?: string } | undefined;
  if (!res || !res.ok || !out?.documentId) {
    console.error("BoldSign send failed:", res?.status, JSON.stringify(out ?? {}).slice(0, 400));
    return { ok: false, status: 502, error: res?.status === 401 || res?.status === 403 ? "BoldSign refused the key. Ask Babs to check it." : "BoldSign couldn't send it. Check BoldSign, or try again in a minute." };
  }

  if (contactId) {
    await logEvent(i.masterPlanId, contactId, "note", "Year-1 Operating Agreement sent for signature", { documentId: out.documentId, to: email, by: i.by ?? null, via: "BoldSign", tier: tier || null, payment: payment || null }, db);
    const { data: c } = await db.from("seq_contacts").select("tags").eq("id", contactId).eq("master_plan_id", i.masterPlanId).maybeSingle();
    const tags = new Set(((c?.tags as string[]) ?? []).map((t) => t.toLowerCase()));
    tags.add("agreement-sent");
    await db.from("seq_contacts").update({ tags: Array.from(tags), updated_at: new Date().toISOString() }).eq("id", contactId).eq("master_plan_id", i.masterPlanId);
  }
  return { ok: true, documentId: out.documentId };
}
