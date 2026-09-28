import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

// Collective search (posts + replies). The query runs through the signed-in
// member's OWN Supabase session (anon key + their cookies), never the service
// role, and cm_search() is SECURITY INVOKER — so the same RLS the feed uses
// (private channels, membership, blocks, suspended members) decides what can
// match. Nothing from a channel they can't open is ever returned.

interface Row {
  kind: "post" | "reply";
  id: string;
  post_id: string;
  post_title: string | null;
  body: string;
  space_id: string;
  space_slug: string;
  space_name: string;
  space_emoji: string | null;
  space_logo: string | null;
  channel_slug: string;
  channel_name: string;
  author_id: string;
  created_at: string;
}

function snippet(text: string, q: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  const lower = flat.toLowerCase();
  const terms = [q, ...q.split(/\s+/)].map((t) => t.toLowerCase().replace(/^["-]+|"+$/g, "")).filter((t) => t.length >= 2);
  let at = -1;
  for (const t of terms) {
    at = lower.indexOf(t);
    if (at >= 0) break;
  }
  if (at < 0) return flat.length > 180 ? `${flat.slice(0, 180).trimEnd()}…` : flat;
  const start = Math.max(0, at - 70);
  const end = Math.min(flat.length, at + 130);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end).trim()}${end < flat.length ? "…" : ""}`;
}

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Search isn't available right now." }, { status: 503 });

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const cookieStore = cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set() {},
      remove() {},
    },
    global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: "no-store" }) },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data, error } = await supabase.rpc("cm_search", { p_q: q, p_limit: 30 });
  if (error) return NextResponse.json({ error: "Search didn't work — please try again." }, { status: 500 });
  const rows = (data as Row[] | null) ?? [];

  // Author names, read through the same session (fellow members only).
  const ids = Array.from(new Set(rows.map((r) => r.author_id)));
  const names = new Map<string, { name: string; avatar: string | null }>();
  if (ids.length) {
    const { data: people } = await supabase.from("cm_profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
    for (const p of (people as { user_id: string; display_name: string; avatar_url: string | null }[] | null) ?? []) {
      names.set(p.user_id, { name: p.display_name, avatar: p.avatar_url });
    }
  }

  const results = rows.map((r) => ({
    kind: r.kind,
    id: r.id,
    postId: r.post_id,
    postTitle: r.post_title,
    snippet: snippet(r.body, q),
    channel: { slug: r.space_slug, name: r.space_name, emoji: r.space_emoji, logo: r.space_logo },
    pathway: { slug: r.channel_slug, name: r.channel_name },
    author: { id: r.author_id, name: names.get(r.author_id)?.name ?? "Member", avatar: names.get(r.author_id)?.avatar ?? null },
    createdAt: r.created_at,
    href: r.kind === "reply" ? `/community/post/${r.post_id}#c-${r.id}` : `/community/post/${r.post_id}`,
  }));
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
