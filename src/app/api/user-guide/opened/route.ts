import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { isAlignmentArchitect, sessionUser } from "@/lib/authz";
import { guideEntry } from "@/lib/userGuide/entries";
import { isGuideTester } from "@/lib/userGuide/flag";

export const dynamic = "force-dynamic";

// Adds one to an entry's total for Frequently used. Only the total is kept, never who opened it. Babs's and the test account's
// own opens are left out so they do not shape what clients see.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { id?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  if (!guideEntry(id)) return NextResponse.json({ error: "not found" }, { status: 404 });
  if ((await isAlignmentArchitect()) || isGuideTester(user.email)) return NextResponse.json({ ok: true, counted: false });
  await createServerClient().rpc("bump_user_guide_open", { p_entry: id });
  return NextResponse.json({ ok: true, counted: true });
}
