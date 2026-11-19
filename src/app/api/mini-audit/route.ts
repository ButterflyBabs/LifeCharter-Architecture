import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { upsertContact, logEvent } from "@/lib/crm";
import { ownerMasterPlanId } from "@/lib/sequences/engine";
import { browserContext, sendMetaEvent } from "@/lib/metaCapi";
import { DEEP_QUESTIONS, QUICK_QUESTIONS, cleanAnswers, cleanProfile, computeResult, isComplete, PROFILE_QUESTIONS, type Answers } from "@/lib/miniAudit";
import { miniAuditEmail } from "@/lib/miniAuditEmail";

export const dynamic = "force-dynamic";

// The public Mini Command Audit (lccommandsuite.com/mini-command-audit). No sign-in; the unguessable results link is the key.
//   POST { action: "submit", firstName, email, consent, profile, answers (the 24 quick answers), _utm, _eid, _page, _hp }
//        scores the quick set, saves the person to Babs's Contacts with tags, emails the results link → { token }
//   POST { action: "deepen", token, answers (the other 24) }
//        adds the deeper answers and re-scores all 48 → { ok }
//   GET  ?token=  → the saved run (profile, answers, depth, result) so the page can show it again or continue
// The results stand alone: they never touch any client's 12 business dimensions.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const newToken = () => randomBytes(18).toString("base64url");
const TAG_ALL = "mini-command-audit";

export async function GET(request: Request) {
  const token = str(new URL(request.url).searchParams.get("token"), 60);
  if (!token) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const db = createServerClient();
  const { data } = await db.from("mini_audit_runs").select("first_name, profile, answers, depth, result").eq("token", token).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ firstName: data.first_name, profile: data.profile, answers: data.answers, depth: data.depth, result: data.result });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "Something went wrong. Please reload and try again." }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (str(b._hp, 100)) return NextResponse.json({ ok: true, token: "x" }); // a bot filled the hidden field; pretend it worked
  const db = createServerClient();

  if (b.action === "deepen") {
    const token = str(b.token, 60);
    const { data: run } = await db.from("mini_audit_runs").select("id, answers, contact_id, master_plan_id, email, first_name, result").eq("token", token).maybeSingle();
    if (!run) return NextResponse.json({ error: "We couldn't find those results. Please open the link in your email again." }, { status: 404 });
    const answers: Answers = { ...((run.answers as Answers) ?? {}), ...cleanAnswers(b.answers, DEEP_QUESTIONS) };
    if (!isComplete(answers, "full")) return NextResponse.json({ error: "A few questions are still unanswered." }, { status: 400 });
    const result = computeResult(answers, "full");
    const now = new Date().toISOString();
    await db.from("mini_audit_runs").update({ answers, depth: "full", result, full_completed_at: now, updated_at: now }).eq("id", run.id);
    try {
      if (run.contact_id && run.master_plan_id) {
        const { data: c } = await db.from("seq_contacts").select("tags").eq("id", run.contact_id).maybeSingle();
        const tags = Array.from(new Set([...(((c?.tags as string[]) ?? []).filter((t) => !t.startsWith("mca-lowest-"))), `${TAG_ALL}-full`, ...result.start.map((p) => `mca-lowest-${p.key}`)]));
        await db.from("seq_contacts").update({ tags, updated_at: now }).eq("id", run.contact_id);
        await logEvent(run.master_plan_id as string, run.contact_id as string, "form", "Finished the full 48-question Mini Command Audit", { lowest: result.start.map((p) => p.name) }, db).catch(() => {});
      }
    } catch (e) {
      console.error("mini-audit deepen crm:", (e as Error).message);
    }
    return NextResponse.json({ ok: true });
  }

  if (b.action !== "submit") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const firstName = str(b.firstName, 80);
  const email = str(b.email, 200).toLowerCase();
  if (!firstName) return NextResponse.json({ error: "Please add your first name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  const answers = cleanAnswers(b.answers, QUICK_QUESTIONS);
  if (!isComplete(answers, "quick")) return NextResponse.json({ error: "A few questions are still unanswered. Please go back and finish them." }, { status: 400 });
  const profile = cleanProfile(b.profile);
  if (PROFILE_QUESTIONS.some((q) => !profile[q.key])) return NextResponse.json({ error: "Please answer the three questions about your business." }, { status: 400 });

  const result = computeResult(answers, "quick");
  const token = newToken();
  const utm: Record<string, string> = {};
  if (b._utm && typeof b._utm === "object") for (const [k, v] of Object.entries(b._utm as Record<string, unknown>)) if (/^(utm_|fbclid)/.test(k) && typeof v === "string") utm[k] = v.slice(0, 120);

  const plan = await ownerMasterPlanId().catch(() => null);
  let contactId: string | null = null;
  try {
    if (plan) {
      const tags = [TAG_ALL, ...result.start.map((p) => `mca-lowest-${p.key}`)];
      const c = await upsertContact({ masterPlanId: plan, email, firstName, source: "mini-command-audit", tags }, db);
      contactId = c?.id ?? null;
      if (c) await logEvent(plan, c.id, "form", `Finished the Mini Command Audit (quick set). Lowest: ${result.start.map((p) => p.name).join(", ") || "n/a"}. ${PROFILE_QUESTIONS.map((q) => `${profile[q.key]}`).join(" · ")}`, { profile, utm }, db).catch(() => {});
    }
  } catch (e) {
    console.error("mini-audit crm:", (e as Error).message);
  }

  const { error } = await db.from("mini_audit_runs").insert({ token, master_plan_id: plan, contact_id: contactId, first_name: firstName, email, profile, answers, depth: "quick", result, attribution: utm });
  if (error) {
    console.error("mini-audit save:", error.message);
    return NextResponse.json({ error: "We couldn't save your results just now. Please try again in a minute." }, { status: 500 });
  }

  // The results email. A failed send never fails the request: the results are on screen and saved.
  const origin = new URL(request.url).origin;
  let status = "skipped";
  let err: string | null = "the sending key is not set";
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const mail = miniAuditEmail({ name: firstName, origin, token, result });
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "AmiLynne Carroll <support@lccommandsuite.com>", to: email, reply_to: "support@lccommandsuite.com", subject: mail.subject, html: mail.html, text: mail.text }),
      });
      const out = (await res.json().catch(() => ({}))) as { message?: string };
      status = res.ok ? "sent" : "failed";
      err = res.ok ? null : (out.message || `the sending service answered ${res.status}`).slice(0, 300);
    } catch (e) {
      status = "failed";
      err = (e as Error).message.slice(0, 300);
    }
  }
  await db.from("mini_audit_runs").update({ email_status: status, email_error: err, emailed_at: new Date().toISOString() }).eq("token", token);

  await sendMetaEvent({
    eventName: "Lead",
    eventId: str(b._eid, 80) || `mca-${token}`,
    email,
    firstName,
    contentName: "mini-command-audit",
    ...browserContext(request, str(b._page, 500) || null),
  }).catch(() => {});
  return NextResponse.json({ ok: true, token, emailed: status === "sent" });
}
