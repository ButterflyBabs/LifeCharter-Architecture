import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import PlatformCosts from "./PlatformCosts";

export const dynamic = "force-dynamic";

// Alignment Architect only: what the platform really costs each month, and per client.
export default async function PlatformCostsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <PlatformCosts />;
}
