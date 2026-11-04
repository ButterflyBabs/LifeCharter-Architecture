import { redirect } from "next/navigation";
import { sessionUser, isAlignmentArchitect } from "@/lib/authz";
import { userGuideOpenFor } from "@/lib/userGuide/flag";
import { GUIDE_ENTRIES } from "@/lib/userGuide/entries";
import { guideHomeList } from "@/lib/userGuide/search";
import { createServerClient } from "@/lib/supabase/server";
import GettingStarted from "./GettingStarted";

export const dynamic = "force-dynamic";

// Getting Started: Set up Suite, First 30 Days, the Starter Guide, the Welcome Overview, the User Guide and the
// Glossary, together on one page (three tabs). New accounts see it in the menu; the old pages keep working.
export default async function GettingStartedPage() {
  const [user, architect] = await Promise.all([sessionUser(), isAlignmentArchitect()]);
  if (!user) redirect("/login");
  const guideOpen = userGuideOpenFor(user.email, architect);
  const entries = guideOpen ? GUIDE_ENTRIES.map(({ id, name, where, area, starter }) => ({ id, name, where, area, starter })) : [];
  const { data } = guideOpen ? await createServerClient().from("user_guide_opens").select("entry_id, opens").order("opens", { ascending: false }).limit(50) : { data: [] };
  const top = guideHomeList(entries, (data ?? []) as { entry_id: string; opens: number }[]);
  return <GettingStarted entries={entries} topTitle={top.title} top={top.list} />;
}
