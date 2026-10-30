import { notFound } from "next/navigation";
import { sessionUser, isAlignmentArchitect } from "@/lib/authz";
import { guideEntry } from "@/lib/userGuide/entries";
import { userGuideOpenFor } from "@/lib/userGuide/flag";
import UserGuideEntry from "./UserGuideEntry";

export const dynamic = "force-dynamic";

// One entry in the User Guide.
export default async function UserGuideEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, architect] = await Promise.all([sessionUser(), isAlignmentArchitect()]);
  const entry = guideEntry(id);
  if (!entry || !userGuideOpenFor(user?.email, architect)) notFound();
  return <UserGuideEntry entry={entry} />;
}
