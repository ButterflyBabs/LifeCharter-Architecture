import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { PORTAL_OPEN_TO_ALL } from "@/lib/portalFlag";
import { accountSender } from "@/lib/email/accountSender";
import { sendMail } from "@/lib/booking/engine";
import { PORTAL_BUCKET, PORTAL_COLUMNS, brandFor, defaultLook, newPortalToken, portalUrl, sendPortalLink, sessionsUsed, type PortalRow } from "@/lib/portal";
import { cleanLook } from "@/lib/portalLook";

export const dynamic = "force-dynamic";

// Clients & Sales › Client Portals (task 1147): the owner's side of each client's private portal.
//   GET                 -> every portal (name, email, last seen, unread messages)
//   GET ?contact=<id>   -> one client's portal: link, packages, homework, goals, files, messages, shared recaps
//   POST { action, ... } -> see the cases below
async function account(request?: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a;
  if (!PORTAL_OPEN_TO_ALL && !a.isArchitect) return { denied: NextResponse.json({ error: "not found" }, { status: 404 }) };
  return a;
}
const PORTAL_COLS = PORTAL_COLUMNS;
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const isDay = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(request: Request) {
  const a = await account();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const contactId = new URL(request.url).searchParams.get("contact");
  if (!contactId) {
    const { data: portals } = await db.from("client_portals").select("contact_id, active, sent_at, last_seen_at, created_at").eq("master_plan_id", a.planId).order("created_at", { ascending: false });
    const ids = ((portals ?? []) as { contact_id: string }[]).map((p) => p.contact_id);
    const [{ data: people }, { data: unread }] = await Promise.all([
      ids.length ? db.from("seq_contacts").select("id, email, first_name, last_name").in("id", ids) : Promise.resolve({ data: [] }),
      ids.length ? db.from("portal_messages").select("contact_id").in("contact_id", ids).eq("author", "client").is("read_at", null) : Promise.resolve({ data: [] }),
    ]);
    const byId = new Map(((people ?? []) as { id: string; email: string; first_name: string | null; last_name: string | null }[]).map((p) => [p.id, p]));
    const count = new Map<string, number>();
    for (const u of (unread ?? []) as { contact_id: string }[]) count.set(u.contact_id, (count.get(u.contact_id) ?? 0) + 1);
    return NextResponse.json({
      portals: ((portals ?? []) as { contact_id: string; active: boolean; sent_at: string | null; last_seen_at: string | null }[]).map((p) => {
        const c = byId.get(p.contact_id);
        return { contactId: p.contact_id, name: [c?.first_name, c?.last_name].filter(Boolean).join(" ") || c?.email || "Someone", email: c?.email ?? "", active: p.active, sentAt: p.sent_at, lastSeenAt: p.last_seen_at, unread: count.get(p.contact_id) ?? 0 };
      }),
    }, { headers: { "Cache-Control": "no-store" } });
  }
  const { data: c } = await db.from("seq_contacts").select("id, email, first_name, last_name").eq("id", contactId).eq("master_plan_id", a.planId).maybeSingle();
  if (!c) return NextResponse.json({ error: "That contact could not be found." }, { status: 404 });
  const [{ data: portal }, { data: pkgs }, { data: items }, { data: messages }, { data: reports }, { data: offers }, { data: cals }] = await Promise.all([
    db.from("client_portals").select(PORTAL_COLS).eq("contact_id", contactId).maybeSingle(),
    db.from("client_packages").select("id, name, offer_id, sessions_total, calendar_ids, starts_on, expires_on, status, created_at").eq("contact_id", contactId).eq("master_plan_id", a.planId).order("created_at", { ascending: false }),
    db.from("portal_items").select("id, kind, title, body, url, file_name, file_path, due_on, status, done_at, done_by, position, created_at").eq("contact_id", contactId).eq("master_plan_id", a.planId).order("position").order("created_at"),
    db.from("portal_messages").select("id, author, body, read_at, created_at").eq("contact_id", contactId).eq("master_plan_id", a.planId).order("created_at").limit(300),
    db.from("volant_reports").select("id, title, session_date, shared_at").eq("contact_id", contactId).eq("master_plan_id", a.planId).order("session_date", { ascending: false }).limit(50),
    db.from("sales_offers").select("id, name").eq("master_plan_id", a.planId).order("sort_order"),
    db.from("booking_calendars").select("id, name, slug, active").eq("master_plan_id", a.planId).order("name"),
  ]);
  const used = await sessionsUsed(db, ((pkgs ?? []) as { id: string }[]).map((p) => p.id));
  const [dflt, brand] = await Promise.all([defaultLook(db, a.planId), brandFor(db, a.planId)]);
  return NextResponse.json({
    contact: c,
    portal: portal ? { ...(portal as PortalRow), url: portalUrl((portal as PortalRow).token), look: cleanLook((portal as PortalRow).look ?? {}, dflt) } : null,
    defaultLook: dflt,
    accountLogo: brand.logo,
    packages: ((pkgs ?? []) as { id: string; sessions_total: number }[]).map((p) => ({ ...p, used: Math.max(0, used.get(p.id) ?? 0) })),
    items: items ?? [],
    messages: messages ?? [],
    reports: reports ?? [],
    offers: offers ?? [],
    calendars: cals ?? [],
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const a = await account(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const now = new Date().toISOString();
  const contactId = str(b.contactId, 60);
  const mine = async () => (contactId ? (await db.from("seq_contacts").select("id, email").eq("id", contactId).eq("master_plan_id", a.planId).maybeSingle()).data : null);
  const portalOf = async () => (await db.from("client_portals").select(PORTAL_COLS).eq("contact_id", contactId).eq("master_plan_id", a.planId).maybeSingle()).data as PortalRow | null;

  switch (b.action) {
    case "create": {
      const c = await mine();
      if (!c) return NextResponse.json({ error: "That contact could not be found." }, { status: 404 });
      const have = await portalOf();
      if (have) return NextResponse.json({ ok: true });
      // A new portal starts from the account's default look.
      const { error } = await db.from("client_portals").insert({ master_plan_id: a.planId, contact_id: contactId, token: newPortalToken(), look: await defaultLook(db, a.planId) });
      if (error) return NextResponse.json({ error: "Couldn't create the portal." }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    case "send": {
      const p = await portalOf();
      if (!p || !p.active) return NextResponse.json({ error: "Turn the portal on first." }, { status: 400 });
      const r = await sendPortalLink(db, p);
      return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
    }
    case "active": {
      const p = await portalOf();
      if (!p) return NextResponse.json({ error: "No portal yet." }, { status: 404 });
      await db.from("client_portals").update({ active: Boolean(b.on), updated_at: now }).eq("id", p.id);
      return NextResponse.json({ ok: true });
    }
    case "newlink": {
      // The old link stops working at once.
      const p = await portalOf();
      if (!p) return NextResponse.json({ error: "No portal yet." }, { status: 404 });
      await db.from("client_portals").update({ token: newPortalToken(), updated_at: now }).eq("id", p.id);
      return NextResponse.json({ ok: true });
    }
    case "welcome": {
      const p = await portalOf();
      if (!p) return NextResponse.json({ error: "No portal yet." }, { status: 404 });
      await db.from("client_portals").update({ welcome: str(b.text, 2000) || null, updated_at: now }).eq("id", p.id);
      return NextResponse.json({ ok: true });
    }
    case "look": {
      // This client's portal look (colors, font, heading, logo, banner, sections).
      const p = await portalOf();
      if (!p) return NextResponse.json({ error: "No portal yet." }, { status: 404 });
      const prev = cleanLook(p.look ?? {});
      const next = cleanLook({ ...((b.look as Record<string, unknown>) ?? {}), logoPath: prev.logoPath, bannerPath: prev.bannerPath, ...(b.removeLogo ? { logoPath: null } : {}), ...(b.removeBanner ? { bannerPath: null } : {}) }, prev);
      await db.from("client_portals").update({ look: next, updated_at: now }).eq("id", p.id);
      return NextResponse.json({ ok: true });
    }
    case "look-default": {
      // Save this client's look as the account default for new portals.
      const p = await portalOf();
      if (!p) return NextResponse.json({ error: "No portal yet." }, { status: 404 });
      await db.from("client_portal_defaults").upsert({ master_plan_id: a.planId, look: cleanLook(p.look ?? {}), updated_at: now }, { onConflict: "master_plan_id" });
      return NextResponse.json({ ok: true });
    }
    case "look-reset": {
      // Put the account default look back on this client's portal.
      const p = await portalOf();
      if (!p) return NextResponse.json({ error: "No portal yet." }, { status: 404 });
      await db.from("client_portals").update({ look: await defaultLook(db, a.planId), updated_at: now }).eq("id", p.id);
      return NextResponse.json({ ok: true });
    }
    case "package-add": {
      if (!(await mine())) return NextResponse.json({ error: "That contact could not be found." }, { status: 404 });
      const total = Math.floor(Number(b.sessions));
      if (!(total >= 1 && total <= 500)) return NextResponse.json({ error: "Sessions must be between 1 and 500." }, { status: 400 });
      let offerId: string | null = null;
      let name = str(b.name, 160);
      if (str(b.offerId, 60)) {
        const { data: o } = await db.from("sales_offers").select("id, name").eq("id", str(b.offerId, 60)).eq("master_plan_id", a.planId).maybeSingle();
        offerId = (o?.id as string) ?? null;
        if (!name && o) name = o.name as string;
      }
      if (!name) return NextResponse.json({ error: "Name the package." }, { status: 400 });
      const calIds = Array.isArray(b.calendarIds) ? (b.calendarIds as unknown[]).map((x) => str(x, 60)).filter(Boolean) : [];
      const { data: valid } = calIds.length ? await db.from("booking_calendars").select("id").eq("master_plan_id", a.planId).in("id", calIds) : { data: [] };
      await db.from("client_packages").insert({
        master_plan_id: a.planId, contact_id: contactId, offer_id: offerId, name, sessions_total: total,
        calendar_ids: ((valid ?? []) as { id: string }[]).map((x) => x.id), starts_on: isDay(b.startsOn) ? b.startsOn : now.slice(0, 10), expires_on: isDay(b.expiresOn) ? b.expiresOn : null,
      });
      return NextResponse.json({ ok: true });
    }
    case "package-adjust": {
      const { data: pkg } = await db.from("client_packages").select("id").eq("id", str(b.packageId, 60)).eq("master_plan_id", a.planId).maybeSingle();
      if (!pkg) return NextResponse.json({ error: "That package isn't here." }, { status: 404 });
      await db.from("package_sessions").insert({ package_id: pkg.id, delta: Number(b.delta) < 0 ? -1 : 1, note: str(b.note, 200) || (Number(b.delta) < 0 ? "Given back by hand" : "Used, added by hand") });
      return NextResponse.json({ ok: true });
    }
    case "package-status": {
      const status = ["active", "done", "cancelled"].includes(String(b.status)) ? String(b.status) : null;
      if (!status) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
      await db.from("client_packages").update({ status, updated_at: now }).eq("id", str(b.packageId, 60)).eq("master_plan_id", a.planId);
      return NextResponse.json({ ok: true });
    }
    case "item-add": {
      if (!(await mine())) return NextResponse.json({ error: "That contact could not be found." }, { status: 404 });
      const kind = ["homework", "goal", "resource"].includes(String(b.kind)) ? String(b.kind) : null;
      const title = str(b.title, 200);
      if (!kind || !title) return NextResponse.json({ error: "Give it a title." }, { status: 400 });
      const url = str(b.url, 1000);
      if (url && !/^https?:\/\//i.test(url)) return NextResponse.json({ error: "Links start with https://" }, { status: 400 });
      const { count } = await db.from("portal_items").select("id", { count: "exact", head: true }).eq("contact_id", contactId).eq("kind", kind);
      await db.from("portal_items").insert({ master_plan_id: a.planId, contact_id: contactId, kind, title, body: str(b.body, 4000) || null, url: url || null, due_on: isDay(b.dueOn) ? b.dueOn : null, position: count ?? 0 });
      return NextResponse.json({ ok: true });
    }
    case "item-update": {
      const patch: Record<string, unknown> = { updated_at: now };
      if (b.title !== undefined) patch.title = str(b.title, 200) || "Untitled";
      if (b.body !== undefined) patch.body = str(b.body, 4000) || null;
      if (b.url !== undefined) patch.url = /^https?:\/\//i.test(str(b.url, 1000)) ? str(b.url, 1000) : null;
      if (b.dueOn !== undefined) patch.due_on = isDay(b.dueOn) ? b.dueOn : null;
      if (["open", "done", "achieved", "paused"].includes(String(b.status))) {
        patch.status = b.status;
        patch.done_at = b.status === "open" || b.status === "paused" ? null : now;
        patch.done_by = b.status === "open" || b.status === "paused" ? null : "owner";
      }
      await db.from("portal_items").update(patch).eq("id", str(b.id, 60)).eq("master_plan_id", a.planId);
      return NextResponse.json({ ok: true });
    }
    case "item-delete": {
      const { data: it } = await db.from("portal_items").select("id, file_path").eq("id", str(b.id, 60)).eq("master_plan_id", a.planId).maybeSingle();
      if (!it) return NextResponse.json({ ok: true });
      if (it.file_path) await db.storage.from(PORTAL_BUCKET).remove([it.file_path as string]).catch(() => null);
      await db.from("portal_items").delete().eq("id", it.id);
      return NextResponse.json({ ok: true });
    }
    case "message": {
      const c = await mine();
      const p = await portalOf();
      const body = str(b.body, 4000);
      if (!c || !p) return NextResponse.json({ error: "Create the portal first." }, { status: 400 });
      if (!body) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
      await db.from("portal_messages").insert({ master_plan_id: a.planId, contact_id: contactId, author: "owner", body });
      let emailed = false;
      if (p.active && c.email) {
        const who = await accountSender(a.planId, { marketing: false }, db);
        if (who.ok) {
          const brand = await brandFor(db, a.planId);
          await sendMail(who, { to: c.email as string, fromName: brand.name, subject: `New message from ${brand.name}`, heading: "You have a new message", lines: [body.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!).replace(/\n/g, "<br>")], button: { label: "Reply in my portal", url: portalUrl(p.token) } });
          emailed = true;
        }
      }
      return NextResponse.json({ ok: true, emailed });
    }
    case "read": {
      await db.from("portal_messages").update({ read_at: now }).eq("contact_id", contactId).eq("master_plan_id", a.planId).eq("author", "client").is("read_at", null);
      return NextResponse.json({ ok: true });
    }
    case "share-report": {
      await db.from("volant_reports").update({ shared_at: b.on ? now : null }).eq("id", str(b.id, 60)).eq("master_plan_id", a.planId);
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
