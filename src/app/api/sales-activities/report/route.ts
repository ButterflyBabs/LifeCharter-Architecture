import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { typeLabel, outcomeLabel } from "@/lib/salesActivities";

export const dynamic = "force-dynamic";

const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

interface Row {
  occurred_on: string | null;
  type: string;
  contact_name: string | null;
  contact_company: string | null;
  title: string | null;
  priority: string | null;
  status: string | null;
  outcome: string | null;
  estimated_value: number | string | null;
}

async function fetchRange(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const url = new URL(request.url);
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  let query = supabase
    .from("sales_activities")
    .select("occurred_on, type, contact_name, contact_company, title, priority, status, outcome, estimated_value")
    .eq("master_plan_id", masterPlanId)
    .order("occurred_on", { ascending: true });
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte("occurred_on", from);
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lte("occurred_on", to);

  const { data } = await query;
  return { rows: (data || []) as Row[], from, to, masterPlanId };
}

// GET — CSV export over an optional date range (?from=YYYY-MM-DD&to=YYYY-MM-DD).
export async function GET(request: Request) {
  const { rows, from, to } = await fetchRange(request);

  const header = ["Date", "Type", "Contact", "Company", "Title", "Priority", "Status", "Outcome", "Est. Value"];
  const lines = [header.join(",")];
  let total = 0;
  let won = 0;
  for (const r of rows) {
    const val = Number(r.estimated_value ?? 0);
    total += val;
    if (r.outcome === "won") won += val;
    lines.push(
      [
        r.occurred_on || "",
        esc(typeLabel(r.type)),
        esc(r.contact_name || ""),
        esc(r.contact_company || ""),
        esc(r.title || ""),
        esc(r.priority || ""),
        esc(r.status || ""),
        esc(outcomeLabel(r.outcome || "")),
        val.toFixed(2),
      ].join(",")
    );
  }
  lines.push("");
  lines.push(["", "", "", "", "", "", "", "Activities", String(rows.length)].join(","));
  lines.push(["", "", "", "", "", "", "", "Pipeline value", total.toFixed(2)].join(","));
  lines.push(["", "", "", "", "", "", "", "Won value", won.toFixed(2)].join(","));

  const label = from || to ? `${from || "start"}_to_${to || "now"}` : "all";
  const fname = `sales-activities-${label}.csv`;
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "no-store",
    },
  });
}

// POST — AI-written report summary over the same optional date range.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const { rows, from, to } = await fetchRange(request);
  if (rows.length === 0) {
    return NextResponse.json({ empty: true, summary: "No sales activity in this range yet.", insights: [] });
  }

  // Compact aggregates for the model.
  const byType: Record<string, number> = {};
  const byOutcome: Record<string, number> = {};
  let pipeline = 0;
  let won = 0;
  let wonCount = 0;
  let contacted = 0;
  for (const r of rows) {
    byType[typeLabel(r.type)] = (byType[typeLabel(r.type)] || 0) + 1;
    if (r.outcome) {
      byOutcome[outcomeLabel(r.outcome)] = (byOutcome[outcomeLabel(r.outcome)] || 0) + 1;
      if (r.outcome !== "no_answer") contacted += 1;
    }
    const v = Number(r.estimated_value ?? 0);
    if (r.outcome === "won") {
      won += v;
      wonCount += 1;
    } else if (r.outcome !== "lost") pipeline += v;
  }

  const { name, key } = await resolveAiConfig();
  const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const stats =
    `Range: ${from || "start"} to ${to || "now"}. ${rows.length} activities. ` +
    `By type: ${Object.entries(byType).map(([k, v]) => `${k} ${v}`).join(", ")}. ` +
    `Outcomes: ${Object.entries(byOutcome).map(([k, v]) => `${k} ${v}`).join(", ") || "none logged"}. ` +
    `Open pipeline value ${usd(pipeline)}, won ${usd(won)} across ${wonCount} deals. ` +
    `Conversion (won / contacted): ${contacted ? Math.round((wonCount / contacted) * 100) : 0}%.`;

  if (!key) {
    // Deterministic summary without AI.
    return NextResponse.json({
      summary: stats,
      insights: [],
      stats,
      needsKey: true,
    });
  }

  const sys =
    `You are ${name}, a sharp sales coach for a small business owner. ` +
    "From the activity aggregates, write a short performance report. " +
    'Return STRICT JSON: {"summary":"2-3 sentence plain-language read on their sales activity and momentum",' +
    '"insights":[{"title":"short","detail":"specific, actionable observation"}]}. ' +
    "2-4 insights: what's working, where the gaps are (e.g. lots of calls but few booked), and the single highest-leverage next move. Do not invent numbers.";

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: stats },
      ],
      max_tokens: 700,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    return NextResponse.json({
      summary: String(parsed.summary || stats).trim(),
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : [],
      stats,
    });
  } catch (e) {
    console.error("POST /api/sales-activities/report:", e);
    return NextResponse.json({ summary: stats, insights: [], stats });
  }
}
