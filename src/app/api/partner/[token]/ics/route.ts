import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { callIcs, partnershipByToken } from "@/lib/accountability";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const db = createServerClient();
  const p = await partnershipByToken(db, params.token);
  if (!p) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  const f = await callIcs(db, p, "b", new URL(request.url).searchParams.get("id") || "");
  if (!f) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return new NextResponse(f.text, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${f.filename}"` } });
}
