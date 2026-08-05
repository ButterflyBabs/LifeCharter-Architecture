import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { dayWindowUtc } from "@/lib/tz";

export const dynamic = "force-dynamic";

const TYPES = ["call", "followup"] as const;
type ActivityType = (typeof TYPES)[number];

type Row = {
  id: string;
  contact_id: string | null;
  contact_name: string | null;
  type: string;
  note: string | null;
  created_at: string;
};

function serialize(r: Row) {
  return {
    id: r.id,
    contactId: r.contact_id || "",
    contactName: r.contact_name || "",
    type: (TYPES.includes(r.type as ActivityType) ? r.type : "call") as ActivityType,
    note: r.note || "",
    createdAt: r.created_at,
  };
}

// GET — today's logged activity (counts + items) for the client, in their tz.
export async function GET(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();

  const tz = new URL(request.url).searchParams.get("tz") || "UTC";
  let startISO: string, endISO: string;
  try {
    ({ startISO, endISO } = dayWindowUtc(tz));
  } catch {
    ({ startISO, endISO } = dayWindowUtc("UTC"));
  }

  const { data, error } = await supabase
    .from("contact_activity_log")
    .select("id, contact_id, contact_name, type, note, created_at")
    .eq("master_plan_id", masterPlanId)
    .gte("created_at", startISO)
    .lt("created_at", endISO)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET activity:", error.message);
    return NextResponse.json({ calls: 0, followups: 0, items: [] }, { status: 200 });
  }

  const rows = (data || []) as Row[];
  const items = rows.map(serialize);
  const calls = items.filter((i) => i.type === "call").length;
  const followups = items.filter((i) => i.type === "followup").length;
  const contacts = new Set(items.map((i) => i.contactId).filter(Boolean));
  return NextResponse.json({ calls, followups, contactsTouched: contacts.size, items });
}

// POST — log a call or follow-up (with an optional note) against a contact.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));

  const type: ActivityType = TYPES.includes(body.type as ActivityType) ? (body.type as ActivityType) : "call";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const contactId = typeof body.contactId === "string" ? body.contactId : "";
  const contactName = typeof body.contactName === "string" ? body.contactName : "";

  const { data, error } = await supabase
    .from("contact_activity_log")
    .insert({
      master_plan_id: masterPlanId,
      contact_id: contactId || null,
      contact_name: contactName || null,
      type,
      note: note || null,
    })
    .select("id, contact_id, contact_name, type, note, created_at")
    .single();

  if (error) {
    console.error("POST activity:", error.message);
    return NextResponse.json({ error: "Couldn't log the activity." }, { status: 500 });
  }
  return NextResponse.json({ item: serialize(data as Row) });
}
