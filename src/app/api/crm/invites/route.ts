import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { upsertContact, logEvent, EMAIL_RE } from "@/lib/crm";
import { crmAccount } from "../guard";
import { enrolContact } from "@/lib/sequences/engine";

export const dynamic = "force-dynamic";

const tagOf = (v: unknown) =>
  typeof v === "string" ? v.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) : "";

// Invite Tracker (each account sees only its own lists). A list is driven by a tag:
// everyone in Contacts with any of the list's tags is invited (like a broadcast's "Who gets it") (so tagging someone in
// Contacts, an import or a form all add them). Invited = when the tag was added;
// sent = ticked here; registered = their first sign-up on the list's form.
// GET ?list= → lists, forms, the chosen list's rows, and registrants without the tag.
// POST
//   create-list { name, tag, formId?, campaignId? }
//   campaign { listId, campaignId }                (the campaign that sends this list's invite)
//   tags { listId, tags: [] }                     (which tags the list follows)
//   add { listId, people: [{ name?, email }], mode: "send" | "already" }
//     send:    starts the list's invite campaign (chosen in List settings),
//              which emails them the invite; "Invite sent" = when that email went out.
//     already: just tags them and marks "Invite sent" now (they were invited another way).
//   sent { listId, contactId, sent: boolean }
//   remove { listId, contactId }                  (removes the list's tags; they stay in Contacts)
export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const [{ data: lists }, { data: forms }, { data: allTagRows }] = await Promise.all([
    db.from("crm_invite_lists").select("id, name, form_id, invite_tag, invite_tags, invite_sequence_id, created_at").eq("master_plan_id", a.planId).order("created_at", { ascending: false }),
    db.from("crm_forms").select("id, name").eq("master_plan_id", a.planId).order("name"),
    db.from("seq_contacts").select("tags").eq("master_plan_id", a.planId).limit(5000),
  ]);
  const { data: campaigns } = await db.from("sequences").select("id, name, active").eq("master_plan_id", a.planId).order("name");
  const allTags = Array.from(new Set((allTagRows ?? []).flatMap((c) => (c.tags as string[]) ?? []))).sort();
  const want = new URL(request.url).searchParams.get("list");
  const list = (lists ?? []).find((l) => l.id === want) ?? (lists ?? [])[0] ?? null;
  if (!list) return NextResponse.json({ lists: [], forms: forms ?? [], campaigns: campaigns ?? [], allTags, list: null, invites: [], walkIns: [] });
  const listTags = ((list.invite_tags as string[]) ?? []).length ? (list.invite_tags as string[]) : list.invite_tag ? [list.invite_tag as string] : [];

  // Everyone with the invite tag.
  const people: { id: string; email: string; first_name: string | null; last_name: string | null; created_at: string }[] = [];
  for (let from = 0; listTags.length; from += 1000) {
    const { data } = await db
      .from("seq_contacts")
      .select("id, email, first_name, last_name, created_at")
      .eq("master_plan_id", a.planId)
      .overlaps("tags", listTags)
      .order("created_at")
      .range(from, from + 999);
    people.push(...((data ?? []) as typeof people));
    if (!data || data.length < 1000) break;
  }
  const ids = people.map((p) => p.id);

  // When each got the tag, and whether the invite went out.
  const tagged = new Map<string, string>();
  const sent = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const [{ data: hist }, { data: inv }] = await Promise.all([
      db.from("crm_tag_history").select("contact_id, created_at").eq("master_plan_id", a.planId).in("tag", listTags).eq("action", "added").in("contact_id", chunk).order("created_at", { ascending: false }),
      db.from("crm_invites").select("contact_id, sent_at").eq("list_id", list.id).in("contact_id", chunk),
    ]);
    for (const h of hist ?? []) tagged.set(h.contact_id as string, h.created_at as string); // latest add wins
    for (const s of inv ?? []) if (s.sent_at) sent.set(s.contact_id as string, s.sent_at as string);
  }

  // Registrations: first sign-up per email on the list's form.
  const registered = new Map<string, { at: string; name: string }>();
  if (list.form_id) {
    const { data: subs } = await db
      .from("crm_submissions")
      .select("created_at, data, seq_contacts(email, first_name, last_name)")
      .eq("form_id", list.form_id)
      .order("created_at", { ascending: true })
      .limit(5000);
    for (const s of subs ?? []) {
      const c = s.seq_contacts as unknown as { email: string; first_name: string | null; last_name: string | null } | null;
      const email = (c?.email || String((s.data as Record<string, string>)?.email || "")).toLowerCase();
      if (!email || registered.has(email)) continue;
      registered.set(email, { at: s.created_at as string, name: [c?.first_name, c?.last_name].filter(Boolean).join(" ") });
    }
  }

  // Also people marked registered by hand (they confirmed another way).
  if (list.form_id) {
    const { data: f } = await db.from("crm_forms").select("sequence_key").eq("id", list.form_id).maybeSingle();
    const { data: seq } = f?.sequence_key ? await db.from("sequences").select("id").eq("master_plan_id", a.planId).eq("key", f.sequence_key).maybeSingle() : { data: null };
    if (seq) {
      const { data: marked } = await db.from("sequence_enrollments").select("registered_at, seq_contacts(email, first_name, last_name)").eq("sequence_id", seq.id).not("registered_at", "is", null).limit(5000);
      for (const m of marked ?? []) {
        const c = m.seq_contacts as unknown as { email: string; first_name: string | null; last_name: string | null } | null;
        const email = (c?.email ?? "").toLowerCase();
        if (email && !registered.has(email)) registered.set(email, { at: m.registered_at as string, name: [c?.first_name, c?.last_name].filter(Boolean).join(" ") });
      }
    }
  }

  // The list's invite campaign: its first email, and when it went to each person.
  const { data: inviteSeq } = list.invite_sequence_id
    ? await db.from("sequences").select("id, name, active").eq("master_plan_id", a.planId).eq("id", list.invite_sequence_id).maybeSingle()
    : { data: null };
  let inviteCampaign: { id: string; name: string; active: boolean; subject: string } | null = null;
  if (inviteSeq) {
    const { data: first } = await db.from("sequence_steps").select("subject").eq("sequence_id", inviteSeq.id).order("position").limit(1).maybeSingle();
    inviteCampaign = { id: inviteSeq.id as string, name: inviteSeq.name as string, active: Boolean(inviteSeq.active), subject: (first?.subject as string) ?? "" };
    for (let i = 0; i < ids.length; i += 500) {
      const { data: enrs } = await db.from("sequence_enrollments").select("contact_id, sequence_sends(status, sent_at)").eq("sequence_id", inviteSeq.id).in("contact_id", ids.slice(i, i + 500));
      for (const e of enrs ?? []) {
        const at = ((e.sequence_sends as { status: string; sent_at: string | null }[] | null) ?? []).filter((x) => x.status === "sent" && x.sent_at).map((x) => x.sent_at as string).sort()[0];
        if (at && !sent.has(e.contact_id as string)) sent.set(e.contact_id as string, at);
      }
    }
  }

  const rows = people.map((p) => ({
    id: p.id,
    name: [p.first_name, p.last_name].filter(Boolean).join(" ") || null,
    email: p.email,
    invited_at: tagged.get(p.id) ?? p.created_at,
    sent_at: sent.get(p.id) ?? null,
    registered_at: registered.get(p.email.toLowerCase())?.at ?? null,
  }));
  const invited = new Set(rows.map((r) => r.email.toLowerCase()));
  const walkIns = Array.from(registered.entries())
    .filter(([email]) => !invited.has(email))
    .map(([email, r]) => ({ email, name: r.name, registered_at: r.at }));
  return NextResponse.json({ lists: lists ?? [], forms: forms ?? [], campaigns: campaigns ?? [], allTags, list, inviteCampaign, invites: rows, walkIns });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const db = createServerClient();
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

  if (b.action === "create-list") {
    const name = str(b.name, 120);
    const tag = tagOf(b.tag) || (name ? `${tagOf(name)}-invite` : "");
    if (!name) return NextResponse.json({ error: "Give the list a name." }, { status: 400 });
    if (!tag) return NextResponse.json({ error: "Give the list a tag." }, { status: 400 });
    let formId: string | null = null;
    if (str(b.formId, 40)) {
      const { data: f } = await db.from("crm_forms").select("id").eq("id", str(b.formId, 40)).eq("master_plan_id", a.planId).maybeSingle();
      formId = (f?.id as string) ?? null;
    }
    let campaignId: string | null = null;
    if (str(b.campaignId, 40)) {
      const { data: sq } = await db.from("sequences").select("id").eq("id", str(b.campaignId, 40)).eq("master_plan_id", a.planId).maybeSingle();
      campaignId = (sq?.id as string) ?? null;
    }
    const { data, error } = await db.from("crm_invite_lists").insert({ master_plan_id: a.planId, name, form_id: formId, invite_tag: tag, invite_tags: [tag], invite_sequence_id: campaignId }).select("id").single();
    if (error) return NextResponse.json({ error: "Couldn't create the list." }, { status: 500 });
    return NextResponse.json({ id: data.id });
  }

  const { data: list } = await db.from("crm_invite_lists").select("id, name, invite_tag, invite_tags, invite_sequence_id").eq("id", str(b.listId, 40)).eq("master_plan_id", a.planId).maybeSingle();
  if (!list) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const tag = (list.invite_tag as string) || ((list.invite_tags as string[]) ?? [])[0] || "invited";
  const listTags = ((list.invite_tags as string[]) ?? []).length ? (list.invite_tags as string[]) : [tag];

  if (b.action === "campaign") {
    let campaignId: string | null = null;
    if (str(b.campaignId, 40)) {
      const { data: sq } = await db.from("sequences").select("id").eq("id", str(b.campaignId, 40)).eq("master_plan_id", a.planId).maybeSingle();
      if (!sq) return NextResponse.json({ error: "Not found." }, { status: 404 });
      campaignId = sq.id as string;
    }
    await db.from("crm_invite_lists").update({ invite_sequence_id: campaignId }).eq("id", list.id).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "tags") {
    const tags = Array.from(new Set((Array.isArray(b.tags) ? b.tags : []).map(tagOf).filter(Boolean))).slice(0, 20) as string[];
    if (!tags.length) return NextResponse.json({ error: "Pick at least one tag." }, { status: 400 });
    // People added from this page get the main tag; keep it if it's still picked, else use the first.
    const main = tags.includes(tag) ? tag : tags[0];
    await db.from("crm_invite_lists").update({ invite_tags: tags, invite_tag: main }).eq("id", list.id).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "add") {
    const { data: inv } = list.invite_sequence_id ? await db.from("sequences").select("key").eq("id", list.invite_sequence_id).eq("master_plan_id", a.planId).maybeSingle() : { data: null };
    const inviteKey = (inv?.key as string) || "";
    const people = (Array.isArray(b.people) ? b.people : []).slice(0, 500) as { name?: unknown; email?: unknown }[];
    let added = 0;
    const skipped: string[] = [];
    for (const p of people) {
      const email = str(p.email, 200).toLowerCase();
      if (!EMAIL_RE.test(email)) {
        skipped.push(str(p.email, 200) || str(p.name, 80) || "(blank)");
        continue;
      }
      const [first, ...rest] = str(p.name, 120).split(/\s+/);
      if (b.mode === "send") {
        // Send the invite: start the list's invite campaign, and tag them for this list.
        if (!inviteKey) {
          skipped.push(`${email} (choose an invite campaign in List settings)`);
          continue;
        }
        const r = await enrolContact({ masterPlanId: a.planId, sequenceKey: inviteKey, email, firstName: first || null, lastName: rest.join(" ") || null, source: "manual", tags: [tag] });
        if (!r.enrollmentId) {
          skipped.push(`${email} (${r.reason === "already enrolled" ? "already sent the invite" : r.reason === "unsubscribed" ? "unsubscribed" : r.reason?.startsWith("no sequence") ? "no invite campaign for this list" : "couldn't send"})`);
          continue;
        }
        added++;
        continue;
      }
      const c = await upsertContact({ masterPlanId: a.planId, email, firstName: first || null, lastName: rest.join(" ") || null, source: `manual:${a.userEmail ?? "you"}`, tags: [tag] }, db);
      if (!c) {
        skipped.push(email);
        continue;
      }
      added++;
      await logEvent(a.planId, c.id, "tag", `Invited to ${list.name} (tagged ${tag})`, {}, db).catch(() => {});
      if (b.mode === "already" || b.alreadySent === true) {
        await db
          .from("crm_invites")
          .upsert({ list_id: list.id, master_plan_id: a.planId, contact_id: c.id, email, sent_at: new Date().toISOString() }, { onConflict: "list_id,email" });
      }
    }
    return NextResponse.json({ added, skipped });
  }

  const contactId = str(b.contactId, 40);
  const { data: c } = await db.from("seq_contacts").select("id, email, tags").eq("id", contactId).eq("master_plan_id", a.planId).maybeSingle();
  if (!c) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (b.action === "sent") {
    const at = b.sent ? new Date().toISOString() : null;
    const { error } = await db
      .from("crm_invites")
      .upsert({ list_id: list.id, master_plan_id: a.planId, contact_id: c.id, email: c.email, sent_at: at }, { onConflict: "list_id,email" });
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
    if (at) await logEvent(a.planId, c.id as string, "manual", `Invite sent: ${list.name}`, {}, db).catch(() => {});
    return NextResponse.json({ ok: true, sent_at: at });
  }
  if (b.action === "remove") {
    const tags = ((c.tags as string[]) ?? []).filter((t) => !listTags.includes(t));
    await db.from("seq_contacts").update({ tags, tag_source: `manual:${a.userEmail ?? "you"}`, updated_at: new Date().toISOString() }).eq("id", c.id).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
