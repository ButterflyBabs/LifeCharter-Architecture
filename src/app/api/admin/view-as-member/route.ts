import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { VIEW_MEMBER_COOKIE, VIEW_MEMBER_MAX_SECONDS, isMemberId } from "@/lib/viewMember";

export const dynamic = "force-dynamic";

// "View as team member" (Alignment Architect only). POST { memberId } opens the Suite as that person sees it, read-only;
// DELETE closes it. The middleware refuses every write while the cookie is present.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  if (!isMemberId(b.memberId)) return NextResponse.json({ error: "Choose a team member." }, { status: 400 });
  const { data: m } = await createServerClient().from("workspace_members").select("id, name, email, role").eq("id", b.memberId).maybeSingle();
  if (!m) return NextResponse.json({ error: "Team member not found." }, { status: 404 });
  const res = NextResponse.json({ ok: true, name: m.name || m.email, role: m.role, landing: m.role === "consultant" ? "/call-to-close" : m.role === "sales" ? "/sales-reference" : "/" });
  res.cookies.set({ name: VIEW_MEMBER_COOKIE, value: m.id as string, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: VIEW_MEMBER_MAX_SECONDS });
  return res;
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: VIEW_MEMBER_COOKIE, value: "", path: "/", maxAge: 0 });
  return res;
}
