import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import LessonsManager from "./LessonsManager";

export const dynamic = "force-dynamic";

// Alignment Architect only: the lessons every client sees on their weak areas.
export default async function LessonsManagerPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <LessonsManager />;
}
