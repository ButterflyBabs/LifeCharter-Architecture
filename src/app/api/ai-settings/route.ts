import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { readAccountKey, resolveAiAccount } from "@/lib/ai/config";
import { DEFAULT_ASSISTANT_NAME, MAX_ASSISTANT_INSTRUCTIONS } from "@/lib/ai/defaults";

export const dynamic = "force-dynamic";

async function current(profileId: string | null) {
  let assistantName = DEFAULT_ASSISTANT_NAME;
  let assistantInstructions = "";
  if (profileId) {
    const { data } = await createServerClient()
      .from("profiles")
      .select("assistant_name, assistant_instructions")
      .eq("id", profileId)
      .maybeSingle();
    assistantName = ((data?.assistant_name as string) || "").trim() || assistantName;
    assistantInstructions = ((data?.assistant_instructions as string) || "").trim();
  }
  return { assistantName, assistantInstructions, hasOpenAiKey: Boolean(await readAccountKey(profileId)) };
}

// Returns this account's AI assistant name + whether its own OpenAI key is set
// (never the key itself).
export async function GET() {
  const account = await resolveAiAccount();
  return NextResponse.json({ ...(await current(account.profileId)), canEdit: account.canEdit });
}

// Saves the assistant name, its standing reply instructions and/or the OpenAI key
// for the signed-in account.
// Send openaiApiKey:"" to clear. The key is stored encrypted in Vault.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const account = await resolveAiAccount();
  if (!account.profileId) return NextResponse.json({ error: "no profile" }, { status: 400 });
  if (!account.canEdit) {
    return NextResponse.json({ error: "Only the account owner can change the AI connection." }, { status: 403 });
  }
  const supabase = createServerClient();

  if (
    typeof body?.assistantName !== "string" &&
    typeof body?.openaiApiKey !== "string" &&
    typeof body?.assistantInstructions !== "string"
  ) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }
  if (typeof body?.assistantName === "string") {
    const { error } = await supabase
      .from("profiles")
      .update({ assistant_name: body.assistantName.trim() || null })
      .eq("id", account.profileId);
    if (error) {
      console.error("POST /api/ai-settings name:", error);
      return NextResponse.json({ error: "save failed" }, { status: 500 });
    }
  }
  if (typeof body?.assistantInstructions === "string") {
    const text = body.assistantInstructions.trim();
    if (text.length > MAX_ASSISTANT_INSTRUCTIONS) {
      return NextResponse.json({ error: `Keep instructions under ${MAX_ASSISTANT_INSTRUCTIONS} characters.` }, { status: 400 });
    }
    const { error } = await supabase.from("profiles").update({ assistant_instructions: text || null }).eq("id", account.profileId);
    if (error) {
      console.error("POST /api/ai-settings instructions:", error);
      return NextResponse.json({ error: "save failed" }, { status: 500 });
    }
  }
  if (typeof body?.openaiApiKey === "string") {
    const { error } = await supabase.rpc("set_account_ai_key", { p_user: account.profileId, p_key: body.openaiApiKey });
    if (error) {
      console.error("POST /api/ai-settings key:", error);
      return NextResponse.json({ error: "save failed" }, { status: 500 });
    }
  }
  return NextResponse.json({ ...(await current(account.profileId)), canEdit: true });
}
