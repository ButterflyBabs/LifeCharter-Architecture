import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Exit Demo mode — clears the cookie and returns to the real workspace.
export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const res = NextResponse.redirect(`${origin}/`);
  res.cookies.set("lc_demo", "", { path: "/", maxAge: 0 });
  return res;
}
