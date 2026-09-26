import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { crossOriginBlocked } from "@/lib/security";
import { currentMailOwner } from "@/lib/mailOwner";
import { listMailAccounts, mailboxAllowance } from "@/lib/mailboxes";

export const dynamic = "force-dynamic";

// The signed-in account's connected email accounts and how many its plan allows.
export async function GET() {
  const ownerId = await currentMailOwner();
  if (!ownerId) return NextResponse.json({ accounts: [], limit: null, used: 0 });
  const [accounts, { limit, used }] = await Promise.all([listMailAccounts({ ownerId }), mailboxAllowance(ownerId)]);
  return NextResponse.json({ accounts, limit, used });
}

// Disconnect one connected email account.
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const ownerId = await currentMailOwner();
  if (!ownerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const accountKey = body?.accountKey ? String(body.accountKey) : "";
  if (!accountKey) return NextResponse.json({ error: "accountKey required" }, { status: 400 });
  const lib = body?.provider === "microsoft" ? microsoft : google;
  await lib.removeConnection(ownerId, accountKey);
  return NextResponse.json({ ok: true });
}
