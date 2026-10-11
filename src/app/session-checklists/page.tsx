import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import SessionChecklists from "./SessionChecklists";

export const dynamic = "force-dynamic";

// Alignment Architect only: every MasterClass and Incubator session and its checklist.
export default async function SessionChecklistsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <SessionChecklists />;
}
