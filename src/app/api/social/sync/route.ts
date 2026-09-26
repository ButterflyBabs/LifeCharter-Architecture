import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { getClientKey } from "@/lib/postStream";
import { socialContext } from "@/lib/social/server";
import { syncFromPostStream } from "@/lib/social/psSync";
import { resolveUserTimeZone } from "@/lib/userTimezone";

export const dynamic = "force-dynamic";

// Pulls PostStream into the Content Calendar: posts that went out there are
// marked posted, and posts made directly in PostStream are added. Quietly does
// nothing if PostStream isn't connected or can't be reached.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const key = await getClientKey();
  if (!key) return NextResponse.json({ connected: false, changed: 0 });
  const body = await request.json().catch(() => ({}));
  try {
    const tz = await resolveUserTimeZone(typeof body?.tz === "string" ? body.tz : null);
    const changed = await Promise.race([
      syncFromPostStream(ctx.masterPlanId, key, tz),
      new Promise<number>((resolve) => setTimeout(() => resolve(0), 8000)),
    ]);
    return NextResponse.json({ connected: true, changed });
  } catch (e) {
    console.error("POST /api/social/sync:", e);
    return NextResponse.json({ connected: true, changed: 0 });
  }
}
