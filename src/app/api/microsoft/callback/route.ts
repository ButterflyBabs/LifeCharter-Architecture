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
    return NextResponse.redirect(`${origin}/?microsoft=error`);
  }
  try {
    const tokens = await exchangeCode(code, origin);
    const email = tokens.access_token ? await getConnectedEmail(tokens.access_token) : null;
    await storeCredential(tokens, email ?? undefined);
    return NextResponse.redirect(`${origin}/?microsoft=connected`);
  } catch (e) {
    console.error("microsoft callback:", e);
    return NextResponse.redirect(`${origin}/?microsoft=error`);
  }
}
