import { createServerClient } from "@/lib/supabase/server";
import { senderProfile } from "@/lib/email/accountSender";
import { enrolContact } from "@/lib/sequences/engine";
import type { FormField } from "@/lib/crm";

// Client Care for every account (task 1148; wording approved by Babs 2026-10-18). The client versions of Babs's own
// Client Care (task 168): a 30-day check-in, a quarterly pulse and an exit survey (each a form + one email), and three
// quiet-client notes. Each account gets them switched OFF, sent from its own address and signed with its own sign-off
// (the sequence renderer adds it). The account owner switches each piece on from Clients & Sales › Client Care.
//
// Who counts as a client: a contact tagged "client" or "customer" (payments through the Suite add "customer"), and not
// "former-client". Triggers (daily, /api/cron/client-care):
//   30-day check-in   30 to 37 days after they became a client (first time the tag was added, else when they were added)
//   quarterly pulse    the first week of every 90 days after that
//   exit survey        within 3 days of being tagged "former-client"
//   quiet client       no activity for 14 days: a task for the owner (never an automatic email); the owner starts the notes

type Db = ReturnType<typeof createServerClient>;

export const CLIENT_TAGS = ["client", "customer"];
export const FORMER_TAG = "former-client";

export const CC = {
  thirty: { form: "client-care-30-day-check-in", seq: "client-care-30-day-check-in-email" },
  pulse: { form: "client-care-quarterly-pulse", seq: "client-care-quarterly-pulse-email" },
  exit: { form: "client-care-exit-survey", seq: "client-care-exit-survey-email" },
  quiet: { seq: "client-care-quiet-client-notes" },
} as const;
export type CareKey = keyof typeof CC;

