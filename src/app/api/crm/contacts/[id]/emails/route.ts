import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { listMailAccounts, openMailboxes } from "@/lib/mailboxes";
import { currentMailOwner } from "@/lib/mailOwner";
import { crmAccount } from "../../../guard";

export const dynamic = "force-dynamic";

// A contact's email history, in one list:
//   - mail found in the account owner's connected Gmail / Microsoft 365
//     mailboxes (stored as metadata + snippet in contact_emails), shown ONLY to
//     the owner themself — team members never see the owner's mailbox;
//   - emails the Suite sent them (sequences and broadcasts), read in place.
// GET → { emails, owner, mailboxes, note? } · POST { action: "sync" } searches
// the owner's mailboxes for this contact, stores what it finds, returns the list.

type Db = ReturnType<typeof createServerClient>;

export type ContactEmail = {
  key: string;
  source: "mailbox" | "suite";
  direction: "in" | "out";
  subject: string;
  from: string;
  to: string;
  sentAt: string | null;
  snippet: string;
  badge: string; // mailbox address, or "Suite"
  via?: string; // "Sent by the Suite · <sequence/broadcast name>"
  provider?: "google" | "microsoft";
  accountKey?: string;
  messageId?: string;
};

const PRIVATE_NOTE = "Emails from the owner's inbox are private to the owner.";
const PER_MAILBOX = 50;
const TIMEOUT_MS = 8000;
const EMAIL_RE = /^[^\s@<>"'(),;:\\]+@[^\s@<>"'(),;:\\]+\.[^\s@<>"'(),;:\\]+$/;

async function loadContact(db: Db, planId: string, id: string) {
  const { data } = await db.from("seq_contacts").select("id, email").eq("id", id).eq("master_plan_id", planId).maybeSingle();
  return data as { id: string; email: string } | null;
}

// The signed-in person's mail-owner id, only when they own THIS account's plan.
async function ownerOfPlan(db: Db, planId: string): Promise<string | null> {
  const owner = await currentMailOwner();
  if (!owner) return null;
  const { data } = await db.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
  return data?.user_id && data.user_id === owner ? owner : null;
}

async function mailboxRows(db: Db, planId: string, contactId: string): Promise<ContactEmail[]> {
  const { data } = await db
    .from("contact_emails")
    .select("id, provider, mailbox_email, account_key, message_id, direction, from_addr, to_addrs, subject, snippet, sent_at")
    .eq("master_plan_id", planId)
    .eq("contact_id", contactId)
    .order("sent_at", { ascending: false })
    .limit(500);
  return (data ?? []).map((r) => ({
    key: `m:${r.id}`,
    source: "mailbox" as const,
    direction: r.direction === "out" ? ("out" as const) : ("in" as const),
    subject: r.subject || "(no subject)",
    from: r.from_addr || "",
    to: r.to_addrs || "",
    sentAt: r.sent_at,
    snippet: r.snippet || "",
    badge: r.mailbox_email || (r.provider === "microsoft" ? "Microsoft 365" : "Gmail"),
    provider: r.provider === "microsoft" ? ("microsoft" as const) : ("google" as const),
    accountKey: r.account_key || undefined,
    messageId: r.message_id,
  }));
}

// Emails the Suite itself sent this contact, scoped to this account's own
// sequences and broadcasts.
async function suiteRows(db: Db, planId: string, contact: { id: string; email: string }): Promise<ContactEmail[]> {
  const [{ data: enrs }, { data: bsends }] = await Promise.all([
    db
      .from("sequence_enrollments")
      .select("id, sequences!inner(name, from_email, master_plan_id), sequence_sends(id, status, sent_at, sequence_steps(subject, preview))")
      .eq("contact_id", contact.id)
      .eq("sequences.master_plan_id", planId),
    db
      .from("crm_broadcast_sends")
      .select("id, sent_at, crm_broadcasts!inner(name, subject, preview, from_email, master_plan_id)")
      .eq("contact_id", contact.id)
      .eq("status", "sent")
      .eq("crm_broadcasts.master_plan_id", planId)
      .limit(500),
  ]);
  const out: ContactEmail[] = [];
  type Seq = { name: string; from_email: string | null };
  type Send = { id: string; status: string; sent_at: string | null; sequence_steps: { subject: string | null; preview: string | null } | null };
  for (const e of enrs ?? []) {
    const seq = e.sequences as unknown as Seq | null;
    for (const s of (e.sequence_sends as unknown as Send[] | null) ?? []) {
      if (s.status !== "sent") continue;
      out.push({
        key: `s:${s.id}`,
        source: "suite",
        direction: "out",
        subject: s.sequence_steps?.subject || "(no subject)",
        from: seq?.from_email || "",
        to: contact.email,
        sentAt: s.sent_at,
        snippet: s.sequence_steps?.preview || "",
        badge: "Suite",
        via: `Sent by the Suite · ${seq?.name || "Sequence"}`,
      });
    }
  }
  type Bc = { name: string; subject: string | null; preview: string | null; from_email: string | null };
  for (const s of bsends ?? []) {
    const b = s.crm_broadcasts as unknown as Bc | null;
    out.push({
      key: `b:${s.id}`,
      source: "suite",
      direction: "out",
      subject: b?.subject || "(no subject)",
      from: b?.from_email || "",
      to: contact.email,
      sentAt: s.sent_at,
      snippet: b?.preview || "",
      badge: "Suite",
      via: `Sent by the Suite · ${b?.name || "Broadcast"}`,
    });
  }
  return out;
}

