import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";

export function createServerClient() {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {
          // No-op
        },
        remove() {
          // No-op
        },
      },
      // Next.js patches global fetch and caches GET responses in its Data Cache.
      // The Supabase client talks to PostgREST via fetch, so without this every
      // read would replay the first cached result. Force no-store on all of them.
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}

// Alias for backward compatibility
export { createServerClient as createClient };
