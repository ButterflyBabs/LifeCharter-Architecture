import { NextResponse } from "next/server";
import { exchangeCode, fetchGoogleEmail, storeCredential, listConnections } from "@/lib/google";
import { currentMailOwner, verifyMailState } from "@/lib/mailOwner";
import { mailboxAllowance } from "@/lib/mailboxes";

export const dynamic = "force-dynamic";

// OAuth redirect target: checks the flow was started by this signed-in
// account, exchanges the code, stores the mailbox under that account.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) return NextResponse.redirect(`${origin}/?google=error`);

  const ownerId = verifyMailState(url.searchParams.get("state"));
  if (!ownerId || ownerId !== (await currentMailOwner())) {
    return NextResponse.redirect(`${origin}/?google=error`);
  }
  try {
    const tokens = await exchangeCode(code, origin);
    const email = tokens.access_token ? await fetchGoogleEmail(tokens.access_token) : null;

    // Re-connecting an address already on the account is always fine; a new
    // one must fit the plan's email-account limit.
    const already = (await listConnections({ ownerId })).some((c) => c.email && email && c.email.toLowerCase() === email.toLowerCase());
    if (!already) {
      const { limit, used } = await mailboxAllowance(ownerId);
      if (limit !== null && used >= limit) return NextResponse.redirect(`${origin}/settings?mail=limit`);
    }
    await storeCredential(ownerId, tokens, email);
    return NextResponse.redirect(`${origin}/?google=connected`);
  } catch (e) {
    console.error("google callback:", e);
    return NextResponse.redirect(`${origin}/?google=error`);
  }
}
