import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { getClientKey, PLATFORMS, PostStreamError } from "@/lib/postStream";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { socialPlannerEnabled, shapePost } from "@/lib/social/server";
import { sendToPostStream, SendError, type SendWhen } from "@/lib/social/psSync";

export const dynamic = "force-dynamic";

// The one place a post gets created, scheduled or published. It saves the post
// on the Content Calendar (for accounts that have it) and sends it through
// PostStream, then records the link between the two. Works for a brand-new post
// or for calendar posts that already exist (plannedIds).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  const when: SendWhen = body.when === "schedule" || body.when === "now" ? body.when : "draft";
  const strs = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  const plannerOn = await socialPlannerEnabled();
  const plannedIds = plannerOn ? strs(body.plannedIds).slice(0, 20) : [];
  const platforms = strs(body.platforms).filter((p) => plannerOn || (PLATFORMS as readonly string[]).includes(p));
  const scheduledAt = typeof body.scheduledAt === "string" && !Number.isNaN(Date.parse(body.scheduledAt)) ? new Date(body.scheduledAt).toISOString() : null;
  const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;

  try {
    const { ps, rows } = await sendToPostStream(masterPlanId, await getClientKey(), plannerOn, {
      title: typeof body.title === "string" ? body.title.slice(0, 300) : "",
      caption: typeof body.caption === "string" ? body.caption.slice(0, 50000) : "",
      platforms,
      when,
      scheduledAt,
      date,
      mediaUrls: strs(body.mediaUrls),
      mediaType: ["image", "video", "carousel"].includes(body.mediaType) ? body.mediaType : undefined,
      plannedIds,
    });
    return NextResponse.json({ ok: true, post: ps, planned: rows.map(shapePost) });
  } catch (e) {
    if (e instanceof SendError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof PostStreamError) return NextResponse.json({ error: e.message }, { status: e.status >= 400 && e.status < 600 ? e.status : 502 });
    console.error("POST /api/content/send:", e);
    return NextResponse.json({ error: "Couldn't send that post." }, { status: 500 });
  }
}
