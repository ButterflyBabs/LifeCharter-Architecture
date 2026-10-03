import type { SupabaseClient } from "@supabase/supabase-js";
import { WELCOME_EMAILS, INCLUDED_BY_PLAN, type WelcomeEmail } from "@/lib/email/welcomeContent";
import { readAccountKey } from "@/lib/ai/config";

// Sends the Command Suite new-client welcome sequence (copy in welcomeContent.ts). Email 1 goes
// out when the account is provisioned; the rest go from the daily cron /api/cron/welcome-sequence.
// Off until WELCOME_EMAILS_ENABLED=true, so nothing sends before Babs approves the copy.
// Each email is claimed in lccs_welcome_log before sending, so it can never go out twice.

export function welcomeEmailsEnabled() {
  return process.env.WELCOME_EMAILS_ENABLED === "true";
}

// The email as it will go out: the built-in copy, with any saved edit (subject, preview, body) on top.
// The schedule (day) always comes from the built-in definition.
export async function effectiveWelcomeEmail(supabase: SupabaseClient, key: string): Promise<(WelcomeEmail & { edited: boolean }) | null> {
  const base = WELCOME_EMAILS.find((x) => x.key === key);
  if (!base) return null;
  const { data } = await supabase.from("lccs_welcome_email_overrides").select("subject, preview, body").eq("email_key", key).maybeSingle();
  if (!data) return { ...base, edited: false };
  return { ...base, subject: String(data.subject || base.subject), preview: String(data.preview ?? base.preview), body: String(data.body || base.body), edited: true };
}

export type WelcomeClient = { userId: string; email: string; name: string | null; planId: string | null; enrolledAt: string };

const SIGN_OFF = "Head up - Wings out\nBabs 🦋";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
function inline(s: string) {
  return esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,)])/g, '<a href="$1" style="color:#2E7C83">$1</a>');
}

// Plain text with "- " bullets and "1. " steps -> simple, email-safe HTML.
function toHtml(text: string) {
  const P = 'style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46"';
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      const bullets = lines.filter((l) => /^- /.test(l));
      const steps = lines.filter((l) => /^\d+\. /.test(l));
      if (bullets.length && bullets.length === lines.length - (/^- /.test(lines[0]) ? 0 : 1)) {
        const head = /^- /.test(lines[0]) ? "" : `<p ${P.replace("14px", "6px")}>${inline(lines[0])}</p>`;
        return `${head}<ul style="margin:0 0 14px;padding-left:22px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${bullets.map((b) => `<li style="margin-bottom:4px">${inline(b.slice(2))}</li>`).join("")}</ul>`;
      }
      if (steps.length === lines.length) {
        return `<ol style="margin:0 0 14px;padding-left:22px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${steps.map((b) => `<li style="margin-bottom:6px">${inline(b.replace(/^\d+\. /, ""))}</li>`).join("")}</ol>`;
      }
      return `<p ${P}>${lines.map(inline).join("<br>")}</p>`;
    })
    .join("");
}

export function renderWelcomeEmail(e: WelcomeEmail, c: WelcomeClient) {
  const first = (c.name || "").trim().split(/\s+/)[0] || "";
  const due = new Date(new Date(c.enrolledAt).getTime() + 14 * 86400_000).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/Denver" });
  const body = e.body
    .replace("{{GREETING}}", first ? `Hi ${first},` : "Hi there,")
    .replace("{{INCLUDED}}", INCLUDED_BY_PLAN[(c.planId || "").toLowerCase()] || INCLUDED_BY_PLAN.starter)
    .replace("{{REVIEW_DUE}}", due);
  const text = `${body}\n\n${SIGN_OFF}`;
  const html = `<!doctype html><html><body style="margin:0;background:#FAF8F3">
  <span style="display:none;max-height:0;overflow:hidden">${esc(e.preview)}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:18px;padding:30px;border:1px solid #E6DDCB">
    <tr><td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B8923F;font-weight:bold;padding-bottom:14px">LifeCharter Command Suite</td></tr>
    <tr><td>${toHtml(body)}</td></tr>
    <tr><td style="font-family:Georgia,serif;font-size:17px;font-style:italic;color:#1a2b4a;padding-top:8px">Head up - Wings out<br>Babs 🦋</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#7F8894;padding-top:22px">You're receiving this because you joined LifeCharter Command Suite. Questions? Reply, or write to support@amilynnecarroll.com.</td></tr>
  </table></td></tr></table></body></html>`;
  return { subject: e.subject, text, html };
}

