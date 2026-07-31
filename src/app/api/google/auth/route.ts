import { NextResponse } from "next/server";
import { getAuthUrl, isGoogleConfigured } from "@/lib/google";

export const dynamic = "force-dynamic";

// Kicks off the Google OAuth consent flow.
export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    // Diagnostic (names only, never values) to reveal an env-var name mismatch.
    const googleEnvKeysPresent = Object.keys(process.env).filter((k) =>
      k.toUpperCase().includes("GOOGLE")
    );
    return NextResponse.json(
      {
        error: "Google OAuth is not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).",
        hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
        hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
        googleEnvKeysPresent,
      },
      { status: 500 }
    );
  }
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(getAuthUrl(origin));
}
