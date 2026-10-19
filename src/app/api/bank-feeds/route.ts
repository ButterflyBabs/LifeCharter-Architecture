import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { bankFeedsAccount } from "@/lib/bankFeedsAccess";
import { bankSummary, finishLink, reviewTransactions, startLink, syncPlan, unlink, type ReviewItem } from "@/lib/bankFeeds";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Bank and card feeds (task 1150 part 2). GET: the page's data. POST: one action at a time.
export async function GET() {
  const a = await bankFeedsAccount();
  if ("denied" in a) return a.denied;
  return NextResponse.json(await bankSummary(createServerClient(), a.planId));
}

export async function POST(request: Request) {
  const a = await bankFeedsAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const body = (await request.json().catch(() => ({}))) as { action?: string; sessionId?: string; connectionId?: string; items?: ReviewItem[]; name?: string };
  switch (body.action) {
    case "start": {
      const r = await startLink(db, a.planId, a.email, typeof body.name === "string" ? body.name.slice(0, 120) : null);
      return NextResponse.json(r, { status: r.ok ? 200 : 400 });
    }
    case "finish": {
      if (!body.sessionId || typeof body.sessionId !== "string") return NextResponse.json({ ok: false, error: "Missing session." }, { status: 400 });
      const r = await finishLink(db, a.planId, body.sessionId, a.email);
      if (r.ok) await syncPlan(db, a.planId).catch(() => null);
      return NextResponse.json(r, { status: r.ok ? 200 : 400 });
    }
    case "unlink": {
      if (!body.connectionId) return NextResponse.json({ ok: false }, { status: 400 });
      return NextResponse.json({ ok: await unlink(db, a.planId, body.connectionId) });
    }
    case "sync": {
      const r = await syncPlan(db, a.planId, true);
      return NextResponse.json({ ok: true, ...r });
    }
    case "approve":
    case "skip":
    case "restore": {
      const items = Array.isArray(body.items) ? body.items.filter((i) => i && typeof i.id === "string").slice(0, 300) : [];
      return NextResponse.json({ ok: true, ...(await reviewTransactions(db, a.planId, body.action, items)) });
    }
    default:
      return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  }
}
