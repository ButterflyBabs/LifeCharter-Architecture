import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import LinksDirectory from "./LinksDirectory";

export const dynamic = "force-dynamic";

// Alignment Architect only: every URL for every offering and every form, in one place.
export default async function LinksDirectoryPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <LinksDirectory />;
}
