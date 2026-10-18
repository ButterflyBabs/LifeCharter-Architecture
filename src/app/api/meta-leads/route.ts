import { ingestLead } from "@/lib/leadIngest";

export const dynamic = "force-dynamic";

// Meta lead ads (Facebook and Instagram) → the Suite, through Make or Zapier. The work is shared with the LinkedIn lead-form address
// in src/lib/leadIngest.ts. Same secret address as before: /api/meta-leads?k=...
export async function POST(request: Request) {
  return ingestLead(request, "meta");
}
