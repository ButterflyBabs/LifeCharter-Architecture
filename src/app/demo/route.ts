import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Visiting /demo turns on Demo mode (sample data everywhere) and lands on the
// dashboard. Non-httpOnly so the DEMO banner can detect it client-side.
export function GET(request: Request) {
  // A link prefetch (the browser or Next getting the page ready) must NEVER turn demo mode on;
  // only a person actually opening it does.
  const h = request.headers;
  if (h.get("next-router-prefetch") || h.get("rsc") || /prefetch|prerender/i.test(`${h.get("purpose") ?? ""} ${h.get("sec-purpose") ?? ""}`)) {
    return new NextResponse(null, { status: 204 });
  }
  const origin = new URL(request.url).origin;
  const res = NextResponse.redirect(`${origin}/`);
  res.cookies.set("lc_demo", "1", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}
