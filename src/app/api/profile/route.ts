import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { readAccountKey, resolveAiAccount } from "@/lib/ai/config";
import { isValidTimeZone } from "@/lib/timezones";

export const dynamic = "force-dynamic";

// Returns the signed-in account's display name for the greeting plus the AI
// assistant name and whether its own OpenAI key is configured. The key itself
// is never returned.
export async function GET() {
  const { profileId } = await resolveAiAccount();
  const { data } = profileId
    ? await createServerClient().from("profiles").select("full_name, assistant_name, avatar_url, timezone, timezone_chosen").eq("id", profileId).maybeSingle()
    : { data: null };
  const fullName = ((data?.full_name as string) || "").trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : "";
  const assistantName = ((data?.assistant_name as string) || "").trim() || "Mariposa";
  const hasOpenAiKey = Boolean(await readAccountKey(profileId));
  const avatarUrl = ((data?.avatar_url as string) || "").trim() || null;
  const timezone = data?.timezone_chosen ? ((data?.timezone as string) || "").trim() || null : null;
  return NextResponse.json({ fullName, firstName, assistantName, hasOpenAiKey, avatarUrl, timezone });
}

// Saves the signed-in owner's chosen time zone (used for the dashboard clock,
// greeting and today's schedule). Team members keep theirs in their browser.
export async function PATCH(req: Request) {
  const { profileId, canEdit } = await resolveAiAccount();
  const body = await req.json().catch(() => ({}));
  const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
  if (!timezone || !isValidTimeZone(timezone)) {
    return NextResponse.json({ error: "Invalid time zone" }, { status: 400 });
  }
  if (!profileId || !canEdit) return NextResponse.json({ ok: true, saved: false });
  const { error } = await createServerClient().from("profiles").update({ timezone, timezone_chosen: true }).eq("id", profileId);
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  return NextResponse.json({ ok: true, saved: true });
}
