import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import type { MergedEmail } from "@/app/api/inbox/route";
import { openMailboxes } from "@/lib/mailboxes";

export const dynamic = "force-dynamic";

// Full-text search merged across every connected mail account.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limitParam = Number(url.searchParams.get("limit"));
  const perMailbox = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20;
  if (!q) return NextResponse.json({ emails: [], query: q });

  const boxes = await openMailboxes();
  const emails: MergedEmail[] = [];

  await Promise.all(
    boxes.map(async (box) => {
      try {
        const rows =
          box.provider === "google"
            ? await google.searchInbox(box.token, q, perMailbox)
            : await microsoft.searchInbox(box.token, q, perMailbox);
        emails.push(...rows.map((e) => ({ ...e, provider: box.provider, account: box.label, accountKey: box.accountKey })));
      } catch (e) {
        console.error(`search ${box.provider}:`, e);
      }
    })
  );

  emails.sort((a, b) => b.ts - a.ts);
  return NextResponse.json({ emails, query: q });
}
