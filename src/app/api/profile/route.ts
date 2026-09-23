import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { readAccountKey, resolveAiAccount } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

// Returns the signed-in account's display name for the greeting plus the AI
// assistant name and whether its own OpenAI key is configured. The key itself
// is never returned.
export async function GET() {
  const { profileId } = await resolveAiAccount();
  const { data } = profileId
    ? await createServerClient().from("profiles").select("full_name, assistant_name, avatar_url").eq("id", profileId).maybeSingle()
    : { data: null };
  const fullName = ((data?.full_name as string) || "").trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : "";
  const assistantName = ((data?.assistant_name as string) || "").trim() || "Mariposa";
  const hasOpenAiKey = Boolean(await readAccountKey(profileId));
  const avatarUrl = ((data?.avatar_url as string) || "").trim() || null;
  return NextResponse.json({ fullName, firstName, assistantName, hasOpenAiKey, avatarUrl });
}
