import { NextResponse } from "next/server";
import { exchangeCode, storeCredential, getConnectedEmail, listConnections } from "@/lib/microsoft";
import { currentMailOwner, verifyMailState } from "@/lib/mailOwner";
import { mailboxAllowance } from "@/lib/mailboxes";
import { completeHostConnect, isHostState, verifyHostState } from "@/lib/booking/connections";

export const dynamic = "force-dynamic";

// OAuth redirect target: checks the flow was started by this signed-in
// account, records the mailbox's address, stores it under that account.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // A booking host connecting their calendar (private link, no Suite login).
  const state = url.searchParams.get("state");
  if (isHostState(state)) {
    const h = verifyHostState(state);
    const back = h?.back && h.back.startsWith("/") ? h.back : "/";
    if (!h || error || !code) return NextResponse.redirect(`${origin}${back}${back.includes("?") ? "&" : "?"}connected=error`);
    try {
      await completeHostConnect("microsoft", code, origin, h.hostId);
      return NextResponse.redirect(`${origin}${back}${back.includes("?") ? "&" : "?"}connected=microsoft`);
    } catch (e) {
      console.error("booking host connect:", e);
      return NextResponse.redirect(`${origin}${back}${back.includes("?") ? "&" : "?"}connected=error`);
    }
  }

  if (error || !code) {
    const desc = url.searchParams.get("error_description") ?? error ?? "no code returned";
    return NextResponse.redirect(
      `${origin}/?microsoft=error&reason=${encodeURIComponent(String(desc).slice(0, 400))}`
    );
  }
  const ownerId = verifyMailState(url.searchParams.get("state"));
  if (!ownerId || ownerId !== (await currentMailOwner())) {
    return NextResponse.redirect(`${origin}/?microsoft=error&reason=${encodeURIComponent("Sign-in session mismatch")}`);
  }
  try {
    const tokens = await exchangeCode(code, origin);
    const email = tokens.access_token ? await getConnectedEmail(tokens.access_token) : null;

    const already = (await listConnections({ ownerId })).some((c) => c.email && email && c.email.toLowerCase() === email.toLowerCase());
    if (!already) {
      const { limit, used } = await mailboxAllowance(ownerId);
      if (limit !== null && used >= limit) return NextResponse.redirect(`${origin}/settings?mail=limit`);
    }
    await storeCredential(ownerId, tokens, email);
    return NextResponse.redirect(`${origin}/?microsoft=connected`);
  } catch (e) {
    console.error("microsoft callback:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.redirect(
      `${origin}/?microsoft=error&reason=${encodeURIComponent(msg.slice(0, 400))}`
    );
  }
}
