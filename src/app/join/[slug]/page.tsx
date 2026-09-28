import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { JoinView, type JoinSpace } from "@/components/community/JoinView";
import { createServerClient } from "@/lib/supabase/server";

// Public join link for a Collective space: /join/<slug>. "collective" is the
// friendly alias for the main community (Start Here + Community).
const ALIASES: Record<string, string> = { collective: "start-here", community: "start-here" };

async function loadSpace(raw: string): Promise<JoinSpace | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const slug = ALIASES[raw.toLowerCase()] ?? raw.toLowerCase();
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase.rpc("cm_join_preview", { p_slug: slug });
  const row = (Array.isArray(data) ? data[0] : null) as JoinSpace | null;
  if (!row) return null;
  // The bucket is private and visitors here are signed out, so sign this
  // channel's own cover/logo server-side. Only paths inside the channel's
  // spaces/<id>/ folder are ever signed (the database enforces that shape too).
  const [cover_src, logo_src] = await Promise.all([brandingSrc(row.cover_url, row.id), brandingSrc(row.logo_url, row.id)]);
  return { ...row, cover_src, logo_src };
}

async function brandingSrc(value: string | null | undefined, spaceId: string): Promise<string | null> {
  if (!value) return null;
  if (/^https:\/\//.test(value)) return value;
  if (!value.startsWith(`spaces/${spaceId}/`) || value.includes("..")) return null;
  try {
    const { data } = await createServerClient().storage.from("community").createSignedUrl(value, 60 * 60 * 6);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const space = await loadSpace(params.slug);
  const title = space && space.slug !== "start-here" ? `Join ${space.name} — The LifeCharter Collective` : "Join The LifeCharter Collective";
  return { title, description: "Private access — your invitation to The LifeCharter Collective.", robots: { index: false, follow: false } };
}

export default async function JoinPage({ params }: { params: { slug: string } }) {
  const space = await loadSpace(params.slug);
  return <JoinView space={space} />;
}
