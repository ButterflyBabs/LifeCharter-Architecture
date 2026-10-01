import { NextResponse } from "next/server";
import { claimFreePlanner } from "@/lib/plannerGiveaway";

export const dynamic = "force-dynamic";

// Public endpoint for the free planner giveaway on amilynnecarroll.com/planners.
// Only Babs's own sites may post here (see /api/forms/[id] for the same list).
const ALLOWED = [
  /^https:\/\/(www\.)?amilynnecarroll\.com$/,
  /^https:\/\/amilynnecarroll-site(-[a-z0-9-]+)?\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

function cors(request: Request) {
  const origin = request.headers.get("origin") || "";
  return ALLOWED.some((r) => r.test(origin))
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : ({} as Record<string, string>);
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request) });
}

export async function POST(request: Request) {
  const headers = cors(request);
  if (!headers["Access-Control-Allow-Origin"]) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const body: Record<string, unknown> = await request.json().catch(() => ({}));
  // Honeypot: people never fill this hidden field; bots do. Pretend it worked.
  if (typeof body._hp === "string" && body._hp.trim()) return NextResponse.json({ ok: true, message: "Thank you!" }, { headers });
  const pageUrl = typeof body._page === "string" ? body._page : request.headers.get("referer");
  const r = await claimFreePlanner(body, pageUrl);
  return r.ok ? NextResponse.json({ ok: true, message: r.message }, { headers }) : NextResponse.json({ error: r.error }, { status: r.status, headers });
}
