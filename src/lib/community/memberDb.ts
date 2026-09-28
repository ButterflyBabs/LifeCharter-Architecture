// Server-only: a Supabase client that runs as the signed-in member (anon key +
// their cookies), never the service role — so RLS (private channels,
// membership, blocks, suspension) decides what can be read. Used wherever
// member content is gathered for search or the AI.
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function memberSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set() {},
      remove() {},
    },
    global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
export type MemberDb = NonNullable<ReturnType<typeof memberSupabase>>;
