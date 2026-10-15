import type { ActionTool, ActionCtx } from "./types";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import * as microsoft from "@/lib/microsoft";
import { enrolContact } from "@/lib/sequences/engine";
import { selectContacts, WHO_SCHEMA } from "./crm";

// Two look-up tools for email campaigns (the Suite's email series): what went out and what is next, and who
// has replied. Both only READ. Replies are found in the account's connected Microsoft 365 inbox; Gmail is
// send-only here, so a Gmail account is told plainly that replies cannot be read.

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const clean = (v: unknown) => str(v, 120).replace(/[%,()]/g, "");

interface Seq { id: string; key: string; name: string; send_hour: number | null; active: boolean }
interface Step { id: string; position: number; day_offset: number; subject: string | null }
interface Enr { id: string; contact_id: string; status: string; enrolled_at: string; start_date: string | null }
interface Contact { id: string; first_name: string | null; last_name: string | null; email: string }
interface SendRow { enrollment_id: string; step_id: string; status: string; sent_at: string | null }

async function findSequences(ctx: ActionCtx, name: string): Promise<Seq[]> {
  const q = ctx.db.from("sequences").select("id, key, name, send_hour, active").eq("master_plan_id", ctx.planId).order("created_at", { ascending: false }).limit(60);
  const { data } = await (name ? q.ilike("name", `%${name}%`) : q);
  return (data ?? []) as Seq[];
}

/** People enrolled within an hour of each other are one batch; batches are numbered 1, 2, 3 in the order they were enrolled. */
function batchesOf(enrs: { id: string; enrolled_at: string }[]): Map<string, number> {
  const sorted = [...enrs].sort((a, b) => a.enrolled_at.localeCompare(b.enrolled_at));
  const out = new Map<string, number>();
  let n = 0;
  let last = 0;
  for (const e of sorted) {
    const t = new Date(e.enrolled_at).getTime();
    if (n === 0 || t - last > 3600_000) n++;
    out.set(e.id, n);
    last = t;
  }
  return out;
}

const fullName = (c: Contact) => `${c.first_name ?? ""} ${c.last_name ?? ""}`.replace(/\s+-\s*$/, "").trim() || c.email;

