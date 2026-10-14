import { createHash } from "crypto";
import { createServerClient } from "@/lib/supabase/server";

// AI use metering. Every AI call in the Suite goes through aiClient() (src/lib/ai/client.ts), which reports how many
// tokens each call used here. Nothing about WHAT was asked is stored: only who it ran for, which model, and counts.
//
// Whose call it was: routes read their key through readAccountKey()/resolveAiConfig(), which remember "this key
// belongs to this account" for a few minutes; a call made with an environment key is attributed to the house
// (Babs's own key) or to Collective Plus. A call whose key was never seen stays "unknown".

export type KeyKind = "own" | "house" | "plus" | "unknown";

const fp = (key: string) => createHash("sha256").update(key.trim()).digest("hex").slice(0, 16);

const remembered = new Map<string, { profileId: string | null; at: number }>();
const TTL_MS = 30 * 60_000;

/** Called when a key is read for an account, so later calls with that key can be attributed to it. */
export function rememberKey(key: string | null | undefined, profileId: string | null): void {
  const k = (key || "").trim();
  if (!k) return;
  remembered.set(fp(k), { profileId, at: Date.now() });
  if (remembered.size > 500) {
    for (const [f, v] of Array.from(remembered.entries())) if (Date.now() - v.at > TTL_MS) remembered.delete(f);
  }
}

export function attribute(key: string): { profileId: string | null; kind: KeyKind } {
  const f = fp(key);
  const env = (process.env.OPENAI_API_KEY || process.env.openai_api_key || "").trim();
  const plus = (process.env.PLUS_OPENAI_API_KEY || "").trim();
  if (plus && f === fp(plus)) return { profileId: null, kind: "plus" };
  const hit = remembered.get(f);
  if (hit && Date.now() - hit.at <= TTL_MS) {
    // The house key read for the owner is still the house's money, even though it was remembered for her profile.
    if (env && f === fp(env)) return { profileId: hit.profileId, kind: "house" };
    return { profileId: hit.profileId, kind: "own" };
  }
  if (env && f === fp(env)) return { profileId: null, kind: "house" };
  return { profileId: null, kind: "unknown" };
}

// Approximate list prices in US cents per million tokens: [input, output]. Estimates for the Platform Costs page, not
// invoices. Unknown models use the "default" row.
const RATES: Record<string, [number, number]> = {
  "gpt-4o-mini": [15, 60],
  "gpt-4o": [250, 1000],
  "gpt-4.1-mini": [40, 160],
  "gpt-4.1": [200, 800],
  "claude-haiku-5-5": [100, 500],
  "claude-sonnet-5-5": [300, 1500],
  default: [100, 400],
};

export function estimateCostCents(model: string | null | undefined, inputTokens: number, outputTokens: number): number {
  const m = (model || "").toLowerCase();
  const key = Object.keys(RATES).filter((k) => k !== "default").sort((a, b) => b.length - a.length).find((k) => m.startsWith(k)) ?? "default";
  const [i, o] = RATES[key];
  return (inputTokens * i + outputTokens * o) / 1_000_000;
}

/** Fire and forget: metering must never slow down or break an AI answer. */
export function recordUsage(key: string, u: { provider: "openai" | "anthropic"; model?: string | null; input: number; output: number }): void {
  try {
    const who = attribute(key);
    void createServerClient()
      .from("ai_usage_log")
      .insert({ profile_id: who.profileId, key_kind: who.kind, provider: u.provider, model: u.model ?? null, input_tokens: Math.max(0, u.input | 0), output_tokens: Math.max(0, u.output | 0) })
      .then(({ error }) => {
        if (error) console.error("ai meter:", error.message);
      });
  } catch (e) {
    console.error("ai meter:", e instanceof Error ? e.message : e);
  }
}
