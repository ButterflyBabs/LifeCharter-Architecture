import { createHmac } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { accountSender } from "@/lib/email/accountSender";
import { brandFor as portalBrand, PORTAL_BUCKET } from "@/lib/portal";
import { isHousePlan } from "@/lib/housePlan";
import { logEvent, upsertContact } from "@/lib/crm";
import { CODE_MAX_TRIES, CODE_MINUTES, allSigned, consentText, currentRound, hashCode, newCode, newToken, sha256 } from "@/lib/esign";
import { sealPdf } from "@/lib/esignPdf";

// E-signature (task 1072), the server side. Every step writes to the audit trail (sign_events). Emails go from the
// account's own verified sending address; until it has one, from the Suite ("<Business> via LifeCharter Command
// Suite", replies to the owner), so a signing request is never silently dropped.

type Db = ReturnType<typeof createServerClient>;
const APP = () => (process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com").replace(/\/$/, "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// The "identity confirmed" cookie for a signer's browser (set when the emailed code is confirmed, or when the signed-in
// account owner signs from the LC Plume dashboard). The signing page checks it with the same secret.
const signSecret = () => process.env.SIGN_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev";
export const signCookieName = (signerId: string) => `sv_${signerId.replace(/-/g, "").slice(0, 16)}`;
export const signCookieMac = (signerId: string, verifiedAt: string) => createHmac("sha256", signSecret()).update(`${signerId}|${verifiedAt}`).digest("base64url");

/** The name signers see. Babs's own account signs as "LifeCharter Command Suite" (her choice, 2026-10-18). */
export async function brandFor(db: Db, planId: string): Promise<{ name: string; logo: string | null }> {
  const b = await portalBrand(db, planId);
  return (await isHousePlan(planId, db)) ? { ...b, name: "LifeCharter Command Suite" } : b;
}

export const DOC_COLUMNS = "id, master_plan_id, title, kind, source, body, file_path, file_name, contact_id, offer_id, amount, message, status, owner_signs, expires_on, sent_at, completed_at, final_path, final_hash, original_hash, external_ref, created_by, created_at, updated_at";
export const SIGNER_COLUMNS = "id, document_id, order_no, name, email, is_owner, status, verified_at, consented_at, signed_at, signature_type, signature_text, signature_image, ip, user_agent, decline_reason, last_reminded_at, code_hash, code_expires_at, code_attempts";
export interface Doc { id: string; master_plan_id: string; title: string; kind: "agreement" | "proposal"; source: "written" | "upload"; body: string | null; file_path: string | null; file_name: string | null; contact_id: string | null; offer_id: string | null; amount: number | null; message: string | null; status: string; owner_signs: boolean; expires_on: string | null; sent_at: string | null; completed_at: string | null; final_path: string | null; final_hash: string | null; original_hash: string | null; external_ref: string | null; created_by: string | null }
export interface Signer { id: string; document_id: string; order_no: number; name: string; email: string; is_owner: boolean; status: string; verified_at: string | null; consented_at: string | null; signed_at: string | null; signature_type: "typed" | "drawn" | null; signature_text: string | null; signature_image: string | null; ip: string | null; user_agent: string | null; decline_reason: string | null; last_reminded_at: string | null; code_hash: string | null; code_expires_at: string | null; code_attempts: number }

export async function audit(db: Db, documentId: string, event: string, extra: { signerId?: string | null; detail?: string | null; ip?: string | null; ua?: string | null } = {}) {
  await db.from("sign_events").insert({ document_id: documentId, signer_id: extra.signerId ?? null, event, detail: extra.detail?.slice(0, 500) ?? null, ip: extra.ip?.slice(0, 80) ?? null, user_agent: extra.ua?.slice(0, 300) ?? null });
}

export const signerUrl = (token: string) => `${APP()}/sign/${token}`;

/** Send one signing email: the account's own address when it has one, else the Suite's. */
export async function signMail(db: Db, planId: string, m: { to: string; subject: string; heading: string; lines: string[]; button?: { label: string; url: string }; attachments?: { filename: string; content: string }[] }): Promise<boolean> {
  const who = await accountSender(planId, { marketing: false }, db).catch(() => null);
  const brand = await brandFor(db, planId);
  const { data: plan } = await db.from("client_master_plans").select("client_email").eq("id", planId).maybeSingle();
  const owner = String(plan?.client_email || "");
  const useOwn = who && who.ok && !who.house;
  const key = useOwn ? (who as { resendKey: string }).resendKey : process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = useOwn ? `${(who as { fromName: string }).fromName.replace(/[<>"]/g, "")} <${(who as { fromEmail: string }).fromEmail}>` : who && who.ok && who.house ? `${brand.name.replace(/[<>"]/g, "")} <signatures@lccommandsuite.com>` : `${brand.name.replace(/[<>"]/g, "")} via LifeCharter Command Suite <signatures@lccommandsuite.com>`;
  const replyTo = useOwn ? (who as { replyTo: string }).replyTo : owner || undefined;
  const body = m.lines.filter(Boolean).map((l) => `<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${l}</p>`).join("");
  const button = m.button ? `<p style="margin:18px 0 6px"><a href="${m.button.url}" style="display:inline-block;background:#2E7C83;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;padding:11px 22px;border-radius:999px">${esc(m.button.label)}</a></p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#FBF8F1"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;padding:28px 12px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:18px;padding:28px;border:1px solid #EADFCF"><tr><td><h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:22px;color:#0F5B63">${esc(m.heading)}</h1>${body}${button}<p style="margin:18px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#9aa3ad">Sent for ${esc(brand.name)} through the LifeCharter Command Suite. Questions? Reply to this email.</p></td></tr></table></td></tr></table></body></html>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: m.to, reply_to: replyTo, subject: m.subject, html, ...(m.attachments ? { attachments: m.attachments } : {}) }),
  }).catch(() => null);
  return Boolean(r?.ok);
}

export async function loadDoc(db: Db, id: string) {
  const [{ data: d }, { data: s }] = await Promise.all([
    db.from("sign_documents").select(DOC_COLUMNS).eq("id", id).maybeSingle(),
    db.from("sign_signers").select(SIGNER_COLUMNS).eq("document_id", id).order("order_no").order("created_at"),
  ]);
  return { doc: d as Doc | null, signers: (s ?? []) as Signer[] };
}

async function inviteMail(db: Db, doc: Doc, s: { name: string; email: string }, token: string, brandName: string): Promise<boolean> {
  return signMail(db, doc.master_plan_id, {
    to: s.email,
    subject: `Please sign: ${doc.title}`,
    heading: `${brandName} sent you ${doc.kind === "proposal" ? "a proposal" : "a document"} to sign`,
    lines: [`Hi ${esc(s.name.split(" ")[0])},`, `Please review and sign <strong>${esc(doc.title)}</strong>.`, doc.message ? esc(doc.message).replace(/\n/g, "<br>") : "", "When you open it, we'll email you a 6-digit code to confirm it's you.", doc.expires_on ? `Please sign by ${new Date(`${doc.expires_on}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}.` : ""],
    button: { label: "Review and sign", url: signerUrl(token) },
  });
}

