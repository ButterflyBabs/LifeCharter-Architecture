import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { IB_FORM_ID } from "@/lib/investorAccess";
import { hashCode, newCode } from "@/lib/investorAccessNode";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Alignment Architect only. approve: new personal code (replaces any earlier one; optionally emailed with the wording
// she reviewed); deny / revoke: no access. Every decision is hers, one person at a time.
export async function POST(request: Request) {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as { email?: string; action?: string; send?: boolean; subject?: string; body?: string };
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

  let emailed = false;
  if (b.send) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return NextResponse.json({ ok: true, code, emailed: false, warning: "Approved, but email is not set up. Send the code yourself." });
    const text = String(b.body || "").replace(/\[access code\]/gi, code).replace(/\[email\]/gi, email);
    const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.65;color:#1B2433;max-width:560px">${text
      .split(/\n{2,}/)
      .map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, "<br>")}</p>`)
      .join("")}</div>`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "AmiLynne Carroll <hello@lccommandsuite.com>",
        reply_to: "amilynne@amilynnecarroll.com",
        to: email,
        subject: String(b.subject || "Your access to the LifeCharter investor documents").slice(0, 200),
        html,
        text,
      }),
    }).catch(() => null);
    emailed = Boolean(r?.ok);
    if (emailed) await db.from("investor_access").update({ emailed_at: new Date().toISOString() }).eq("email", email);
  }
  return NextResponse.json({ ok: true, code, emailed, status: "approved" });
}
