import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveActor } from "@/lib/authz";
import { crmAccount } from "../guard";
import { isHouseDomain, senderProfile, senderVerdict, cleanName } from "@/lib/email/accountSender";
import { createDomain, deleteDomain, getDomain, verifyDomain } from "@/lib/email/resendDomains";
import { checkResendKey, setAccountResendKey } from "@/lib/email/resendKey";

export const dynamic = "force-dynamic";

// Email sending for the signed-in account (Contacts → Email sending).
//   GET → the account's sending domain (status + DNS records) and sender profile
//   POST { action } with action one of:
//     save-profile { senderName, replyTo, signoff, supportEmail, address, fromLocal }
//     save-resend-key { key }    (account owner only; the key is checked, then stored encrypted)
//     remove-resend-key          (account owner only)
//     add-domain { domain }      (account owner only; needs the Resend key first)
//     check-domain               → asks the email service to verify, then refreshes status/records
//     remove-domain              (account owner only)
// Babs's account keeps its existing sender setup; nothing here changes it.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const HOST_RE = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const LOCAL_RE = /^[a-z0-9](?:[a-z0-9._-]{0,38}[a-z0-9])?$/;
const NOT_READY = "Email sending isn't switched on for accounts yet. Please contact support.";
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const emailDomain = (e: string) => e.split("@")[1] || "";

