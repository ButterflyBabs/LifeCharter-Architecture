import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import type { InboxEmail } from "@/lib/google";

export const dynamic = "force-dynamic";

export type Provider = "google" | "microsoft";
export type MergedEmail = InboxEmail & { provider: Provider; account: string };

// Live inbox merged across every connected mail account (Gmail + Microsoft 365).
export async function GET(request: Request) {
  const limitParam = Number(new URL(request.url).searchParams.get("limit"));
  const perProvider = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 12;

  const [gToken, mToken] = await Promise.all([
    google.getValidAccessToken(),
    microsoft.getValidAccessToken(),
  ]);

  const emails: MergedEmail[] = [];
  const accounts: Array<{ provider: Provider; email: string; label: string }> = [];
  const providers = { google: false, microsoft: false };

  if (gToken) {
    providers.google = true;
    const gEmail = await google.connectedEmail();
    accounts.push({ provider: "google", email: gEmail ?? "", label: gEmail ?? "Gmail" });
    try {
      const g = await google.fetchInbox(gToken, perProvider);
      emails.push(...g.map((e) => ({ ...e, provider: "google" as const, account: gEmail ?? "Gmail" })));
    } catch (e) {
      console.error("inbox google:", e);
    }
  }

  if (mToken) {
    providers.microsoft = true;
    const mEmail = await microsoft.connectedEmail();
    accounts.push({ provider: "microsoft", email: mEmail ?? "", label: mEmail ?? "Microsoft 365" });
    try {
      const m = await microsoft.fetchInbox(mToken, perProvider);
      emails.push(
        ...m.map((e) => ({ ...e, provider: "microsoft" as const, account: mEmail ?? "Microsoft 365" }))
      );
    } catch (e) {
      console.error("inbox microsoft:", e);
    }
  }

  // Interleave the two accounts newest-first.
  emails.sort((a, b) => b.ts - a.ts);

  return NextResponse.json({
    connected: providers.google || providers.microsoft,
    providers,
    accounts,
    emails,
  });
}
