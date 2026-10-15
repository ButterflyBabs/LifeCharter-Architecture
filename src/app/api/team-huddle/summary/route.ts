import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { huddleAccess } from "@/lib/teamHuddleServer";
import { aiClient, extractJson } from "@/lib/ai/client";
import { resolveAiConfig } from "@/lib/ai/config";
import { memberAiGate } from "@/lib/ai/memberCap";
import { cleanActions, cleanAgenda, cleanSummary } from "@/lib/teamHuddle";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_CHARS = 60000; // about 10,000 words: well past a 30-minute call

// The person who runs the account (and an admin they invited). Reads the saved transcript of one call and writes the summary, wins, decisions, hot topics,
// to-dos (with owner and date when said) and follow-ups, then saves them on the call. One AI call per press.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as { id?: string; via?: string };
  const a = await huddleAccess({ shared: b.via === "share" });
  if (!a || !a.manage) return NextResponse.json({ error: "not found" }, { status: 404 });
  const db = createServerClient();
  const { data: h } = await db.from("team_huddles").select("id, call_date, title, agenda, actions, transcript").eq("id", String(b.id || "")).eq("master_plan_id", a.planId).maybeSingle();
  if (!h) return NextResponse.json({ error: "not found" }, { status: 404 });
  const transcript = String(h.transcript || "").trim();
  if (transcript.length < 200) return NextResponse.json({ error: "Paste or upload the transcript first (it looks too short to summarize)." }, { status: 400 });

  const { key } = await resolveAiConfig();
  const overCap = await memberAiGate(key);
  if (overCap) return overCap;
  if (!key) return NextResponse.json({ needsKey: true, error: "Add your AI key in Settings > AI first (the same one your assistant uses), then try again." }, { status: 400 });

  const agenda = cleanAgenda(h.agenda).map((s) => `${s.title} (${s.minutes} min): ${s.items.map((i) => i.text).filter(Boolean).join(" | ")}`).join("\n");
  const open = cleanActions(h.actions).filter((x) => !x.done && x.text).map((x) => `- ${x.text}${x.owner ? ` [${x.owner}]` : ""}`).join("\n") || "(none)";
  const clipped = transcript.length > MAX_CHARS;

  const sys =
    `You write the follow-up record of a short weekly team call for a small business team. ` +
    `Use ONLY what is in the transcript; never invent names, numbers, dates or decisions. If something is unclear, leave it out. ` +
    `Write plainly and warmly, in short sentences. Owners are first names as spoken; leave "" if no owner was named. ` +
    `Dates: only when a date or a weekday was spoken; give it as YYYY-MM-DD resolved from the call date, otherwise "". ` +
    `Respond ONLY as strict JSON: {"summary": "3 to 6 sentences", "wins": [""], "decisions": [""], "hot_topics": ["topic and where it landed"], ` +
    `"action_items": [{"text": "start with a verb", "owner": "", "due": ""}], "follow_ups": ["questions or items still open for next week"]}.`;
  const user =
    `Call: ${h.title} on ${h.call_date}.\n\nThe agenda was:\n${agenda}\n\nTo-dos already on the page:\n${open}\n\n` +
    `TRANSCRIPT${clipped ? " (the first part; it was long)" : ""}:\n${transcript.slice(0, MAX_CHARS)}`;

  try {
    const ai = aiClient(key, { timeout: 100000 });
    const completion = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      max_tokens: 1800,
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
    const summary = cleanSummary(parsed);
    if (!summary.summary) return NextResponse.json({ error: "The summary came back empty. Try again." }, { status: 502 });
    await db.from("team_huddles").update({ summary, status: "done", updated_at: new Date().toISOString() }).eq("id", h.id).eq("master_plan_id", a.planId);
    return NextResponse.json({ summary, clipped });
  } catch (e) {
    console.error("POST /api/team-huddle/summary:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't write the summary. Try again in a minute." }, { status: 502 });
  }
}
