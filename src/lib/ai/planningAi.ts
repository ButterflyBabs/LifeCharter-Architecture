import OpenAI from "openai";
import { resolveAiConfig } from "@/lib/ai/config";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { buildAssistantKnowledge } from "@/lib/ai/assistantContext";

// Every Strategic Planning AI feature (plan drafting, reviews, proposals, the
// forecast read, budgets, sales targets, the planning briefing…) runs as THIS
// client's own assistant: their assistant's name, their own OpenAI key, their
// standing instructions for how it writes, and everything it knows about their
// business (assessments, plans, budgets, forecast, sales, tasks). Nothing from
// any other account is ever in the prompt.

export interface PlanningAssistant {
  planId: string;
  name: string;
  key: string;
  instructions: string;
  knowledge: string; // what the assistant knows about this client
}

export async function planningAssistant(): Promise<PlanningAssistant | null> {
  const planId = await resolveMasterPlanId();
  if (!planId) return null;
  const { name, key, instructions } = await resolveAiConfig();
  if (!key) return { planId, name, key: "", instructions, knowledge: "" };
  let knowledge = "";
  try {
    const tz = await resolveUserTimeZone(null);
    knowledge = (await buildAssistantKnowledge(planId, tz, { mailOwnerId: null })).text;
  } catch {
    /* draft without it */
  }
  return { planId, name, key, instructions, knowledge };
}

// The system prompt: who the assistant is, how the client wants it to write,
// what it knows, and the rules for this task.
export function planningSystem(a: PlanningAssistant, role: string, rules: string): string {
  return (
    `You are ${a.name}, this client's own AI assistant — ${role}\n` +
    (a.instructions ? `\nTHEIR STANDING INSTRUCTIONS FOR HOW YOU WRITE (tone, length, style — they never allow inventing facts):\n${a.instructions}\n` : "") +
    `\nWHAT YOU KNOW ABOUT THIS CLIENT (their own words and live numbers):\n${a.knowledge || "(nothing recorded yet)"}\n\n` +
    `${rules}\n` +
    "Never invent facts, numbers, names or history that aren't shown above. Where something is missing, say so or leave a [bracketed placeholder]. Assessment answers are private to them — describe themes, don't quote them at length."
  );
}

// One JSON completion on the client's own key. Returns null if the model or the
// network fails, so routes can answer with a plain error.
export async function runJson(a: PlanningAssistant, system: string, user: string, maxTokens = 1200, temperature = 0.4): Promise<Record<string, unknown> | null> {
  try {
    const completion = await new OpenAI({ apiKey: a.key }).chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature,
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content?.trim() || "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch (e) {
    console.error("planning AI:", e);
    return null;
  }
}

export const cleanList = (v: unknown, max: number, keys: string[]): Record<string, string>[] =>
  (Array.isArray(v) ? v : [])
    .slice(0, max)
    .map((x) => Object.fromEntries(keys.map((k) => [k, String((x as Record<string, unknown>)?.[k] ?? "").trim().slice(0, 400)])))
    .filter((x) => keys.some((k) => x[k]));