const NAME_EMAIL: FormField[] = [
  { name: "first_name", label: "First name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
];

export const CC_FORMS: Record<"thirty" | "pulse" | "exit", { name: string; fields: FormField[]; success: string; submit: string }> = {
  thirty: {
    name: "Client 30-day check-in",
    submit: "Send my check-in",
    success: "Thank you. Every answer is read, and we will reach out if you asked for a call.",
    fields: [
      ...NAME_EMAIL,
      { name: "how_is_it_going", label: "Overall, how is our work together going so far?", type: "select", required: true, options: ["Great", "Good", "Okay", "Not working yet"] },
      { name: "helped_most", label: "What has helped you most so far?", type: "textarea" },
      { name: "hardest", label: "What has been hardest, confusing or missing?", type: "textarea" },
      { name: "call_help", label: "Would a short call help right now?", type: "select", required: true, options: ["Yes, please reach out", "Not right now"] },
      { name: "describe_to_friend", label: "In a sentence or two, how would you describe working with us to a friend?", type: "textarea" },
      { name: "testimonial_ok", label: "May we share your words (with your first name) as a testimonial?", type: "select", options: ["Yes", "Not yet, ask me later", "No"] },
    ],
  },
  pulse: {
    name: "Client quarterly pulse (3 questions)",
    submit: "Send my answers",
    success: "Thank you. This helps us shape the next quarter around what you need.",
    fields: [
      ...NAME_EMAIL,
      { name: "helping", label: "This quarter, how much has our work together helped you?", type: "select", required: true, options: ["A great deal", "Quite a bit", "Somewhat", "Not much"] },
      { name: "proud", label: "What are you most proud of this quarter?", type: "textarea" },
      { name: "change", label: "If you could change or add one thing, what would it be?", type: "textarea" },
    ],
  },
  exit: {
    name: "Client exit survey",
    submit: "Send",
    success: "Thank you for telling us. Every answer is read.",
    fields: [
      ...NAME_EMAIL,
      { name: "reason", label: "What is the main reason our work together is ending?", type: "select", required: true, options: ["We reached the goal", "Cost", "Timing or capacity", "It wasn't the right fit", "I found another option", "Something else"] },
      { name: "better", label: "What would have made it better?", type: "textarea" },
      { name: "check_in_later", label: "May we check in with you in six months?", type: "select", options: ["Yes", "No"] },
    ],
  },
};

interface Step { day: number; subject: string; body: string; button?: string; link: "form" | "booking" | null }
export const CC_SERIES: Record<CareKey, { name: string; description: string; steps: Step[] }> = {
  thirty: {
    name: "CLIENT CARE - 30-day check-in",
    description: "Starts 30 days after someone becomes a client (tag client or customer).",
    steps: [{
      day: 0, link: "form", button: "Share how it's going",
      subject: "30 days in: how is it going, {{first_name}}?",
      body: "Hi {{first_name}},\n\nIt has been about 30 days since we started working together, and I would love to hear how it is going in your own words.\n\nIt is a short check-in: what is working, what has helped most, what has been hard or missing, and whether a call would help right now. It takes about five minutes, and I read every answer myself.\n\nIf something is stuck, you don't have to wait for the form. Just reply to this email.",
    }],
  },
  pulse: {
    name: "CLIENT CARE - quarterly pulse",
    description: "Every 90 days while someone is a client.",
    steps: [{
      day: 0, link: "form", button: "Answer the three questions",
      subject: "Three questions for this quarter, {{first_name}}",
      body: "Hi {{first_name}},\n\nOnce a quarter I ask every client the same three questions: how much our work together is helping, what you are proud of, and the one thing you would change or add.\n\nIt takes about two minutes, and what you tell me shapes what we do next.",
    }],
  },
  exit: {
    name: "CLIENT CARE - exit survey",
    description: "When someone is tagged former-client.",
    steps: [{
      day: 0, link: "form", button: "Share your thoughts",
      subject: "Thank you, {{first_name}}",
      body: "Hi {{first_name}},\n\nThank you for the time we spent working together. It has meant a great deal to me.\n\nIf you are willing, I would value two minutes of your honesty: what worked, what didn't, and what would have made it better. Every answer is read, and it helps me serve the next person well.\n\nMy door stays open. If you ever want to pick back up, just reply to this email.",
    }],
  },
  quiet: {
    name: "CLIENT CARE - quiet client (3 notes)",
    description: "You start this one for a quiet client (from the quiet-client task); it is never started automatically.",
    steps: [
      {
        day: 0, link: null,
        subject: "Checking in, {{first_name}}",
        body: "Hi {{first_name}},\n\nIt has been a couple of weeks since we last connected, and I wanted to say hello. No pressure and nothing to catch up on.\n\nIf something got in the way, or it isn't clear where to pick back up, reply and tell me. Even one line helps, and we will start from where you are.",
      },
      {
        day: 7, link: null,
        subject: "Still here when you are ready, {{first_name}}",
        body: "Hi {{first_name}},\n\nI wanted to follow up on my note last week. Life and business get full.\n\nTell me what you are working on right now and I will suggest one small next step. A sentence is plenty.",
      },
      {
        day: 14, link: "booking", button: "Choose a time",
        subject: "Would a short call help, {{first_name}}?",
        body: "Hi {{first_name}},\n\nIt has been about three weeks, and I would rather hear from you than guess. Would a short call help?\n\nChoose a time that works for you with the button below. We will look at what is in the way and decide the next step together.\n\nIf none of the times work, just reply and tell me what does.",
      },
    ],
  },
};

const SITE = () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
export const formUrl = (id: string) => `${SITE()}/f/${id}`;
export const bookingUrl = (slug: string) => `${SITE()}/book/${slug}`;

/** Load the Client Care forms and series into an account, switched off. Safe to repeat: existing ones are left alone. */
export async function ensureClientCare(db: Db, planId: string): Promise<void> {
  const formIds: Partial<Record<CareKey, string>> = {};
  for (const k of ["thirty", "pulse", "exit"] as const) {
    const key = CC[k].form;
    const { data: have } = await db.from("crm_forms").select("id").eq("master_plan_id", planId).eq("key", key).maybeSingle();
    if (have) {
      formIds[k] = have.id as string;
      continue;
    }
    const f = CC_FORMS[k];
    const { data } = await db
      .from("crm_forms")
      .insert({ master_plan_id: planId, key, name: f.name, fields: f.fields, tags: [key], success_message: f.success, submit_label: f.submit, active: false, notify: true })
      .select("id")
      .single();
    if (data) formIds[k] = data.id as string;
  }
  const { data: settings } = await db.from("client_care_settings").select("booking_slug").eq("master_plan_id", planId).maybeSingle();
  const p = await senderProfile(planId, db);
  for (const k of Object.keys(CC_SERIES) as CareKey[]) {
    const key = CC[k].seq;
    const { data: have } = await db.from("sequences").select("id").eq("master_plan_id", planId).eq("key", key).maybeSingle();
    if (have) continue;
    const s = CC_SERIES[k];
    const { data: seq } = await db
      .from("sequences")
      .insert({ master_plan_id: planId, key, name: s.name, description: s.description, brand: s.name, from_name: p.senderName, from_email: p.fromEmail ?? "", reply_to: p.replyTo, active: false, skip_tags: k === "exit" ? [] : [FORMER_TAG] })
      .select("id")
      .single();
    if (!seq) continue;
    await db.from("sequence_steps").insert(
      s.steps.map((st, i) => ({
        sequence_id: seq.id,
        position: i,
        day_offset: st.day,
        subject: st.subject,
        body: st.body,
        button_label: st.link === "form" && formIds[k] ? st.button : st.link === "booking" && settings?.booking_slug ? st.button : null,
        button_url: st.link === "form" && formIds[k] ? formUrl(formIds[k]!) : st.link === "booking" && settings?.booking_slug ? bookingUrl(settings.booking_slug as string) : null,
      })),
    );
  }
  await db.from("client_care_settings").upsert({ master_plan_id: planId }, { onConflict: "master_plan_id", ignoreDuplicates: true });
}

/** Point the third quiet-client note at a booking calendar (or remove the button). */
export async function setQuietBooking(db: Db, planId: string, slug: string | null): Promise<void> {
  await db.from("client_care_settings").upsert({ master_plan_id: planId, booking_slug: slug, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id" });
  const { data: seq } = await db.from("sequences").select("id").eq("master_plan_id", planId).eq("key", CC.quiet.seq).maybeSingle();
  if (!seq) return;
  await db
    .from("sequence_steps")
    .update({ button_label: slug ? "Choose a time" : null, button_url: slug ? bookingUrl(slug) : null, updated_at: new Date().toISOString() })
    .eq("sequence_id", seq.id)
    .eq("day_offset", 14);
}

/** Switch one piece on or off: the form and its email together (the quiet piece is the task switch). */
export async function setCareOn(db: Db, planId: string, k: CareKey, on: boolean): Promise<void> {
  const now = new Date().toISOString();
  if (k === "quiet") {
    await db.from("client_care_settings").upsert({ master_plan_id: planId, quiet_on: on, updated_at: now }, { onConflict: "master_plan_id" });
    await db.from("sequences").update({ active: on, updated_at: now }).eq("master_plan_id", planId).eq("key", CC.quiet.seq);
    return;
  }
  await db.from("crm_forms").update({ active: on, updated_at: now }).eq("master_plan_id", planId).eq("key", CC[k].form);
  await db.from("sequences").update({ active: on, updated_at: now }).eq("master_plan_id", planId).eq("key", CC[k].seq);
}

const DAY = 86_400_000;
const CATCH_UP_DAYS = 7;

export interface CareRun { planId: string; thirty: string[]; pulse: string[]; exit: string[]; quiet: string[] }

/** The daily Client Care run for one client account (never the house account; its own Client Care runs separately). */
export async function runClientCare(db: Db, planId: string, dry: boolean): Promise<CareRun> {
  const out: CareRun = { planId, thirty: [], pulse: [], exit: [], quiet: [] };
  const [{ data: seqs }, { data: settings }] = await Promise.all([
    db.from("sequences").select("id, key, active").eq("master_plan_id", planId).in("key", [CC.thirty.seq, CC.pulse.seq, CC.exit.seq]),
    db.from("client_care_settings").select("quiet_on").eq("master_plan_id", planId).maybeSingle(),
  ]);
  const live = new Map(((seqs ?? []) as { id: string; key: string; active: boolean }[]).filter((s) => s.active).map((s) => [s.key, s.id]));
  const quietOn = Boolean(settings?.quiet_on);
  if (!live.size && !quietOn) return out;

  const { data: people } = await db
    .from("seq_contacts")
    .select("id, email, first_name, last_name, tags, created_at, last_activity_at, unsubscribed_at")
    .eq("master_plan_id", planId)
    .overlaps("tags", [...CLIENT_TAGS, FORMER_TAG])
    .limit(5000);
  const rows = (people ?? []) as { id: string; email: string; first_name: string | null; last_name: string | null; tags: string[]; created_at: string; last_activity_at: string | null; unsubscribed_at: string | null }[];
  if (!rows.length) return out;
  const ids = rows.map((r) => r.id);
  const { data: hist } = await db
    .from("crm_tag_history")
    .select("contact_id, tag, created_at")
    .eq("master_plan_id", planId)
    .eq("action", "added")
    .in("tag", [...CLIENT_TAGS, FORMER_TAG])
    .in("contact_id", ids.slice(0, 1000))
    .order("created_at");
  const becameClient = new Map<string, number>();
  const leftAt = new Map<string, number>();
  for (const h of (hist ?? []) as { contact_id: string; tag: string; created_at: string }[]) {
    const t = Date.parse(h.created_at);
    if (h.tag === FORMER_TAG) leftAt.set(h.contact_id, t);
    else if (!becameClient.has(h.contact_id)) becameClient.set(h.contact_id, t);
  }

  const enrol = async (k: "thirty" | "pulse" | "exit", r: (typeof rows)[number], source: string) => {
    out[k].push(r.email);
    const seqId = live.get(CC[k].seq);
    if (dry || !seqId) return;
    if (k === "pulse") {
      // A new quarter: clear last quarter's finished pulse so they can get this one.
      const { data: prev } = await db.from("sequence_enrollments").select("id, start_date").eq("sequence_id", seqId).eq("contact_id", r.id).maybeSingle();
      if (prev?.start_date && Date.now() - new Date(prev.start_date as string).getTime() > 60 * DAY) await db.from("sequence_enrollments").delete().eq("id", prev.id);
    }
    await enrolContact({ masterPlanId: planId, sequenceKey: CC[k].seq, email: r.email, firstName: r.first_name, source }).catch((e) => console.error("client care enrol:", e));
  };

  for (const r of rows) {
    if (r.unsubscribed_at || /eloise/i.test(`${r.first_name ?? ""} ${r.email}`)) continue;
    const tags = r.tags ?? [];
    const former = tags.includes(FORMER_TAG);
    if (former) {
      const left = leftAt.get(r.id);
      if (live.has(CC.exit.seq) && left && Date.now() - left < 3 * DAY) await enrol("exit", r, "client-care:exit");
      continue;
    }
    if (!tags.some((t) => CLIENT_TAGS.includes(t))) continue;
    const since = becameClient.get(r.id) ?? Date.parse(r.created_at);
    const age = Math.floor((Date.now() - since) / DAY);
    if (live.has(CC.thirty.seq) && age >= 30 && age < 30 + CATCH_UP_DAYS) await enrol("thirty", r, "client-care:30-day");
    const q = Math.floor(age / 90);
    if (live.has(CC.pulse.seq) && q >= 1 && age - q * 90 < CATCH_UP_DAYS) await enrol("pulse", r, "client-care:quarterly");
    // Quiet: a client with no activity for 14 days (and a client for at least 14 days) gets one task a month.
    const lastSeen = Date.parse(r.last_activity_at || r.created_at);
    if (quietOn && age >= 14 && Date.now() - lastSeen >= 14 * DAY) {
      const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email;
      const title = `Quiet for 2 weeks: ${name}`;
      const { data: dup } = await db.from("tasks").select("id").eq("master_plan_id", planId).eq("title", title).gte("created_at", new Date(Date.now() - 30 * DAY).toISOString()).limit(1);
      if (dup?.length) continue;
      out.quiet.push(r.email);
      if (dry) continue;
      await db.from("tasks").insert({
        master_plan_id: planId,
        title,
        description: `${name} (${r.email}) is a client with no bookings, payments, emails or notes for 2 weeks. Reach out personally, or start the "CLIENT CARE - quiet client (3 notes)" campaign for them from their contact record or Campaigns & Broadcasts. Client Care › Quiet clients.`,
        status: "today",
        priority: "medium",
        due_date: new Date().toISOString().slice(0, 10),
      });
    }
  }
  return out;
}
