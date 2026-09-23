import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { JoinView, type JoinSpace } from "@/components/community/JoinView";

// Public join link for a Collective space: /join/<slug>. "collective" is the
// friendly alias for the main community (Start Here + The Commons).
const ALIASES: Record<string, string> = { collective: "start-here", community: "start-here" };

async function loadSpace(raw: string): Promise<JoinSpace | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const slug = ALIASES[raw.toLowerCase()] ?? raw.toLowerCase();
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase.rpc("cm_join_preview", { p_slug: slug });
  const row = Array.isArray(data) ? data[0] : null;
  return (row as JoinSpace) ?? null;
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
