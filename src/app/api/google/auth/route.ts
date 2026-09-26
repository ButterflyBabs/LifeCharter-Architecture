import { NextResponse } from "next/server";
import { getAuthUrl, isGoogleConfigured } from "@/lib/google";
import { currentMailOwner, signMailState } from "@/lib/mailOwner";
import { mailboxAllowance } from "@/lib/mailboxes";

export const dynamic = "force-dynamic";

// Kicks off the Google OAuth consent flow for the signed-in account.
export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 500 });
  }
  const origin = new URL(request.url).origin;
  const ownerId = await currentMailOwner();
  if (!ownerId) return NextResponse.redirect(`${origin}/login`);

  const { limit, used } = await mailboxAllowance(ownerId);
  if (limit !== null && used >= limit) return NextResponse.redirect(`${origin}/settings?mail=limit`);

  return NextResponse.redirect(getAuthUrl(origin, signMailState(ownerId)));
}
