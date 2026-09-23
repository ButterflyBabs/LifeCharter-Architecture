// Server-only: which AI a Collective member's request runs on.
//
//   1. Their own Command Suite connection (their key, their assistant name) —
//      invited team members use their account owner's.
//   2. Otherwise Collective Plus: LifeCharter's dedicated Plus key
//      (PLUS_OPENAI_API_KEY — its own OpenAI project with its own spend
//      limit), always as "Mariposa", capped per member per month.
//   3. Otherwise none (free members see the Plus invitation instead).
import { isOwnerEmail } from "@/lib/authz";
import { readAccountKey } from "@/lib/ai/config";
import { createServerClient } from "@/lib/supabase/server";

export const PLUS_MONTHLY_PRICE = 999; // cents
export const PLUS_ANNUAL_PRICE = 9900;
export const FOUNDING_MONTHLY_PRICE = 700;
export const FOUNDING_ANNUAL_PRICE = 7000;
export const FOUNDING_SPOTS = 100;
export const PLUS_MONTHLY_AI_CAP = 200; // Mariposa requests per member per calendar month

export type AiSource = "own" | "plus";

export interface CollectiveAi {
  key: string;
  name: string;
  source: AiSource | null;
  plus: boolean; // has Collective Plus (whether or not the AI is also their own)
  capReached: boolean;
  plusKeyMissing: boolean; // Plus member, but the Plus key isn't configured yet
}

export async function isPlusMember(userId: string): Promise<boolean> {
  const { data } = await createServerClient().rpc("cm_is_plus", { p_user: userId });
  return data === true;
}

async function ownAccount(userId: string, email: string | null): Promise<{ key: string; name: string } | null> {
  const supabase = createServerClient();
  let profileId: string | null = null;
  const { data: own } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (own?.id) profileId = own.id as string;
  else if (email) {
    const { data: m } = await supabase.from("workspace_members").select("workspace_id").ilike("email", email).eq("status", "active").maybeSingle();
    if (m?.workspace_id) {
      const { data: ws } = await supabase.from("workspaces").select("owner_id").eq("id", m.workspace_id).maybeSingle();
      profileId = (ws?.owner_id as string) ?? null;
    }
  }
  let key = await readAccountKey(profileId);
  if (!key && isOwnerEmail(email) && email) key = process.env.OPENAI_API_KEY || process.env.openai_api_key || "";
  if (!key) return null;
  let name = "Mariposa";
  if (profileId) {
    const { data } = await supabase.from("profiles").select("assistant_name").eq("id", profileId).maybeSingle();
    name = ((data?.assistant_name as string) || "").trim() || name;
  }
  return { key, name };
}

function monthStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function plusUsageThisMonth(userId: string): Promise<number> {
  const { count } = await createServerClient()
    .from("cm_ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("source", "plus")
    .gte("created_at", monthStart());
  return count ?? 0;
}

export async function collectiveAiFor(user: { id: string; email: string | null }): Promise<CollectiveAi> {
  const plus = await isPlusMember(user.id);
  const own = await ownAccount(user.id, user.email);
  if (own) return { ...own, source: "own", plus, capReached: false, plusKeyMissing: false };
  if (!plus) return { key: "", name: "Mariposa", source: null, plus, capReached: false, plusKeyMissing: false };
  const plusKey = process.env.PLUS_OPENAI_API_KEY || "";
  const capReached = (await plusUsageThisMonth(user.id)) >= PLUS_MONTHLY_AI_CAP;
  return { key: capReached ? "" : plusKey, name: "Mariposa", source: "plus", plus, capReached, plusKeyMissing: !plusKey };
}

export async function logAiUse(userId: string, action: string, source: AiSource) {
  await createServerClient().from("cm_ai_usage").insert({ user_id: userId, action, source });
}

export function aiUnavailableMessage(ai: CollectiveAi): string {
  if (ai.capReached) return "You've reached this month's Mariposa limit — it resets on the 1st.";
  if (ai.plusKeyMissing) return "Mariposa is still being set up for Plus — please try again soon.";
  if (!ai.plus) return "Mariposa comes with Collective Plus.";
  return "The AI isn't available right now.";
}

// One JSON-mode call on the small model. Throws with a member-friendly message.
export async function aiJson(key: string, system: string, user: string, maxTokens = 400): Promise<Record<string, unknown>> {
  const { default: OpenAI } = await import("openai");
  try {
    const completion = await new OpenAI({ apiKey: key }).chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.6,
      response_format: { type: "json_object" },
    });
    try {
      return JSON.parse(completion.choices[0]?.message?.content?.trim() || "{}");
    } catch {
      return {};
    }
  } catch (e) {
    console.error("aiJson:", e);
    const status = (e as { status?: number })?.status;
    throw new Error(status === 401 ? "The AI key was rejected — update it in Command Suite settings." : "The AI didn't respond — try again in a moment.");
  }
}

// Has this member agreed to Mariposa sending their text to OpenAI?
export async function hasAiConsent(userId: string): Promise<boolean> {
  const { data } = await createServerClient().from("cm_profiles").select("ai_consent_at").eq("user_id", userId).maybeSingle();
  return Boolean(data?.ai_consent_at);
}
