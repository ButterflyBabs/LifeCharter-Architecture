import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { act, aiHelp, isErr, loadView, partnershipByToken } from "@/lib/accountability";

export const dynamic = "force-dynamic";

// The outside partner's private link: no login, the unguessable token in the address
// is the key. They are always side "b" and see only this one partnership.
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const db = createServerClient();
  const p = await partnershipByToken(db, params.token);
  if (!p) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  return NextResponse.json({ ...(await loadView(db, p, "b")), invitedBy: p.a_name });
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const db = createServerClient();
  const p = await partnershipByToken(db, params.token);
  if (!p) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  // Only the client who started it can delete or choose coach visibility; both are refused for side b inside act().
  const r = body.action === "ai" ? await aiHelp(db, p, "b", body) : await act(db, p, "b", body);
  if (isErr(r)) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r);
}
