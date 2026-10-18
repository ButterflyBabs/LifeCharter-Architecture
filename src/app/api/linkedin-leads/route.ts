import { ingestLead } from "@/lib/leadIngest";

export const dynamic = "force-dynamic";

// LinkedIn Lead Gen Forms → the Suite, through Make or Zapier. Same private key as the Meta lead-ads address:
// /api/linkedin-leads?k=... (add &masterclass=1 on Babs's account to register the people on the MasterClass Zoom meeting).
export async function POST(request: Request) {
  return ingestLead(request, "linkedin");
}
