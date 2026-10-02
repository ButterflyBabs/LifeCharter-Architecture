import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { runReminders } from "@/lib/accountability";

export const dynamic = "force-dynamic";

// Daily (8am Mountain): "due tomorrow" to whoever owns the item, and one gentle note
// to both partners when something slips past its date. Same CRON_SECRET convention
// as the other crons; skips email without RESEND_API_KEY (the in-app feed still fills).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await runReminders(createServerClient()));
}
