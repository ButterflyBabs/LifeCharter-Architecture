import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { provisionAccountForEmail } from "@/lib/provisionAccount";
import { logEvent } from "@/lib/crm";
import { retagContact } from "@/lib/dmPipeline";
import { zonedToUtcISO } from "@/lib/tz";
import { crmAccount } from "../../crm/guard";

export const dynamic = "force-dynamic";

// Pre-Founder: one press after a "yes" on the 1:1 (Babs only). Creates their Command Suite account
// at the VIP level, emails them a link to set their password, tags and notes their contact card, and
// leaves a task to set up billing before the six free months end. No card is taken now (Babs, 2026-10-05).
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FREE_MONTHS = 6;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  if (!a.isArchitect) return NextResponse.json({ error: "This page is private." }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  const contactId = typeof b.contactId === "string" ? b.contactId : "";
  const db = createServerClient();
  const { data: c } = /^[0-9a-f-]{36}$/i.test(contactId)
    ? await db.from("seq_contacts").select("id, email, first_name, last_name").eq("id", contactId).eq("master_plan_id", a.planId).maybeSingle()
    : { data: null };
  if (!c?.email) return NextResponse.json({ error: "Pick the person first." }, { status: 400 });
  const email = (c.email as string).toLowerCase();
  const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ") || null;

  let isNewAccount = false;
  try {
    ({ isNewAccount } = await provisionAccountForEmail(email, "vip", fullName));
  } catch (e) {
    console.error("[pre-founder] provision failed:", e);
    return NextResponse.json({ error: "Their account couldn't be created. Nothing was emailed." }, { status: 500 });
  }

  // A link that signs them in and lets them choose their own password.
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: link } = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: `${APP_URL}/auth/callback?next=/reset-password` } });
  const loginUrl = link?.properties?.action_link ?? null;

  let emailed = false;
  const key = process.env.RESEND_API_KEY;
  if (loginUrl && key) {
    const first = (c.first_name as string | null) || "";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "AmiLynne Carroll <hello@lccommandsuite.com>",
        to: email,
        reply_to: "support@lccommandsuite.com",
        subject: "Your LifeCharter Command Suite login",
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;max-width:560px;color:#0F1A38">
<p>${first ? `Hi ${esc(first)},` : "Hi there,"}</p>
<p>Welcome, Pre-Founder. Your LifeCharter Command Suite account is ready.</p>
<p>Press the button below to choose your password and sign in. The link works once and expires after an hour; if it has expired, use "Forgot password" on the sign-in page with this email address and a fresh one comes to you.</p>
<p style="margin:22px 0"><a href="${esc(loginUrl)}" style="display:inline-block;background:#0F1A38;color:#E9D7A9;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none">Choose my password and sign in</a></p>
<p>Your first step inside is <strong>Set up Suite</strong>, which guides you through everything in order. After that, sign in any time at <a href="${APP_URL}/login">${APP_URL.replace("https://", "")}/login</a>.</p>
<p>Questions? Just reply to this email.</p>
<p>Head up - Wings out,<br><br>AmiLynne "Babs" Carroll<br>Executive, Alignment Architect, and Chief Travel Partner<br>LifeCharter by AmiLynne Carroll</p></div>`,
      }),
    }).catch(() => null);
    emailed = Boolean(res?.ok);
    if (res && !res.ok) console.error("[pre-founder] login email failed:", res.status, await res.text().catch(() => ""));
  }

  await retagContact(db as never, a.planId, c.id as string, ["pre-founder", "pre-founder-login-issued"], ["needs-login"]).catch(() => {});
  const now = new Date();
  const ends = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + FREE_MONTHS, now.getUTCDate()));
  const endsDay = ends.toISOString().slice(0, 10);
  const remindDay = new Date(ends.getTime() - 14 * 86_400_000).toISOString().slice(0, 10);
  const nice = ends.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  await logEvent(a.planId, c.id as string, "manual", `Pre-Founder login issued${emailed ? " and emailed" : ""}: six free months to ${nice}`, { isNewAccount, freeUntil: endsDay }, db).catch(() => {});
  await db.from("tasks").insert({
    master_plan_id: a.planId,
    title: `Pre-Founder billing: set up $497/mo for ${fullName || email} (six free months end ${nice})`.slice(0, 250),
    description: "No card was taken when their login was issued. Take their card and start billing before the free months end.",
    status: "backlog",
    priority: "high",
    due_at: zonedToUtcISO(remindDay, "23:59", "America/Denver"),
    due_has_time: false,
    time_kind: "deadline",
    dimension_finance: true,
  });
  return NextResponse.json({ ok: true, isNewAccount, emailed, loginUrl, email, freeUntil: endsDay });
}
