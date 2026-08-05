import { NextResponse } from "next/server";
import { getAuthUrl, isMicrosoftConfigured } from "@/lib/microsoft";

export const dynamic = "force-dynamic";

// Kicks off the Microsoft 365 OAuth consent flow.
export async function GET(request: Request) {
  if (!isMicrosoftConfigured()) {
    return NextResponse.json({ error: "Microsoft OAuth is not configured." }, { status: 500 });
  }
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(getAuthUrl(origin));
}
