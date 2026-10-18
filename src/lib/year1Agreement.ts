import { createServerClient } from "@/lib/supabase/server";
import { logEvent, upsertContact } from "@/lib/crm";
import { fillPlaceholders, newToken } from "@/lib/esign";
import { loadDoc, sendDocument } from "@/lib/esignServer";

// Sends the Year-1 Operating Agreement for e-signature through the Suite's own Agreements & Proposals (task 1094;
// BoldSign retired 2026-10-18 after the attorney approved the Suite version). Used by the Sales Reference page
// (Marcello, on a call) and by the self-serve Starter sign-up (automatic, right after payment). The document is made
// from the house template "LCCS Year-1 Operating Agreement" with everything we know filled in; the Client signs first,
// then AmiLynne countersigns. Agreements sent through BoldSign before the switch are still checked there.

const TEMPLATE_KEY = "lccs-year1";
const COMPANY_NAME = "AmiLynne Carroll";
const COMPANY_EMAIL = process.env.YEAR1_COMPANY_SIGNER_EMAIL || process.env.BOLDSIGN_COMPANY_SIGNER_EMAIL || "amilynne@amilynnecarroll.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

export const TIER_FIELD: Record<string, string> = { Starter: "Starter", Growth: "Growth", VIP: "VIP" };
export const PAYMENT_FIELD: Record<string, string> = { full: "Implementation Fee paid in full, then the Monthly Fee", split: "50/50: half of the Implementation Fee today and half in about 30 days, then the Monthly Fee", annual: "Annual plan paid in full (covers the Implementation Fee and the first 12 months)" };

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
  redirectUrl?: string; // where the client continues after signing (self-serve: back to the page that opens their account)
  accountOpensOnSigning?: boolean; // self-serve: the Suite account is created only once they sign, and the email says so
}

export type AgreementResult = { ok: true; documentId: string } | { ok: false; status: number; error: string };

export const agreementConfigured = () => true;

export async function sendYear1Agreement(i: AgreementInput): Promise<AgreementResult> {
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
    if (recent?.length) return { ok: false, status: 409, error: "The agreement was already sent to this client in the last 24 hours. Check Agreements & Proposals before sending it again." };
  }

  const { data: tpl } = await db.from("sign_templates").select("body").eq("master_plan_id", i.masterPlanId).eq("key", TEMPLATE_KEY).maybeSingle();
  if (!tpl?.body) return { ok: false, status: 503, error: "The Year-1 Operating Agreement template is missing from Agreements & Proposals. Ask Babs." };
  const body = fillPlaceholders(String(tpl.body), {
    "Client name": name,
    "Business name of the client": i.businessName?.trim().slice(0, 160) || "(not given)",
    "Client email": email,
    "Client phone": i.phone?.trim().slice(0, 40) || "(not given)",
    "Tier: Starter, Growth or VIP": tier || "(to be confirmed)",
    "Payment option: in full, 50/50, or annual": payment ? PAYMENT_FIELD[payment] : "(to be confirmed)",
    'Promotional or alumni credit, or "None"': "None",
  });
  const first = name.split(/\s+/)[0];
  const message =
    `Hi ${first}, welcome to LifeCharter Command Suite! Please review and sign your Year-1 Operating Agreement. It takes about two minutes. ` +
    (i.accountOpensOnSigning ? `Your Command Suite account opens the moment you sign, and we will email you right after so you can book your 1:1 Welcome Call with me. ` : "") +
    (i.welcomeCallLink ? `After you sign, please choose a time for your 1:1 Welcome Call with me: ${APP_URL}/book/new-client-welcome-call?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)} ` : "") +
    `If you have any questions, reply to this email or write to support@lccommandsuite.com. Head up - Wings out. Babs`;

  const { data: doc, error } = await db
    .from("sign_documents")
    .insert({ master_plan_id: i.masterPlanId, title: "LifeCharter Command Suite Year-1 Operating Agreement", kind: "agreement", body, contact_id: contactId || null, message, owner_signs: true, external_ref: i.redirectUrl || null, created_by: i.by || "year1" })
    .select("id")
    .single();
  if (error || !doc) return { ok: false, status: 500, error: "Couldn't prepare the agreement. Please try again." };
  const { error: sErr } = await db.from("sign_signers").insert([
    { document_id: doc.id, order_no: 1, name, email, is_owner: false, token_hash: newToken().hash },
    { document_id: doc.id, order_no: 2, name: COMPANY_NAME, email: COMPANY_EMAIL.toLowerCase(), is_owner: true, token_hash: newToken().hash },
  ]);
  if (sErr) {
    console.error("Year-1 signers:", sErr.message);
    await db.from("sign_documents").delete().eq("id", doc.id);
    return { ok: false, status: 500, error: "Couldn't prepare the agreement. Please try again." };
  }
  const { doc: full, signers } = await loadDoc(db, doc.id);
  const sent = full ? await sendDocument(db, full, signers) : { ok: false as const, error: "missing" };
  if (!sent.ok || sent.sent < 1) {
    console.error("Year-1 send failed:", sent.ok ? "no email went out" : sent.error);
    return { ok: false, status: 502, error: "The agreement couldn't be emailed. Please try again in a minute." };
  }

  if (contactId) {
    await logEvent(i.masterPlanId, contactId, "note", "Year-1 Operating Agreement sent for signature", { documentId: doc.id, to: email, by: i.by ?? null, via: "LCCS e-signature", tier: tier || null, payment: payment || null }, db);
    const { data: c } = await db.from("seq_contacts").select("tags").eq("id", contactId).eq("master_plan_id", i.masterPlanId).maybeSingle();
    const tags = new Set(((c?.tags as string[]) ?? []).map((t) => t.toLowerCase()));
    tags.add("agreement-sent");
    await db.from("seq_contacts").update({ tags: Array.from(tags), updated_at: new Date().toISOString() }).eq("id", contactId).eq("master_plan_id", i.masterPlanId);
  }
  return { ok: true, documentId: doc.id as string };
}
