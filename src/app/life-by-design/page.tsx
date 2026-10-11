import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import LifeByDesign from "./LifeByDesign";

export const dynamic = "force-dynamic";

// Alignment Architect only: planning and tracking for the Life by Design Summit (April 15-17, 2027).
export default async function LifeByDesignPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <LifeByDesign />;
}