/** Invite whoever signs next (a fresh private link each time, so an old link from a void or resend stops working). */
async function inviteRound(db: Db, doc: Doc, signers: Signer[]): Promise<number> {
  const brand = await brandFor(db, doc.master_plan_id);
  let sent = 0;
  for (const s of currentRound(signers).filter((x) => x.status === "waiting")) {
    const { token, hash } = newToken();
    await db.from("sign_signers").update({ token, token_hash: hash, status: "sent" }).eq("id", s.id);
    const ok = await inviteMail(db, doc, s, token, brand.name);
    await audit(db, doc.id, ok ? "Sent for signature" : "Sending failed", { signerId: s.id, detail: s.email });
    if (ok) sent++;
  }
  return sent;
}

/**
 * Tie a document to the contact record of whoever is signing it, so it shows on their record. Matched by email; a signer
 * who isn't in Contacts yet is added. People signing an independent contractor agreement are tagged LifeCharter-Team.
 */
export async function linkContact(db: Db, doc: Doc, signers: Signer[]): Promise<Doc> {
  const team = /contractor/i.test(doc.title);
  let contactId = doc.contact_id;
  for (const s of signers.filter((x) => !x.is_owner)) {
    const [first, ...rest] = s.name.trim().split(/\s+/);
    const c = await upsertContact({ masterPlanId: doc.master_plan_id, email: s.email, firstName: first || null, lastName: rest.join(" ") || null, source: "LC Plume", tags: team ? ["LifeCharter-Team"] : [] }, db).catch(() => null);
    if (c && !contactId) contactId = c.id;
  }
  if (!contactId || contactId === doc.contact_id) return doc;
  await db.from("sign_documents").update({ contact_id: contactId }).eq("id", doc.id);
  return { ...doc, contact_id: contactId };
}

