import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { isAlignmentArchitect, ALIGNMENT_ARCHITECT_EMAIL } from "@/lib/authz";
import { enrolContact, ownerMasterPlanId, sendRendered, isValidTz } from "@/lib/sequences/engine";
import { renderStep } from "@/lib/sequences/render";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Alignment Architect only: one sequence.
//   GET → the sequence, its steps, and its people
//   POST { action } with action one of:
//     settings { name, description, fromName, fromEmail, brand, sendHour, active }
//     save-step { step: { id?, position, dayOffset, subject, preview, body, buttonLabel, buttonUrl } }
//     delete-step { stepId }
//     preview { step }                 → the rendered email (as Eloise)
//     test { stepId }                  → sends that step to Babs
//     enrol { email, firstName, lastName, timezone }
//     person { enrollmentId, status: active|paused|stopped }

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const link = (v: unknown) => (typeof v === "string" && /^https?:\/\//i.test(v.trim()) ? v.trim().slice(0, 600) : null);

async function load(id: string, request?: Request) {
  if (request && crossOriginBlocked(request)) return { denied: NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 }) };
  if (!(await isAlignmentArchitect())) return { denied: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  const planId = await ownerMasterPlanId();
  const db = createServerClient();
  const { data: seq } = planId ? await db.from("sequences").select("*").eq("id", id).eq("master_plan_id", planId).maybeSingle() : { data: null };
  if (!seq || !planId) return { denied: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  return { seq, planId, db };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { denied, seq, db } = await load(params.id);
  if (denied) return denied;
  const [{ data: steps }, { data: enrs }] = await Promise.all([
    db.from("sequence_steps").select("*").eq("sequence_id", seq.id).order("position"),
    db
      .from("sequence_enrollments")
      .select("id, status, enrolled_at, start_date, source, completed_at, seq_contacts(id, email, first_name, last_name, timezone, unsubscribed_at), sequence_sends(status)")
      .eq("sequence_id", seq.id)
      .order("enrolled_at", { ascending: false })
      .limit(500),
  ]);
  const people = (enrs ?? []).map((e) => {
    const sends = (e.sequence_sends as { status: string }[] | null) ?? [];
    return { ...e, sequence_sends: undefined, sent: sends.filter((s) => s.status === "sent").length, failed: sends.filter((s) => s.status === "failed").length };
  });
  return NextResponse.json({ sequence: seq, steps: steps ?? [], people });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { denied, seq, db, planId } = await load(params.id, request);
  if (denied) return denied;
  const b = await request.json().catch(() => ({}));

  if (b.action === "settings") {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof b.name === "string" && b.name.trim()) patch.name = str(b.name, 120);
    if (typeof b.description === "string") patch.description = str(b.description, 500) || null;
    if (typeof b.fromName === "string" && b.fromName.trim()) patch.from_name = str(b.fromName, 80);
    if (typeof b.fromEmail === "string" && /^[^@\s]+@(lifecharter\.life|lccommandsuite\.com)$/i.test(b.fromEmail.trim())) patch.from_email = b.fromEmail.trim().toLowerCase();
    if (typeof b.brand === "string" && b.brand.trim()) patch.brand = str(b.brand, 60);
    if (Number.isInteger(b.sendHour) && b.sendHour >= 0 && b.sendHour <= 23) patch.send_hour = b.sendHour;
    if (typeof b.active === "boolean") patch.active = b.active;
    const { data, error } = await db.from("sequences").update(patch).eq("id", seq.id).select("*").single();
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
    return NextResponse.json({ sequence: data });
  }

  if (b.action === "save-step") {
    const s = b.step || {};
    const row = {
      sequence_id: seq.id,
      position: Number.isInteger(s.position) ? s.position : 0,
      day_offset: Number.isInteger(s.dayOffset) && s.dayOffset >= 0 && s.dayOffset <= 365 ? s.dayOffset : 0,
      subject: str(s.subject, 200),
      preview: str(s.preview, 200) || null,
      body: str(s.body, 20000),
      button_label: str(s.buttonLabel, 60) || null,
      button_url: link(s.buttonUrl),
      updated_at: new Date().toISOString(),
    };
    if (!row.subject || !row.body) return NextResponse.json({ error: "A step needs a subject and a body." }, { status: 400 });
    const q = typeof s.id === "string" && s.id
      ? db.from("sequence_steps").update(row).eq("id", s.id).eq("sequence_id", seq.id)
      : db.from("sequence_steps").insert(row);
    const { data, error } = await q.select("*").single();
    if (error) return NextResponse.json({ error: "Couldn't save the step." }, { status: 500 });
    return NextResponse.json({ step: data });
  }

  if (b.action === "delete-step") {
    await db.from("sequence_steps").delete().eq("id", str(b.stepId, 60)).eq("sequence_id", seq.id);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "preview") {
    const s = b.step || {};
    const mail = renderStep({ brand: seq.brand, subject: str(s.subject, 200), preview: str(s.preview, 200), body: str(s.body, 20000), buttonLabel: str(s.buttonLabel, 60) || null, buttonUrl: link(s.buttonUrl), contact: { id: "preview", first_name: "Eloise" } });
    return NextResponse.json({ subject: mail.subject, html: mail.html });
  }

  if (b.action === "test") {
    const { data: step } = await db.from("sequence_steps").select("*").eq("id", str(b.stepId, 60)).eq("sequence_id", seq.id).maybeSingle();
    if (!step) return NextResponse.json({ error: "Step not found." }, { status: 404 });
    const mail = renderStep({
      brand: seq.brand,
      subject: `[Test] ${step.subject}`,
      preview: step.preview,
      body: step.body,
      buttonLabel: step.button_label,
      buttonUrl: step.button_url,
      contact: { id: "test", first_name: "Babs" },
    });
    const r = await sendRendered(seq, ALIGNMENT_ARCHITECT_EMAIL, "test", mail);
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error || "Couldn't send." }, { status: 500 });
  }

  if (b.action === "enrol") {
    const tz = typeof b.timezone === "string" && isValidTz(b.timezone) ? b.timezone : "America/Denver";
    const r = await enrolContact({
      masterPlanId: planId,
      sequenceKey: seq.key,
      email: str(b.email, 200),
      firstName: str(b.firstName, 80) || null,
      lastName: str(b.lastName, 80) || null,
      timezone: tz,
      source: "manual",
      tags: [seq.key],
    });
    return r.enrollmentId ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.reason === "unsubscribed" ? "They've unsubscribed, so they can't be added back." : r.reason === "already enrolled" ? "They're already in this sequence." : r.reason || "Couldn't add them." }, { status: 400 });
  }

  if (b.action === "person") {
    const status = ["active", "paused", "stopped"].includes(b.status) ? b.status : null;
    if (!status) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    await db.from("sequence_enrollments").update({ status }).eq("id", str(b.enrollmentId, 60)).eq("sequence_id", seq.id).neq("status", "completed");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
