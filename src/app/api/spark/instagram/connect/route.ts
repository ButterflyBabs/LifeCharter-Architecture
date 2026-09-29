import { NextResponse } from "next/server";
import { sparkAccount } from "@/lib/spark/guard";
import { igConfigured, signIgState, IG_REDIRECT_URI, IG_SCOPES } from "@/lib/spark/instagram";

export const dynamic = "force-dynamic";

// Owner-only: starts "Connect Instagram" for the signed-in account. It sits under the
// public /api/spark/instagram prefix (for Meta's webhook), so it checks the owner itself.
export async function GET(request: Request) {
  const a = await sparkAccount();
  if ("denied" in a) return a.denied;
  if (!igConfigured()) return NextResponse.redirect(new URL("/lc-spark?tab=instagram&ig=not-set-up", request.url));
  const p = new URLSearchParams({
    client_id: process.env.SPARK_IG_APP_ID!,
    redirect_uri: IG_REDIRECT_URI,
    response_type: "code",
    scope: IG_SCOPES,
    state: signIgState(a.planId),
  });
  return NextResponse.redirect(`https://www.instagram.com/oauth/authorize?${p.toString()}`);
}
