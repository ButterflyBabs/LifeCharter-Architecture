import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ONE-TIME setup route for the Read.ai OAuth connection (open-beta API, no
// static keys — see src/lib/readai.ts). Not part of the app's normal auth;
// there is no ongoing "reconnect" UI for this like there is for Google,
// because Read.ai's beta flow sends the authorization code to their own
// hosted page (https://api.read.ai/oauth/ui) rather than back to us, so
// completing it means: open that flow in a browser, copy the `code` shown
// there, then hit THIS route once with it as a query param.
//
// Self-disables after first success (won't silently overwrite a working
// connection) — pass ?force=1 to deliberately reconnect.
//
// The PKCE verifier below is single-use and tied to the specific
// authorization URL issued for this bootstrap; it has no value once this
// route has been used successfully, so leaving it in source isn't a
// standing secret the way the client secret or a refresh token is.
const CODE_VERIFIER = "JBNTBUxvt-Mpg0wmIBMgUxiLBIhIxdQ5Z5UEwvZTYtWt3Yt-M7KuIp8ZHfzZDhu97BwyKRUA9axyj0qgDYNVSQ";
const EXPECTED_STATE = "QlblrbeOT-L1rGatPhgyqyRjLt7wtmJm";
const TOKEN_ENDPOINT = "https://authn.read.ai/oauth2/token";
const REDIRECT_URI = "https://api.read.ai/oauth/ui";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const force = url.searchParams.get("force") === "1";

  if (!code) {
    return NextResponse.json(
      { error: "missing ?code= — paste the code from the Read.ai consent page" },
      { status: 400 }
    );
  }
  if (state && state !== EXPECTED_STATE) {
    return NextResponse.json({ error: "state mismatch — this code wasn't issued for this flow" }, { status: 400 });
  }

  const clientId = process.env.READ_AI_CLIENT_ID || "";
  const clientSecret = process.env.READ_AI_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "READ_AI_CLIENT_ID / READ_AI_CLIENT_SECRET not set" }, { status: 500 });
  }

  const supabase = createServerClient();
  if (!force) {
    const { data: existing } = await supabase
      .from("read_ai_credentials")
      .select("account_key")
      .eq("account_key", "primary")
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { status: "already connected — pass ?force=1 to reconnect deliberately" },
        { status: 409 }
      );
    }
  }

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: CODE_VERIFIER,
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    console.error("readai bootstrap: token exchange failed", tokenRes.status, detail);
    return NextResponse.json({ error: "token exchange failed", status: tokenRes.status, detail }, { status: 502 });
  }

  const tokens = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const expiry = new Date(Date.now() + (tokens.expires_in ?? 600) * 1000).toISOString();
  const { error } = await supabase.from("read_ai_credentials").upsert(
    {
      account_key: "primary",
      access_token: tokens.access_token ?? null,
      refresh_token: tokens.refresh_token ?? null,
      expiry,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_key" }
  );
  if (error) {
    console.error("readai bootstrap: store failed", error);
    return NextResponse.json({ error: "token exchange succeeded but storing it failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "connected", hasRefreshToken: Boolean(tokens.refresh_token) });
}
