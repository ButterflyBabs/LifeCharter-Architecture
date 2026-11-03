import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { logEvent } from "@/lib/crm";
import { aiClient, extractJson } from "@/lib/ai/client";
import { resolveAiConfig } from "@/lib/ai/config";
import { memberAiGate } from "@/lib/ai/memberCap";
import { volantAccount } from "@/lib/volantServer";
import { buildCoachCopy, buildCoachCopyHtml, buildPrompt, cleanReport, templateByKey, templateName, VOLANT_MAX_TRANSCRIPT } from "@/lib/volant";
import { openMailboxes } from "@/lib/mailboxes";
import { isHousePlan } from "@/lib/housePlan";
import { HOUSE_PORTAL_LOGO, HOUSE_PORTAL_NAME, brandFor } from "@/lib/portal";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// LC Volant: make a report. { templateKey, transcript, title?, date?, contactId?, recordingId?, consent: true } -> one AI call on the
// account's own key, the report saved (with the transcript) and, when a contact was picked, a line on their timeline.
// Nothing becomes a task here: each action item waits for its own Approve on the page.
export async function POST(request: Request) {
  const a = await volantAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const db = createServerClient();
  // "Write it again from the whole transcript": reuse the transcript, template, name, date and contact of a report already made.
  type Prior = { transcript: string | null; title: string; session_date: string; contact_id: string | null; template_key: string };
  let from = null as Prior | null;
  if (str(b.fromReportId, 60)) {
    const { data } = await db.from("volant_reports").select("transcript, title, session_date, contact_id, template_key").eq("id", str(b.fromReportId, 60)).eq("master_plan_id", a.planId).maybeSingle();
    if (!data) return NextResponse.json({ error: "That report could not be found." }, { status: 404 });
    from = data as Prior;
  }
  const t = templateByKey(str(b.templateKey, 60) || from?.template_key || "");
  if (!t) return NextResponse.json({ error: "Pick a template first." }, { status: 400 });
  if (b.consent !== true && !from) return NextResponse.json({ error: "Tick the box to confirm everyone agreed to be recorded." }, { status: 400 });
  const rawText = typeof b.transcript === "string" && b.transcript ? b.transcript : from?.transcript ?? "";
  const cleaned = rawText.replace(/\u0000/g, "").trim();
  // The whole transcript is used, never a clipped part: one too long to read in one go is refused so it can be split, not silently cut.
  if (cleaned.length > VOLANT_MAX_TRANSCRIPT) return NextResponse.json({ error: `This transcript is longer than one report can read (about ${Math.round(VOLANT_MAX_TRANSCRIPT / 6).toLocaleString("en-US")} words). Split it into two and write a report for each.` }, { status: 400 });
  const transcript = cleaned;
  if (transcript.length < 200) return NextResponse.json({ error: "Paste or upload the transcript first (it looks too short to make a report)." }, { status: 400 });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(b.date, 10)) ? str(b.date, 10) : from?.session_date ?? new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });

  let contactId: string | null = null;
  let contactName = "";
  const wantContact = str(b.contactId, 60) || from?.contact_id || "";
  if (wantContact) {
    const { data: c } = await db.from("seq_contacts").select("id, first_name, last_name, email").eq("id", wantContact).eq("master_plan_id", a.planId).maybeSingle();
    if (!c) return NextResponse.json({ error: "That contact could not be found." }, { status: 400 });
    contactId = c.id as string;
    contactName = [c.first_name, c.last_name].filter(Boolean).join(" ") || String(c.email || "");
  }

  const { key } = await resolveAiConfig();
  const overCap = await memberAiGate(key);
  if (overCap) return overCap;
  if (!key) return NextResponse.json({ needsKey: true, error: "Add your AI key in Settings > AI first (the same one your assistant uses), then try again." }, { status: 400 });

  const { data: settings } = await db.from("volant_settings").select("template_names, copy_new_reports").eq("master_plan_id", a.planId).maybeSingle();
  const tName = templateName(t, settings?.template_names as Record<string, string> | null);
  const title = str(b.title, 160) || (from ? `${from.title} (whole transcript)` : "") || (contactName ? `${tName} with ${contactName}` : tName);
  const { system, user, clipped } = buildPrompt(t, { title, date, contactName, transcript });

  try {
    const ai = aiClient(key, { timeout: 110000 });
    const completion = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: 6000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch {
      parsed = {};
    }
    const report = cleanReport(parsed, t, clipped, undefined, contactName);
    if (!report.sections.some((x) => x.content) && !report.action_items.length) return NextResponse.json({ error: "The report came back empty. Try again." }, { status: 502 });

    const who = await sessionUser().catch(() => null);
    const now = new Date().toISOString();
    const { data: row, error } = await db
      .from("volant_reports")
      .insert({ master_plan_id: a.planId, template_key: t.key, title, session_date: date, contact_id: contactId, transcript, report, consent_at: now, created_by: who?.id ?? null })
      .select("id")
      .single();
    if (error || !row) {
      console.error("POST /api/volant/report insert:", error?.message);
      return NextResponse.json({ error: "The report was written but couldn't be saved. Try again." }, { status: 500 });
    }
    // The owner's own full copy, to their own inbox, as the report is written (on unless they turned it off in Names). Never stops the report.
    if (settings?.copy_new_reports !== false) {
      try {
        const boxes = await openMailboxes();
        const box = boxes.find((x) => x.provider === "microsoft") ?? boxes[0];
        if (box?.email) {
          const mine = buildCoachCopy(report, { title, date: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), contactName, link: `${new URL(request.url).origin}/volant?report=${row.id}`, sentTo: null });
          let status: "sent" | "failed" = "sent";
          const origin = new URL(request.url).origin;
          const house = await isHousePlan(a.planId, db);
          const b0 = house ? null : await brandFor(db, a.planId).catch(() => null);
          const brand = house ? { name: HOUSE_PORTAL_NAME, logoUrl: `${origin}${HOUSE_PORTAL_LOGO}` } : { name: b0?.name || "Your coach", logoUrl: b0?.logo ? (b0.logo.startsWith("http") ? b0.logo : `${origin}${b0.logo}`) : null };
          const mineHtml = buildCoachCopyHtml(report, { title, date: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), contactName, link: `${origin}/volant?report=${row.id}`, sentTo: null }, brand);
          try {
            if (box.provider === "microsoft") await microsoft.sendEmail(box.token, { to: box.email, subject: mine.subject, body: mine.text, html: mineHtml });
            else await google.sendEmail(box.token, { to: box.email, subject: mine.subject, body: mine.text, html: mineHtml });
          } catch (e) {
            status = "failed";
            console.error("volant copy to owner:", e instanceof Error ? e.message : e);
          }
          await db.from("volant_reports").update({ report: { ...report, copied: { at: new Date().toISOString(), to: box.email, status } } }).eq("id", row.id);
        }
      } catch (e) {
        console.error("volant copy to owner:", e instanceof Error ? e.message : e);
      }
    }
    // A recording turned into this report stops showing in the bell as waiting.
    if (str(b.recordingId, 60)) await db.from("volant_recordings").update({ used_at: now }).eq("id", str(b.recordingId, 60)).eq("master_plan_id", a.planId);
    if (contactId) await logEvent(a.planId, contactId, "note", `LC Volant report: ${title}`, { volant_report_id: row.id }, db).catch(() => {});
    return NextResponse.json({ id: row.id });
  } catch (e) {
    console.error("POST /api/volant/report:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't write the report. Try again in a minute." }, { status: 502 });
  }
}
