import { createServerClient } from "@/lib/supabase/server";
import { isHousePlan } from "@/lib/housePlan";
import { mapStatus, type DnsRecord, type DomainStatus } from "@/lib/email/resendDomains";

// Who an account's emails come from.
//
// Babs's account (the "house" plan) keeps exactly the sender setup it has always
// had: each sequence/broadcast row's own from/reply-to, reminders@lccommandsuite.com
// for bookings, her sign-off, footer and LLC address. Callers see { house: true }
// and use their existing code path unchanged.
//
// Every other account sends ONLY from its own verified domain
// (<local>@<their domain>), never from any of Babs's domains. Until the domain is
// verified (and, for marketing email, a mailing address is on file), nothing is sent.

type Db = ReturnType<typeof createServerClient>;

// Babs's domains: a client can never send from (or register) these or their subdomains.
export const HOUSE_DOMAINS = ["lccommandsuite.com", "amilynnecarroll.com", "lifecharter.life"];
export const isHouseDomain = (d: string) => {
  const x = d.trim().toLowerCase().replace(/\.$/, "");
  return HOUSE_DOMAINS.some((h) => x === h || x.endsWith(`.${h}`));
};
export const SENDING_SETUP_PATH = "/contacts?tab=sending";
const LOCAL_RE = /^[a-z0-9](?:[a-z0-9._-]{0,38}[a-z0-9])?$/i;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface EmailFooter {
  signoff: string; // plain text, newlines kept
  supportEmail: string;
  address: string;
}

export interface SenderProfile {
  house: boolean;
  columnsMissing: boolean; // the sending columns aren't in the database yet
  domain: string | null;
  domainId: string | null;
  status: DomainStatus;
  records: DnsRecord[];
  fromLocal: string;
  // What the account saved (null = use the default)…
  saved: { senderName: string | null; replyTo: string | null; signoff: string | null; supportEmail: string | null; address: string | null };
  // …the defaults…
  defaults: { senderName: string; replyTo: string; signoff: string; supportEmail: string };
  // …and what's actually used.
  senderName: string;
  replyTo: string;
  signoff: string;
  supportEmail: string;
  address: string;
  fromEmail: string | null; // <local>@<domain> once a domain is on file
}

export type AccountSender =
  | { ok: true; house: true }
  | { ok: true; house: false; from: string; fromName: string; fromEmail: string; replyTo: string; signoff: string; supportEmail: string; address: string; footer: EmailFooter }
  | { ok: false; house: false; reason: string; code: "not_available" | "no_domain" | "unverified" | "no_address" | "no_reply_to" };

