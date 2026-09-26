import { createServerClient } from "@/lib/supabase/server";
import { getBlueprint, sectionQuestions } from "@/lib/plans/blueprints";
import { normalizeRules } from "@/lib/social/planner";

// What an account has told Command Suite about its business and voice, as
// plain text for AI writers: its Marketing Plan (each Build-tab section's
// answers and written text, including how the owner sounds under Brand Voice &
// Story) and the Social Planner's practical rules (sign-off, word rules, …).
// Each account only ever gets its own.
export interface BusinessContext {
  text: string; // "" when the account hasn't filled anything in
  hasPlan: boolean;
  hasVoice: boolean; // a voice is described (Marketing Plan Brand Voice, or older planner voice notes)
  signOff: string;
}

const MAX_CHARS = 9000;

export interface Row {
  section_key: string;
  content: string | null;
  answers: Record<string, unknown> | null;
}

export async function loadBusinessContext(masterPlanId: string | null): Promise<BusinessContext> {
  if (!masterPlanId) return { text: "", hasPlan: false, hasVoice: false, signOff: "" };
  const supabase = createServerClient();
  const [{ data: rows }, { data: settings }] = await Promise.all([
    supabase.from("plan_sections").select("section_key, content, answers").eq("master_plan_id", masterPlanId).eq("plan_type", "marketing"),
    supabase.from("social_settings").select("rules").eq("master_plan_id", masterPlanId).maybeSingle(),
  ]);
  return buildBusinessContext((rows || []) as Row[], settings?.rules ?? null);
}

// Pure assembly, separate from loading so it can be checked without a database.
export function buildBusinessContext(rows: Row[], rules: unknown): BusinessContext {
  // Marketing Plan, in the blueprint's section order.
  const bp = getBlueprint("marketing");
  const byKey = new Map(rows.map((r) => [r.section_key, r]));
  const planParts: string[] = [];
  for (const section of bp?.sections || []) {
    const r = byKey.get(section.key);
    if (!r) continue;
    const lines = sectionQuestions(section)
      .map((q) => {
        const a = r.answers?.[q.id];
        return typeof a === "string" && a.trim() ? `- ${q.question} ${a.trim().replace(/\n+/g, "; ")}` : "";
      })
      .filter(Boolean);
    const written = (r.content || "").trim();
    if (!lines.length && !written) continue;
    planParts.push([`${section.title}:`, ...lines, ...(written ? [written] : [])].join("\n"));
  }

  const voiceLines: string[] = [];
  let signOff = "";
  if (rules) {
    const r = normalizeRules(rules as never);
    signOff = r.signOff.trim();
    if (r.voice.trim()) voiceLines.push(`Voice: ${r.voice.trim()}`);
    if (signOff) voiceLines.push(`Sign-off (end every post with exactly this): ${signOff}`);
    for (const w of r.wordRules) if (w.avoid.trim()) voiceLines.push(`Never say "${w.avoid.trim()}"${w.instead.trim() ? `; say "${w.instead.trim()}" instead` : ""}.`);
    if (r.personalDetails.trim()) voiceLines.push(`Personal details: ${r.personalDetails.trim()}`);
    for (const x of r.otherRules) if (x.trim()) voiceLines.push(`Rule: ${x.trim()}`);
  }

  const parts: string[] = [];
  if (voiceLines.length) parts.push(`VOICE & RULES\n${voiceLines.join("\n")}`);
  if (planParts.length) parts.push(`MARKETING PLAN (the owner's own answers and writing)\n${planParts.join("\n\n")}`);
  let text = parts.join("\n\n");
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + "\n…";

  const voiceAnswers = byKey.get("brand_voice")?.answers || {};
  const planVoice = ["brand-voice", "voice-notes"].some((id) => typeof voiceAnswers[id] === "string" && (voiceAnswers[id] as string).trim());
  return { text, hasPlan: planParts.length > 0, hasVoice: planVoice || voiceLines.length > 0, signOff };
}
