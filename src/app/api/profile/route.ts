import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Returns the owner's display name for the greeting (single-user: first profile
// row) plus the AI assistant name and whether an OpenAI key is configured.
// The key itself is never returned.
export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, assistant_name, openai_api_key")
    .limit(1)
    .maybeSingle();
  const fullName = ((data?.full_name as string) || "").trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : "";
  const assistantName = ((data?.assistant_name as string) || "").trim() || "Mariposa";
  const hasOpenAiKey = Boolean(((data?.openai_api_key as string) || "").trim());
  return NextResponse.json({ fullName, firstName, assistantName, hasOpenAiKey });
}
