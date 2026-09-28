import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import SequencesManager from "./SequencesManager";

export const dynamic = "force-dynamic";

// Alignment Architect only: timed email series (The Life Shift and more).
export default async function SequencesManagerPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <SequencesManager />;
}
