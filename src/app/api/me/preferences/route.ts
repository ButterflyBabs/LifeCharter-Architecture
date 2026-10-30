import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { cleanOrders } from "@/lib/taskOrder";
import { cleanGuideRecent } from "@/lib/userGuide/search";

export const dynamic = "force-dynamic";

// A signed-in person's own display preferences (kept on their profile, so they follow them from device to device).
// Only the keys listed here can be written.
const LAYOUTS = ["list", "cards"] as const;
const TEXT_SIZES = ["small", "medium", "large"] as const;
const TEXT_SCALES = ["v1", "v2"] as const;

export async function GET() {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await createServerClient().from("profiles").select("preferences").eq("id", user.id).maybeSingle();
  const prefs = (data?.preferences ?? {}) as Record<string, unknown>;
  return NextResponse.json(
    {
      tasksView: LAYOUTS.includes(prefs.tasksView as (typeof LAYOUTS)[number]) ? prefs.tasksView : null,
      // The order this person put the Tasks page sections in (lib/taskOrder.ts); null = the usual order.
      tasksOrder: cleanOrders(prefs.tasksOrder),
      textSize: TEXT_SIZES.includes(prefs.textSize as (typeof TEXT_SIZES)[number]) ? prefs.textSize : null,
      // Which text scale this person gets; null = the app's default (lib/textScale.ts). Set by Claude, not by the person.
      textScale: TEXT_SCALES.includes(prefs.textScale as (typeof TEXT_SCALES)[number]) ? prefs.textScale : null,
      // This person's recent User Guide searches, newest first.
      guideRecent: cleanGuideRecent(prefs.guideRecent),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const change: Record<string, unknown> = {};
  if (body.tasksView !== undefined) {
    if (!LAYOUTS.includes(body.tasksView)) return NextResponse.json({ error: "tasksView must be list or cards" }, { status: 400 });
    change.tasksView = body.tasksView;
  }
  if (body.tasksOrder !== undefined) {
    const orders = cleanOrders(body.tasksOrder);
    if (!orders) return NextResponse.json({ error: "tasksOrder must be an object of lists" }, { status: 400 });
    change.tasksOrder = orders;
  }
  if (body.textSize !== undefined) {
    if (!TEXT_SIZES.includes(body.textSize)) return NextResponse.json({ error: "textSize must be small, medium or large" }, { status: 400 });
    change.textSize = body.textSize;
  }
  if (body.guideRecent !== undefined) change.guideRecent = cleanGuideRecent(body.guideRecent);
  if (!Object.keys(change).length) return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  const db = createServerClient();
  const { data } = await db.from("profiles").select("preferences").eq("id", user.id).maybeSingle();
  const merged = { ...((data?.preferences ?? {}) as Record<string, unknown>), ...change };
  const { error } = await db.from("profiles").update({ preferences: merged }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  return NextResponse.json({ ok: true, ...change });
}
