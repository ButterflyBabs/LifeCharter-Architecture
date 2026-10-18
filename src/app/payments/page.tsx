import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import { PAYMENTS_OPEN_TO_ALL } from "@/lib/paymentsFlag";
import Payments from "./Payments";

export const dynamic = "force-dynamic";

// Payments & Invoices: every payment on the client's own Stripe account, and invoices (or invoice payment plans) sent
// from a contact. Babs only until PAYMENTS_OPEN_TO_ALL is switched on.
export default async function Page({ searchParams }: { searchParams: { contact?: string } }) {
  if (!PAYMENTS_OPEN_TO_ALL && !(await isAlignmentArchitect())) notFound();
  return <Payments contactId={typeof searchParams.contact === "string" ? searchParams.contact : null} />;
}
