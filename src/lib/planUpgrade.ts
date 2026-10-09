// Plan upgrades: when a paying client moves up a plan in Stripe, three things happen —
//   1. the client gets an email right away (you've been upgraded, and the prorated amount if Stripe has one),
//   2. Babs and Operations get an alert to reach out within 3 business days,
//   3. the client is enrolled in the "plan-upgrade-check-in" sequence (one email the next morning).
// The whole thing is behind the app_settings flag plan_upgrade_emails_on (off until the wording is approved),
// so with the flag off the webhook behaves exactly as it did before.

import { createServerClient } from "@/lib/supabase/server";
import { enrolContact, ownerMasterPlanId } from "@/lib/sequences/engine";

type Db = ReturnType<typeof createServerClient>;

export const PLAN_RANK: Record<string, number> = { starter: 1, growth: 2, vip: 3 };
const PLAN_NAME: Record<string, string> = { starter: "Starter", growth: "Growth", vip: "VIP" };

export const isUpgrade = (from: string | null | undefined, to: string | null | undefined) =>
  !!from && !!to && (PLAN_RANK[to] ?? 0) > (PLAN_RANK[from] ?? 99);

export async function planUpgradeEmailsOn(db: Db): Promise<boolean> {
  const { data } = await db.from("app_settings").select("value").eq("key", "plan_upgrade_emails_on").maybeSingle();
  return String(data?.value ?? "").toLowerCase() === "true";
}

const FROM = "AmiLynne Carroll <hello@lccommandsuite.com>";
const REPLY_TO = "support@lccommandsuite.com";
const BABS = "amilynne@amilynnecarroll.com";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const shell = (inner: string) =>
  `<!doctype html><html><body style="margin:0;background:#FAF8F3"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px"><table width="560" style="max-width:560px;background:#fff;border-radius:12px;padding:28px;font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#0F1A38"><tr><td>${inner}</td></tr></table></td></tr></table></body></html>`;

async function send(to: string | string[], subject: string, html: string, bcc?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, bcc, reply_to: REPLY_TO, subject, html }),
  });
  if (!res.ok) console.error("plan-upgrade email:", res.status, await res.text().catch(() => ""));
  return res.ok;
}

export function clientUpgradeEmail(firstName: string, toPlan: string, amount: string | null) {
  const planName = PLAN_NAME[toPlan] ?? toPlan;
  const money = amount
    ? `Your card on file was charged the prorated difference for the rest of this billing period: <b>${esc(amount)}</b>. After that, your plan renews at the ${esc(planName)} rate.`
    : `The prorated difference for the rest of this billing period will show on your card on file. After that, your plan renews at the ${esc(planName)} rate.`;
  const subject = `You've been upgraded to ${planName}`;
  const html = shell(`<p>Hi ${esc(firstName || "there")},</p>
<p>Your LifeCharter Command Suite plan is now <b>${esc(planName)}</b>, and everything that comes with it is open to you.</p>
<p>${money}</p>
<p>Someone from our team will reach out within the next 3 business days to help you get the most from your new plan. If you have a question before then, just reply to this email.</p>
<p>Head up - Wings out,</p>
<p>AmiLynne "Babs" Carroll<br>Executive, Alignment Architect, and Chief Travel Partner<br>LifeCharter by AmiLynne Carroll</p>`);
  return { subject, html };
}

export async function notifyPlanUpgrade(db: Db, i: { userId: string; fromPlan: string; toPlan: string; amount: string | null }) {
  const { data: prof } = await db.from("profiles").select("email, full_name").eq("id", i.userId).maybeSingle();
  if (!prof?.email) return;
  const first = (prof.full_name || "").trim().split(/\s+/)[0] || "";
  const toName = PLAN_NAME[i.toPlan] ?? i.toPlan;
  const fromName = PLAN_NAME[i.fromPlan] ?? i.fromPlan;

  // 1. The client, right away.
  const c = clientUpgradeEmail(first, i.toPlan, i.amount);
  await send(prof.email, c.subject, c.html, BABS);

  // 2. Babs and Operations: reach out within 3 business days.
  const { data: ops } = await db.from("app_settings").select("value").eq("key", "plan_upgrade_ops_email").maybeSingle();
  const to = [BABS, String(ops?.value || "").trim()].filter((v, n, a) => v && a.indexOf(v) === n);
  await send(
    to,
    `Plan upgrade: ${prof.full_name || prof.email} moved from ${fromName} to ${toName}`,
    shell(`<p><b>${esc(prof.full_name || prof.email)}</b> (${esc(prof.email)}) just upgraded from <b>${esc(fromName)}</b> to <b>${esc(toName)}</b>.${i.amount ? ` Prorated charge: ${esc(i.amount)}.` : ""}</p>
<p>Please reach out to them within 3 business days. They have already received their upgrade email, and tomorrow morning they get a check-in email.</p>`),
  );

  // 3. The next-morning check-in (an inactive draft sequence sends nothing, so it only goes once it is switched on).
  try {
    const house = await ownerMasterPlanId();
    if (house) await enrolContact({ masterPlanId: house, sequenceKey: "plan-upgrade-check-in", email: prof.email, firstName: first, source: "plan-upgrade", tags: ["plan-upgrade"] });
  } catch (e) {
    console.error("plan-upgrade enrol:", e);
  }
}
