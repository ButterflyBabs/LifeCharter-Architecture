import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import { VOLANT_OPEN_TO_ALL } from "@/lib/volant";
import Volant from "./Volant";

export const dynamic = "force-dynamic";

// LC Volant: upload or paste a transcript from any app or device, pick one of the 21 templates, get the report,
// and approve each action item into Tasks. Babs only until VOLANT_OPEN_TO_ALL is switched on; then every account.
export default async function Page() {
  if (!VOLANT_OPEN_TO_ALL && !(await isAlignmentArchitect())) notFound();
  return <Volant />;
}
