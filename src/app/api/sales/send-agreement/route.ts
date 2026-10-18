import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { sessionUser } from "@/lib/authz";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { sendYear1Agreement } from "@/lib/year1Agreement";

export const dynamic = "force-dynamic";

// Sends the Year-1 Operating Agreement for signature from /sales-reference (Babs, 2026-10-16). The sending itself
// lives in src/lib/year1Agreement.ts (shared with the automatic send after a self-serve Starter sign-up).
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const planId = await ownerMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Owner account not found." }, { status: 500 });
  const user = await sessionUser().catch(() => null);
  const out = await sendYear1Agreement({
    masterPlanId: planId,
    contactId: str(b.contactId, 60) || null,
    name: str(b.name, 120),
    email: str(b.email, 200),
    phone: str(b.phone, 40),
    businessName: str(b.businessName, 160),
    tier: str(b.tier, 20),
    payment: str(b.payment, 20),
    by: user?.email ?? null,
  });
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json({ ok: true, documentId: out.documentId });
}
