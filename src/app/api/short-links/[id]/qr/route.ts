import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "@/app/api/crm/guard";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

// A scannable QR code (PNG) for one short link, generated on the fly —
// nothing is pre-rendered or stored, so editing the destination later never
// leaves a stale code behind; the QR always points at the stable /l/<code>.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { data: link } = await db.from("short_links").select("code").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
  if (!link) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const shortUrl = `${APP_URL}/l/${link.code}`;
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
