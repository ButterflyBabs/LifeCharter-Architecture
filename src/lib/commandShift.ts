import { createServerClient } from "@/lib/supabase/server";

// Bridge from The Command Shift (21-Day Challenge) into Command Suite (approved by Babs 2026-09-27).
// The Challenge app saves nine structured answers to cs_outputs (same login system, same database).
// A client imports them with one tap; they become their "Command Shift" answers in the Alignment
// Profile (assessment_type "command_shift"), are read by their AI assistant and plan drafts, and
// fill three empty Marketing Plan sections. Nothing the client already wrote is overwritten.
//
// Mirror of DAY_OUTPUT in command-shift-app lib/content.ts — keep the keys in step.
export const COMMAND_SHIFT_OUTPUTS: { key: string; day: number; label: string; planSection?: string }[] = [
  { key: "mission_line", day: 2, label: "Your mission line" },
  { key: "command_audit", day: 3, label: "Your Command Audit: two lowest areas" },
  { key: "true_north", day: 5, label: "Your True North (this season)" },
  { key: "offer", day: 8, label: "Your core offer", planSection: "offers_promise" },
  { key: "revenue_friction", day: 9, label: "Your #1 revenue friction" },
  { key: "first_system", day: 10, label: "The system you built" },
  { key: "brand_voice", day: 11, label: "Your brand voice", planSection: "brand_voice" },
  { key: "positioning", day: 12, label: "Your positioning line", planSection: "positioning" },
  { key: "operating_intention", day: 18, label: "Your operating intention" },
];

export const COMMAND_SHIFT_TYPE = "command_shift";

export type CommandShiftAnswer = { key: string; day: number; label: string; text: string };

function textOf(row: { value_text: string | null; value_json: unknown }) {
  if (row.value_text?.trim()) return row.value_text.trim();
  if (row.value_json && typeof row.value_json === "object") {
    return Object.values(row.value_json as Record<string, unknown>)
      .map((v) => (typeof v === "string" ? v : Array.isArray(v) ? v.join(", ") : ""))
      .filter(Boolean)
      .join(" · ")
      .trim();
  }
  return "";
}

/** What this person wrote in the Challenge (empty list if they never did it). */
export async function challengeAnswers(userId: string): Promise<CommandShiftAnswer[]> {
  const supabase = createServerClient();
  const { data } = await supabase.from("cs_outputs").select("key, value_text, value_json").eq("user_id", userId);
  const byKey = new Map(((data ?? []) as { key: string; value_text: string | null; value_json: unknown }[]).map((r) => [r.key, textOf(r)]));
  return COMMAND_SHIFT_OUTPUTS.filter((o) => byKey.get(o.key)).map((o) => ({ key: o.key, day: o.day, label: o.label, text: byKey.get(o.key)! }));
}

/** Their Command Shift answers as saved in Command Suite (after import, including their edits). */
export async function savedAnswers(masterPlanId: string): Promise<CommandShiftAnswer[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("unified_client_responses")
    .select("question_id, answer_text")
    .eq("master_plan_id", masterPlanId)
    .eq("assessment_type", COMMAND_SHIFT_TYPE);
  const byKey = new Map(((data ?? []) as { question_id: string; answer_text: string | null }[]).map((r) => [r.question_id, r.answer_text ?? ""]));
  return COMMAND_SHIFT_OUTPUTS.filter((o) => byKey.has(o.key)).map((o) => ({ key: o.key, day: o.day, label: o.label, text: byKey.get(o.key)! }));
}

/** Copies the Challenge answers in. Returns how many answers and plan sections were filled. */
export async function importCommandShift(userId: string, masterPlanId: string): Promise<{ answers: number; planSections: number }> {
  const supabase = createServerClient();
  const answers = await challengeAnswers(userId);
  if (!answers.length) return { answers: 0, planSections: 0 };
  const now = new Date().toISOString();

  // Keep anything already saved here (they may have edited it); only add what's missing.
  const already = new Set((await savedAnswers(masterPlanId)).map((a) => a.key));
  const rows = answers
    .filter((a) => !already.has(a.key))
    .map((a) => ({
      master_plan_id: masterPlanId,
      user_id: userId,
      assessment_type: COMMAND_SHIFT_TYPE,
      question_id: a.key,
      question_text: a.label,
      section_name: `Day ${a.day}`,
      section_type: "command_shift",
      answer_text: a.text,
      answer_value: { source: "command_shift", day: a.day },
      answered_at: now,
    }));
  if (rows.length) {
    const { error } = await supabase.from("unified_client_responses").upsert(rows, { onConflict: "master_plan_id,assessment_type,question_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }

  // Fill matching Marketing Plan sections only when they are empty.
  let planSections = 0;
  for (const a of answers) {
    const section = COMMAND_SHIFT_OUTPUTS.find((o) => o.key === a.key)?.planSection;
    if (!section) continue;
    const { data: existing } = await supabase
      .from("plan_sections")
      .select("id, content, status")
      .eq("master_plan_id", masterPlanId)
      .eq("plan_type", "marketing")
      .eq("section_key", section)
      .maybeSingle();
    const empty = !existing || (!String(existing.content ?? "").trim() && (existing.status ?? "empty") === "empty");
    if (!empty) continue;
    const content = `${a.text}\n\n(From your Command Shift, Day ${a.day}.)`;
    const write = existing?.id
      ? await supabase.from("plan_sections").update({ content, status: "drafted", source: "client", updated_at: now }).eq("id", existing.id)
      : await supabase.from("plan_sections").insert({ master_plan_id: masterPlanId, plan_type: "marketing", section_key: section, content, status: "drafted", source: "client", updated_at: now });
    if (!write.error) planSections += 1;
  }

  return { answers: rows.length, planSections };
}
