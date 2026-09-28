import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient as createSessionClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Short-lived links for files in the Collective's private "community" bucket.
//
// 1. Who's asking is read from the member's OWN Supabase session (anon key +
//    their cookies), and cm_readable_files() runs as them — it keeps only the
//    paths they can actually see: posts/replies in channels they can open
//    (cm_can_view_space, same as the feed), conversations they're in
//    (cm_in_thread), avatars, library files, branding, their own uploads.
// 2. Only those paths are then signed with the service role, for 15 minutes.
// Anything else simply comes back without a link.

const BUCKET = "community";
const TTL_SECONDS = 15 * 60;
const MAX_PATHS = 60;

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Files aren't available right now." }, { status: 503 });

  let paths: string[] = [];
  try {
    const body = (await request.json()) as { paths?: unknown };
    if (Array.isArray(body.paths)) paths = body.paths.filter((p): p is string => typeof p === "string" && p.length > 0 && p.length < 512);
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  paths = Array.from(new Set(paths.filter((p) => !p.includes("..") && !p.startsWith("/")))).slice(0, MAX_PATHS);
  if (!paths.length) return NextResponse.json({ urls: {} });

  const cookieStore = cookies();
  const session = createSessionClient(url, key, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set() {},
      remove() {},
    },
    global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: "no-store" }) },
  });
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data: allowed, error } = await session.rpc("cm_readable_files", { p_paths: paths });
  if (error) return NextResponse.json({ error: "Couldn't open these files." }, { status: 500 });
  // A SETOF text function comes back as plain strings (or {fn: value} rows on older PostgREST).
  const ok = ((allowed as unknown[] | null) ?? [])
    .map((r) => (typeof r === "string" ? r : r && typeof r === "object" ? String(Object.values(r)[0] ?? "") : ""))
    .filter((p) => paths.includes(p));

  const urls: Record<string, string> = {};
  if (ok.length) {
    const { data: signed } = await createServerClient().storage.from(BUCKET).createSignedUrls(ok, TTL_SECONDS);
    for (const s of signed ?? []) if (s.path && s.signedUrl && !s.error) urls[s.path] = s.signedUrl;
  }
  return NextResponse.json({ urls, ttl: TTL_SECONDS }, { headers: { "Cache-Control": "no-store" } });
}
