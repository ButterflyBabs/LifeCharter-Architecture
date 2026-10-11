import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import LifeByDesign from "../life-by-design/LifeByDesign";

export const dynamic = "force-dynamic";

// Alignment Architect only: planning and tracking for the Quarterly Intensive (same workspace as Life by Design).
export default async function QuarterlyIntensivePage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <LifeByDesign event="quarterly-intensive" />;
}
