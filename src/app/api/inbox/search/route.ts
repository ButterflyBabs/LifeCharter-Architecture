import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import type { Provider, MergedEmail } from "@/app/api/inbox/route";

export const dynamic = "force-dynamic";

// Full-text search merged across every connected mail account.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limitParam = Number(url.searchParams.get("limit"));
  const perProvider = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20;
  if (!q) return NextResponse.json({ emails: [], query: q });

  const [gToken, mToken] = await Promise.all([
    google.getValidAccessToken(),
    microsoft.getValidAccessToken(),
  ]);

  const emails: MergedEmail[] = [];

  if (gToken) {
    const gEmail = await google.connectedEmail();
    try {
      const g = await google.searchInbox(gToken, q, perProvider);
      emails.push(...g.map((e) => ({ ...e, provider: "google" as Provider, account: gEmail ?? "Gmail" })));
    } catch (e) {
      console.error("search google:", e);
    }
  }
  if (mToken) {
    const mEmail = await microsoft.connectedEmail();
    try {
      const m = await microsoft.searchInbox(mToken, q, perProvider);
      emails.push(
        ...m.map((e) => ({ ...e, provider: "microsoft" as Provider, account: mEmail ?? "Microsoft 365" }))
      );
    } catch (e) {
      console.error("search microsoft:", e);
    }
  }

  emails.sort((a, b) => b.ts - a.ts);
  return NextResponse.json({ emails, query: q });
}
