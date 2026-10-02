import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import AccountabilityCoach from "./AccountabilityCoach";

export const dynamic = "force-dynamic";

// Alignment Architect only: read-only view of the accountability partnerships
// clients have chosen to let their coach see.
export default async function AccountabilityCoachPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <AccountabilityCoach />;
}