// Claim, then send. Returns true only if this call sent the email.
export async function sendWelcomeEmail(supabase: SupabaseClient, c: WelcomeClient, key: string): Promise<boolean> {
  if (!welcomeEmailsEnabled()) return false;
  const e = await effectiveWelcomeEmail(supabase, key);
  const apiKey = process.env.RESEND_API_KEY;
  if (!e || !apiKey || !c.email) return false;
  const { data: claimed, error: claimErr } = await supabase
    .from("lccs_welcome_log")
    .upsert({ user_id: c.userId, email_key: key }, { onConflict: "user_id,email_key", ignoreDuplicates: true })
    .select("user_id");
  if (claimErr || !claimed?.length) return false;
  const { subject, text, html } = renderWelcomeEmail(e, c);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Babs at LifeCharter Command Suite <support@lccommandsuite.com>",
        to: c.email,
        reply_to: "support@amilynnecarroll.com",
        subject,
        html,
        text,
      }),
    });
    if (res.ok) return true;
    console.error("welcome email:", key, res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.error("welcome email:", key, (err as Error).message);
  }
  // Release the claim so the next run can retry.
  await supabase.from("lccs_welcome_log").delete().eq("user_id", c.userId).eq("email_key", key);
  return false;
}

// What the client has already done, for skipping emails that no longer apply. Read without a
// session (the cron runs as the service role), scoped to this one client's plan.
export async function clientSetupState(supabase: SupabaseClient, userId: string, masterPlanId: string) {
  // Brain and Soul are counted separately: one combined query was capped at 500 rows, and Brain alone has 535.
  const answered = (type: "brain" | "soul") => supabase.from("unified_client_responses").select("id", { count: "exact", head: true }).eq("master_plan_id", masterPlanId).eq("assessment_type", type);
  const [{ count: brainRows }, { count: soulRows }, { data: plan }, { data: integ }, { data: g }, { data: m }, { data: ws }, key] = await Promise.all([
    answered("brain"),
    answered("soul"),
    supabase.from("client_master_plans").select("domain_scores, profit_score").eq("id", masterPlanId).maybeSingle(),
    supabase.from("client_integrations").select("provider, api_key").eq("master_plan_id", masterPlanId).eq("provider", "poststream"),
    supabase.from("google_credentials").select("owner_id").eq("owner_id", userId).limit(1),
    supabase.from("microsoft_credentials").select("owner_id").eq("owner_id", userId).limit(1),
    supabase.from("workspaces").select("website").eq("master_plan_id", masterPlanId).order("is_default", { ascending: false }).limit(1).maybeSingle(),
    readAccountKey(userId).catch(() => ""),
  ]);
  const types = new Set<string>([...((brainRows ?? 0) > 0 ? ["brain"] : []), ...((soulRows ?? 0) > 0 ? ["soul"] : [])]);
  const ds = (plan?.domain_scores as Record<string, unknown> | null) || null;
  const profit = Boolean((ds && Object.keys(ds).length) || plan?.profit_score);
  const tools = Boolean(g?.length || m?.length || ((integ ?? []) as { api_key: string | null }[]).some((r) => (r.api_key || "").trim()));
  const ai = Boolean(key);
  const assessments = types.has("brain") && types.has("soul") && profit;
  return { ai, assessments, tools, website: Boolean(((ws?.website as string) || "").trim()), setupComplete: ai && assessments && tools };
}


// "Send me a test" from the editor: one email to the person who asked, with sample details. Not logged, not counted.
export async function sendWelcomeTest(e: WelcomeEmail, to: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return false;
  const { subject, text, html } = renderWelcomeEmail(e, { userId: "test", email: to, name: "Eloise", planId: "starter", enrolledAt: new Date().toISOString() });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Babs at LifeCharter Command Suite <support@lccommandsuite.com>", to, reply_to: "support@amilynnecarroll.com", subject: `[Test] ${subject}`, html, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
