import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Public: "Request your invitation" on the Collective landing page. Saves the
// lead (with where it came from) and emails their personal join link with
// the current Start Here invite code, so the code never has to be published.

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

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // Honeypot: a hidden field real people never fill.
  if (clip(body.company, 200)) return NextResponse.json({ ok: true });
  const email = clip(body.email, 254).toLowerCase();
  const name = clip(body.name, 120);
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(`ip:${ip}`, 8, 15 * 60_000) || limited(`email:${email}`, 3, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many requests — please wait a few minutes and try again." }, { status: 429 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEnv = process.env.COMMUNITY_EMAIL_FROM;
  if (!resendKey || !fromEnv) {
    console.error("request-invite: RESEND_API_KEY / COMMUNITY_EMAIL_FROM not set");
    return NextResponse.json({ error: "Invitations can't be sent right now — please try again later." }, { status: 503 });
  }

  const supabase = createServerClient();
  const { data: space } = await supabase.from("cm_spaces").select("id, join_enabled").eq("slug", "start-here").maybeSingle();
  const { data: codeRow } = space ? await supabase.from("cm_space_codes").select("code").eq("space_id", space.id).maybeSingle() : { data: null };
  if (!space?.join_enabled || !codeRow?.code) {
    return NextResponse.json({ error: "The Collective isn't accepting new members right this moment — please try again soon." }, { status: 503 });
  }
  const code = String(codeRow.code).toUpperCase();

  const utm: Record<string, string> = {};
  if (body.utm && typeof body.utm === "object") {
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"]) {
      const v = clip((body.utm as Record<string, unknown>)[k], 120);
      if (v) utm[k] = v;
    }
  }
  const { data: existing } = await supabase.from("cm_invite_requests").select("id, sent_count").eq("email", email).maybeSingle();
  const row = {
    email,
    name: name || null,
    source: clip(body.source, 60) || "landing",
    utm: Object.keys(utm).length ? utm : null,
    referrer: clip(body.referrer, 500) || null,
    sent_count: ((existing?.sent_count as number) ?? 0) + 1,
    last_sent_at: new Date().toISOString(),
  };
  const { error: saveErr } = existing
    ? await supabase.from("cm_invite_requests").update({ sent_count: row.sent_count, last_sent_at: row.last_sent_at, ...(name ? { name } : {}) }).eq("id", existing.id)
    : await supabase.from("cm_invite_requests").insert(row);
  if (saveErr) console.error("request-invite save:", saveErr.message);

  const base = new URL(req.url).origin;
  const link = `${base}/join/collective?code=${encodeURIComponent(code)}`;
  const first = name.split(" ")[0];
  const address = fromEnv.match(/<([^>]+)>/)?.[1] ?? fromEnv;

  const html = `<!doctype html><html><body style="margin:0;background:#FAF8F3;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:18px;padding:30px;border:1px solid #E6DDCB">
    <tr><td style="padding-bottom:6px"><img src="${base}/collective-logo.png" width="240" alt="The LifeCharter Collective" style="display:block;width:240px;max-width:100%;height:auto;border:0"></td></tr>
    <tr><td style="font-size:27px;color:#1F2B3A;padding:8px 0 12px">Your invitation is here</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46">
      ${first ? `Hi ${esc(first)},<br><br>` : ""}Welcome. The Collective is where people living on purpose and founders leading mission-driven businesses set their intention each week, share what moved, and build alongside people who understand the work.<br><br>
      Your membership is free. Accept your invitation below — it takes about a minute.
    </td></tr>
    <tr><td style="padding:24px 0 8px"><a href="${link}" style="display:inline-block;background:#D4AF63;color:#1F2B3A;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">Accept your invitation</a></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:13.5px;color:#56616E;padding-bottom:18px">Your invite code: <strong style="letter-spacing:2px;color:#1F2B3A">${esc(code)}</strong></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:14px;line-height:1.65;color:#2E3A46;border-top:1px solid #F1EBDF;padding-top:16px">
      <strong style="color:#1F2B3A">Your first three steps</strong><br>
      1. Introduce yourself in Start Here.<br>
      2. Set this week&rsquo;s intention in your private Alignment Journal.<br>
      3. Join the next live Alignment Anchor.
    </td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#7F8894;padding-top:18px">You're receiving this because you requested an invitation at lccommandsuite.com/collective. If that wasn't you, you can ignore this email.</td></tr>
  </table></td></tr></table></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `The LifeCharter Collective <${address}>`,
      to: email,
      subject: "Your invitation to The LifeCharter Collective",
      html,
      text: `${first ? `Hi ${first},\n\n` : ""}Your invitation to The LifeCharter Collective is here. Membership is free.\n\nAccept your invitation: ${link}\nYour invite code: ${code}\n\nFirst steps: introduce yourself in Start Here, set this week's intention in your private Alignment Journal, and join the next live Alignment Anchor.`,
    }),
  });
  if (!res.ok) {
    console.error("request-invite email:", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "We couldn't send your invitation just now — please try again in a minute." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
