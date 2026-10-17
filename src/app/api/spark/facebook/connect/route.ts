import { NextResponse } from "next/server";
import { sparkAccount } from "@/lib/spark/guard";
import { fbConfigured, signFbState, FB_REDIRECT_URI, FB_SCOPES } from "@/lib/spark/facebook";

export const dynamic = "force-dynamic";

// Owner-only: starts "Connect Facebook" for the signed-in account. It sits under the public /api/spark/facebook prefix
// (for Meta's webhook), so it checks the owner itself.
export async function GET(request: Request) {
  const a = await sparkAccount();
  if ("denied" in a) return a.denied;
  if (!fbConfigured()) return NextResponse.redirect(new URL("/lc-spark?tab=facebook&fb=not-set-up", request.url));
  const p = new URLSearchParams({
    client_id: process.env.SPARK_FB_APP_ID!,
    redirect_uri: FB_REDIRECT_URI,
    response_type: "code",
    scope: FB_SCOPES,
    state: signFbState(a.planId),
  });
  return NextResponse.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${p.toString()}`);
}
