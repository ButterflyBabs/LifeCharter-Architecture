import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import EfProjectDetail from "./EfProjectDetail";

export const dynamic = "force-dynamic";

// One Embraced;Fully project. Babs only, always.
export default async function EfProjectPage({ params }: { params: { id: string } }) {
  if (!(await isAlignmentArchitect())) notFound();
  return <EfProjectDetail id={params.id} />;
}
