import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { VAULT_COOKIE } from "@/lib/vault";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VAULT_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return res;
}
