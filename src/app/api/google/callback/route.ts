import { NextResponse } from "next/server";
import { exchangeCode, storeCredential } from "@/lib/google";

export const dynamic = "force-dynamic";

// OAuth redirect target: exchanges the code for tokens, stores them, returns home.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?google=error`);
  }
  try {
    const tokens = await exchangeCode(code, origin);
    await storeCredential(tokens);
    return NextResponse.redirect(`${origin}/?google=connected`);
  } catch (e) {
    console.error("google callback:", e);
    return NextResponse.redirect(`${origin}/?google=error`);
  }
}
