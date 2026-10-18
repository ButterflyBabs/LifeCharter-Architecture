import { randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { accountSender } from "@/lib/email/accountSender";
import { sendMail } from "@/lib/booking/engine";
import type { VolantReport } from "@/lib/volant";
import { cleanLook, headingFor, type PortalLook } from "@/lib/portalLook";

// Client portal (task 1147). Each account's own clients get a private link (no password; the unguessable link is the
// key, like shared project pages) to a page in the account's own branding: package and sessions left, upcoming
// bookings, invoices to pay, shared LC Volant recaps, homework they tick off, goals, files and messages.
// Decisions (Babs 2026-10-18): private link; everything but group programs; a session counts when the booking is
// marked Attended; the account's own name and logo with a small "Powered by" line.

type Db = ReturnType<typeof createServerClient>;

const SITE = () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
export const newPortalToken = () => randomBytes(24).toString("base64url");
export const portalUrl = (token: string) => `${SITE()}/portal/${token}`;
export const validToken = (t: string) => /^[A-Za-z0-9_-]{24,64}$/.test(t);
export const PORTAL_BUCKET = "portal-files";
export const MAX_FILE = 50 * 1024 * 1024;

export interface PortalRow { id: string; master_plan_id: string; contact_id: string; token: string; active: boolean; welcome: string | null; sent_at: string | null; last_seen_at: string | null; look?: unknown }
export const PORTAL_COLUMNS = "id, master_plan_id, contact_id, token, active, welcome, sent_at, last_seen_at, look";

/** The account's default look (what a new portal starts from). */
export async function defaultLook(db: Db, planId: string): Promise<PortalLook> {
  const { data } = await db.from("client_portal_defaults").select("look").eq("master_plan_id", planId).maybeSingle();
  return cleanLook(data?.look ?? {});
}

/** The portal behind a private link, if the link is well formed and still on. */
export async function portalFor(token: string) {
  if (!validToken(token)) return null;
  const db = createServerClient();
  const { data } = await db.from("client_portals").select(PORTAL_COLUMNS).eq("token", token).maybeSingle();
  if (!data || !data.active) return null;
  return { db, p: data as PortalRow };
}

/** The account's own name and logo for the portal header (never the Suite's). */
export async function brandFor(db: Db, planId: string): Promise<{ name: string; logo: string | null }> {
  const [{ data: ws }, { data: plan }] = await Promise.all([
    db.from("workspaces").select("name, logo_url").eq("master_plan_id", planId).order("created_at").limit(1).maybeSingle(),
    db.from("client_master_plans").select("sender_name, client_name").eq("id", planId).maybeSingle(),
  ]);
  const name = (plan?.sender_name as string) || (ws?.name as string) || (plan?.client_name as string) || "Your portal";
  return { name, logo: (ws?.logo_url as string) || null };
}

/** Sessions used per package (each Attended booking or hand adjustment is one row of +1 or -1). */
export async function sessionsUsed(db: Db, packageIds: string[]): Promise<Map<string, number>> {
  const used = new Map<string, number>();
  if (!packageIds.length) return used;
  const { data } = await db.from("package_sessions").select("package_id, delta").in("package_id", packageIds);
  for (const r of (data ?? []) as { package_id: string; delta: number }[]) used.set(r.package_id, (used.get(r.package_id) ?? 0) + r.delta);
  return used;
}

/** A booking was marked Attended: it uses one session of the client's active package (once per booking). */
export async function countAttendedSession(db: Db, planId: string, bookingId: string): Promise<boolean> {
  const { data: b } = await db.from("bookings").select("id, contact_id, calendar_id, start_at, invitee_email").eq("id", bookingId).eq("master_plan_id", planId).maybeSingle();
  if (!b) return false;
  let contactId = b.contact_id as string | null;
  if (!contactId && b.invitee_email) {
    const { data: c } = await db.from("seq_contacts").select("id").eq("master_plan_id", planId).eq("email", String(b.invitee_email).toLowerCase()).maybeSingle();
    contactId = (c?.id as string) ?? null;
  }
  if (!contactId) return false;
  const { data: pkgs } = await db.from("client_packages").select("id, sessions_total, calendar_ids, expires_on").eq("contact_id", contactId).eq("master_plan_id", planId).eq("status", "active").order("created_at");
  const day = String(b.start_at).slice(0, 10);
  const fits = ((pkgs ?? []) as { id: string; sessions_total: number; calendar_ids: string[]; expires_on: string | null }[]).filter(
    (p) => (!p.calendar_ids?.length || p.calendar_ids.includes(b.calendar_id as string)) && (!p.expires_on || p.expires_on >= day),
  );
  if (!fits.length) return false;
  const used = await sessionsUsed(db, fits.map((p) => p.id));
  const pkg = fits.find((p) => (used.get(p.id) ?? 0) < p.sessions_total) ?? fits[fits.length - 1];
  const { error } = await db.from("package_sessions").insert({ package_id: pkg.id, booking_id: bookingId, delta: 1, used_on: day, note: "Attended" });
  if (error) return false; // already counted (one row per booking)
  if ((used.get(pkg.id) ?? 0) + 1 >= pkg.sessions_total) await db.from("client_packages").update({ status: "done", updated_at: new Date().toISOString() }).eq("id", pkg.id);
  return true;
}

/** Email the client their private portal link, from the account's own address. */
export async function sendPortalLink(db: Db, portal: PortalRow): Promise<{ ok: boolean; error?: string }> {
  const who = await accountSender(portal.master_plan_id, { marketing: false }, db);
  if (!who.ok) return { ok: false, error: who.reason || "Set up email sending first (Contacts › Email sending). Meanwhile you can copy the link." };
  const [{ data: c }, brand] = await Promise.all([db.from("seq_contacts").select("email, first_name").eq("id", portal.contact_id).maybeSingle(), brandFor(db, portal.master_plan_id)]);
  if (!c?.email) return { ok: false, error: "This contact has no email address." };
  await sendMail(who, {
    to: c.email as string,
    fromName: brand.name,
    subject: `Your private client portal with ${brand.name}`,
    heading: `Hi ${(c.first_name as string) || "there"}, here is your portal`,
    lines: [
      `Everything for our work together is in one place: your sessions, upcoming bookings, notes from our sessions, homework, files and a place to message me.`,
      `This link is just for you, so please don't share it. Bookmark it, or ask for a new link any time at ${SITE()}/portal.`,
    ],
    button: { label: "Open my portal", url: portalUrl(portal.token) },
  });
  await db.from("client_portals").update({ sent_at: new Date().toISOString() }).eq("id", portal.id);
  return { ok: true };
}

/** Let the account owner know their client wrote in the portal (from the Suite's own system address). */
export async function notifyOwnerOfMessage(db: Db, planId: string, contactId: string, body: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const [{ data: plan }, { data: c }] = await Promise.all([
    db.from("client_master_plans").select("client_email").eq("id", planId).maybeSingle(),
    db.from("seq_contacts").select("first_name, last_name, email").eq("id", contactId).maybeSingle(),
  ]);
  const to = plan?.client_email as string | undefined;
  if (!to) return;
  const name = [c?.first_name, c?.last_name].filter(Boolean).join(" ") || (c?.email as string) || "A client";
  const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46"><p><strong>${esc(name)}</strong> sent you a message in their client portal:</p><blockquote style="margin:0 0 16px;padding:10px 14px;background:#F4F1EA;border-radius:10px">${esc(body.slice(0, 1500)).replace(/\n/g, "<br>")}</blockquote><p><a href="${SITE()}/client-portals?contact=${contactId}" style="color:#2E7C83;font-weight:bold">Reply in the Command Suite</a></p></div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "LifeCharter Command Suite <notifications@lccommandsuite.com>", to, subject: `New portal message from ${name}`, html }),
  }).catch(() => null);
}

