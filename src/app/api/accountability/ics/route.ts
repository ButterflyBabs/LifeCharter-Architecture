import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveActor } from "@/lib/authz";
import { crmAccount } from "../../crm/guard";
import { callIcs, partnershipById, sideOfPlan } from "@/lib/accountability";

export const dynamic = "force-dynamic";

// Calendar file for one call, for a signed-in Suite client.
export async function GET(request: Request) {
  const acct = await crmAccount();
  if ("denied" in acct) return acct.denied;
  if ((await resolveActor()).kind === "member") return NextResponse.json({ error: "Not available." }, { status: 403 });
  const url = new URL(request.url);
  const db = createServerClient();
  const p = await partnershipById(db, url.searchParams.get("p") || "");
  const side = p ? sideOfPlan(p, acct.planId) : null;
  if (!p || !side) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const f = await callIcs(db, p, side, url.searchParams.get("id") || "");
  if (!f) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return new NextResponse(f.text, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${f.filename}"` } });
}
