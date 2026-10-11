import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { IB_FORM_ID } from "@/lib/investorAccess";
import { hashCode, newCode } from "@/lib/investorAccessNode";
import { renderStep } from "@/lib/sequences/render";

export const dynamic = "force-dynamic";

const HOUSE = "acc142bf-68d5-4d44-97dc-f25b00a3cef1";
const CAMPAIGN_KEY = "investor-access-approved";

// Alignment Architect only. approve: a new personal code (replaces any earlier one) and, if asked, the email from the
// "INVESTOR ACCESS - APPROVED" campaign in Campaigns & Broadcasts (its wording is edited there; it only sends while
// the campaign is ON, and every send is logged on it). deny / revoke: no access. One person at a time, all hers.
export async function POST(request: Request) {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as { email?: string; action?: string; send?: boolean };
  const email = (b.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Missing email." }, { status: 400 });
  const db = createServerClient();

  // The person must really have asked: an entry from the request form.
  const { data: subs } = await db.from("crm_submissions").select("data").eq("form_id", IB_FORM_ID).order("created_at", { ascending: false }).limit(300);
  const sub = (subs ?? []).map((s) => s.data as Record<string, string>).find((d) => (d.email || "").toLowerCase() === email);
  if (!sub) return NextResponse.json({ error: "No request from that email." }, { status: 404 });

  if (b.action === "deny" || b.action === "revoke") {
    const status = b.action === "deny" ? "denied" : "revoked";
    await db.from("investor_access").upsert({ email, name: sub.name || "", company: sub.company || "", status, code_hash: null, code_salt: null, code_v: null, decided_at: new Date().toISOString() }, { onConflict: "email" });
    return NextResponse.json({ ok: true, status });
  }
  if (b.action !== "approve") return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const code = newCode();
  const h = hashCode(code);
  const { error } = await db.from("investor_access").upsert(
    { email, name: sub.name || "", company: sub.company || "", status: "approved", code_hash: h.hash, code_salt: h.salt, code_v: h.v, decided_at: new Date().toISOString() },
    { onConflict: "email" }
  );
  if (error) return NextResponse.json({ error: "It did not save. Try again." }, { status: 500 });
  if (!b.send) return NextResponse.json({ ok: true, code, emailed: false, status: "approved" });

  // The email, from the campaign.
  const { data: seq } = await db.from("sequences").select("id, name, brand, from_name, from_email, reply_to, active").eq("master_plan_id", HOUSE).eq("key", CAMPAIGN_KEY).maybeSingle();
  if (!seq) return NextResponse.json({ ok: true, code, emailed: false, warning: "The investor email campaign was not found, so nothing was emailed. Give them the code yourself." });
  if (!seq.active) return NextResponse.json({ ok: true, code, emailed: false, warning: "Approved. The email campaign is still OFF (it is a draft), so nothing was emailed. Read it in Campaigns & Broadcasts and turn it ON, or give them the code yourself." });
  const { data: step } = await db.from("sequence_steps").select("id, subject, preview, body, button_label, button_url").eq("sequence_id", seq.id).order("position").limit(1).maybeSingle();
  const key = process.env.RESEND_API_KEY;
  const { data: contact } = await db.from("seq_contacts").select("id, first_name, unsubscribed").eq("master_plan_id", HOUSE).ilike("email", email).maybeSingle();
  if (!step || !key || !contact) return NextResponse.json({ ok: true, code, emailed: false, warning: "Approved, but the email could not be prepared. Give them the code yourself." });
  if (contact.unsubscribed) return NextResponse.json({ ok: true, code, emailed: false, warning: "This person has unsubscribed from your emails, so none was sent. Give them the code yourself." });

  const first = (contact.first_name as string | null) || (sub.name || "").trim().split(/\s+/)[0] || null;
  const r = renderStep({
    brand: seq.brand as string,
    subject: step.subject as string,
    preview: step.preview as string | null,
    body: (step.body as string).replace(/\[access code\]/gi, code),
    buttonLabel: step.button_label as string | null,
    buttonUrl: step.button_url as string | null,
    contact: { id: contact.id as string, first_name: first },
  });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${seq.from_name} <${seq.from_email}>`,
      reply_to: seq.reply_to || undefined,
      to: email,
      subject: r.subject,
      html: r.html,
      text: r.text,
    }),
  }).catch(() => null);
  const out = res ? ((await res.json().catch(() => ({}))) as { id?: string }) : {};
  const sent = Boolean(res?.ok);

  // Log it on the campaign so its results show in Campaigns & Broadcasts.
  const today = new Date().toISOString().slice(0, 10);
  const { data: enr } = await db
    .from("sequence_enrollments")
    .upsert({ sequence_id: seq.id, contact_id: contact.id, status: "completed", source: "investor-access", start_date: today, completed_at: new Date().toISOString() }, { onConflict: "sequence_id,contact_id" })
    .select("id")
    .single();
  if (enr) {
    await db.from("sequence_sends").delete().eq("enrollment_id", enr.id).eq("step_id", step.id);
    await db.from("sequence_sends").insert({ enrollment_id: enr.id, step_id: step.id, status: sent ? "sent" : "failed", resend_id: out.id ?? null, error: sent ? null : "send failed", sent_at: sent ? new Date().toISOString() : null });
  }
  if (sent) await db.from("investor_access").update({ emailed_at: new Date().toISOString() }).eq("email", email);
  return NextResponse.json({ ok: true, code, emailed: sent, status: "approved", ...(sent ? {} : { warning: "The email did not send. Give them the code yourself." }) });
}