export async function sendDocument(db: Db, doc: Doc, signers: Signer[]): Promise<{ ok: true; sent: number } | { ok: false; error: string }> {
  if (doc.status !== "draft") return { ok: false, error: "It has already been sent." };
  if (!signers.length) return { ok: false, error: "Add at least one signer." };
  if (doc.source === "written" && !(doc.body || "").trim()) return { ok: false, error: "The document is empty." };
  if (doc.source === "written" && /\{\{[^{}]+\}\}/.test(doc.body || "")) return { ok: false, error: "Fill in every {{blank}} before sending." };
  // The hash of exactly what is being signed (the text, or the uploaded file's bytes).
  let originalHash = sha256(`${doc.title}\n\n${doc.body || ""}`);
  if (doc.source === "upload" && doc.file_path) {
    const { data: f } = await db.storage.from(PORTAL_BUCKET).download(doc.file_path);
    if (!f) return { ok: false, error: "The uploaded file couldn't be read. Please upload it again." };
    originalHash = sha256(Buffer.from(await f.arrayBuffer()));
  }
  doc = await linkContact(db, doc, signers);
  await db.from("sign_documents").update({ status: "sent", sent_at: new Date().toISOString(), original_hash: originalHash, updated_at: new Date().toISOString() }).eq("id", doc.id);
  await audit(db, doc.id, "Document sent", { detail: `SHA-256 ${originalHash}` });
  const sent = await inviteRound(db, { ...doc, status: "sent" }, signers);
  if (doc.contact_id) await logEvent(doc.master_plan_id, doc.contact_id, "note", `Sent for signature: ${doc.title}`, { esign: doc.id }, db).catch(() => null);
  return { ok: true, sent };
}

/**
 * Send a document again, any time. Out for signature: a fresh private link goes to whoever is waiting (the old link stops
 * working), optionally to a corrected email address for that one signer. Signed: the signed copy is emailed again.
 */
export async function resendDocument(db: Db, doc: Doc, signers: Signer[], opts: { signerId?: string | null; email?: string | null }): Promise<{ ok: true; sent: number; to: string[] } | { ok: false; error: string }> {
  const email = String(opts.email || "").trim().toLowerCase();
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "That email address doesn't look right." };
  const brand = await brandFor(db, doc.master_plan_id);
  if (doc.status === "completed") {
    if (!doc.final_path) return { ok: false, error: "There's no signed copy to send yet." };
    const { data: f } = await db.storage.from(PORTAL_BUCKET).download(doc.final_path);
    if (!f) return { ok: false, error: "The signed copy couldn't be read." };
    const bytes = Buffer.from(await f.arrayBuffer());
    const fileName = `${doc.title.replace(/[^A-Za-z0-9 _-]+/g, "").trim().slice(0, 80) || "signed"} (signed).pdf`;
    const pick = opts.signerId ? signers.filter((s) => s.id === opts.signerId) : signers;
    const to = email ? [email] : Array.from(new Set(pick.map((s) => s.email.toLowerCase())));
    let sent = 0;
    for (const addr of to) {
      const ok = await signMail(db, doc.master_plan_id, { to: addr, subject: `Signed: ${doc.title}`, heading: "Your signed copy", lines: [`Here is the signed copy of <strong>${esc(doc.title)}</strong> from ${esc(brand.name)}, with its certificate of completion attached.`], attachments: [{ filename: fileName, content: bytes.toString("base64") }] });
      await audit(db, doc.id, ok ? "Signed copy resent" : "Resending the signed copy failed", { detail: addr });
      if (ok) sent++;
    }
    return sent ? { ok: true, sent, to } : { ok: false, error: "The email couldn't be sent. Please try again in a minute." };
  }
  if (doc.status !== "sent") return { ok: false, error: "Only a document that is out for signature, or signed, can be resent." };
  const waiting = signers.filter((s) => (opts.signerId ? s.id === opts.signerId : currentRound(signers).some((r) => r.id === s.id)) && (s.status === "sent" || s.status === "viewed"));
  if (!waiting.length) return { ok: false, error: "Nobody is waiting to sign this right now." };
  if (email && waiting.length > 1) return { ok: false, error: "Choose which signer to send it to." };
  const to: string[] = [];
  let sent = 0;
  for (const s of waiting) {
    const { token, hash } = newToken();
    const addr = email || s.email;
    await db.from("sign_signers").update({ email: addr, token, token_hash: hash, status: "sent", code_hash: null, code_expires_at: null, code_attempts: 0, verified_at: null }).eq("id", s.id);
    if (email && email !== s.email.toLowerCase()) await audit(db, doc.id, "Signer's email changed", { signerId: s.id, detail: `${s.email} to ${email}` });
    const ok = await inviteMail(db, doc, { name: s.name, email: addr }, token, brand.name);
    await audit(db, doc.id, ok ? "Sent again" : "Sending again failed", { signerId: s.id, detail: addr });
    if (ok) { sent++; to.push(addr); }
  }
  return sent ? { ok: true, sent, to } : { ok: false, error: "The email couldn't be sent. Please try again in a minute." };
}

