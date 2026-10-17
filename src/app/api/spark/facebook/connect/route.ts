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
  // An app set up for "Facebook Login for Business" asks for permissions through a saved configuration (config_id) instead of a
  // scope list. When SPARK_FB_CONFIG_ID is set we use it; otherwise the classic scope list.
  const configId = process.env.SPARK_FB_CONFIG_ID;
  const p = new URLSearchParams({
    client_id: process.env.SPARK_FB_APP_ID!,
    redirect_uri: FB_REDIRECT_URI,
    response_type: "code",
    state: signFbState(a.planId),
    ...(configId ? { config_id: configId, override_default_response_type: "true" } : { scope: FB_SCOPES }),
  });
  return NextResponse.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${p.toString()}`);
}
