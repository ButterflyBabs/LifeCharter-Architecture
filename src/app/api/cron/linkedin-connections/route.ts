import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { acceptWaiting, loadWaiting, type Accepted } from "@/lib/linkedinRequests";
import { notifyAccepted } from "@/lib/linkedinNotify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// LinkedIn does not reliably email "accepted your invitation", so twice a day a scheduled task reads the owner's own
// LinkedIn Connections page (signed in, read-only) and posts the newest connections here:
//   POST { token, connections: [{ name, profileUrl }] }
// Each connection that matches ONE card in "Connect request sent: waiting" (by profile link, else exact name) moves to
// "Connected: send the invite", and the people in metadata.linkedinAcceptNotify get one email. The token is the account's
// metadata.linkedinSweepToken; it only allows this one move, nothing else.
export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as { token?: string; connections?: { name?: string; profileUrl?: string }[] };
  const token = (b.token || "").trim();
  if (token.length < 24) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const { data: plan } = await db.from("client_master_plans").select("id, user_id, metadata").eq("metadata->>linkedinSweepToken", token).maybeSingle();
  if (!plan) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const people = (b.connections ?? []).slice(0, 300).filter((c) => typeof c?.name === "string" && c.name.trim());
  const { data: prof } = await db.from("profiles").select("timezone").eq("id", plan.user_id as string).maybeSingle();
  const tz = (prof?.timezone as string | null) || "America/Denver";
  const day = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const waiting = await loadWaiting(db as never, plan.id as string);
  const accepted: Accepted[] = [];
  for (const c of people) {
    const slug = (c.profileUrl || "").match(/\/in\/([A-Za-z0-9%_-]{2,100})/)?.[1] ?? null;
    const hit = await acceptWaiting(db as never, plan.id as string, tz, waiting, { name: (c.name as string).trim(), slug: slug ? decodeURIComponent(slug).toLowerCase() : null }, day);
    if (hit) accepted.push(hit);
  }
  const meta = (plan.metadata as Record<string, unknown> | null) ?? {};
  const notify = Array.isArray(meta.linkedinAcceptNotify) ? (meta.linkedinAcceptNotify as unknown[]).filter((x): x is string => typeof x === "string" && x.includes("@")) : [];
  await notifyAccepted(notify, accepted).catch((e) => console.error("linkedin connections notify:", (e as Error).message));
  await db.from("client_master_plans").update({ metadata: { ...meta, linkedinSweepAt: new Date().toISOString() } }).eq("id", plan.id as string);
  return NextResponse.json({ checked: people.length, moved: accepted.map((a) => a.name) });
}