const SENDER_COLS = "sending_domain, resend_domain_id, sending_domain_status, sending_domain_records, sending_from_local, sender_name, sender_reply_to, sender_signoff, sender_support_email, business_address";
const txt = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
export const cleanName = (s: string) => s.replace(/[<>"\\\r\n]/g, "").trim().slice(0, 80);

export async function senderProfile(planId: string, db: Db = createServerClient()): Promise<SenderProfile> {
  const house = await isHousePlan(planId, db);
  if (house) {
    // Babs's account: nothing here is used; her existing sender setup applies.
    const none = { senderName: "", replyTo: "", signoff: "", supportEmail: "" };
    return { house, columnsMissing: false, domain: null, domainId: null, status: "not_started", records: [], fromLocal: "hello", saved: { senderName: null, replyTo: null, signoff: null, supportEmail: null, address: null }, defaults: none, ...none, address: "", fromEmail: null };
  }
  const [{ data: plan }, { data: row, error }, { data: ws }] = await Promise.all([
    db.from("client_master_plans").select("user_id, client_name, client_email").eq("id", planId).maybeSingle(),
    db.from("client_master_plans").select(SENDER_COLS).eq("id", planId).maybeSingle(),
    db.from("workspaces").select("name").eq("master_plan_id", planId).order("is_default", { ascending: false }).order("created_at").limit(1).maybeSingle(),
  ]);
  const r = (error ? {} : row ?? {}) as Record<string, unknown>;
  const { data: prof } = plan?.user_id ? await db.from("profiles").select("full_name, email").eq("id", plan.user_id).maybeSingle() : { data: null };

  const fullName = txt(prof?.full_name) || "";
  const ownerEmail = (txt(prof?.email) || txt(plan?.client_email) || "").toLowerCase();
  const clientName = txt(plan?.client_name);
  const defaults = {
    senderName: cleanName(txt(ws?.name) || fullName || (clientName && !clientName.includes("@") ? clientName : "") || "Your business"),
    replyTo: EMAIL_RE.test(ownerEmail) ? ownerEmail : "",
    signoff: fullName.split(/\s+/)[0] || "",
    supportEmail: EMAIL_RE.test(ownerEmail) ? ownerEmail : "",
  };
  const saved = {
    senderName: txt(r.sender_name),
    replyTo: txt(r.sender_reply_to),
    signoff: txt(r.sender_signoff),
    supportEmail: txt(r.sender_support_email),
    address: txt(r.business_address),
  };
  const domain = txt(r.sending_domain)?.toLowerCase() ?? null;
  const localRaw = txt(r.sending_from_local) || "hello";
  const fromLocal = LOCAL_RE.test(localRaw) ? localRaw.toLowerCase() : "hello";
  const replyTo = saved.replyTo || defaults.replyTo;
  return {
    house,
    columnsMissing: Boolean(error),
    domain,
    domainId: txt(r.resend_domain_id),
    status: domain ? mapStatus(r.sending_domain_status || "not_started") : "not_started",
    records: Array.isArray(r.sending_domain_records) ? (r.sending_domain_records as DnsRecord[]) : [],
    fromLocal,
    saved,
    defaults,
    senderName: cleanName(saved.senderName || defaults.senderName) || "Your business",
    replyTo,
    signoff: saved.signoff ?? defaults.signoff,
    supportEmail: saved.supportEmail || replyTo,
    address: saved.address || "",
    fromEmail: domain && !isHouseDomain(domain) ? `${fromLocal}@${domain}` : null,
  };
}

// The footer a client's emails carry (also used for previews before setup is done).
export function footerOf(p: SenderProfile): EmailFooter | undefined {
  if (p.house) return undefined; // Babs's own footer, unchanged
  return { signoff: p.signoff, supportEmail: p.supportEmail, address: p.address || "[Your mailing address]" };
}

// May this account send right now? marketing = sequences and broadcasts (need a
// mailing address by law); booking confirmations/reminders are transactional.
export function senderVerdict(p: SenderProfile, marketing: boolean): AccountSender {
  if (p.house) return { ok: true, house: true };
  const where = "Contacts → Email sending";
  if (p.columnsMissing) return { ok: false, house: false, code: "not_available", reason: "Email sending isn't switched on for your account yet. Please contact support." };
  if (!p.domain || !p.fromEmail) return { ok: false, house: false, code: "no_domain", reason: `Nothing can be emailed until you set up your own sending domain in ${where}.` };
  if (p.status !== "verified") return { ok: false, house: false, code: "unverified", reason: `Your sending domain (${p.domain}) isn't verified yet. Add its DNS records, then click Check verification in ${where}.` };
  if (!EMAIL_RE.test(p.replyTo)) return { ok: false, house: false, code: "no_reply_to", reason: `Add a reply-to email in ${where}.` };
  if (marketing && !p.address.trim()) return { ok: false, house: false, code: "no_address", reason: `Add your business mailing address in ${where}. The law requires it on every marketing email.` };
  const footer: EmailFooter = { signoff: p.signoff, supportEmail: p.supportEmail || p.replyTo, address: p.address };
  return { ok: true, house: false, from: `"${p.senderName}" <${p.fromEmail}>`, fromName: p.senderName, fromEmail: p.fromEmail, replyTo: p.replyTo, signoff: p.signoff, supportEmail: footer.supportEmail, address: p.address, footer };
}

export async function accountSender(planId: string, opts: { marketing: boolean }, db: Db = createServerClient()): Promise<AccountSender> {
  return senderVerdict(await senderProfile(planId, db), opts.marketing);
}

// Per-run memo for crons that touch many rows of the same account.
export function senderCache(db: Db = createServerClient()) {
  const m = new Map<string, Promise<SenderProfile>>();
  return (planId: string, marketing: boolean) => {
    if (!m.has(planId)) m.set(planId, senderProfile(planId, db));
    return m.get(planId)!.then((p) => senderVerdict(p, marketing));
  };
}
