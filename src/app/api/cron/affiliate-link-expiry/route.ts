import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Affiliate product links last 365 days. Once a day this finds links that end within 30 days and emails the
// account owner and the affiliate, once per term (expiry_notified_at; renewing clears it). Same CRON_SECRET
// convention as the other crons.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.ALERT_EMAIL_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nice = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Denver" });

async function send(key: string, to: string, subject: string, html: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  return res.ok;
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ skipped: "RESEND_API_KEY not set" });

  const db = createServerClient();
  const soon = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const { data: links } = await db
    .from("affiliate_links")
    .select("id, product, code, expires_at, master_plan_id, affiliates!inner(name, email, status)")
    .eq("status", "active")
    .is("expiry_notified_at", null)
    .gt("expires_at", new Date().toISOString())
    .lte("expires_at", soon)
    .limit(200);

  let notified = 0;
  for (const l of (links ?? []) as unknown as { id: string; product: string; code: string; expires_at: string; master_plan_id: string; affiliates: { name: string; email: string | null; status: string } }[]) {
    if (l.affiliates.status !== "active") continue;
    const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", l.master_plan_id).maybeSingle();
    const { data: owner } = plan?.user_id ? await db.from("profiles").select("email, full_name").eq("id", plan.user_id).maybeSingle() : { data: null };
    const ends = nice(l.expires_at);
    const link = `${APP_URL}/r/${l.code}`;
    let ok = false;
    if (owner?.email) {
      ok = await send(
        key,
        owner.email,
        `${l.affiliates.name}'s ${l.product} link ends ${ends}`,
        `<p>${esc(l.affiliates.name)}'s <b>${esc(l.product)}</b> affiliate link (${esc(link)}) ends on <b>${esc(ends)}</b>, 30 days from now. After that date it stops crediting new sign-ups. People already credited to ${esc(l.affiliates.name)} keep their credit.</p><p>To keep it going, open <a href="${APP_URL}/affiliates">Affiliates</a>, open ${esc(l.affiliates.name)} and press Renew 365 days on the link.</p>`
      ).catch(() => false);
    }
    if (l.affiliates.email) {
      const sent = await send(
        key,
        l.affiliates.email,
        `Your ${l.product} link ends ${ends}`,
        `<p>Hi ${esc(l.affiliates.name.split(/\s+/)[0])},</p><p>Your <b>${esc(l.product)}</b> link (${esc(link)}) ends on <b>${esc(ends)}</b>. After that date it stops crediting new sign-ups to you. Anyone already credited to you stays credited.</p><p>${esc(owner?.full_name || "Your host")} can renew it for another 365 days.</p>`,
        owner?.email || undefined
      ).catch(() => false);
      ok = ok || sent;
    }
    if (ok) {
      await db.from("affiliate_links").update({ expiry_notified_at: new Date().toISOString() }).eq("id", l.id);
      notified += 1;
    }
  }
  return NextResponse.json({ due: (links ?? []).length, notified });
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
