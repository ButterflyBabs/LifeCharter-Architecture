import { notFound } from "next/navigation";
import { sessionUser, isAlignmentArchitect } from "@/lib/authz";
import { userGuideOpenFor } from "@/lib/userGuide/flag";
import { GUIDE_ENTRIES } from "@/lib/userGuide/entries";
import UserGuideHome from "./UserGuideHome";

export const dynamic = "force-dynamic";

// Getting Started › User Guide (task 1604): every feature, found by search or by menu area.
export default async function UserGuidePage() {
  const [user, architect] = await Promise.all([sessionUser(), isAlignmentArchitect()]);
  if (!userGuideOpenFor(user?.email, architect)) notFound();
  return <UserGuideHome entries={GUIDE_ENTRIES.map(({ id, name, where, area, starter }) => ({ id, name, where, area, starter }))} />;
}
