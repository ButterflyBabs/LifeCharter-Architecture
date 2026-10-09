import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { UNLOCK_MS, VAULT_COOKIE, passwordIsRight, tooManyTries, unlockToken, vaultUser } from "@/lib/vault";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST { password }: opens the person's vault for 15 minutes once they prove it is them by re-entering their Suite password.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const u = await vaultUser();
  if (!u) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (tooManyTries(u.id)) return NextResponse.json({ error: "Too many tries. Please wait a few minutes and try again." }, { status: 429 });
  const b = (await request.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof b.password === "string" ? b.password : "";
  if (!(await passwordIsRight(u.email, password))) {
    return NextResponse.json({ error: "That isn't your Suite password. If you sign in another way or have forgotten it, use \"Forgot or set your password?\" on the sign-in page to choose one." }, { status: 403 });
  }
  const t = unlockToken(u.id);
  await createServerClient().from("vault_audit").insert({ owner_user_id: u.id, action: "opened" });
  const res = NextResponse.json({ ok: true, until: t.exp });
  res.cookies.set(VAULT_COOKIE, t.value, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: Math.floor(UNLOCK_MS / 1000) });
  return res;
}
