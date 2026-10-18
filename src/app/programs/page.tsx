import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import { PORTAL_OPEN_TO_ALL } from "@/lib/portalFlag";
import Programs from "./Programs";

export const dynamic = "force-dynamic";

// Clients & Sales › Programs (task 1147, second release): group programs and cohorts, shown in each member's portal.
export default async function Page({ searchParams }: { searchParams: { id?: string } }) {
  if (!PORTAL_OPEN_TO_ALL && !(await isAlignmentArchitect())) notFound();
  return <Programs programId={typeof searchParams.id === "string" ? searchParams.id : null} />;
}
