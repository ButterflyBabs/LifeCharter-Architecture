import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import PlannerSalesManager from "./PlannerSalesManager";

export const dynamic = "force-dynamic";

// Alignment Architect only: sales, free downloads and giveaway coupon codes
// for the digital planners (amilynnecarroll.com/planners).
export default async function PlannerSalesPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <PlannerSalesManager />;
}
