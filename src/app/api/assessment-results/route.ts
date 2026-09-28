import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/sequences/engine";
import { upsertContact, logEvent, EMAIL_RE } from "@/lib/crm";
import { ALIGNMENT_ARCHITECT_EMAIL } from "@/lib/authz";

export const dynamic = "force-dynamic";

// The Executive Business Assessment (Command Suite landing page) posts here:
// the person lands in the Suite CRM (tagged executive-assessment) with their
// scores on their timeline, gets their results by email, and Babs gets a copy.
// Replaces the Global Control lccs_execassess tag + workflow (Babs, 2026-09-28).

const REC: Record<string, { title: string; body: string; label: string; url: string }> = {
  consultation: {
    title: "Your best next step: an Executive Consultation",
    body: "You have the fundamentals and you're ready now. A short consultation is the fastest way to map your build and find the right fit.",
    label: "Book my Executive Consultation",
    url: "https://lccommandsuite.com/schedule/website",
  },
  masterclass: {
    title: "Your best next step: the free “From Hustle to Command” MasterClass",
    body: "You're ready to move. See the full method, and the Command Suite that runs it, then get started on the spot.",
    label: "Save my MasterClass seat",
    url: "https://us02web.zoom.us/meeting/register/qHumbeSKSP-U3gsNsBHYQw",
  },
  challenge: {
    title: "Your best next step: the free 21-Day Executive Challenge",
    body: "A daily, guided on-ramp that turns these openings into momentum, and shows you what it feels like to run your business with structure, one day at a time.",
    label: "Join the 21-Day Challenge",
    url: "https://command-shift-landing.vercel.app/",
  },
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const score = (v: unknown) => (typeof v === "number" && v >= 1 && v <= 5 ? Math.round(v) : null);

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const email = str(b.email, 200).toLowerCase();
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  const firstName = str(b.firstName, 80);
  const lastName = str(b.lastName, 80);
  const overall = typeof b.overall === "number" ? Math.max(0, Math.min(100, Math.round(b.overall))) : null;
  const rec = REC[String(b.recommendation)] ? String(b.recommendation) : "challenge";
  const scores = (Array.isArray(b.scores) ? b.scores : []).slice(0, 20).map((s: Record<string, unknown>) => ({ label: str(s?.label, 60), score: score(s?.score) })).filter((s: { label: string; score: number | null }) => s.label && s.score);
  const gaps = (Array.isArray(b.gapDetails) ? b.gapDetails : Array.isArray(b.topGaps) ? b.topGaps.map((l: unknown) => ({ label: l })) : [])
    .slice(0, 3)
    .map((g: Record<string, unknown>) => ({ label: str(g?.label, 60), reason: str(g?.reason, 400), score: score(g?.score) }))
    .filter((g: { label: string }) => g.label);

  const planId = await ownerMasterPlanId();
  if (!planId) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
  const db = createServerClient();
  const contact = await upsertContact({ masterPlanId: planId, email, firstName: firstName || null, lastName: lastName || null, source: "executive-assessment", tags: ["executive-assessment", `assessment-${rec}`] }, db);
  if (!contact) return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });

  // A double submit within 10 minutes doesn't send the results twice.
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const { data: recent } = await db.from("crm_events").select("id").eq("contact_id", contact.id).eq("kind", "form").eq("title", "Completed the Executive Business Assessment").gte("created_at", since).limit(1);
  await logEvent(planId, contact.id, "form", "Completed the Executive Business Assessment", { data: { overall: String(overall ?? ""), top_gaps: gaps.map((g: { label: string }) => g.label).join(", "), recommendation: rec, ...Object.fromEntries(scores.map((s: { label: string; score: number }) => [s.label, String(s.score)])) } }, db);
  if (recent?.length) return NextResponse.json({ ok: true, crm: "saved" });

  const key = process.env.RESEND_API_KEY;
  if (key) {
    const r = REC[rec];
    const gapHtml = gaps
      .map((g: { label: string; reason: string; score: number | null }) => `<tr><td style="padding:10px 0;border-top:1px solid #EFE6D8;font-family:Arial,sans-serif;font-size:15px;color:#2E3A46"><strong>${esc(g.label)}</strong>${g.score ? ` · ${g.score}/5` : ""}${g.reason ? `<br><span style="color:#5a6472;font-size:14px">${esc(g.reason)}</span>` : ""}</td></tr>`)
      .join("");
    const scoreHtml = scores.map((s: { label: string; score: number }) => `<tr><td style="padding:4px 12px 4px 0;font-family:Arial,sans-serif;font-size:13px;color:#5a6472">${esc(s.label)}</td><td style="padding:4px 0;font-family:Arial,sans-serif;font-size:13px;color:#1a2b4a">${"●".repeat(s.score)}${"○".repeat(5 - s.score)}</td></tr>`).join("");
    const html = `<!doctype html><html><body style="margin:0;background:#FBF8F1"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;padding:28px 12px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#fff;border-radius:18px;padding:30px;border:1px solid #EADFCF"><tr><td>
<p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a227;font-weight:bold">LifeCharter Command Suite</p>
<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#0F5B63">Your Executive Business Assessment</h1>
<p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${firstName ? `Hi ${esc(firstName)}, here` : "Here"} are your results, so you have them to come back to.</p>
${overall !== null ? `<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:40px;color:#1a2b4a">${overall}<span style="font-size:18px;color:#7a8a99"> / 100</span></p>` : ""}
${gaps.length ? `<p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7a8a99;font-weight:bold">Your biggest openings</p><table width="100%" cellpadding="0" cellspacing="0">${gapHtml}</table>` : ""}
${scoreHtml ? `<p style="margin:20px 0 6px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7a8a99;font-weight:bold">Every area</p><table cellpadding="0" cellspacing="0">${scoreHtml}</table>` : ""}
<h2 style="margin:24px 0 8px;font-family:Georgia,serif;font-size:19px;color:#0F5B63">${esc(r.title)}</h2>
<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${esc(r.body)}</p>
<p style="margin:0 0 22px"><a href="${r.url}" style="display:inline-block;background:#2E7C83;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:999px">${esc(r.label)}</a></p>
<p style="margin:0;font-family:Georgia,serif;font-size:16px;color:#1a2b4a;font-style:italic">Head up - Wings out<br>Babs 🦋</p>
<p style="margin:22px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#9aa3ad">Questions? Just reply, or write to support@amilynnecarroll.com.<br>Sacred Kaleidoscope Community LLC · 5787 S Odessa Street · Centennial, Colorado 80015</p>
</td></tr></table></td></tr></table></body></html>`;
    const send = (payload: Record<string, unknown>) =>
      fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch((e) => console.error("assessment mail:", e));
    await send({ from: "AmiLynne Carroll <hello@lccommandsuite.com>", to: email, reply_to: "support@amilynnecarroll.com", subject: `Your Executive Business Assessment results${overall !== null ? `: ${overall}/100` : ""}`, html });
    await send({
      from: "LifeCharter Command Suite <reminders@lccommandsuite.com>",
      to: ALIGNMENT_ARCHITECT_EMAIL,
      reply_to: email,
      subject: `New assessment: ${[firstName, lastName].filter(Boolean).join(" ") || email} scored ${overall ?? "?"} (${rec})`,
      html: `<p style="font-family:Arial,sans-serif">${esc([firstName, lastName].filter(Boolean).join(" ") || email)} (${esc(email)}) completed the Executive Business Assessment. They were sent the copy below.</p><p style="font-family:Arial,sans-serif"><a href="https://lccommandsuite.com/contacts">Open Contacts in the Suite</a></p><hr>${html}`,
    });
  }
  return NextResponse.json({ ok: true, crm: "saved" });
}
