import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { syncCollectiveReplays } from "@/lib/community/replaySync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Babs only: run the replay sync now instead of waiting for the hourly job, and see
// what it found (added, still processing, or no matching session).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const days = Math.min(30, Math.max(1, Number(body.days) || 7));
  return NextResponse.json(await syncCollectiveReplays(createServerClient(), days));
}
