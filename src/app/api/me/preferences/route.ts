import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// A signed-in person's own display preferences (kept on their profile, so they follow them from device to device).
// Only the keys listed here can be written.
const LAYOUTS = ["list", "cards"] as const;

export async function GET() {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await createServerClient().from("profiles").select("preferences").eq("id", user.id).maybeSingle();
  const prefs = (data?.preferences ?? {}) as Record<string, unknown>;
  return NextResponse.json({ tasksView: LAYOUTS.includes(prefs.tasksView as (typeof LAYOUTS)[number]) ? prefs.tasksView : null }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!LAYOUTS.includes(body.tasksView)) return NextResponse.json({ error: "tasksView must be list or cards" }, { status: 400 });
  const db = createServerClient();
  const { data } = await db.from("profiles").select("preferences").eq("id", user.id).maybeSingle();
  const merged = { ...((data?.preferences ?? {}) as Record<string, unknown>), tasksView: body.tasksView };
  const { error } = await db.from("profiles").update({ preferences: merged }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  return NextResponse.json({ ok: true, tasksView: body.tasksView });
}
