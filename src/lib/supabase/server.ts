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
    }
  );
}

// Alias for backward compatibility
export { createServerClient as createClient };
