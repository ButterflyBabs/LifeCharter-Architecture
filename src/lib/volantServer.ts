import { NextResponse } from "next/server";
import { crmAccount, type CrmAccount } from "@/app/api/crm/guard";
import { VOLANT_OPEN_TO_ALL } from "@/lib/volant";

// The gate for every LC Volant route: the CRM gate (signed in, own account, the demo can read but never write),
// narrowed to the Alignment Architect until VOLANT_OPEN_TO_ALL is switched on.
export async function volantAccount(request?: Request): Promise<CrmAccount | { denied: NextResponse }> {
  const a = await crmAccount(request);
  if ("denied" in a) return a;
  if (!VOLANT_OPEN_TO_ALL && !a.isArchitect) return { denied: NextResponse.json({ error: "not found" }, { status: 404 }) };
  return a;
}
