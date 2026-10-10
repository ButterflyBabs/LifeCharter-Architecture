import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import ViewAs from "./ViewAs";

export const dynamic = "force-dynamic";

// Alignment Architect only: open a client's account read-only, for support. Every opening is logged
// and the client can see it in their Settings.
export default async function ViewAsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <ViewAs />;
}