export const checkCampaigns: ActionTool = {
  name: "check_campaigns",
  kind: "read",
  apiPath: "/api/sequences",
  description:
    "Check the client's email campaigns (the Campaigns & Broadcasts series): which exist, how many people are enrolled, and for one campaign (give part of its name) who was sent which email and when, and when each person's NEXT email is due. Use for 'did batch 1 go out', 'when does note 2 send' and 'who is in the warm-up'. It cannot say who replied: use check_replies for that.",
  parameters: {
    type: "object",
    properties: {
      campaign: { type: "string", description: "Part of the campaign's name. Leave out to list every campaign with counts." },
    },
  },
  read: async (a, ctx) => {
    const tz = await resolveUserTimeZone(null);
    const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
    const want = clean(a.campaign);
    const seqs = await findSequences(ctx, want);
    if (!seqs.length) return want ? `No campaign has "${want}" in its name.` : "The client has no email campaigns yet.";

    // No name: a short list with counts.
    if (!want && seqs.length > 1) {
      const lines: string[] = [];
      for (const s of seqs.slice(0, 25)) {
        const { data: e } = await ctx.db.from("sequence_enrollments").select("status").eq("sequence_id", s.id).limit(5000);
        const n = new Map<string, number>();
        for (const r of e ?? []) n.set(r.status as string, (n.get(r.status as string) ?? 0) + 1);
        lines.push(`"${s.name}" (${s.active ? "ON" : "OFF"}): ${Array.from(n).map(([k, v]) => `${v} ${k}`).join(", ") || "nobody enrolled"}`);
      }
      return lines.join("\n");
    }

    const out: string[] = [];
    for (const s of seqs.slice(0, 3)) {
      const { data: stepRows } = await ctx.db.from("sequence_steps").select("id, position, day_offset, subject").eq("sequence_id", s.id).order("position");
      const steps = (stepRows ?? []) as Step[];
      const { data: enrRows } = await ctx.db.from("sequence_enrollments").select("id, contact_id, status, enrolled_at, start_date").eq("sequence_id", s.id).order("enrolled_at").limit(500);
      const enrs = (enrRows ?? []) as Enr[];
      const ids = enrs.map((e) => e.id);
      const { data: sendRows } = ids.length ? await ctx.db.from("sequence_sends").select("enrollment_id, step_id, status, sent_at").in("enrollment_id", ids.slice(0, 500)) : { data: [] };
      const sends = (sendRows ?? []) as SendRow[];
      const cids = Array.from(new Set(enrs.map((e) => e.contact_id)));
      const { data: cRows } = cids.length ? await ctx.db.from("seq_contacts").select("id, first_name, last_name, email").eq("master_plan_id", ctx.planId).in("id", cids.slice(0, 500)) : { data: [] };
      const contacts = new Map(((cRows ?? []) as Contact[]).map((c) => [c.id, c]));
      const stepPos = new Map(steps.map((st) => [st.id, st]));

      out.push(`Campaign "${s.name}" (${s.active ? "ON" : "OFF"}), ${steps.length} emails: ${steps.map((st) => `#${st.position + 1} day ${st.day_offset}${st.subject ? ` "${st.subject.slice(0, 40)}"` : ""}`).join("; ")}.`);
      const status = new Map<string, number>();
      for (const e of enrs) status.set(e.status, (status.get(e.status) ?? 0) + 1);
      out.push(`Enrolled: ${enrs.length} (${Array.from(status).map(([k, v]) => `${v} ${k}`).join(", ") || "none"}).`);
      const batchOf = batchesOf(enrs);
      const byBatch = new Map<number, { n: number; first: string }>();
      for (const e of enrs) {
        const b = batchOf.get(e.id) ?? 1;
        const cur = byBatch.get(b);
        if (!cur) byBatch.set(b, { n: 1, first: e.enrolled_at });
        else cur.n++;
      }
      if (byBatch.size > 1 || enrs.length) out.push(`Batches (people enrolled within an hour of each other): ${Array.from(byBatch).map(([b, v]) => `batch ${b} = ${v.n} people enrolled ${when(v.first)}`).join("; ")}.`);
      for (const e of enrs.slice(0, 60)) {
        const c = contacts.get(e.contact_id);
        const mine = sends.filter((x) => x.enrollment_id === e.id && x.status === "sent" && x.sent_at).sort((x, y) => String(x.sent_at).localeCompare(String(y.sent_at)));
        const sentPositions = new Set(mine.map((x) => stepPos.get(x.step_id)?.position));
        const next = steps.find((st) => !sentPositions.has(st.position));
        let due = "";
        if (next && e.status === "active") {
          const base = e.start_date ? new Date(`${e.start_date}T12:00:00Z`) : new Date(e.enrolled_at);
          const d = new Date(base.getTime() + next.day_offset * 86400_000);
          due = `; next: email #${next.position + 1} due ${day(d.toISOString().slice(0, 10))}${s.send_hour != null ? ` around ${s.send_hour}:00` : ""}`;
        }
        out.push(`- ${c ? fullName(c) : "(contact removed)"} [batch ${batchOf.get(e.id) ?? 1}, ${e.status}]: ${mine.length ? mine.map((x) => `#${(stepPos.get(x.step_id)?.position ?? 0) + 1} sent ${when(x.sent_at as string)}`).join(", ") : "nothing sent yet"}${due}`);
      }
      if (enrs.length > 60) out.push(`(${enrs.length - 60} more not shown)`);
      out.push("");
    }
    return out.join("\n").trim();
  },
};

export const checkReplies: ActionTool = {
  name: "check_replies",
  kind: "read",
  apiPath: "/api/inbox",
  description:
    "Find who has REPLIED to an email campaign by searching the client's connected Microsoft 365 inbox for messages from the people enrolled in it (after they were enrolled). Give part of the campaign's name. Reports each reply with when and the first lines, and who has not replied. Only works when a Microsoft 365 mailbox is connected (a Gmail account cannot be read). It reads, it never replies or sends. Replies that bounced (Undeliverable) are not seen here.",
  parameters: {
    type: "object",
    properties: {
      campaign: { type: "string", description: "Part of the campaign's name." },
      batch: { type: "number", description: "Optional: only batch 1, 2, 3 (people enrolled within an hour of each other, numbered in the order enrolled; check_campaigns lists them). Leave out to check everyone enrolled; do not pass dates." },
    },
    required: ["campaign"],
  },
  read: async (a, ctx) => {
    const tz = await resolveUserTimeZone(null);
    const when = (ms: number) => new Date(ms).toLocaleString("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const want = clean(a.campaign);
    if (!want) return "Which campaign? Give part of its name.";
    const seqs = await findSequences(ctx, want);
    if (!seqs.length) return `No campaign has "${want}" in its name.`;
    if (seqs.length > 1 && !seqs.some((s) => s.name.toLowerCase() === want.toLowerCase())) return `More than one campaign matches: ${seqs.slice(0, 5).map((s) => `"${s.name}"`).join(", ")}. Which one?`;
    const seq = seqs.find((s) => s.name.toLowerCase() === want.toLowerCase()) ?? seqs[0];

    // Whose mailbox: the account owner's own connection, the same one the inbox page reads.
    const { data: plan } = await ctx.db.from("client_master_plans").select("user_id").eq("id", ctx.planId).maybeSingle();
    const ownerId = (plan?.user_id as string) || null;
    if (!ownerId) return "This account has no mailbox connected, so replies can't be read.";
    const token = await microsoft.getValidAccessToken({ ownerId }).catch(() => null);
    if (!token) return "No Microsoft 365 mailbox is connected for this account (a Gmail account is send-only here), so replies can't be read. Ask the client to connect Microsoft 365 in Settings > Integrations, or to tell you who replied.";

    const { data: enrRows } = await ctx.db.from("sequence_enrollments").select("id, contact_id, status, enrolled_at").eq("sequence_id", seq.id).order("enrolled_at").limit(300);
    const allEnrs = (enrRows ?? []) as { id: string; contact_id: string; status: string; enrolled_at: string }[];
    if (!allEnrs.length) return `Nobody is enrolled in "${seq.name}".`;
    const batchOf = batchesOf(allEnrs);
    const wantBatch = typeof a.batch === "number" && a.batch >= 1 ? Math.round(a.batch) : 0;
    let enrs = wantBatch ? allEnrs.filter((e) => batchOf.get(e.id) === wantBatch) : allEnrs;
    let batchNote = "";
    if (wantBatch && !enrs.length) {
      enrs = allEnrs; // a batch number that does not exist: check everyone rather than answer with nothing
      batchNote = `There is no batch ${wantBatch} (the campaign has ${Math.max(...Array.from(batchOf.values()))}), so everyone enrolled was checked. `;
    }
    const cids = Array.from(new Set(enrs.map((e) => e.contact_id)));
    const { data: cRows } = await ctx.db.from("seq_contacts").select("id, first_name, last_name, email").eq("master_plan_id", ctx.planId).in("id", cids.slice(0, 300));
    const contacts = new Map(((cRows ?? []) as Contact[]).map((c) => [c.id, c]));

    const replied: string[] = [];
    const quiet: string[] = [];
    const limit = enrs.slice(0, 40);
    const deadline = Date.now() + 40_000; // the whole check stops here so the reply is never held up
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    // One person's check. Throws when the mailbox search itself fails (busy, rate limit) so it can be retried.
    const checkOne = async (e: (typeof limit)[number]): Promise<"replied" | "quiet" | "skip"> => {
      const c = contacts.get(e.contact_id);
      if (!c?.email) return "skip";
      const since = new Date(e.enrolled_at).getTime() - 60_000;
      if (Date.now() > deadline) throw new Error("out of time");
      const msgs = await microsoft.searchAllMail(token, c.email, 30, AbortSignal.timeout(8000));
      const mine = msgs.filter((m) => m.fromEmail === c.email.toLowerCase() && m.ts >= since);
      if (mine.length) {
        const m = mine[0];
        replied.push(`- ${fullName(c)} (batch ${batchOf.get(e.id) ?? 1}) replied ${when(m.ts)}: "${m.subject.slice(0, 70)}" ${m.snippet.replace(/\s+/g, " ").slice(0, 140)}${mine.length > 1 ? ` (${mine.length} messages)` : ""}`);
        return "replied";
      }
      quiet.push(fullName(c));
      return "quiet";
    };
    // A few at a time, so a long list does not hammer the mailbox; anything that fails is tried again one by one.
    let failed: typeof limit = [];
    for (let i = 0; i < limit.length; i += 4) {
      const group = limit.slice(i, i + 4);
      const res = await Promise.all(group.map((e) => checkOne(e).then(() => null, () => e)));
      failed.push(...res.filter((x): x is (typeof limit)[number] => x !== null));
    }
    for (let round = 0; round < 2 && failed.length; round++) {
      const again: typeof limit = [];
      for (const e of failed) {
        await sleep(700);
        try {
          await checkOne(e);
        } catch {
          again.push(e);
        }
      }
      failed = again;
    }
    for (const e of failed) {
      const c = contacts.get(e.contact_id);
      quiet.push(`${c ? fullName(c) : "a contact"} (not checked: the mailbox search was slow or failed; ask again to check these)`);
    }
    const perBatch = new Map<number, { n: number }>();
    for (const e of limit) perBatch.set(batchOf.get(e.id) ?? 1, { n: (perBatch.get(batchOf.get(e.id) ?? 1)?.n ?? 0) + 1 });
    return [
      `${batchNote}Campaign "${seq.name}": ${limit.length} people checked${enrs.length > limit.length ? ` of ${enrs.length}` : ""} (${Array.from(perBatch).map(([b, v]) => `batch ${b}: ${v.n}`).join(", ")}), ${replied.length} replied.`,
      ...(replied.length ? ["Replies:", ...replied] : ["No replies found in the connected Microsoft 365 inbox."]),
      ...(quiet.length ? [`No reply from: ${quiet.join(", ")}.`] : []),
      "Note: this reads the connected Microsoft 365 inbox only; replies sent somewhere else, or that bounced, are not seen.",
    ].join("\n");
  },
};


// ── Start people on a campaign ──────────────────────────────────────────────────────────────────────────────
// The one tool that makes an email go out, so it is narrow: named people only (never "everyone"), a small number per
// approval, anyone who unsubscribed, is already in, or carries a skip tag is left out, and the preview says plainly
// what will be sent and when. Nothing runs until the client presses Approve.
const ENROLL_MAX = 20;

interface EnrolPlan {
  notFound: string[];
  seq: { id: string; key: string; name: string; active: boolean; send_hour: number | null; skip_tags: string[] | null };
  go: { id: string; email: string; first_name: string | null; last_name: string | null }[];
  already: string[];
  unsub: string[];
  skipped: string[];
  capped: number;
  steps: { position: number; day_offset: number; subject: string | null }[];
}

async function planEnrol(a: Record<string, unknown>, ctx: ActionCtx): Promise<EnrolPlan | { error: string }> {
  const name = clean(a.campaign);
  if (!name) return { error: "Which campaign? Give part of its name." };
  const who = (a.who as Record<string, unknown>) ?? {};
  const { data: seqs } = await ctx.db.from("sequences").select("id, key, name, active, send_hour, skip_tags").eq("master_plan_id", ctx.planId).ilike("name", `%${name}%`).limit(6);
  const list = (seqs ?? []) as EnrolPlan["seq"][];
  if (!list.length) return { error: `No campaign has "${name}" in its name.` };
  const seq = list.find((x) => x.name.toLowerCase() === name.toLowerCase()) ?? (list.length === 1 ? list[0] : null);
  if (!seq) return { error: `More than one campaign matches: ${list.map((x) => `"${x.name}"`).join(", ")}. Which one?` };

  // Named people: each name or email is looked up on its own, so a list of several people all resolve.
  const people = (Array.isArray(a.people) ? a.people : []).map((x) => str(x, 120)).filter(Boolean).slice(0, 40);
  const notFound: string[] = [];
  let rows: Awaited<ReturnType<typeof selectContacts>> extends infer R ? (R extends { rows: infer T } ? T : never) : never = [] as never;
  let capped = false;
  if (people.length) {
    const seen = new Set<string>();
    const acc: typeof rows = [] as never;
    for (const person of people) {
      const one = /@/.test(person) ? { emails: [person.toLowerCase()] } : { search: person };
      const r = await selectContacts(one, ctx);
      if ("error" in r || !r.rows.length) {
        notFound.push(person);
        continue;
      }
      // A name that matches several different people is not guessed: ask which one.
      if (r.rows.length > 1) {
        const exact = r.rows.filter((c) => `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim().toLowerCase() === person.toLowerCase());
        if (exact.length !== 1) {
          notFound.push(`${person} (matches ${r.rows.length} contacts: ${r.rows.slice(0, 3).map((c) => c.email).join(", ")})`);
          continue;
        }
        r.rows = exact;
      }
      for (const c of r.rows) if (!seen.has(c.id)) { seen.add(c.id); acc.push(c); }
    }
    rows = acc;
  } else {
    if (who.everyone) return { error: "I can only start named people or a tag group, never everyone at once. Tell me which people or which tag." };
    const found = await selectContacts(who, ctx);
    if ("error" in found) return { error: found.error };
    rows = found.rows;
    capped = found.capped;
  }
  void capped;
  if (!rows.length) return { error: notFound.length ? `I could not find: ${notFound.join(", ")}.` : "Nobody matched that." };
  const found = { rows };
  const ids = found.rows.map((r) => r.id);
  const { data: enr } = await ctx.db.from("sequence_enrollments").select("contact_id").eq("sequence_id", seq.id).in("contact_id", ids.slice(0, 1000));
  const inIds = new Set((enr ?? []).map((e) => e.contact_id as string));
  const { data: flags } = await ctx.db.from("seq_contacts").select("id, unsubscribed_at, tags").eq("master_plan_id", ctx.planId).in("id", ids.slice(0, 1000));
  const flagOf = new Map(((flags ?? []) as { id: string; unsubscribed_at: string | null; tags: string[] | null }[]).map((f) => [f.id, f]));
  const skipTags = (seq.skip_tags ?? []).filter(Boolean);
  const nm = (c: { first_name: string | null; last_name: string | null; email: string }) => `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email;
  const go: EnrolPlan["go"] = [];
  const already: string[] = [];
  const unsub: string[] = [];
  const skipped: string[] = [];
  for (const c of found.rows) {
    const f = flagOf.get(c.id);
    if (inIds.has(c.id)) already.push(nm(c));
    else if (f?.unsubscribed_at) unsub.push(nm(c));
    else if (skipTags.length && (f?.tags ?? []).some((t) => skipTags.includes(t))) skipped.push(nm(c));
    else go.push({ id: c.id, email: c.email, first_name: c.first_name, last_name: c.last_name });
  }
  if (!go.length) {
    const why = [already.length ? `${already.length} already in it` : "", unsub.length ? `${unsub.length} unsubscribed` : "", skipped.length ? `${skipped.length} carry a tag it skips` : ""].filter(Boolean).join(", ");
    return { error: `Nobody can be started: ${why || "no one matched"}.` };
  }
  const { data: st } = await ctx.db.from("sequence_steps").select("position, day_offset, subject").eq("sequence_id", seq.id).order("position");
  return { seq, go: go.slice(0, ENROLL_MAX), already, unsub, skipped, notFound, capped: Math.max(0, go.length - ENROLL_MAX), steps: (st ?? []) as EnrolPlan["steps"] };
}

export const enrollInCampaign: ActionTool = {
  name: "enroll_in_campaign",
  kind: "write",
  apiPath: "/api/sequences",
  description:
    "Start specific people on one of the client's email campaigns (Campaigns & Broadcasts), for example 'start batch 3 on the warm-up'. THIS MAKES EMAIL GO OUT: the campaign's first email is sent to each person right away when the campaign is ON, and the later emails follow on its own schedule. It runs only after the client presses Approve. Give the campaign name and WHO (names, emails or a tag; never everyone); up to 20 people per approval. Anyone already in it, unsubscribed, or carrying a tag the campaign skips is left out and listed. Look at the campaign with check_campaigns first so you know who is already in.",
  parameters: {
    type: "object",
    properties: {
      campaign: { type: "string", description: "Part of the campaign's name." },
      people: { type: "array", items: { type: "string" }, description: "Named people to start: full names or email addresses, one entry each (up to 40). Use this whenever the client names people." },
      who: { ...WHO_SCHEMA, description: "Only when starting a TAG group instead of named people (for example with_any_tag). Leave out when you give people." },
    },
    required: ["campaign"],
  },
  plan: async (a, ctx) => {
    const p = await planEnrol(a, ctx);
    if ("error" in p) return { error: p.error };
    const tz = await resolveUserTimeZone(null);
    const dayLabel = (offset: number) => {
      const d = new Date(Date.now() + offset * 86400_000);
      return d.toLocaleDateString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" });
    };
    const names = p.go.map((c) => `${`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email}`);
    const lines = [
      p.seq.active
        ? `Email 1 is sent to ${p.go.length === 1 ? "them" : "each of them"} right away, from your campaign's sender. This cannot be unsent.`
        : `This campaign is OFF, so nothing is sent until you turn it on; they are only added.`,
      ...p.steps.slice(1).map((s) => `Email ${s.position + 1}${s.subject ? ` ("${s.subject.slice(0, 40)}")` : ""}: ${dayLabel(s.day_offset)}${p.seq.send_hour != null ? ` around ${p.seq.send_hour}:00` : ""}`),
      `People: ${names.slice(0, 12).join(", ")}${names.length > 12 ? `, and ${names.length - 12} more` : ""}`,
      ...(p.already.length ? [`Left out, already in it (${p.already.length}): ${p.already.slice(0, 6).join(", ")}`] : []),
      ...(p.unsub.length ? [`Left out, unsubscribed (${p.unsub.length}): ${p.unsub.slice(0, 6).join(", ")}`] : []),
      ...(p.skipped.length ? [`Left out, carry a tag this campaign skips (${p.skipped.length}): ${p.skipped.slice(0, 6).join(", ")}`] : []),
      ...(p.notFound.length ? [`Not found, so NOT included (${p.notFound.length}): ${p.notFound.join(", ")}`] : []),
      ...(p.capped ? [`Only the first ${ENROLL_MAX} are started; ask again for the other ${p.capped}.`] : []),
    ];
    return { preview: { title: `Start ${p.go.length} ${p.go.length === 1 ? "person" : "people"} on "${p.seq.name}"`, lines } };
  },
  run: async (a, ctx) => {
    const p = await planEnrol(a, ctx);
    if ("error" in p) throw new Error(p.error);
    const started: string[] = [];
    const failed: string[] = [];
    for (const c of p.go) {
      const out = await enrolContact({ masterPlanId: ctx.planId, sequenceKey: p.seq.key, email: c.email, firstName: c.first_name, lastName: c.last_name, source: "assistant", sourceRef: ctx.userEmail });
      if (out.enrollmentId) started.push(c.id);
      else failed.push(`${c.first_name ?? c.email}: ${out.reason ?? "not started"}`);
    }
    return {
      summary: `Started ${started.length} ${started.length === 1 ? "person" : "people"} on "${p.seq.name}"${p.seq.active ? " (email 1 sent)" : ""}${failed.length ? `. Not started: ${failed.slice(0, 4).join("; ")}` : ""}.`,
      result: { started: started.length, failed: failed.length },
    };
  },
};

export const CAMPAIGN_TOOLS: ActionTool[] = [checkCampaigns, checkReplies, enrollInCampaign];
