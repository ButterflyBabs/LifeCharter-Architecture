import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

// Always query live data per request.
export const dynamic = "force-dynamic";

// Tasks API for the Executive Home Priority Tasks card.
// Backed by the `tasks` table introduced in the multi_business_model migration.

const DIMENSION_COLUMNS: Record<string, string> = {
  marketing: "dimension_marketing",
  sales: "dimension_sales",
  operations: "dimension_operations",
  finance: "dimension_finance",
  team: "dimension_team",
  systems: "dimension_systems",
  leadership: "dimension_leadership",
  vision: "dimension_vision",
  product: "dimension_product",
  customer_experience: "dimension_customer_experience",
  legal: "dimension_legal",
  sustainability: "dimension_sustainability",
};

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, description, status, priority, energy, due_date, due_at, followup, completed_at, business:businesses(name, color), segment:segments(name, color)"
    )
    .order("board_position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("GET /api/tasks:", error.message);
    return NextResponse.json({ tasks: [], error: error.message }, { status: 200 });
  }
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const body = await request.json().catch(() => ({}));

  if (!body?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    title: body.title,
    description: body.description ?? null,
    status: body.status ?? "today",
    priority: body.priority ?? "medium",
    energy: ["low", "medium", "high"].includes(body.energy) ? body.energy : "medium",
    business_id: body.businessId ?? null,
    segment_id: body.segmentId ?? null,
    due_date: body.dueDate ?? null,
    due_at: body.dueAt ?? null,
    followup: body.followup && typeof body.followup === "object" ? body.followup : {},
  };
  for (const key of Array.isArray(body.dimensions) ? body.dimensions : []) {
    const col = DIMENSION_COLUMNS[key];
    if (col) row[col] = true;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert(row)
    .select(
      "id, title, status, priority, business:businesses(name, color), segment:segments(name, color)"
    )
    .single();

  if (error) {
    console.error("POST /api/tasks:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data, persisted: true });
}
