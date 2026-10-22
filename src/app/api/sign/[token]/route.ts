import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { PORTAL_BUCKET } from "@/lib/portal";
import { SIGN_AGREE, consentText, currentRound, validDrawnSignature, validTypedSignature } from "@/lib/esign";
import { audit, brandFor, declineDocument, sendCode, signCookieMac, signCookieName, signDocument, signerByToken, verifyCode } from "@/lib/esignServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// A signer's private page (task 1072): lccommandsuite.com/sign/<token>.
//   GET                                  -> where they stand; the document itself only after they confirmed the code
//   POST { action: "code" }              -> email a 6-digit code
//   POST { action: "verify", code }      -> confirm it (sets a cookie for this browser)
//   POST { action: "sign", consent: true, type, text | image }
//   POST { action: "decline", reason }
const cookieName = signCookieName;
const mac = signCookieMac;
function verifiedHere(signerId: string, verifiedAt: string | null): boolean {
  if (!verifiedAt) return false;
  const c = cookies().get(cookieName(signerId))?.value || "";
  const want = mac(signerId, verifiedAt);
  return c.length === want.length && timingSafeEqual(Buffer.from(c), Buffer.from(want));
}
const who = (req: Request) => ({ ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null, ua: req.headers.get("user-agent") });

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const db = createServerClient();
  const found = await signerByToken(db, params.token);
  if (!found) return NextResponse.json({ error: "This signing link isn't active. Please ask the sender for a new one." }, { status: 404 });
  const { doc, signer, signers } = found;
  const brand = await brandFor(db, doc.master_plan_id);
  const myTurn = currentRound(signers).some((s) => s.id === signer.id);
  const verified = verifiedHere(signer.id, signer.verified_at);
  const state = doc.status === "voided" ? "voided" : doc.status === "expired" ? "expired" : doc.status === "declined" ? "declined" : signer.status === "signed" ? (doc.status === "completed" ? "completed" : "signed") : !myTurn ? "waiting" : verified ? "ready" : "code";
  if (state === "ready" && signer.status === "sent") {
    await db.from("sign_signers").update({ status: "viewed" }).eq("id", signer.id);
    await audit(db, doc.id, "Opened the document", { signerId: signer.id, ...who(request) });
  }
  let fileUrl: string | null = null;
  if ((state === "ready" || state === "completed" || state === "signed") && verified && doc.source === "upload" && doc.file_path && /\.pdf$/i.test(doc.file_name || doc.file_path)) {
    const { data } = await db.storage.from(PORTAL_BUCKET).createSignedUrl(doc.file_path, 600);
    fileUrl = data?.signedUrl ?? null;
  }
  return NextResponse.json(
    {
      state,
      business: brand.name,
      logo: brand.logo,
      title: doc.title,
      kind: doc.kind,
      signer: { name: signer.name, email: signer.email.replace(/^(.).*(@.*)$/, "$1•••$2") },
      others: signers.filter((s) => s.id !== signer.id).map((s) => ({ name: s.name, signed: s.status === "signed" })),
      body: verified && doc.source === "written" ? doc.body : null,
      fileUrl,
      fileName: doc.file_name,
      amount: doc.amount,
      consent: consentText(brand.name),
      agree: SIGN_AGREE,
      canDownload: verified && doc.status === "completed" && Boolean(doc.final_path),
      // Where the client continues after signing (the self-serve sign-up opens their account there).
      next: signer.status === "signed" && !signer.is_owner && doc.external_ref && /^https:\/\//.test(doc.external_ref) ? doc.external_ref : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const db = createServerClient();
  const found = await signerByToken(db, params.token);
  if (!found) return NextResponse.json({ error: "This signing link isn't active." }, { status: 404 });
  const { doc, signer, signers } = found;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { ip, ua } = who(request);
  const action = String(b.action || "");

  if (action === "download") {
    if (!verifiedHere(signer.id, signer.verified_at) || doc.status !== "completed" || !doc.final_path) return NextResponse.json({ error: "Not available." }, { status: 403 });
    const { data } = await db.storage.from(PORTAL_BUCKET).createSignedUrl(doc.final_path, 300, { download: `${doc.title.replace(/[^A-Za-z0-9 _-]+/g, "").slice(0, 80) || "signed"} (signed).pdf` });
    await audit(db, doc.id, "Signed copy downloaded", { signerId: signer.id, ip, ua });
    return NextResponse.json({ url: data?.signedUrl ?? null });
  }
  if (doc.status !== "sent") return NextResponse.json({ error: "This document isn't open for signing." }, { status: 409 });
  if (!currentRound(signers).some((s) => s.id === signer.id)) return NextResponse.json({ error: "It isn't your turn to sign yet. We'll email you when it is." }, { status: 409 });

  if (action === "code") {
    if (signer.code_expires_at && Date.parse(signer.code_expires_at) - 14 * 60_000 > Date.now()) return NextResponse.json({ error: "We just sent a code. Please check your email (and spam) before asking again." }, { status: 429 });
    const ok = await sendCode(db, doc, signer, ip, ua);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "We couldn't send the code. Please try again in a minute." }, { status: 502 });
  }
  if (action === "verify") {
    const r = await verifyCode(db, doc, signer, String(b.code || ""), ip, ua);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    const { data: fresh } = await db.from("sign_signers").select("verified_at").eq("id", signer.id).maybeSingle();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookieName(signer.id), mac(signer.id, String(fresh?.verified_at)), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 6 });
    return res;
  }
  if (!verifiedHere(signer.id, signer.verified_at)) return NextResponse.json({ error: "Please confirm the code we emailed you first." }, { status: 401 });

  if (action === "sign") {
    if (b.consent !== true) return NextResponse.json({ error: "Please tick that you agree to sign electronically." }, { status: 400 });
    const type = b.type === "drawn" ? "drawn" : "typed";
    const text = typeof b.text === "string" ? b.text.trim().slice(0, 80) : "";
    const image = typeof b.image === "string" ? b.image : "";
    if (type === "typed" && !validTypedSignature(text)) return NextResponse.json({ error: "Type your full name as your signature." }, { status: 400 });
    if (type === "drawn" && !validDrawnSignature(image)) return NextResponse.json({ error: "Please draw your signature in the box." }, { status: 400 });
    const result = await signDocument(db, doc, signer, { type, text: type === "typed" ? text : null, image: type === "drawn" ? image : null }, ip, ua);
    return NextResponse.json({ ok: true, completed: result === "completed" });
  }
  if (action === "decline") {
    await declineDocument(db, doc, signer, typeof b.reason === "string" ? b.reason.trim() : "", ip, ua);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
