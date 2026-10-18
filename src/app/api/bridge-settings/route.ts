import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { PLATFORMS, type Platform } from "@/lib/bridge";
import { handleBridge, type Connection } from "@/lib/bridgeServer";

export const dynamic = "force-dynamic";

// Courses & Memberships › Bring buyers over (task 1152 part 2), the owner's side.
//   GET  -> connections (with their receiving address), products and their rules, recent messages, and the
//           campaigns and Suite courses to pick from
//   POST { action: "connect", platform } | { action: "key", id, signingKey } | { action: "pause" | "resume" | "remove", id }
//        { action: "product", id, tags, recordIncome, sequenceKey, programId } | { action: "test", id }
const APP = () => (process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com").replace(/\/$/, "");
const uuid = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : "");

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const [{ data: conns }, { data: products }, { data: events }, { data: seqs }, { data: progs }] = await Promise.all([
    db.from("bridge_connections").select("id, platform, token, signing_key, active, last_event_at, created_at").eq("master_plan_id", a.planId).order("created_at"),
    db.from("bridge_products").select("id, platform, product_key, product_name, tags, record_income, sequence_key, program_id").eq("master_plan_id", a.planId).order("created_at"),
    db.from("bridge_events").select("id, platform, kind, email, product_name, amount, status, created_at, contact_id").eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(50),
    db.from("sequences").select("key, name, active").eq("master_plan_id", a.planId).order("name"),
    db.from("programs").select("id, name, kind, status").eq("master_plan_id", a.planId).neq("status", "archived").order("name"),
  ]);
  return NextResponse.json(
    {
      platforms: PLATFORMS,
      connections: ((conns ?? []) as { token: string; signing_key: string | null }[]).map(({ token, signing_key, ...c }) => ({ ...c, url: `${APP()}/api/bridge/${token}`, hasKey: Boolean(signing_key) })),
      products: products ?? [],
      events: events ?? [],
      sequences: seqs ?? [],
      programs: progs ?? [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(b.action || "");

  if (action === "connect") {
    const platform = PLATFORMS.some((p) => p.key === b.platform) ? (b.platform as Platform) : null;
    if (!platform) return NextResponse.json({ error: "Pick a platform." }, { status: 400 });
    const { data: have } = await db.from("bridge_connections").select("id").eq("master_plan_id", a.planId).eq("platform", platform).maybeSingle();
    if (have) return NextResponse.json({ ok: true, id: have.id });
    const { data, error } = await db.from("bridge_connections").insert({ master_plan_id: a.planId, platform, token: randomBytes(24).toString("base64url") }).select("id").single();
    return error ? NextResponse.json({ error: "Couldn't set it up. Please try again." }, { status: 500 }) : NextResponse.json({ ok: true, id: data.id });
  }

  if (action === "product") {
    const id = uuid(b.id);
    const tags = (Array.isArray(b.tags) ? b.tags : String(b.tags || "").split(","))
      .map((t) => String(t).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""))
      .filter(Boolean)
      .slice(0, 10);
    let programId: string | null = uuid(b.programId) || null;
    if (programId) {
      const { data: p } = await db.from("programs").select("id").eq("id", programId).eq("master_plan_id", a.planId).maybeSingle();
      programId = p ? programId : null;
    }
    let seq: string | null = typeof b.sequenceKey === "string" && b.sequenceKey ? b.sequenceKey.slice(0, 80) : null;
    if (seq) {
      const { data: q } = await db.from("sequences").select("key").eq("key", seq).eq("master_plan_id", a.planId).maybeSingle();
      seq = q ? seq : null;
    }
    await db.from("bridge_products").update({ tags, record_income: b.recordIncome !== false, sequence_key: seq, program_id: programId }).eq("id", id).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }

  const id = uuid(b.id);
  const { data: c } = id ? await db.from("bridge_connections").select("id, master_plan_id, platform, signing_key, active").eq("id", id).eq("master_plan_id", a.planId).maybeSingle() : { data: null };
  if (!c) return NextResponse.json({ error: "That connection could not be found." }, { status: 404 });
  if (action === "key") {
    const key = typeof b.signingKey === "string" ? b.signingKey.trim().slice(0, 200) : "";
    await db.from("bridge_connections").update({ signing_key: key || null }).eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (action === "pause" || action === "resume") {
    await db.from("bridge_connections").update({ active: action === "resume" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (action === "remove") {
    await db.from("bridge_connections").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (action === "test") {
    // A pretend sale from the test person Eloise (no money), so the owner sees it arrive and can set the product up.
    const stamp = Date.now().toString(36);
    const sample: Record<Platform, Record<string, unknown>> = {
      payhip: { type: "paid", id: `test-${stamp}`, email: "eloise.bridgetest@example.com", price: 0, items: [{ product_key: "TEST", product_name: "TEST Course" }] },
      kajabi: { id: `test-${stamp}`, offer_id: "TEST", offer_title: "TEST Course", amount_in_cents: 0, member: { email: "eloise.bridgetest@example.com", first_name: "Eloise", last_name: "Test" } },
      teachable: { type: "Sale.created", object: { id: `test-${stamp}`, final_price: 0, user: { email: "eloise.bridgetest@example.com", name: "Eloise Test" }, product: { id: "TEST", name: "TEST Course" } } },
      thinkific: { resource: "order", action: "created", payload: { id: `test-${stamp}`, amount_cents: 0, user: { email: "eloise.bridgetest@example.com", first_name: "Eloise", last_name: "Test" }, items: [{ product_id: "TEST", product_name: "TEST Course" }] } },
      zapier: { event: "purchase", id: `test-${stamp}`, email: "eloise.bridgetest@example.com", first_name: "Eloise", last_name: "Test", product: "TEST Course", product_id: "TEST", amount: 0 },
    };
    const result = await handleBridge(db, c as Connection, sample[(c as Connection).platform]);
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
