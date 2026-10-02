import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import PreFounderCall from "./PreFounderCall";

export const dynamic = "force-dynamic";

// Alignment Architect only: the script for the Pre-Founder 1:1 calls, with notes
// that save straight onto the contact's card.
export default async function PreFounderCallPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <PreFounderCall />;
}
