import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/planScope";
import { loadSummary, scanReceipts } from "@/lib/platformCostsServer";
import { VENDORS, monthOf } from "@/lib/platformCosts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Platform Costs: Alignment Architect only. GET = the page's data. POST = scan | confirm | reject | update | add | setting.
async function gate() {
  if (!(await isAlignmentArchitect())) return { error: NextResponse.json({ error: "not found" }, { status: 404 }) } as const;
  const planId = await housePlanId();
  if (!planId) return { error: NextResponse.json({ error: "No house account found." }, { status: 500 }) } as const;
  return { planId } as const;
}

export async function GET() {
  const g = await gate();
  if ("error" in g) return g.error;
  const db = createServerClient();
  const s = await loadSummary(db, g.planId);
  return NextResponse.json({ ...s, vendors: VENDORS.map(({ key, label, category, hint }) => ({ key, label, category, hint: hint ?? null })) });
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await gate();
  if ("error" in g) return g.error;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const db = createServerClient();
  const planId = g.planId;
  const now = new Date().toISOString();

  if (b.action === "scan") {
    const r = await scanReceipts(db, planId);
    return NextResponse.json(r, { status: r.error ? 502 : 200 });
  }

  if (b.action === "confirm" || b.action === "reject" || b.action === "update") {
    const id = str(b.id, 60);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Unknown entry." }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: now };
    if (b.action === "confirm") patch.status = "confirmed";
    if (b.action === "reject") patch.status = "rejected";
    const cents = num(b.amountCents);
    if (cents !== null) patch.amount_cents = Math.round(cents);
    if (typeof b.counts === "boolean") patch.counts = b.counts;
    if (typeof b.label === "string") patch.label = str(b.label, 80) || null;
    if (typeof b.note === "string") patch.note = str(b.note, 300) || null;
    const { error } = await db.from("platform_cost_entries").update(patch).eq("id", id).eq("master_plan_id", planId);
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  if (b.action === "add") {
    const cents = num(b.amountCents);
    const vendor = str(b.vendor, 40).toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "other";
    const month = /^\d{4}-\d{2}/.test(str(b.month, 10)) ? `${str(b.month, 10).slice(0, 7)}-01` : monthOf(Date.now());
    if (cents === null || cents === 0) return NextResponse.json({ error: "Enter an amount." }, { status: 400 });
    const { error } = await db.from("platform_cost_entries").insert({
      master_plan_id: planId,
      month,
      vendor,
      label: str(b.label, 80) || null,
      amount_cents: Math.round(cents),
      counts: b.counts === false ? false : true,
      status: "confirmed",
      source: "manual",
      note: str(b.note, 300) || null,
    });
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  if (b.action === "setting") {
    // The only two settings the page edits.
    const key = b.key === "client_count_override" ? "platform_costs_client_count_override" : b.key === "exclude_emails" ? "platform_costs_exclude_emails" : null;
    if (!key) return NextResponse.json({ error: "Unknown setting." }, { status: 400 });
    const value = str(b.value, 500);
    const { error } = await db.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
