import { NextResponse } from "next/server";
import { getAuthUrl, isGoogleConfigured } from "@/lib/google";

export const dynamic = "force-dynamic";

// Kicks off the Google OAuth consent flow.
export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth is not configured." },
      { status: 500 }
    );
  }
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(getAuthUrl(origin));
}
