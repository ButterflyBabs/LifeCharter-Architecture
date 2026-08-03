import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Returns the AI assistant name + whether an OpenAI key is set (never the key).
export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, assistant_name, openai_api_key")
    .limit(1)
    .maybeSingle();
  return NextResponse.json({
    assistantName: ((data?.assistant_name as string) || "").trim() || "Mariposa",
    hasOpenAiKey: Boolean(((data?.openai_api_key as string) || "").trim()),
  });
}

// Saves the assistant name and/or the OpenAI key. Send openaiApiKey:"" to clear.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const supabase = createServerClient();
  const { data: prof } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
  if (!prof?.id) return NextResponse.json({ error: "no profile" }, { status: 400 });

  const patch: Record<string, string | null> = {};
  if (typeof body?.assistantName === "string") {
    patch.assistant_name = body.assistantName.trim() || null;
  }
  if (typeof body?.openaiApiKey === "string") {
    // Only overwrite when a real value is sent; empty string clears it.
    patch.openai_api_key = body.openaiApiKey.trim() || null;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", prof.id);
  if (error) {
    console.error("POST /api/ai-settings:", error);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  const { data } = await supabase
    .from("profiles")
    .select("assistant_name, openai_api_key")
    .eq("id", prof.id)
    .maybeSingle();
  return NextResponse.json({
    assistantName: ((data?.assistant_name as string) || "").trim() || "Mariposa",
    hasOpenAiKey: Boolean(((data?.openai_api_key as string) || "").trim()),
  });
}
