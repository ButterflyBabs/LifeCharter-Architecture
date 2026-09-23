import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Password-reset request for lccommandsuite.com (Command Suite and the
// Collective). We mint the recovery token ourselves and email a link to
// /auth/confirm, instead of Supabase's built-in reset email, because:
//   • Supabase's default (PKCE) link only works in the same browser that
//     asked for it — open the email on a phone and it "expires".
//   • /auth/confirm verifies only when the person clicks a button, so
//     Outlook/Gmail link scanners can't use the link up first.
//   • The Supabase project's own reset email and Site URL stay untouched for
//     the other app that shares this project.
// Always answers "ok" so it never reveals whether an email has an account.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recent = new Map<string, number[]>();

function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  recent.set(key, hits);
  return hits.length > max;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function POST(req: Request) {
  const ok = NextResponse.json({ ok: true });
  let email = "";
  try {
    email = String((await req.json()).email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(`ip:${ip}`, 10, 15 * 60_000) || limited(`email:${email}`, 3, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes and try again." }, { status: 429 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEnv = process.env.COMMUNITY_EMAIL_FROM;
  if (!resendKey || !fromEnv) {
    console.error("forgot-password: RESEND_API_KEY / COMMUNITY_EMAIL_FROM not set");
    return NextResponse.json({ error: "Password reset email isn't available right now." }, { status: 503 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.admin.generateLink({ type: "recovery", email });
  if (error || !data?.properties?.hashed_token) {
    // No such account (or a transient failure): say nothing different.
    if (error && !/not found|no user/i.test(error.message)) console.error("forgot-password generateLink:", error.message);
    return ok;
  }

  const base = new URL(req.url).origin;
  const link = `${base}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&next=/reset-password`;
  const address = fromEnv.match(/<([^>]+)>/)?.[1] ?? fromEnv;
  const name = (data.user?.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  const html = `<!doctype html><html><body style="margin:0;background:#F8F5F0;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5F0;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:18px;padding:28px;border:1px solid #E9E2D3">
    <tr><td style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#A8873F;font-family:Arial,sans-serif">LifeCharter</td></tr>
    <tr><td style="font-size:24px;color:#1F315B;padding:8px 0 10px">Reset your password</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#3A4462">
      ${name ? `Hi ${esc(name)},<br><br>` : ""}We received a request to reset the password for your LifeCharter account. Click below to choose a new one. This link works once and expires in an hour.
    </td></tr>
    <tr><td style="padding:22px 0"><a href="${link}" style="display:inline-block;background:#D4AF63;color:#0F1A38;font-family:Arial,sans-serif;font-weight:700;padding:13px 24px;border-radius:10px;text-decoration:none">Choose a new password</a></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:12.5px;line-height:1.6;color:#8A8FA0">If you didn't ask for this, you can ignore this email — your password won't change.</td></tr>
  </table></td></tr></table></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `LifeCharter <${address}>`,
      to: email,
      subject: "Reset your LifeCharter password",
      html,
      text: `Reset your LifeCharter password: ${link}\n\nThis link works once and expires in an hour. If you didn't ask for this, you can ignore this email.`,
    }),
  });
  if (!res.ok) {
    console.error("forgot-password email:", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "We couldn't send the email just now. Please try again in a minute." }, { status: 502 });
  }
  return ok;
}
