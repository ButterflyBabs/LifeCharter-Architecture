import { resolveAiAccount } from "@/lib/ai/config";
import { createServerClient } from "@/lib/supabase/server";
import { isValidTimeZone } from "@/lib/timezones";

// The time zone a request should be read in: the zone the account owner chose
// (profiles.timezone once timezone_chosen), else the browser-detected zone the
// client sent (?tz=), else UTC.
export async function resolveUserTimeZone(queryTz?: string | null): Promise<string> {
  let tz = queryTz && isValidTimeZone(queryTz) ? queryTz : "UTC";
  try {
    const { profileId, canEdit } = await resolveAiAccount();
    if (profileId && canEdit) {
      const { data } = await createServerClient()
        .from("profiles")
        .select("timezone, timezone_chosen")
        .eq("id", profileId)
        .maybeSingle();
      const chosen = (data?.timezone as string | null)?.trim();
      if (data?.timezone_chosen && chosen && isValidTimeZone(chosen)) tz = chosen;
    }
  } catch {
    /* fall back to the query zone */
  }
  return tz;
}
