import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "@/app/api/crm/guard";
import { shortUrlFor } from "@/lib/shortLinks";

export const dynamic = "force-dynamic";

// A scannable QR code (PNG) for one short link, generated on the fly —
// nothing is pre-rendered or stored, so editing the destination later never
// leaves a stale code behind. Encodes the account's own verified domain when
// it has one, so a printed code never carries lccommandsuite.com.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const [{ data: link }, { data: plan }] = await Promise.all([
    db.from("short_links").select("code").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle(),
    db.from("client_master_plans").select("short_link_domain, short_link_domain_status").eq("id", a.planId).maybeSingle(),
  ]);
  if (!link) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const shortUrl = shortUrlFor(link.code as string, { status: (plan?.short_link_domain_status as string) || "not_started", domain: (plan?.short_link_domain as string) || null });
  const png = await QRCode.toBuffer(shortUrl, {
    type: "png",
    width: 640,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0F1A38FF", light: "#FFFFFFFF" },
  });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${link.code}-qr.png"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
