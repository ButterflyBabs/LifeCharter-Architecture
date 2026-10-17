import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { logEvent } from "@/lib/crm";
import { aiClient, extractJson } from "@/lib/ai/client";
import { resolveAiConfig } from "@/lib/ai/config";
import { memberAiGate } from "@/lib/ai/memberCap";
import { volantAccount } from "@/lib/volantServer";
import { buildPrompt, cleanReport, templateByKey, templateName, VOLANT_MAX_TRANSCRIPT } from "@/lib/volant";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// LC Volant: make a report. { templateKey, transcript, title?, date?, contactId?, consent: true } -> one AI call on the
// account's own key, the report saved (with the transcript) and, when a contact was picked, a line on their timeline.
// Nothing becomes a task here: each action item waits for its own Approve on the page.
export async function POST(request: Request) {
  const a = await volantAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const t = templateByKey(str(b.templateKey, 60));
  if (!t) return NextResponse.json({ error: "Pick a template first." }, { status: 400 });
  if (b.consent !== true) return NextResponse.json({ error: "Tick the box to confirm everyone agreed to be recorded." }, { status: 400 });
  const transcript = typeof b.transcript === "string" ? b.transcript.replace(/\u0000/g, "").trim().slice(0, VOLANT_MAX_TRANSCRIPT) : "";
  if (transcript.length < 200) return NextResponse.json({ error: "Paste or upload the transcript first (it looks too short to make a report)." }, { status: 400 });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(b.date, 10)) ? str(b.date, 10) : new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });

  const db = createServerClient();
  let contactId: string | null = null;
  let contactName = "";
  if (str(b.contactId, 60)) {
    const { data: c } = await db.from("seq_contacts").select("id, first_name, last_name, email").eq("id", str(b.contactId, 60)).eq("master_plan_id", a.planId).maybeSingle();
    if (!c) return NextResponse.json({ error: "That contact could not be found." }, { status: 400 });
    contactId = c.id as string;
    contactName = [c.first_name, c.last_name].filter(Boolean).join(" ") || String(c.email || "");
  }

  const { key } = await resolveAiConfig();
  const overCap = await memberAiGate(key);
  if (overCap) return overCap;
  if (!key) return NextResponse.json({ needsKey: true, error: "Add your AI key in Settings > AI first (the same one your assistant uses), then try again." }, { status: 400 });

  const { data: settings } = await db.from("volant_settings").select("template_names").eq("master_plan_id", a.planId).maybeSingle();
  const tName = templateName(t, settings?.template_names as Record<string, string> | null);
  const title = str(b.title, 160) || (contactName ? `${tName} with ${contactName}` : tName);
  const { system, user, clipped } = buildPrompt(t, { title, date, contactName, transcript });

  try {
    const ai = aiClient(key, { timeout: 110000 });
    const completion = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: 4000,
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
    const report = cleanReport(parsed, t, clipped);
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
    if (contactId) await logEvent(a.planId, contactId, "note", `LC Volant report: ${title}`, { volant_report_id: row.id }, db).catch(() => {});
    return NextResponse.json({ id: row.id });
  } catch (e) {
    console.error("POST /api/volant/report:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't write the report. Try again in a minute." }, { status: 502 });
  }
}
