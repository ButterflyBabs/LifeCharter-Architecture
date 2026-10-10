import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/housePlan";

// Red-flag handling for every client's assistant (Babs, 2026-10-10; matches "Red flags, by stage" in the Team Briefing).
//   crisis       signs of serious distress: the assistant stops coaching, shares crisis resources, and a person is told
//   hardship     financial hardship: never suggest spending or debt; a personal conversation is flagged
//   frustration  repeated frustration with the Suite: flagged for support
//   misleading   asks for fake testimonials or fear-based claims: declined with the values (prompt only, no alert)
// Detection is deliberately conservative (specific phrases, not single words) so ordinary talk like "this deadline is
// killing me" does not trigger it. The alert never includes what the client wrote.

export type RedFlag = "crisis" | "hardship" | "frustration" | "misleading";

const PATTERNS: Record<RedFlag, RegExp> = {
  crisis:
    /\b(kill(ing)? myself|end(ing)? my (own )?life|take my (own )?life|suicid(e|al)|want(ed)? to die|wish i (was|were) dead|don['’]?t want to (be here|live|be alive|exist)|no (reason|point) (in|to) liv(e|ing)|hurt(ing)? myself|harm(ing)? myself|self[- ]?harm|better off (dead|without me))\b/i,
  hardship:
    /\b(can['’]?t (afford|pay) (for )?(my |the |our )?(rent|mortgage|bills|groceries|food|payroll)|behind on (my |the )?(rent|mortgage|bills)|evict(ed|ion)|foreclos(e|ed|ure)|bankrupt(cy)?|losing (my|the|our) (house|home|business)|can['’]?t feed (my|the)|no money for (food|rent|groceries)|drowning in debt|maxed out (my |all my )?cards?|debt collectors?)\b/i,
  frustration:
    /\b(this (is|app is|suite is|thing is) (useless|garbage|terrible|broken|a waste)|waste of (my )?(time|money)|so frustrat(ed|ing)|i['’]?m (so )?(done|fed up) with (this|the suite)|nothing (works|is working)|want (a |my )?refund|cancel my (account|subscription|membership))\b/i,
  misleading:
    /\b(fake (testimonials?|reviews?)|make up (a )?(testimonials?|reviews?)|invent (a )?(testimonials?|results)|guarantee(d)? (results|income|returns)|scare (them|people)|fear[- ]based (marketing|ads?))\b/i,
};

export function detectRedFlags(text: string): RedFlag[] {
  const t = (text || "").slice(0, 6000);
  return (Object.keys(PATTERNS) as RedFlag[]).filter((k) => PATTERNS[k].test(t));
}

export const CRISIS_REPLY = `I'm really glad you told me, and I want to set the business conversation down for a moment. How you're feeling matters more than anything on your list today.

If you might hurt yourself, or you're in immediate danger, please call 911 now (or your local emergency number).
If you're in the United States, you can call or text 988 (the Suicide & Crisis Lifeline) any time, day or night, or chat at 988lifeline.org.
If you're outside the US, findahelpline.com lists free, confidential lines by country.

Is there someone close by, a friend, a family member or a neighbor, who can be with you right now? Please reach out to them. I'm an AI assistant and I can't give you the support a person can, but you deserve it.

I've also let the LifeCharter team know you may be having a hard time, so that a real person can check in with you. When you're ready, we'll pick the business back up together. There's no rush.`;

// Added to the assistant's instructions for the turn when a flag is present.
export function promptHint(flags: RedFlag[]): string {
  const parts: string[] = [];
  if (flags.includes("hardship"))
    parts.push("This client may be under financial hardship. Be warm and practical, never suggest spending money, taking on debt or paying for anything, and keep to free, low-effort next steps. Tell them a real person on the LifeCharter team can talk it through with them.");
  if (flags.includes("frustration"))
    parts.push("This client sounds frustrated with the Suite. Acknowledge it sincerely, do not get defensive, solve what you can, and tell them how to reach support (Help, then Contact Support).");
  if (flags.includes("misleading"))
    parts.push("The client is asking for something misleading (fake testimonials, invented results, guarantees or fear-based marketing). Decline kindly, say LifeCharter's values are honesty and care, and offer an honest alternative.");
  return parts.join("\n");
}

const LABEL: Record<string, string> = {
  crisis: "may be in distress: please reach out to them personally today",
  hardship: "may be under financial hardship: a personal conversation is worth having; do not sell them anything",
  frustration: "sounds frustrated with the Suite: worth a support follow-up",
  disengaged: "has not signed in for two weeks or more",
};

const APP = () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Sends one plain email to the account owner (never includes what the client wrote). */
export async function emailOwner(subject: string, htmlBody: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const db = createServerClient();
  const plan = await housePlanId(db);
  const { data: p } = plan ? await db.from("client_master_plans").select("client_email").eq("id", plan).maybeSingle() : { data: null };
  const to = (p?.client_email as string | null) || "";
  if (!to) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.TASK_REMINDER_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>",
      to,
      subject,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${htmlBody}<p style="margin-top:18px;font-size:12px;color:#7F8894">Open the client from Alignment Architect &gt; <a href="${APP()}/view-as">View as Client</a>. This alert never includes what they wrote.</p></div>`,
    }),
  }).catch(() => null);
  return Boolean(res?.ok);
}

/**
 * Screens one client message. Records and emails an alert (at most one per kind per client per day, so a long
 * conversation does not flood anyone), and says whether the assistant must answer with the fixed crisis reply.
 * The house account and the public demo are never alerted about.
 */
export async function screenMessage(planId: string | null, message: string, opts: { demo?: boolean } = {}): Promise<{ crisis: boolean; hint: string }> {
  const flags = detectRedFlags(message);
  const out = { crisis: flags.includes("crisis"), hint: promptHint(flags) };
  if (!planId || opts.demo) return out;
  const alertKinds = flags.filter((f): f is "crisis" | "hardship" | "frustration" => f !== "misleading");
  if (!alertKinds.length) return out;
  try {
    const db = createServerClient();
    const house = await housePlanId(db);
    if (house && house === planId) return out;
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data: recent } = await db.from("assistant_red_flags").select("kind").eq("master_plan_id", planId).gte("created_at", since);
    const had = new Set(((recent ?? []) as { kind: string }[]).map((r) => r.kind));
    const fresh = alertKinds.filter((k) => !had.has(k));
    if (!fresh.length) return out;
    const { data: plan } = await db.from("client_master_plans").select("client_name, client_email").eq("id", planId).maybeSingle();
    const who = `${esc((plan?.client_name as string) || "A client")}${plan?.client_email ? ` (${esc(plan.client_email as string)})` : ""}`;
    const now = new Date().toISOString();
    await db.from("assistant_red_flags").insert(fresh.map((kind) => ({ master_plan_id: planId, kind })));
    const urgent = fresh.includes("crisis");
    const ok = await emailOwner(
      `${urgent ? "URGENT: " : ""}Assistant flag: ${((plan?.client_name as string) || "a client")}`,
      fresh.map((k) => `<p><strong>${who}</strong> ${LABEL[k]}.</p>`).join("")
    );
    if (ok) await db.from("assistant_red_flags").update({ notified_at: now }).eq("master_plan_id", planId).in("kind", fresh).gte("created_at", since);
  } catch (e) {
    console.error("red flag alert:", e);
  }
  return out;
}

export const RED_FLAG_LABEL = LABEL;
