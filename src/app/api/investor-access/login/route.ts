import { NextResponse } from "next/server";
import { IB_COOKIE, IB_COOKIE_DAYS, signAccessToken } from "@/lib/investorAccess";
import { codeMatches } from "@/lib/investorAccessNode";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Public: an approved person signs in to the investor page with their email and their own access code.
const fails = new Map<string, { n: number; at: number }>();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const rec0 = fails.get(ip);
  if (rec0 && Date.now() - rec0.at < 10 * 60_000 && rec0.n >= 6) {
    return NextResponse.json({ error: "Too many tries. Please wait a few minutes and try again." }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; code?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code : "";
  const bad = async () => {
    fails.set(ip, { n: (rec0 && Date.now() - rec0.at < 10 * 60_000 ? rec0.n : 0) + 1, at: Date.now() });
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "That email and access code do not match an approved request." }, { status: 401 });
  };
  if (!EMAIL_RE.test(email) || !code.trim()) return bad();
  const db = createServerClient();
  const { data } = await db.from("investor_access").select("status, code_hash, code_salt, code_v").eq("email", email).maybeSingle();
  if (!data || data.status !== "approved" || !data.code_v || !codeMatches(code, data)) return bad();
  fails.delete(ip);
  const token = await signAccessToken(email, data.code_v as string);
  if (!token) return NextResponse.json({ error: "This page is not available right now." }, { status: 503 });
  await db.from("investor_access").update({ last_login_at: new Date().toISOString() }).eq("email", email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: IB_COOKIE, value: token, httpOnly: true, secure: true, sameSite: "lax", path: "/investor-brief", maxAge: IB_COOKIE_DAYS * 86_400 });
  return res;
}
