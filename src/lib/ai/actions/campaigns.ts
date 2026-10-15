import type { ActionTool, ActionCtx } from "./types";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import * as microsoft from "@/lib/microsoft";

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
        out.push(`- ${c ? fullName(c) : "(contact removed)"} [${e.status}]: ${mine.length ? mine.map((x) => `#${(stepPos.get(x.step_id)?.position ?? 0) + 1} sent ${when(x.sent_at as string)}`).join(", ") : "nothing sent yet"}${due}`);
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
      batch_from: { type: "string", description: "Optional YYYY-MM-DD: only people enrolled on or after this day (one batch)." },
      batch_to: { type: "string", description: "Optional YYYY-MM-DD: only people enrolled on or before this day." },
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
    let enrs = (enrRows ?? []) as { id: string; contact_id: string; status: string; enrolled_at: string }[];
    const from = str(a.batch_from, 10);
    const to = str(a.batch_to, 10);
    const dayOf = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: tz });
    if (/^\d{4}-\d{2}-\d{2}$/.test(from)) enrs = enrs.filter((e) => dayOf(e.enrolled_at) >= from);
    if (/^\d{4}-\d{2}-\d{2}$/.test(to)) enrs = enrs.filter((e) => dayOf(e.enrolled_at) <= to);
    if (!enrs.length) return `Nobody is enrolled in "${seq.name}" in that window.`;
    const cids = Array.from(new Set(enrs.map((e) => e.contact_id)));
    const { data: cRows } = await ctx.db.from("seq_contacts").select("id, first_name, last_name, email").eq("master_plan_id", ctx.planId).in("id", cids.slice(0, 300));
    const contacts = new Map(((cRows ?? []) as Contact[]).map((c) => [c.id, c]));

    const replied: string[] = [];
    const quiet: string[] = [];
    const limit = enrs.slice(0, 40);
    // A few at a time, so a long list does not hammer the mailbox.
    for (let i = 0; i < limit.length; i += 5) {
      await Promise.all(
        limit.slice(i, i + 5).map(async (e) => {
          const c = contacts.get(e.contact_id);
          if (!c?.email) return;
          const since = new Date(e.enrolled_at).getTime() - 60_000;
          try {
            const msgs = await microsoft.searchAllMail(token, c.email, 30);
            const mine = msgs.filter((m) => m.fromEmail === c.email.toLowerCase() && m.ts >= since);
            if (mine.length) {
              const m = mine[0];
              replied.push(`- ${fullName(c)} replied ${when(m.ts)}: "${m.subject.slice(0, 70)}" ${m.snippet.replace(/\s+/g, " ").slice(0, 140)}${mine.length > 1 ? ` (${mine.length} messages)` : ""}`);
            } else quiet.push(fullName(c));
          } catch {
            quiet.push(`${fullName(c)} (could not be checked)`);
          }
        })
      );
    }
    return [
      `Campaign "${seq.name}": ${limit.length} people checked${enrs.length > limit.length ? ` of ${enrs.length}` : ""}, ${replied.length} replied.`,
      ...(replied.length ? ["Replies:", ...replied] : ["No replies found in the connected Microsoft 365 inbox."]),
      ...(quiet.length ? [`No reply from: ${quiet.join(", ")}.`] : []),
      "Note: this reads the connected Microsoft 365 inbox only; replies sent somewhere else, or that bounced, are not seen.",
    ].join("\n");
  },
};

export const CAMPAIGN_TOOLS: ActionTool[] = [checkCampaigns, checkReplies];