async function view(planId: string) {
  const p = await senderProfile(planId);
  if (p.house) return { house: true };
  const transactional = senderVerdict(p, false);
  const marketing = senderVerdict(p, true);
  return {
    house: false,
    available: !p.columnsMissing,
    resendConnected: Boolean(p.resendKey),
    domain: p.domain ? { name: p.domain, status: p.status, records: p.records, fromEmail: p.fromEmail } : null,
    fromLocal: p.fromLocal,
    saved: p.saved,
    defaults: p.defaults,
    using: { senderName: p.senderName, replyTo: p.replyTo, signoff: p.signoff, supportEmail: p.supportEmail, address: p.address },
    ready: { bookings: transactional.ok, marketing: marketing.ok, reason: marketing.ok ? null : marketing.reason },
  };
}

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  return NextResponse.json(await view(a.planId));
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  if (a.house) return NextResponse.json({ error: "Your account already sends from your own addresses; nothing to change here." }, { status: 400 });
  const b = await request.json().catch(() => ({}));
  const db = createServerClient();
  const p = await senderProfile(a.planId, db);
  if (p.columnsMissing) return NextResponse.json({ error: NOT_READY }, { status: 503 });
  const save = async (patch: Record<string, unknown>) => {
    const { error } = await db.from("client_master_plans").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", a.planId);
    return error;
  };

  if (b.action === "save-profile") {
    const patch: Record<string, unknown> = {};
    if (b.senderName !== undefined) patch.sender_name = cleanName(str(b.senderName, 80)) || null;
    for (const [k, col] of [["replyTo", "sender_reply_to"], ["supportEmail", "sender_support_email"]] as const) {
      if (b[k] === undefined) continue;
      const v = str(b[k], 200).toLowerCase();
      if (v && !EMAIL_RE.test(v)) return NextResponse.json({ error: `${k === "replyTo" ? "Reply-to" : "Support"} needs to be a full email address.` }, { status: 400 });
      if (v && isHouseDomain(emailDomain(v))) return NextResponse.json({ error: "Please use one of your own email addresses." }, { status: 400 });
      patch[col] = v || null;
    }
    if (b.signoff !== undefined) patch.sender_signoff = str(b.signoff, 200) || null;
    if (b.address !== undefined) patch.business_address = str(b.address, 300) || null;
    if (b.fromLocal !== undefined) {
      const v = str(b.fromLocal, 40).toLowerCase() || "hello";
      if (!LOCAL_RE.test(v)) return NextResponse.json({ error: "The part before the @ can use letters, numbers, dots, dashes and underscores." }, { status: 400 });
      patch.sending_from_local = v;
    }
    const err = await save(patch);
    if (err) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
    return NextResponse.json(await view(a.planId));
  }

  if (b.action === "save-resend-key" || b.action === "remove-resend-key" || b.action === "add-domain" || b.action === "remove-domain") {
    // Connecting a domain is like connecting any outside account: the account owner only.
    const actor = await resolveActor();
    if (actor.kind === "member") return NextResponse.json({ error: "Only the account owner can set up or remove the sending domain." }, { status: 403 });
  }

  if (b.action === "save-resend-key") {
    const key = str(b.key, 200);
    const c = await checkResendKey(key);
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 400 });
    // A different Resend account than before: the old domain isn't in it, so start the domain step again.
    if (p.resendKey && p.resendKey !== key) await save({ sending_domain: null, resend_domain_id: null, sending_domain_status: "not_started", sending_domain_records: [] });
    if (!(await setAccountResendKey(a.planId, key, db))) return NextResponse.json({ error: "Couldn't save the key." }, { status: 500 });
    return NextResponse.json(await view(a.planId));
  }

  if (b.action === "remove-resend-key") {
    // Take the domain off their Resend account first, then forget the key.
    if (p.resendKey && p.domainId) await deleteDomain(p.resendKey, p.domainId);
    await save({ sending_domain: null, resend_domain_id: null, sending_domain_status: "not_started", sending_domain_records: [] });
    await setAccountResendKey(a.planId, "", db);
    return NextResponse.json(await view(a.planId));
  }

  if (b.action === "add-domain" && !p.resendKey) return NextResponse.json({ error: "Connect your Resend account first (step 1)." }, { status: 400 });
  if ((b.action === "check-domain") && !p.resendKey) return NextResponse.json({ error: "Connect your Resend account first (step 1)." }, { status: 400 });

  if (b.action === "add-domain") {
    if (p.domainId) return NextResponse.json({ error: "Remove the current domain first." }, { status: 400 });
    const domain = str(b.domain, 253).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
    if (!HOST_RE.test(domain)) return NextResponse.json({ error: "Enter a domain like mail.yourbusiness.com." }, { status: 400 });
    if (isHouseDomain(domain)) return NextResponse.json({ error: "Please use a domain your business owns." }, { status: 400 });
    const { data: taken } = await db.from("client_master_plans").select("id").ilike("sending_domain", domain).neq("id", a.planId).limit(1);
    if (taken?.length) return NextResponse.json({ error: "That domain is already in use by another account." }, { status: 409 });
    const r = await createDomain(p.resendKey!, domain);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status >= 500 ? 502 : 400 });
    const err = await save({ sending_domain: domain, resend_domain_id: r.data.id, sending_domain_status: r.data.status, sending_domain_records: r.data.records });
    if (err) {
      await deleteDomain(p.resendKey!, r.data.id); // don't leave an orphan at the email service
      return NextResponse.json({ error: err.code === "23505" ? "That domain is already in use by another account." : "Couldn't save the domain." }, { status: 400 });
    }
    return NextResponse.json(await view(a.planId));
  }

  if (b.action === "check-domain") {
    if (!p.domainId) return NextResponse.json({ error: "Add your domain first." }, { status: 400 });
    const v = await verifyDomain(p.resendKey!, p.domainId);
    if (!v.ok && v.status !== 409) return NextResponse.json({ error: v.error }, { status: 400 });
    const g = await getDomain(p.resendKey!, p.domainId);
    if (!g.ok) return NextResponse.json({ error: g.error }, { status: 400 });
    // Only ever trust the record this account created.
    if (g.data.name.toLowerCase() !== (p.domain || "")) return NextResponse.json({ error: "That domain doesn't match. Remove it and add it again." }, { status: 400 });
    await save({ sending_domain_status: g.data.status, sending_domain_records: g.data.records });
    return NextResponse.json(await view(a.planId));
  }

  if (b.action === "remove-domain") {
    if (p.domainId && p.resendKey) {
      const r = await deleteDomain(p.resendKey, p.domainId);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    }
    const err = await save({ sending_domain: null, resend_domain_id: null, sending_domain_status: "not_started", sending_domain_records: [] });
    if (err) return NextResponse.json({ error: "Couldn't remove it." }, { status: 500 });
    return NextResponse.json(await view(a.planId));
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
