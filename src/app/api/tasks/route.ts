import { NextResponse } from "next/server";

// Phase-1 placeholder tasks API for the ported Executive Home.
//
// The Executive Dashboard's Priority Tasks card calls GET/POST /api/tasks.
// In the original (Drizzle) app this hit a `tasks` table. In Architecture the
// multi-business `tasks` table is introduced by the
// `*_multi_business_model.sql` migration; until that is applied and seeded,
// this route returns demo data so the merged dashboard renders fully in
// preview without a database dependency.
//
// TODO(phase-1): replace the demo array with a real Supabase query against the
// `tasks` table (createServerClient from "@/lib/supabase/server"), and persist
// POSTed tasks. Tracked in the exec-into-architecture merge.

const demoTasks = [
  { id: 1, title: "Review LifeCharter Circle applications", status: "today", priority: "critical", segment: "Circle", dueTime: "10:00 AM" },
  { id: 2, title: "Draft newsletter for subscribers", status: "in_progress", priority: "high", segment: "Conversations", dueTime: "11:30 AM" },
  { id: 3, title: "Approve social media posts", status: "waiting", priority: "medium", segment: "AmiLynne Speaks" },
];

export async function GET() {
  return NextResponse.json({ tasks: demoTasks, source: "demo" });
}

export async function POST(request: Request) {
  // Not yet persisted — echo the task back so the UI can update optimistically.
  const body = await request.json().catch(() => ({}));
  const task = { id: Date.now(), status: "today", priority: "medium", ...body };
  return NextResponse.json({ task, persisted: false }, { status: 200 });
}
