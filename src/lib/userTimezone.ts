import { resolveAiAccount } from "@/lib/ai/config";
import { createServerClient } from "@/lib/supabase/server";
import { isValidTimeZone } from "@/lib/timezones";
import { cookies } from "next/headers";

// The browser keeps its own zone in this cookie on every page load (see AppLayout), so server code that runs
// without a request body (the assistant's tools, an approval, a page) still reads the client's clock correctly.
export const TZ_COOKIE = "lc_tz";
function cookieZone(): string | null {
  try {
    const raw = cookies().get(TZ_COOKIE)?.value;
    if (!raw) return null;
    const v = /%/.test(raw) ? decodeURIComponent(raw) : raw;
    return isValidTimeZone(v) ? v : null;
  } catch {
    return null; // outside a request (a scheduled job): the account's own setting or UTC
  }
}

// The time zone a request should be read in: the zone the account owner chose
// (profiles.timezone once timezone_chosen), else the browser-detected zone the
// client sent (?tz=), else the zone their browser last reported (cookie), else UTC.
export async function resolveUserTimeZone(queryTz?: string | null): Promise<string> {
  let tz = queryTz && isValidTimeZone(queryTz) ? queryTz : cookieZone() ?? "UTC";
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
