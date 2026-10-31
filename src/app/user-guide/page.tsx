import { notFound } from "next/navigation";
import { sessionUser, isAlignmentArchitect } from "@/lib/authz";
import { userGuideOpenFor } from "@/lib/userGuide/flag";
import { GUIDE_ENTRIES } from "@/lib/userGuide/entries";
import { guideHomeList } from "@/lib/userGuide/search";
import { createServerClient } from "@/lib/supabase/server";
import UserGuideHome from "./UserGuideHome";

export const dynamic = "force-dynamic";

// Getting Started › User Guide (task 1604): every feature, found by search or by menu area.
export default async function UserGuidePage() {
  const [user, architect] = await Promise.all([sessionUser(), isAlignmentArchitect()]);
  if (!userGuideOpenFor(user?.email, architect)) notFound();
  const entries = GUIDE_ENTRIES.map(({ id, name, where, area, starter }) => ({ id, name, where, area, starter }));
  const { data } = await createServerClient().from("user_guide_opens").select("entry_id, opens").order("opens", { ascending: false }).limit(50);
  const top = guideHomeList(entries, (data ?? []) as { entry_id: string; opens: number }[]);
  return <UserGuideHome entries={entries} topTitle={top.title} top={top.list} />;
}