/**
 * The account owner signs from the LC Plume dashboard without hunting for the email. The owner is already signed in to the
 * Suite as the address that signs, so that stands in for the emailed code. Returns the private signing page and the
 * cookie that tells it the identity is confirmed.
 */
export async function ownerSignNow(db: Db, doc: Doc, signers: Signer[], userEmail: string | null): Promise<{ ok: true; url: string; cookie: { name: string; value: string } } | { ok: false; error: string }> {
  if (doc.status !== "sent") return { ok: false, error: "This document isn't open for signing." };
  const me = currentRound(signers).find((s) => s.is_owner && (s.status === "sent" || s.status === "viewed" || s.status === "waiting"));
  if (!me) return { ok: false, error: "It isn't your turn to sign yet." };
  if (!userEmail || userEmail.toLowerCase() !== me.email.toLowerCase()) return { ok: false, error: `Only ${me.email} can sign this from the dashboard. Sign in as that address.` };
  const { token, hash } = newToken();
  await db.from("sign_signers").update({ token, token_hash: hash, status: "viewed", verified_at: new Date().toISOString(), code_hash: null, code_expires_at: null, code_attempts: 0 }).eq("id", me.id);
  // The signing page compares the cookie with the stored timestamp exactly as the database returns it.
  const { data: fresh } = await db.from("sign_signers").select("verified_at").eq("id", me.id).maybeSingle();
  await audit(db, doc.id, "Identity confirmed: signed in to the Suite as the signer", { signerId: me.id, detail: me.email });
  return { ok: true, url: signerUrl(token), cookie: { name: signCookieName(me.id), value: signCookieMac(me.id, String(fresh?.verified_at)) } };
}

export async function signerByToken(db: Db, token: string): Promise<{ doc: Doc; signer: Signer; signers: Signer[] } | null> {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null;
  const { createHash } = await import("crypto");
  const hash = createHash("sha256").update(`sign:${token}`).digest("hex");
  const { data: s } = await db.from("sign_signers").select(SIGNER_COLUMNS).eq("token_hash", hash).maybeSingle();
  if (!s) return null;
  const { doc, signers } = await loadDoc(db, (s as Signer).document_id);
  return doc ? { doc, signer: s as Signer, signers } : null;
}

export async function sendCode(db: Db, doc: Doc, s: Signer, ip: string | null, ua: string | null): Promise<boolean> {
  const { code, hash } = newCode(s.id);
  await db.from("sign_signers").update({ code_hash: hash, code_expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(), code_attempts: 0 }).eq("id", s.id);
  const brand = await brandFor(db, doc.master_plan_id);
  const ok = await signMail(db, doc.master_plan_id, { to: s.email, subject: `Your code to sign: ${code}`, heading: "Your signing code", lines: [`Your code to open <strong>${esc(doc.title)}</strong> from ${esc(brand.name)} is:`, `<span style="font-size:28px;letter-spacing:6px;font-weight:bold">${code}</span>`, `It works for ${CODE_MINUTES} minutes. If you didn't ask for it, you can ignore this email.`] });
  await audit(db, doc.id, "Code emailed", { signerId: s.id, ip, ua });
  return ok;
}

