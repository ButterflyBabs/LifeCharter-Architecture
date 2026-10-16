import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import EfProjects from "./EfProjects";

export const dynamic = "force-dynamic";

// Embraced;Fully projects. Babs only, always.
export default async function EfProjectsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <EfProjects />;
}