async function merged(db: Db, planId: string, contact: { id: string; email: string }, owner: string | null) {
  const [mine, suite] = await Promise.all([owner ? mailboxRows(db, planId, contact.id) : Promise.resolve([]), suiteRows(db, planId, contact)]);
  return [...mine, ...suite].sort((a, b) => (b.sentAt ? Date.parse(b.sentAt) : 0) - (a.sentAt ? Date.parse(a.sentAt) : 0));
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const contact = await loadContact(db, a.planId, params.id);
  if (!contact) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const owner = await ownerOfPlan(db, a.planId);
  const mailboxes = owner ? (await listMailAccounts({ ownerId: owner })).map((m) => m.email || (m.provider === "google" ? "Gmail" : "Microsoft 365")) : [];
  return NextResponse.json({
    emails: await merged(db, a.planId, contact, owner),
    owner: Boolean(owner),
    mailboxes,
    note: owner ? undefined : PRIVATE_NOTE,
  });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  if (b?.action !== "sync") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const db = createServerClient();
  const contact = await loadContact(db, a.planId, params.id);
  if (!contact) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const owner = await ownerOfPlan(db, a.planId);
  if (!owner) return NextResponse.json({ error: PRIVATE_NOTE }, { status: 403 });

  const target = (contact.email || "").trim().toLowerCase();
  const errors: string[] = [];
  let mailboxes: string[] = [];
  if (EMAIL_RE.test(target)) {
    const boxes = await openMailboxes({ ownerId: owner });
    mailboxes = boxes.map((m) => m.label);
    const own = new Set(boxes.map((m) => (m.email || "").toLowerCase()).filter(Boolean));
    await Promise.all(
      boxes.map(async (box) => {
        if (box.provider === "google" && box.canReadMail === false) return; // send-only Gmail connection: nothing to read
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
        try {
          const lib = box.provider === "google" ? google : microsoft;
          const found = await lib.searchAllMail(box.token, target, PER_MAILBOX, ctrl.signal);
          const rows = found
            // Keep only mail this contact is really on (search can match loosely).
            .filter((m) => m.fromEmail === target || m.toEmails.includes(target))
            .map((m) => ({
              master_plan_id: a.planId,
              contact_id: contact.id,
              provider: box.provider,
              mailbox_email: box.email,
              account_key: box.accountKey,
              message_id: m.id,
              thread_id: m.threadId || null,
              direction: own.has(m.fromEmail) ? "out" : "in",
              from_addr: m.fromEmail.slice(0, 320),
              to_addrs: Array.from(new Set(m.toEmails)).join(", ").slice(0, 2000),
              subject: m.subject.slice(0, 500),
              snippet: m.snippet.replace(/\s+/g, " ").trim().slice(0, 300),
              sent_at: m.ts ? new Date(m.ts).toISOString() : null,
            }));
          if (rows.length) {
            const { error } = await db
              .from("contact_emails")
              .upsert(rows, { onConflict: "master_plan_id,contact_id,provider,message_id", ignoreDuplicates: true });
            if (error) throw error;
          }
        } catch (e) {
          console.error(`contact emails ${box.provider}:`, e);
          errors.push(`Couldn't reach ${box.label} just now.`);
        } finally {
          clearTimeout(timer);
        }
      })
    );
  }
  return NextResponse.json({ emails: await merged(db, a.planId, contact, owner), owner: true, mailboxes, errors });
}