export async function verifyCode(db: Db, doc: Doc, s: Signer, code: string, ip: string | null, ua: string | null): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!s.code_hash || !s.code_expires_at || Date.parse(s.code_expires_at) < Date.now()) return { ok: false, error: "That code has run out. Ask for a new one." };
  if (s.code_attempts >= CODE_MAX_TRIES) return { ok: false, error: "Too many tries. Ask for a new code." };
  if (hashCode(s.id, code) !== s.code_hash) {
    await db.from("sign_signers").update({ code_attempts: s.code_attempts + 1 }).eq("id", s.id);
    await audit(db, doc.id, "Wrong code entered", { signerId: s.id, ip, ua });
    return { ok: false, error: "That code isn't right. Please check the email and try again." };
  }
  await db.from("sign_signers").update({ verified_at: new Date().toISOString(), code_hash: null, code_attempts: 0, status: s.status === "sent" ? "viewed" : s.status }).eq("id", s.id);
  await audit(db, doc.id, "Identity confirmed by emailed code", { signerId: s.id, ip, ua });
  return { ok: true };
}

export async function signDocument(db: Db, doc: Doc, s: Signer, sig: { type: "typed" | "drawn"; text: string | null; image: string | null }, ip: string | null, ua: string | null) {
  const now = new Date().toISOString();
  const brand = await brandFor(db, doc.master_plan_id);
  await db.from("sign_signers").update({ status: "signed", consented_at: s.consented_at || now, signed_at: now, signature_type: sig.type, signature_text: sig.text, signature_image: sig.image, ip, user_agent: ua }).eq("id", s.id);
  await audit(db, doc.id, "Agreed to sign electronically", { signerId: s.id, ip, ua, detail: consentText(brand.name) });
  await audit(db, doc.id, `Signed (${sig.type} signature)`, { signerId: s.id, ip, ua, detail: `${s.name} <${s.email}>` });
  const { signers } = await loadDoc(db, doc.id);
  if (allSigned(signers)) return completeDocument(db, doc.id);
  await inviteRound(db, doc, signers);
  return "signed";
}

export async function declineDocument(db: Db, doc: Doc, s: Signer, reason: string, ip: string | null, ua: string | null) {
  await db.from("sign_signers").update({ status: "declined", decline_reason: reason.slice(0, 500) || null, ip, user_agent: ua }).eq("id", s.id);
  await db.from("sign_documents").update({ status: "declined", updated_at: new Date().toISOString() }).eq("id", doc.id);
  await audit(db, doc.id, "Declined", { signerId: s.id, ip, ua, detail: reason.slice(0, 500) || null });
  const { data: plan } = await db.from("client_master_plans").select("client_email").eq("id", doc.master_plan_id).maybeSingle();
  if (plan?.client_email) await signMail(db, doc.master_plan_id, { to: String(plan.client_email), subject: `Declined: ${doc.title}`, heading: `${s.name} declined to sign`, lines: [`<strong>${esc(s.name)}</strong> declined <strong>${esc(doc.title)}</strong>.`, reason ? `Their reason: ${esc(reason)}` : "They didn't give a reason."], button: { label: "Open Agreements", url: `${APP()}/agreements?doc=${doc.id}` } });
}

