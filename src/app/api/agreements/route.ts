import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { PORTAL_BUCKET } from "@/lib/portal";
import { fillPlaceholders, newToken, placeholders } from "@/lib/esign";
import { DOC_COLUMNS, SIGNER_COLUMNS, audit, brandFor, loadDoc, ownerSignNow, resendDocument, sendDocument, signMail, signerUrl, voidDocument, type Doc } from "@/lib/esignServer";
import { currentRound } from "@/lib/esign";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Clients & Sales › LC Plume (task 1072), the owner's side.
//   GET            -> documents with signer progress, templates (starter + own), offers
//   GET ?id=<doc>  -> one document with its signers and audit trail
//   POST { action: "create" | "save" | "send" | "resend" | "sign-now" | "remind" | "void" | "duplicate" | "delete" | "download" | "save-template" | "delete-template", ... }
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const uuid = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);
const today = () => new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const id = uuid(new URL(request.url).searchParams.get("id"));
  if (id) {
    const { doc, signers } = await loadDoc(db, id);
    if (!doc || doc.master_plan_id !== a.planId) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const { data: events } = await db.from("sign_events").select("event, signer_id, detail, ip, at").eq("document_id", id).order("at");
    return NextResponse.json({ doc, signers: signers.map(({ code_hash: _c, signature_image: _i, ...s }) => s), events: events ?? [], placeholders: placeholders(doc.body || "") }, { headers: { "Cache-Control": "no-store" } });
  }
  const [{ data: docs }, { data: signers }, { data: tpls }, { data: offers }] = await Promise.all([
    db.from("sign_documents").select("id, title, kind, status, source, contact_id, sent_at, completed_at, created_at, updated_at").eq("master_plan_id", a.planId).order("updated_at", { ascending: false }).limit(300),
    db.from("sign_signers").select("document_id, name, status, order_no, is_owner, sign_documents!inner(master_plan_id)").eq("sign_documents.master_plan_id", a.planId),
    db.from("sign_templates").select("id, key, name, kind, review_note, master_plan_id, updated_at").or(`master_plan_id.is.null,master_plan_id.eq.${a.planId}`).order("name"),
    db.from("sales_offers").select("id, name, price").eq("master_plan_id", a.planId).order("sort_order"),
  ]);
  type Sg = { document_id: string; name: string; status: string; order_no: number; is_owner: boolean };
  const byDoc = new Map<string, Sg[]>();
  for (const s of (signers ?? []) as Sg[]) byDoc.set(s.document_id, [...(byDoc.get(s.document_id) ?? []), s]);
  // "Needs your signature": the document is out and it is the owner's turn.
  const needsMe = (docId: string, status: string) => status === "sent" && currentRound(byDoc.get(docId) ?? []).some((s) => s.is_owner && (s.status === "sent" || s.status === "viewed"));
  return NextResponse.json(
    {
      // Voided agreements sit at the bottom; everything else is alphabetical by title so one is easy to find.
      docs: ((docs ?? []) as { id: string; title: string; status: string; updated_at: string }[])
        .map((d) => ({ ...d, signers: (byDoc.get(d.id) ?? []).map((s) => ({ name: s.name, status: s.status })), needsMe: needsMe(d.id, d.status) }))
        .sort((x, y) => Number(x.status === "voided") - Number(y.status === "voided") || x.title.localeCompare(y.title, undefined, { sensitivity: "base", numeric: true }) || y.updated_at.localeCompare(x.updated_at)), templates: ((tpls ?? []) as { master_plan_id: string | null }[]).map((t) => ({ ...t, starter: !t.master_plan_id })), offers: offers ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(b.action || "");
  const now = new Date().toISOString();

  if (action === "create") {
    let body = "";
    let title = str(b.title, 160);
    let kind = b.kind === "proposal" ? "proposal" : "agreement";
    const tplId = uuid(b.templateId);
    if (tplId) {
      const { data: t } = await db.from("sign_templates").select("name, kind, body, master_plan_id").eq("id", tplId).maybeSingle();
      if (t && (!t.master_plan_id || t.master_plan_id === a.planId)) {
        body = String(t.body);
        title = title || String(t.name);
        kind = String(t.kind);
      }
    }
    // Fill what the Suite already knows: their business, today's date, and the client's name and email.
    const brand = await brandFor(db, a.planId);
    const contactId = uuid(b.contactId);
    const { data: c } = contactId ? await db.from("seq_contacts").select("id, first_name, last_name, email").eq("id", contactId).eq("master_plan_id", a.planId).maybeSingle() : { data: null };
    const clientName = c ? [c.first_name, c.last_name].filter(Boolean).join(" ") : "";
    body = fillPlaceholders(body, { "Business name": brand.name, "Your business": brand.name, Date: today(), "Client name": clientName, "Client email": String(c?.email || "") });
    const { data, error } = await db.from("sign_documents").insert({ master_plan_id: a.planId, title: title || (kind === "proposal" ? "Proposal" : "Agreement"), kind, body, contact_id: c?.id ?? null, created_by: a.userEmail }).select("id").single();
    if (error || !data) return NextResponse.json({ error: "Couldn't create it." }, { status: 500 });
    if (c && EMAIL.test(String(c.email || ""))) await db.from("sign_signers").insert({ document_id: data.id, order_no: 1, name: clientName || String(c.email), email: String(c.email).toLowerCase(), token_hash: newToken().hash });
    await audit(db, data.id, "Created", { detail: tplId ? "from a template" : "blank" });
    return NextResponse.json({ ok: true, id: data.id });
  }

  if (action === "save-template") {
    const name = str(b.name, 120);
    const body = str(b.body, 60000);
    if (!name || !body) return NextResponse.json({ error: "Give the template a name and some text." }, { status: 400 });
    const { data } = await db.from("sign_templates").insert({ master_plan_id: a.planId, name, kind: b.kind === "proposal" ? "proposal" : "agreement", body }).select("id").single();
    return NextResponse.json({ ok: true, id: data?.id });
  }
  if (action === "delete-template") {
    await db.from("sign_templates").delete().eq("id", uuid(b.templateId) || "").eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }

  const id = uuid(b.id);
  const { data: d } = id ? await db.from("sign_documents").select(DOC_COLUMNS).eq("id", id).eq("master_plan_id", a.planId).maybeSingle() : { data: null };
  const doc = d as Doc | null;
  if (!doc) return NextResponse.json({ error: "That document could not be found." }, { status: 404 });

  if (action === "save") {
    if (doc.status !== "draft") return NextResponse.json({ error: "Only a draft can be changed. Void it and make a copy to change it." }, { status: 409 });
    const signersIn = (Array.isArray(b.signers) ? b.signers : []).map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}));
    const signers = signersIn.map((x, i) => ({ name: str(x.name, 120), email: str(x.email, 160).toLowerCase(), order_no: Math.min(10, Math.max(1, Math.floor(Number(x.order) || i + 1))) })).filter((x) => x.name || x.email);
    const bad = signers.find((x) => !x.name || !EMAIL.test(x.email));
    if (bad) return NextResponse.json({ error: "Each signer needs a name and an email address." }, { status: 400 });
    if (signers.length > 10) return NextResponse.json({ error: "Up to 10 signers." }, { status: 400 });
    const amount = Number(b.amount);
    const offerId = uuid(b.offerId);
    const { data: offer } = offerId ? await db.from("sales_offers").select("id").eq("id", offerId).eq("master_plan_id", a.planId).maybeSingle() : { data: null };
    await db
      .from("sign_documents")
      .update({
        title: str(b.title, 160) || doc.title,
        kind: b.kind === "proposal" ? "proposal" : "agreement",
        body: doc.source === "upload" && doc.file_path && /\.pdf$/i.test(doc.file_name || "") ? doc.body : str(b.body, 60000),
        message: str(b.message, 2000) || null,
        expires_on: /^\d{4}-\d{2}-\d{2}$/.test(String(b.expiresOn || "")) ? b.expiresOn : null,
        amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null,
        offer_id: offer?.id ?? null,
        owner_signs: Boolean(b.ownerSigns),
        contact_id: uuid(b.contactId) ?? doc.contact_id,
        updated_at: now,
      })
      .eq("id", doc.id);
    // Signers are replaced as a set (a draft has no links out yet). The owner signs last when asked to.
    await db.from("sign_signers").delete().eq("document_id", doc.id);
    // Every row carries is_owner, so a batch that adds the owner too is saved in one go.
    const rows = signers.map((x) => ({ document_id: doc.id, name: x.name, email: x.email, order_no: x.order_no, is_owner: false, token_hash: newToken().hash }));
    if (b.ownerSigns) {
      const { data: plan } = await db.from("client_master_plans").select("client_email, client_name").eq("id", a.planId).maybeSingle();
      const ownerEmail = String(a.userEmail || plan?.client_email || "").toLowerCase();
      const brand = await brandFor(db, a.planId);
      if (EMAIL.test(ownerEmail) && !rows.some((r) => r.email === ownerEmail)) rows.push({ document_id: doc.id, name: str(b.ownerName, 120) || String(plan?.client_name || brand.name), email: ownerEmail, order_no: Math.max(0, ...rows.map((r) => r.order_no)) + 1, token_hash: newToken().hash, is_owner: true } as (typeof rows)[number]);
    }
    if (rows.length) await db.from("sign_signers").insert(rows);
    return NextResponse.json({ ok: true });
  }

  if (action === "send") {
    const { signers } = await loadDoc(db, doc.id);
    const r = await sendDocument(db, doc, signers);
    return r.ok ? NextResponse.json({ ok: true, sent: r.sent }) : NextResponse.json({ error: r.error }, { status: 400 });
  }
  if (action === "resend") {
    const { signers } = await loadDoc(db, doc.id);
    const r = await resendDocument(db, doc, signers, { signerId: uuid(b.signerId), email: str(b.email, 160) });
    return r.ok ? NextResponse.json({ ok: true, sent: r.sent, to: r.to }) : NextResponse.json({ error: r.error }, { status: 400 });
  }
  if (action === "sign-now") {
    const { signers } = await loadDoc(db, doc.id);
    const r = await ownerSignNow(db, doc, signers, a.userEmail);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    const res = NextResponse.json({ ok: true, url: r.url });
    res.cookies.set(r.cookie.name, r.cookie.value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 6 });
    return res;
  }
  if (action === "remind") {
    if (doc.status !== "sent") return NextResponse.json({ error: "Only a document out for signature can be reminded." }, { status: 409 });
    const { data: s } = await db.from("sign_signers").select(SIGNER_COLUMNS + ", token").eq("document_id", doc.id).in("status", ["sent", "viewed"]);
    let n = 0;
    for (const x of (s ?? []) as unknown as { id: string; name: string; email: string; token: string | null }[]) {
      if (!x.token) continue;
      const ok = await signMail(db, a.planId, { to: x.email, subject: `Reminder: please sign ${doc.title}`, heading: "A gentle reminder", lines: [`Hi ${x.name.split(" ")[0]}, this is a reminder to sign <strong>${doc.title.replace(/</g, "&lt;")}</strong>.`], button: { label: "Review and sign", url: signerUrl(x.token) } });
      await db.from("sign_signers").update({ last_reminded_at: now }).eq("id", x.id);
      await audit(db, doc.id, ok ? "Reminder sent" : "Reminder failed", { signerId: x.id });
      if (ok) n++;
    }
    return NextResponse.json({ ok: true, reminded: n });
  }
  if (action === "void") {
    if (!["sent", "declined", "expired"].includes(doc.status)) return NextResponse.json({ error: "Only a document that was sent can be voided." }, { status: 409 });
    await voidDocument(db, doc, str(b.reason, 300));
    return NextResponse.json({ ok: true });
  }
  if (action === "duplicate") {
    const { signers } = await loadDoc(db, doc.id);
    const { data } = await db.from("sign_documents").insert({ master_plan_id: a.planId, title: `${doc.title} (copy)`.slice(0, 160), kind: doc.kind, source: doc.source, body: doc.body, file_path: doc.file_path, file_name: doc.file_name, contact_id: doc.contact_id, offer_id: doc.offer_id, amount: doc.amount, message: doc.message, owner_signs: doc.owner_signs, created_by: a.userEmail }).select("id").single();
    if (data && signers.length) await db.from("sign_signers").insert(signers.map((s) => ({ document_id: data.id, name: s.name, email: s.email, order_no: s.order_no, is_owner: s.is_owner, token_hash: newToken().hash })));
    if (data) await audit(db, data.id, "Created", { detail: `copy of ${doc.id}` });
    return NextResponse.json({ ok: true, id: data?.id });
  }
  if (action === "delete") {
    if (doc.status !== "draft") return NextResponse.json({ error: "Sent documents are kept for the record. Void it instead." }, { status: 409 });
    if (doc.file_path) {
      const { count } = await db.from("sign_documents").select("id", { count: "exact", head: true }).eq("file_path", doc.file_path);
      if ((count ?? 0) <= 1) await db.storage.from(PORTAL_BUCKET).remove([doc.file_path]).catch(() => null);
    }
    await db.from("sign_documents").delete().eq("id", doc.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "download") {
    if (!doc.final_path) return NextResponse.json({ error: "There's no signed copy yet." }, { status: 404 });
    const { data } = await db.storage.from(PORTAL_BUCKET).createSignedUrl(doc.final_path, 300, { download: `${doc.title.replace(/[^A-Za-z0-9 _-]+/g, "").slice(0, 80) || "signed"} (signed).pdf` });
    return NextResponse.json({ url: data?.signedUrl ?? null });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
