import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { aiClient, extractJson } from "@/lib/ai/client";
import { resolveAiConfig } from "@/lib/ai/config";
import { memberAiGate } from "@/lib/ai/memberCap";
import { PORTAL_BUCKET } from "@/lib/portal";
import { cleanReceiptRead } from "@/lib/finance/receipts";
import { loadTaxSettings } from "@/lib/salesTaxServer";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

// Receipt photos (task 1150 part 1).
//   POST multipart { file }  -> saves the photo and has the client's assistant read it (vendor, date, amount, category,
//                               description, and the GST/HST shown when the account is registered, and the QST for a Quebec QST registrant). Nothing is posted: the Expenses page shows it as a draft to approve.
//   GET ?entry=<id>          -> opens the receipt kept on an expense (a short-lived private link)
const MAX = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a photo of the receipt." }, { status: 400 });
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return NextResponse.json({ error: "Use a photo (JPG, PNG or WebP). On an iPhone, a normal camera photo works." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Photos can be up to 8 MB." }, { status: 400 });

  const { key } = await resolveAiConfig();
  const overCap = await memberAiGate(key);
  if (overCap) return overCap;
  if (!key) return NextResponse.json({ needsKey: true, error: "Add your AI key in Settings > AI first (the same one your assistant uses), then try again." }, { status: 400 });

  const db = createServerClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `${planId}/receipts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const up = await db.storage.from(PORTAL_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (up.error) return NextResponse.json({ error: "The photo didn't upload. Please try again." }, { status: 500 });

  // Their own categories first, so the suggestion matches how they already sort expenses.
  const { data: cats } = await db.from("finance_entries").select("category").eq("master_plan_id", planId).eq("type", "expense").not("category", "is", null).limit(1000);
  const categories = Array.from(new Set(((cats ?? []) as { category: string }[]).map((c) => c.category).filter(Boolean))).slice(0, 40);
  const today = new Date().toISOString().slice(0, 10);
  // Registered for GST/HST: also read the GST/HST printed on the receipt, so it can be claimed back.
  const settings = await loadTaxSettings(planId, db).catch(() => null);
  const registered = settings?.registered ?? false;
  // A Quebec QST registrant: also read the QST (TVQ), which is claimed back too. PST is part of the cost, so never split out.
  const qst = Boolean(settings?.provincial.QC?.registered);
  const taxAsk =
    (registered
      ? `, "tax": the GST/HST (or HST, or GST) amount printed on the receipt as a number, only the GST/HST line (not PST, QST or tips), 0 if none is printed`
      : "") + (qst ? `, "provTax": the QST (TVQ) amount printed on the receipt as a number, only the QST line, 0 if none is printed` : "");
  let read = cleanReceiptRead({}, today);
  try {
    const ai = aiClient(key, { timeout: 80000 });
    const completion = await ai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 600,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `You read a photo of a receipt or invoice for a small business owner's bookkeeping. Reply with JSON only: {"vendor": who was paid (the business name on the receipt), "date": "YYYY-MM-DD" (the purchase date; today is ${today}), "amount": the TOTAL paid as a number with no currency sign${taxAsk}, "currency": "USD" or "CAD" only if the receipt clearly shows which (e.g. "CAD", "CA$", "USD", "US$", a Canadian GST/HST line), else "", "category": the best fit, preferring one of these existing categories if any fits: ${JSON.stringify(categories)}, else a short common business category, "description": a few words on what was bought, "confident": true or false}. If something can't be read, use an empty string (or 0 for amount) and set confident to false. Never guess a total that isn't printed.` },
        { role: "user", content: [{ type: "text", text: "Read this receipt." }, { type: "image_url", image_url: { url: `data:${file.type};base64,${bytes.toString("base64")}` } }] },
      ],
    });
    read = cleanReceiptRead(JSON.parse(extractJson(completion.choices[0]?.message?.content?.trim() || "{}")), today);
  } catch (e) {
    console.error("receipt read:", e);
  }
  const { data: row } = await db.from("finance_receipts").insert({ master_plan_id: planId, path, file_name: file.name.slice(-120), read }).select("id").single();
  return NextResponse.json({ ok: true, receiptId: row?.id, read });
}

export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const entry = new URL(request.url).searchParams.get("entry") || "";
  const db = createServerClient();
  const { data } = /^[0-9a-f-]{36}$/i.test(entry) ? await db.from("finance_entries").select("receipt_path").eq("id", entry).eq("master_plan_id", planId).maybeSingle() : { data: null };
  if (!data?.receipt_path) return NextResponse.json({ error: "No receipt on that expense." }, { status: 404 });
  const { data: signed } = await db.storage.from(PORTAL_BUCKET).createSignedUrl(data.receipt_path as string, 300);
  return signed?.signedUrl ? NextResponse.redirect(signed.signedUrl) : NextResponse.json({ error: "The receipt couldn't be opened." }, { status: 500 });
}
