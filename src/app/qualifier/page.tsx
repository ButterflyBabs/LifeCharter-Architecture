import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import { QUALIFIER_OPEN_TO_ALL } from "@/lib/qualifier";
import Qualifier from "./Qualifier";

export const dynamic = "force-dynamic";

// Prospect Qualifier: score a profile (or a whole list) against your Ideal Client Profile and send the good ones
// to an Outreach Pipeline. Babs only until QUALIFIER_OPEN_TO_ALL is switched on.
export default async function QualifierPage() {
  if (!QUALIFIER_OPEN_TO_ALL && !(await isAlignmentArchitect())) notFound();
  return <Qualifier />;
}
