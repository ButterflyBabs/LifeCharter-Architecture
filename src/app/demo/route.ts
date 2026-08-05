import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Visiting /demo turns on Demo mode (sample data everywhere) and lands on the
// dashboard. Non-httpOnly so the DEMO banner can detect it client-side.
export function GET(request: Request) {
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