/** Everyone signed: seal the PDF (document + signature page + certificate), store it and its hash, email copies. */
export async function completeDocument(db: Db, docId: string): Promise<string> {
  const loaded = await loadDoc(db, docId);
  const { signers } = loaded;
  if (!loaded.doc || loaded.doc.final_path) return "already sealed";
  const doc = await linkContact(db, loaded.doc, signers);
  const now = new Date().toISOString();
  await audit(db, doc.id, "Completed: everyone signed");
  const [{ data: evs }, brand] = await Promise.all([db.from("sign_events").select("event, signer_id, ip, at").eq("document_id", doc.id).order("at"), brandFor(db, doc.master_plan_id)]);
  const nameOf = new Map(signers.map((s) => [s.id, `${s.name} <${s.email}>`]));
  let original: Uint8Array | null = null;
  if (doc.source === "upload" && doc.file_path && /\.pdf$/i.test(doc.file_name || doc.file_path)) {
    const { data: f } = await db.storage.from(PORTAL_BUCKET).download(doc.file_path);
    if (f) original = new Uint8Array(await f.arrayBuffer());
  }
  const bytes = await sealPdf({
    id: doc.id,
    title: doc.title,
    business: brand.name,
    body: original ? null : doc.body,
    original,
    originalHash: doc.original_hash || "",
    signers: signers.map((s) => ({ name: s.name, email: s.email, signedAt: s.signed_at || now, ip: s.ip, type: s.signature_type || "typed", text: s.signature_text, image: s.signature_image })),
    events: ((evs ?? []) as { event: string; signer_id: string | null; ip: string | null; at: string }[]).map((e) => ({ at: e.at, event: e.event, who: e.signer_id ? nameOf.get(e.signer_id) ?? null : null, ip: e.ip })),
    completedAt: now,
    consentText: consentText(brand.name),
  });
  const finalHash = sha256(bytes);
  const path = `${doc.master_plan_id}/signed/${doc.id}.pdf`;
  await db.storage.from(PORTAL_BUCKET).upload(path, Buffer.from(bytes), { contentType: "application/pdf", upsert: true });
  await db.from("sign_documents").update({ status: "completed", completed_at: now, final_path: path, final_hash: finalHash, updated_at: now }).eq("id", doc.id);
  const fileName = `${doc.title.replace(/[^A-Za-z0-9 _-]+/g, "").trim().slice(0, 80) || "signed"} (signed).pdf`;
  const attachment = [{ filename: fileName, content: Buffer.from(bytes).toString("base64") }];
  const { data: plan } = await db.from("client_master_plans").select("client_email").eq("id", doc.master_plan_id).maybeSingle();
  const to = Array.from(new Set([...signers.map((s) => s.email.toLowerCase()), String(plan?.client_email || "").toLowerCase()].filter(Boolean)));
  for (const email of to) await signMail(db, doc.master_plan_id, { to: email, subject: `Signed: ${doc.title}`, heading: "Everyone has signed", lines: [`<strong>${esc(doc.title)}</strong> is signed by everyone. Your copy is attached, with a certificate of completion.`, "Keep it for your records."], attachments: attachment });
  await audit(db, doc.id, "Signed copy emailed to everyone", { detail: `SHA-256 ${finalHash}` });
  if (doc.contact_id) await logEvent(doc.master_plan_id, doc.contact_id, "note", `Signed by everyone: ${doc.title}`, { esign: doc.id }, db).catch(() => null);
  return "completed";
}

export async function voidDocument(db: Db, doc: Doc, reason: string) {
  await db.from("sign_documents").update({ status: "voided", updated_at: new Date().toISOString() }).eq("id", doc.id);
  // Old links stop working at once.
  const { signers } = await loadDoc(db, doc.id);
  for (const s of signers) await db.from("sign_signers").update({ token: null, token_hash: newToken().hash }).eq("id", s.id);
  await audit(db, doc.id, "Voided by the sender", { detail: reason || null });
}

/** Daily: a gentle reminder after 3 days without signing (then every 3 days), and documents past their date expire. */
export async function runSignReminders(db: Db): Promise<{ reminded: number; expired: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: old } = await db.from("sign_documents").select("id").eq("status", "sent").lt("expires_on", today);
  for (const d of (old ?? []) as { id: string }[]) {
    await db.from("sign_documents").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", d.id);
    await audit(db, d.id, "Expired before everyone signed");
  }
  const cutoff = new Date(Date.now() - 3 * 86_400_000).toISOString();
  const { data: docs } = await db.from("sign_documents").select(DOC_COLUMNS).eq("status", "sent").lt("sent_at", cutoff).limit(200);
  let reminded = 0;
  for (const doc of (docs ?? []) as Doc[]) {
    const { signers } = await loadDoc(db, doc.id);
    for (const s of currentRound(signers).filter((x) => x.status === "sent" || x.status === "viewed")) {
      if (s.last_reminded_at && s.last_reminded_at > cutoff) continue;
      // The same private link as before (it still works), so an earlier email isn't broken.
      const { data: t } = await db.from("sign_signers").select("token").eq("id", s.id).maybeSingle();
      const token = String(t?.token || "");
      if (!token) continue;
      await db.from("sign_signers").update({ last_reminded_at: new Date().toISOString() }).eq("id", s.id);
      const brand = await brandFor(db, doc.master_plan_id);
      const ok = await signMail(db, doc.master_plan_id, { to: s.email, subject: `Reminder: please sign ${doc.title}`, heading: "A gentle reminder", lines: [`Hi ${esc(s.name.split(" ")[0])}, ${esc(brand.name)} is waiting on your signature for <strong>${esc(doc.title)}</strong>.`], button: { label: "Review and sign", url: signerUrl(token) } });
      await audit(db, doc.id, ok ? "Reminder sent" : "Reminder failed", { signerId: s.id });
      if (ok) reminded++;
    }
  }
  return { reminded, expired: (old ?? []).length };
}
