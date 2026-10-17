import { aiClient } from "@/lib/ai/client";
import { createServerClient } from "@/lib/supabase/server";
import { readAccountKey } from "@/lib/ai/config";
import { ALIGNMENT_ARCHITECT_EMAIL, superAdminEmails } from "@/lib/authz";
import type { SparkSettings, SparkSite } from "./settings";

// The model call behind LC Spark. Public requests have no session, so the key is
// the ACCOUNT's own OpenAI key (Vault), found through the account's owner. Only
// the house owner may fall back to the house key — never a client account.

export interface SparkAiAccount {
  key: string;
  ownerEmail: string | null;
  ownerName: string | null;
}

export async function sparkAccountAi(planId: string): Promise<SparkAiAccount> {
  const db = createServerClient();
  const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
  const userId = (plan?.user_id as string) || null;
  if (!userId) return { key: "", ownerEmail: null, ownerName: null };
  const { data: prof } = await db.from("profiles").select("id, email, full_name").eq("id", userId).maybeSingle();
  const ownerEmail = ((prof?.email as string) || "").toLowerCase() || null;
  const own = await readAccountKey(userId).catch(() => "");
  const admins = superAdminEmails();
  const isHouse = Boolean(ownerEmail && (ownerEmail === ALIGNMENT_ARCHITECT_EMAIL || (admins.length > 0 && admins.includes(ownerEmail))));
  const house = process.env.OPENAI_API_KEY || "";
  return { key: own || (isHouse ? house : ""), ownerEmail, ownerName: ((prof?.full_name as string) || "").trim() || null };
}

export interface SparkAiResult {
  reply: string;
  capturedName: string | null;
  capturedEmail: string | null;
  wantsBooking: boolean;
  handoff: boolean;
}

export interface SparkHistoryItem {
  role: "visitor" | "assistant";
  content: string;
}

import { buildSystemPrompt, type SparkAiChannel } from "./prompt";
export { buildSystemPrompt, type SparkAiChannel } from "./prompt";

export async function sparkReply(opts: {
  apiKey: string;
  settings: SparkSettings;
  channel: SparkAiChannel;
  site: SparkSite | null;
  booking: string | null; // the site's calendar, or (Instagram) the first website's
  history: SparkHistoryItem[];
  known: { name: string | null; email: string | null };
}): Promise<SparkAiResult | null> {
  const system = buildSystemPrompt(opts.settings, opts.channel, opts.site, opts.booking, opts.known);
  try {
    const completion = await aiClient(opts.apiKey, { timeout: 20_000, maxRetries: 1 }).chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 350,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        ...opts.history.slice(-16).map((m) => ({ role: m.role === "visitor" ? ("user" as const) : ("assistant" as const), content: m.content.slice(0, 1500) })),
      ],
    });
    const raw = JSON.parse(completion.choices[0]?.message?.content?.trim() || "{}") as Record<string, unknown>;
    const reply = typeof raw.reply === "string" ? raw.reply.trim().slice(0, 1500) : "";
    if (!reply) return null;
    return {
      reply,
      capturedName: typeof raw.capturedName === "string" && raw.capturedName.trim() ? raw.capturedName.trim().slice(0, 60) : null,
      capturedEmail: typeof raw.capturedEmail === "string" && raw.capturedEmail.trim() ? raw.capturedEmail.trim().toLowerCase().slice(0, 200) : null,
      wantsBooking: raw.wantsBooking === true,
      handoff: raw.handoff === true,
    };
  } catch (e) {
    console.error("spark ai:", e instanceof Error ? e.message : e);
    return null;
  }
}
