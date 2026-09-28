import { NextResponse } from "next/server";
import { insightRoute, text } from "@/lib/ai/insightRoute";
import { cleanList } from "@/lib/ai/planningAi";
import { financeReadData } from "@/lib/finance/readData";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The assistant's short read on each Finance detail page, from the client's own
// ledger plus everything else it knows about them.
const shape = (o: Record<string, unknown>) => {
  const summary = text(o.summary);
  if (!summary) return null;
  return { summary, notice: cleanList(o.notice, 3, ["title", "detail"]), next: cleanList(o.next, 3, ["title", "detail"]) };
};
const JSON_SHAPE =
  'Return STRICT JSON: {"summary":"2-3 sentences","notice":[{"title":"short","detail":"specific, with the number"}],"next":[{"title":"a specific step","detail":"why it matters"}]}. 1-3 notices, up to 3 next steps. Never invent numbers; use only the LEDGER and what you know. Not tax or legal advice: suggest checking with their accountant where it matters.';
const ask = async (planId: string) => financeReadData(planId);

const ROUTES = {
  pnl: insightRoute({
    area: "fin-pnl",
    role: "reading their profit and loss.",
    rules: "Read their P&L: margin and its trend by month, their biggest costs and whether they fit the business, and where profit is leaking or growing. " + JSON_SHAPE,
    ask,
    shape,
  }),
  tax: insightRoute({
    area: "fin-tax",
    role: "helping them get ready for taxes.",
    rules: "Read their tax readiness: uncategorized expenses to fix, likely deductible categories they may be missing, a sensible amount to set aside from year-to-date net (say it's an estimate), and whether estimated-tax dates are on their calendar. " + JSON_SHAPE,
    ask,
    shape,
  }),
  monthly: insightRoute({
    area: "fin-monthly",
    role: "running their monthly money review with them.",
    rules: "Compare this month (or the last complete month) with the months before: what changed in income and costs, what drove it, and the one money decision worth making now. " + JSON_SHAPE,
    ask,
    shape,
  }),
  ledger: insightRoute({
    area: "fin-ledger",
    role: "reading where their money comes from and where it goes.",
    rules: "Read their income sources (concentration, which offers bring the money) and their spending (what's growing, what looks unnecessary), tied to their offers and goals. " + JSON_SHAPE,
    ask,
    shape,
  }),
};
type Kind = keyof typeof ROUTES;
const pick = (kind: string) => (kind in ROUTES ? ROUTES[kind as Kind] : null);

export async function GET(request: Request, { params }: { params: { kind: string } }) {
  const r = pick(params.kind);
  return r ? r.GET() : NextResponse.json({ error: "Not found." }, { status: 404 });
}
export async function POST(request: Request, { params }: { params: { kind: string } }) {
  const r = pick(params.kind);
  return r ? r.POST(request) : NextResponse.json({ error: "Not found." }, { status: 404 });
}
