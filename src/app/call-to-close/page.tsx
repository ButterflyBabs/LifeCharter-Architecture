import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect, sessionUser } from "@/lib/authz";
import { housePlanId } from "@/lib/housePlan";
import { consultantBoards } from "@/lib/c2c";
import CallToClose from "./CallToClose";

export const dynamic = "force-dynamic";

// A Call to Close consultant's whole workspace: their pipeline, contacts, calendar and sales resources. Only someone who
// owns a Call to Close board sees it (and Babs, who can look at a consultant's view with ?as=<their email>).
export default async function CallToClosePage({ searchParams }: { searchParams: { as?: string } }) {
  const user = await sessionUser();
  if (!user?.email) notFound();
  const as = searchParams.as && (await isAlignmentArchitect()) ? searchParams.as : null;
  const db = createServerClient();
  const plan = await housePlanId(db);
  if (!plan) notFound();
  if (!(await consultantBoards(db, plan, as || user.email!)).length) notFound();
  return <CallToClose as={as} />;
}
