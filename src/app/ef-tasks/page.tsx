import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import EfTasks from "./EfTasks";

export const dynamic = "force-dynamic";

// Alignment Architect only (Babs): the Embraced;Fully task list. Not a client feature, not shown to the team.
export default async function EfTasksPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <EfTasks />;
}
