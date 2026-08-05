import { NextResponse } from "next/server";
import { exchangeCode, storeCredential, getConnectedEmail } from "@/lib/microsoft";

export const dynamic = "force-dynamic";

// OAuth redirect target: exchanges the code for tokens, records the account
// email, stores them, returns home.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    const desc = url.searchParams.get("error_description") ?? error ?? "no code returned";
    return NextResponse.redirect(
      `${origin}/?microsoft=error&reason=${encodeURIComponent(String(desc).slice(0, 400))}`
    );
  }
  try {
    const tokens = await exchangeCode(code, origin);
    const email = tokens.access_token ? await getConnectedEmail(tokens.access_token) : null;
    await storeCredential(tokens, email ?? undefined);
    return NextResponse.redirect(`${origin}/?microsoft=connected`);
  } catch (e) {
    console.error("microsoft callback:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.redirect(
      `${origin}/?microsoft=error&reason=${encodeURIComponent(msg.slice(0, 400))}`
    );
  }
}