/** What the client sees. Private LC Volant sections and draft recaps never leave the account. */
export async function portalView(db: Db, p: PortalRow) {
  const now = new Date().toISOString();
  const { data: c } = await db.from("seq_contacts").select("email, first_name, last_name").eq("id", p.contact_id).maybeSingle();
  const email = String(c?.email || "").toLowerCase();
  const [brand, { data: pkgs }, { data: bookings }, { data: invoices }, { data: reports }, { data: items }, { data: messages }] = await Promise.all([
    brandFor(db, p.master_plan_id),
    db.from("client_packages").select("id, name, sessions_total, calendar_ids, starts_on, expires_on, status").eq("contact_id", p.contact_id).eq("master_plan_id", p.master_plan_id).neq("status", "cancelled").order("created_at", { ascending: false }),
    db.from("bookings").select("id, calendar_id, start_at, end_at, meeting_url, status").eq("master_plan_id", p.master_plan_id).eq("status", "confirmed").gte("start_at", now).or(`contact_id.eq.${p.contact_id},invitee_email.eq."${email.replace(/"/g, "")}"`).order("start_at").limit(10),
    db.from("suite_invoices").select("id, description, amount, payment_count, payments_made, status, hosted_url, due_date").eq("contact_id", p.contact_id).eq("master_plan_id", p.master_plan_id).in("status", ["open", "plan_active"]).order("created_at", { ascending: false }),
    db.from("volant_reports").select("id, title, session_date, report").eq("contact_id", p.contact_id).eq("master_plan_id", p.master_plan_id).not("shared_at", "is", null).order("session_date", { ascending: false }).limit(20),
    db.from("portal_items").select("id, kind, title, body, url, file_name, file_path, due_on, status, done_at, done_by, position, created_at").eq("contact_id", p.contact_id).eq("master_plan_id", p.master_plan_id).order("position").order("created_at"),
    db.from("portal_messages").select("id, author, body, created_at").eq("contact_id", p.contact_id).eq("master_plan_id", p.master_plan_id).order("created_at").limit(200),
  ]);
  const pk = (pkgs ?? []) as { id: string; name: string; sessions_total: number; calendar_ids: string[]; starts_on: string; expires_on: string | null; status: string }[];
  const used = await sessionsUsed(db, pk.map((x) => x.id));
  const calIds = Array.from(new Set([...pk.filter((x) => x.status === "active").flatMap((x) => x.calendar_ids ?? []), ...((bookings ?? []) as { calendar_id: string }[]).map((b) => b.calendar_id)]));
  const { data: cals } = calIds.length ? await db.from("booking_calendars").select("id, slug, name, active").in("id", calIds) : { data: [] };
  const calById = new Map(((cals ?? []) as { id: string; slug: string; name: string; active: boolean }[]).map((x) => [x.id, x]));
  const look = cleanLook(p.look ?? {});
  const assetUrl = (k: "logo" | "banner") => `/api/portal/${p.token}/asset?k=${k}&v=${encodeURIComponent((k === "logo" ? look.logoPath : look.bannerPath) || "").slice(-24)}`;
  const { programsForMember } = await import("@/lib/programs");
  const programs = await programsForMember(db, p.master_plan_id, p.contact_id, brand.name);
  return {
    programs,
    brand: { name: brand.name, logo: look.useAccountLogo ? brand.logo : look.logoPath ? assetUrl("logo") : null },
    look: { accent: look.accent, background: look.background, font: look.font, heading: headingFor(look, (c?.first_name as string) || null), banner: look.bannerPath ? assetUrl("banner") : null, sections: look.sections },
    client: { firstName: (c?.first_name as string) || null },
    welcome: p.welcome,
    packages: pk.map((x) => {
      const u = Math.max(0, used.get(x.id) ?? 0);
      return { id: x.id, name: x.name, total: x.sessions_total, used: u, left: Math.max(0, x.sessions_total - u), expiresOn: x.expires_on, status: x.status };
    }),
    bookNow: pk
      .filter((x) => x.status === "active")
      .flatMap((x) => x.calendar_ids ?? [])
      .map((id) => calById.get(id))
      .filter((x): x is { id: string; slug: string; name: string; active: boolean } => Boolean(x && x.active))
      .filter((x, i, all) => all.findIndex((y) => y.id === x.id) === i)
      .map((x) => ({ name: x.name, url: `/book/${x.slug}` })),
    bookings: ((bookings ?? []) as { id: string; calendar_id: string; start_at: string; end_at: string; meeting_url: string | null }[]).map((b) => ({ id: b.id, name: calById.get(b.calendar_id)?.name ?? "Session", start: b.start_at, end: b.end_at, meetingUrl: b.meeting_url })),
    invoices: ((invoices ?? []) as { id: string; description: string; amount: number; payment_count: number; payments_made: number; status: string; hosted_url: string | null; due_date: string | null }[]).map((i) => ({ id: i.id, description: i.description, amount: Number(i.amount), plan: i.payment_count > 1 ? `${i.payments_made} of ${i.payment_count} paid` : null, dueDate: i.due_date, payUrl: i.hosted_url })),
    recaps: ((reports ?? []) as { id: string; title: string; session_date: string; report: VolantReport }[]).map((r) => ({
      id: r.id,
      title: r.title,
      date: r.session_date,
      sections: (r.report?.sections ?? []).filter((s) => s.kind === "text" && (s.content || "").trim()).map((s) => ({ title: s.title, content: s.content })),
      commitments: (r.report?.action_items ?? []).map((a) => ({ text: a.text, due: a.due ?? null })),
    })),
    homework: ((items ?? []) as Item[]).filter((i) => i.kind === "homework").map(shapeItem),
    goals: ((items ?? []) as Item[]).filter((i) => i.kind === "goal").map(shapeItem),
    resources: ((items ?? []) as Item[]).filter((i) => i.kind === "resource").map(shapeItem),
    messages: (messages ?? []) as { id: string; author: "owner" | "client"; body: string; created_at: string }[],
  };
}

type Item = { id: string; kind: string; title: string; body: string | null; url: string | null; file_name: string | null; file_path: string | null; due_on: string | null; status: string; done_at: string | null; done_by: string | null; position: number; created_at: string };
const shapeItem = (i: Item) => ({ id: i.id, title: i.title, body: i.body, url: i.url, fileName: i.file_name, hasFile: Boolean(i.file_path), dueOn: i.due_on, status: i.status, doneAt: i.done_at, doneBy: i.done_by, fromClient: i.done_by === "client" && i.kind === "resource" });
