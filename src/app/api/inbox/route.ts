import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import type { InboxEmail } from "@/lib/google";
import { openMailboxes } from "@/lib/mailboxes";

export const dynamic = "force-dynamic";

export type Provider = "google" | "microsoft";
export type MergedEmail = InboxEmail & { provider: Provider; account: string; accountKey: string };

// Live inbox merged across every mail account the signed-in account has
// connected (Gmail + Microsoft 365, as many as their plan allows).
export async function GET(request: Request) {
  const limitParam = Number(new URL(request.url).searchParams.get("limit"));
  const perMailbox = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 12;

  const boxes = await openMailboxes();
  const emails: MergedEmail[] = [];
  const accounts: Array<{ provider: Provider; email: string; label: string; accountKey: string }> = [];
  const providers = { google: false, microsoft: false };

  await Promise.all(
    boxes.map(async (box) => {
      providers[box.provider] = true;
      accounts.push({ provider: box.provider, email: box.email ?? "", label: box.label, accountKey: box.accountKey });
      try {
        const rows =
          box.provider === "google"
            ? await google.fetchInbox(box.token, perMailbox)
            : await microsoft.fetchInbox(box.token, perMailbox);
        emails.push(...rows.map((e) => ({ ...e, provider: box.provider, account: box.label, accountKey: box.accountKey })));
      } catch (e) {
        console.error(`inbox ${box.provider}:`, e);
      }
    })
  );

  // Interleave every account newest-first.
  emails.sort((a, b) => b.ts - a.ts);

  return NextResponse.json({
    connected: boxes.length > 0,
    providers,
    accounts,
    emails,
  });
}
