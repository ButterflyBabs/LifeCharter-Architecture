import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

// Parse raw statement / CSV / invoice text into structured transactions with the
// client's AI bot. Returns { transactions: [...] } or { needsKey: true }.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const raw = typeof body.text === "string" ? body.text : "";
  if (!raw.trim()) {
    return NextResponse.json({ error: "Nothing to parse — paste or upload some text." }, { status: 400 });
  }
  // Keep token use bounded.
  const text = raw.slice(0, 16000);

  const { key } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  const sys =
    "You extract financial transactions from a bank/credit-card statement, CSV export, or invoice. " +
    'Return STRICT JSON: {"transactions":[{"date":"YYYY-MM-DD","description":"...","amount":<positive number>,"type":"income"|"expense","category":"<short guess>"}]}. ' +
    "Rules: money received / deposits / payments to the business = income; money spent / withdrawals / charges = expense. " +
    "amount is always a positive number (no currency symbols or signs). date as YYYY-MM-DD (infer the year if obvious, else use the most likely). " +
    "category is a short label you infer (e.g. Software, Meals, Coaching). Skip header rows, running balances, totals, and any non-transaction lines. " +
    "If there are no real transactions, return an empty array.";

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: text },
      ],
      max_tokens: 2000,
      temperature: 0,
      response_format: { type: "json_object" },
    });
    const rawOut = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: { transactions?: unknown } = {};
    try {
      parsed = JSON.parse(rawOut);
    } catch {
      parsed = {};
    }
    const list = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    const transactions = list
      .map((t) => {
        const o = (t || {}) as Record<string, unknown>;
        const amount = Math.abs(Number(o.amount));
        if (!isFinite(amount) || amount <= 0) return null;
        const date =
          typeof o.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.date)
            ? o.date
            : new Date().toISOString().slice(0, 10);
        return {
          date,
          description: String(o.description ?? "").slice(0, 200),
          amount,
          type: o.type === "income" ? "income" : "expense",
          category: String(o.category ?? "").slice(0, 60),
        };
      })
      .filter(Boolean)
      .slice(0, 300);

    return NextResponse.json({ transactions });
  } catch (e) {
    console.error("POST /api/finance/import/parse:", e);
    return NextResponse.json({ error: "Couldn't parse that — try a cleaner CSV or less text." }, { status: 502 });
  }
}
