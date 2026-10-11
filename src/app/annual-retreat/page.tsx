import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import LifeByDesign from "../life-by-design/LifeByDesign";

export const dynamic = "force-dynamic";

// Alignment Architect only: planning and tracking for the Annual In Person Retreat (same workspace as Life by Design).
export default async function AnnualRetreatPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <LifeByDesign event="annual-retreat" />;
}
