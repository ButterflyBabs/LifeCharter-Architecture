import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import { PORTAL_OPEN_TO_ALL } from "@/lib/portalFlag";
import ClientPortals from "./ClientPortals";

export const dynamic = "force-dynamic";

// Clients & Sales › Client Portals (task 1147). Babs only until PORTAL_OPEN_TO_ALL is switched on.
export default async function Page({ searchParams }: { searchParams: { contact?: string } }) {
  if (!PORTAL_OPEN_TO_ALL && !(await isAlignmentArchitect())) notFound();
  return <ClientPortals contactId={typeof searchParams.contact === "string" ? searchParams.contact : null} />;
}
