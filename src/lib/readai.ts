import { createServerClient } from "@/lib/supabase/server";

// Read.ai API — OAuth 2.1 with PKCE and dynamic client registration (open
// beta as of Sept 2026, no static API keys). Endpoints confirmed against
// Read.ai's own OIDC discovery document at
// https://authn.read.ai/.well-known/openid-configuration — not guessed.
// Docs: https://support.read.ai/hc/en-us/articles/49380809380371-API-Keys-Authentication
//
// The one-time bootstrap (register a client, send a human to log in and
// consent, exchange the resulting code) happens outside this app — see
// scripts/readai-oauth-bootstrap.md. This file only handles what's ongoing:
// refreshing the access token and calling the API.

const READ_AI_API = "https://api.read.ai/v1";
const TOKEN_ENDPOINT = "https://authn.read.ai/oauth2/token";
const ACCOUNT_KEY = "primary";

function clientId(): string {
  return process.env.READ_AI_CLIENT_ID || "";
}
function clientSecret(): string {
  return process.env.READ_AI_CLIENT_SECRET || "";
}

export function isReadAiConfigured(): boolean {
  return Boolean(clientId() && clientSecret());
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

// Refresh tokens rotate on every use (Read.ai revokes the old one after a
// short grace period) — unlike Google's, the new refresh_token from this
// response MUST be persisted, or the next refresh will fail.
async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`read.ai token refresh ${res.status} ${await res.text()}`);
  return res.json();
}

async function storeCredential(tokens: TokenResponse): Promise<void> {
  const supabase = createServerClient();
  const expiry = new Date(Date.now() + (tokens.expires_in ?? 600) * 1000).toISOString();
  const row: Record<string, unknown> = {
    account_key: ACCOUNT_KEY,
    access_token: tokens.access_token ?? null,
    expiry,
    updated_at: new Date().toISOString(),
  };
  if (tokens.refresh_token) row.refresh_token = tokens.refresh_token;
  await supabase.from("read_ai_credentials").upsert(row, { onConflict: "account_key" });
}

export async function isConnected(): Promise<boolean> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("read_ai_credentials")
    .select("account_key")
    .eq("account_key", ACCOUNT_KEY)
    .maybeSingle();
  return Boolean(data);
}

// Access tokens are short-lived (10 minutes) — in practice this refreshes on
// nearly every call. That's expected, not a bug.
export async function getValidAccessToken(): Promise<string | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("read_ai_credentials")
    .select("access_token, refresh_token, expiry")
    .eq("account_key", ACCOUNT_KEY)
    .maybeSingle();
  if (!data) return null;

  const stillValid = data.expiry && new Date(data.expiry).getTime() > Date.now() + 30_000;
  if (stillValid) return data.access_token ?? null;
  if (!data.refresh_token) return data.access_token ?? null;

  const refreshed = await refreshAccessToken(data.refresh_token);
  await storeCredential(refreshed);
  return refreshed.access_token ?? null;
}

export type ReadAiMeeting = {
  id: string;
  title: string;
  start_time_ms: number;
  end_time_ms: number;
  recording_download?: { url: string; expires_in: number } | null;
};

/**
 * Finds the most recent meeting whose title contains one of `titleContains`
 * (case-insensitive) with a start time on or after `sinceMs`, that already
 * has a recording ready. Returns null — not an error — if nothing matches
 * yet, since Read.ai can take a while to finish processing after a call
 * ends; callers should treat that as "try again on the next scheduled run."
 */
export async function findRecentMeetingRecording(
  accessToken: string,
  opts: { titleContains: string[]; sinceMs: number; untilMs?: number }
): Promise<ReadAiMeeting | null> {
  const params = new URLSearchParams({
    limit: "10",
    start_datetime_gte: new Date(opts.sinceMs).toISOString(),
    expand: "recording_download",
  });
  if (opts.untilMs) params.set("start_datetime_lte", new Date(opts.untilMs).toISOString());

  const res = await fetch(`${READ_AI_API}/meetings?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`read.ai meetings ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { data: ReadAiMeeting[] };

  const needles = opts.titleContains.map((s) => s.toLowerCase());
  const match = data.data.find(
    (m) => needles.some((n) => m.title.toLowerCase().includes(n)) && m.recording_download?.url
  );
  return match ?? null;
}
