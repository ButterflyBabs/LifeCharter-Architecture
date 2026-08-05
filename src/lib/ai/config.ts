import { createServerClient } from "@/lib/supabase/server";

// The account's AI assistant name + OpenAI key. Prefers the per-account key
// stored on the profile, falling back to the environment key. Single-user:
// reads the first profile row (matching /api/profile).
export async function resolveAiConfig(): Promise<{ name: string; key: string }> {
  const envKey = process.env.OPENAI_API_KEY || process.env.openai_api_key || "";
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("profiles")
      .select("assistant_name, openai_api_key")
      .limit(1)
      .maybeSingle();
    const name = ((data?.assistant_name as string) || "").trim() || "Mariposa";
    const key = ((data?.openai_api_key as string) || "").trim() || envKey;
    return { name, key };
  } catch {
    return { name: "Mariposa", key: envKey };
  }
}

export async function resolveOpenAiKey(): Promise<string> {
  return (await resolveAiConfig()).key;
}
