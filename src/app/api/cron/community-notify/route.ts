import { NextResponse } from "next/server";
import webpush from "web-push";
import { createServerClient } from "@/lib/supabase/server";
import { sessionsBetween } from "@/lib/community/events";
import { apnsConfigured, sendApns, type ApnsEnv } from "@/lib/community/apns";

export const dynamic = "force-dynamic";

// Delivery worker for The LifeCharter Collective. cm_notifications rows are
// written by database triggers (announcements, replies, DMs); this turns them
// into push notifications (right away) and an email digest (after a short
// grace period, and only for anything still unread). It also queues 1-hour
// reminders for events people said they're going to.
//
// Runs on Vercel Cron every 5 minutes. Web push needs VAPID keys, iPhone-app
// push needs APNS_* keys; email needs a Resend API key. Either channel quietly skips when its keys aren't set.
// Same CRON_SECRET convention as the other crons.

const EMAIL_GRACE_MIN = 10;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

interface NoteRow {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  emailed_at: string | null;
  pushed_at: string | null;
  created_at: string;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && (request.headers.get("authorization") || "") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const now = Date.now();
  const result = { reminders: 0, pushed: 0, emailed: 0, pushConfigured: false, emailConfigured: false };

  // ── Event reminders: ~1 hour before each session, for people who RSVP'd
  //    "going". Recurring series remind before every session.
  const soon = await sessionsBetween(supabase, new Date(now), new Date(now + 65 * 60_000));
  for (const s of soon) {
    if (s.start.getTime() < now) continue;
    const at = s.start.toISOString();
    const { data: rsvps } = await supabase
      .from("cm_event_rsvps")
      .select("user_id, reminded_for")
      .eq("event_id", s.event.id)
      .eq("status", "going");
    const users = ((rsvps as { user_id: string; reminded_for: string | null }[]) ?? [])
      .filter((r) => !r.reminded_for || new Date(r.reminded_for).getTime() !== s.start.getTime())
      .map((r) => r.user_id);
    if (!users.length) continue;
    await supabase.from("cm_notifications").insert(
      users.map((u) => ({ user_id: u, kind: "event", title: `Starting soon: ${s.event.title}`, body: "Your session begins within the hour.", href: `/community/events#${s.event.id}` }))
    );
    await supabase.from("cm_event_rsvps").update({ reminded_for: at, reminded_at: new Date().toISOString() }).eq("event_id", s.event.id).in("user_id", users);
    result.reminders += users.length;
  }

  // ── Push (web push + the iPhone app) ─────────────────────────────────────
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const webOn = Boolean(vapidPublic && vapidPrivate);
  const apnsOn = apnsConfigured();
  if (webOn || apnsOn) {
    result.pushConfigured = true;
    if (webOn) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:amilynne@amilynnecarroll.com", vapidPublic!, vapidPrivate!);
    const { data } = await supabase
      .from("cm_notifications")
      .select("*")
      .is("pushed_at", null)
      .is("read_at", null)
      .gte("created_at", new Date(now - 6 * 3600_000).toISOString())
      .limit(500);
    const notes = (data as NoteRow[]) ?? [];
    const userIds = Array.from(new Set(notes.map((n) => n.user_id)));
    if (userIds.length) {
      const [{ data: subs }, { data: devices }, { data: prefs }] = await Promise.all([
        webOn ? supabase.from("cm_push_subscriptions").select("id, user_id, endpoint, p256dh, auth").in("user_id", userIds) : Promise.resolve({ data: [] }),
        apnsOn ? supabase.from("cm_apns_devices").select("token, user_id, env").in("user_id", userIds) : Promise.resolve({ data: [] }),
        supabase.from("cm_profiles").select("user_id, notify_push").in("user_id", userIds),
      ]);
      const wants = new Set(((prefs as { user_id: string; notify_push: boolean }[]) ?? []).filter((p) => p.notify_push).map((p) => p.user_id));
      const byUser = new Map<string, { id: string; endpoint: string; p256dh: string; auth: string }[]>();
      for (const s of (subs as { id: string; user_id: string; endpoint: string; p256dh: string; auth: string }[]) ?? []) {
        if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
        byUser.get(s.user_id)!.push(s);
      }
      const phones = new Map<string, { token: string; env: ApnsEnv }[]>();
      for (const d of (devices as { token: string; user_id: string; env: ApnsEnv }[]) ?? []) {
        if (!phones.has(d.user_id)) phones.set(d.user_id, []);
        phones.get(d.user_id)!.push(d);
      }
      for (const n of notes) {
        if (wants.has(n.user_id)) {
          for (const s of byUser.get(n.user_id) ?? []) {
            try {
              await webpush.sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                JSON.stringify({ title: n.title, body: n.body ?? "", href: n.href ?? "/community", tag: n.kind === "dm" ? n.href ?? undefined : undefined }),
                { TTL: 3600 }
              );
              result.pushed += 1;
            } catch (err) {
              const code = (err as { statusCode?: number }).statusCode;
              if (code === 404 || code === 410) await supabase.from("cm_push_subscriptions").delete().eq("id", s.id);
              else console.error("community push:", code, (err as Error).message);
            }
          }
          const mine = phones.get(n.user_id) ?? [];
          if (mine.length) {
            const msg = { title: n.title, body: n.body ?? "", href: n.href ?? "/community", threadId: n.kind === "dm" ? n.href ?? undefined : n.kind };
            for (const env of ["production", "sandbox"] as const) {
              const tokens = mine.filter((d) => d.env === env).map((d) => d.token);
              for (const r of await sendApns(env, tokens, msg)) {
                if (r.ok) result.pushed += 1;
                else if (r.reason === "BadDeviceToken" && env === "production") {
                  // A development build's token: remember it as sandbox and retry there.
                  await supabase.from("cm_apns_devices").update({ env: "sandbox" }).eq("token", r.token);
                  const [retry] = await sendApns("sandbox", [r.token], msg);
                  if (retry?.ok) result.pushed += 1;
                } else if (r.status === 410 || r.reason === "BadDeviceToken" || r.reason === "Unregistered") {
                  await supabase.from("cm_apns_devices").delete().eq("token", r.token);
                } else console.error("apns push:", r.status, r.reason);
              }
            }
          }
        }
        await supabase.from("cm_notifications").update({ pushed_at: new Date().toISOString() }).eq("id", n.id);
      }
    }
  }

  // ── Email digest ─────────────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.COMMUNITY_EMAIL_FROM;
  if (resendKey && from) {
    result.emailConfigured = true;
    const { data } = await supabase
      .from("cm_notifications")
      .select("*")
      .is("emailed_at", null)
      .lte("created_at", new Date(now - EMAIL_GRACE_MIN * 60_000).toISOString())
      .gte("created_at", new Date(now - 3 * 86400_000).toISOString())
      .order("created_at")
      .limit(1000);
    const notes = (data as NoteRow[]) ?? [];
    const pending = new Map<string, NoteRow[]>();
    const skip: string[] = [];
    for (const n of notes) {
      if (n.read_at) skip.push(n.id); // already seen in the app — no email
      else {
        if (!pending.has(n.user_id)) pending.set(n.user_id, []);
        pending.get(n.user_id)!.push(n);
      }
    }
    if (skip.length) await supabase.from("cm_notifications").update({ emailed_at: new Date().toISOString() }).in("id", skip);

    const userIds = Array.from(pending.keys());
    const { data: prefs } = userIds.length
      ? await supabase.from("cm_profiles").select("user_id, display_name, notify_email, status").in("user_id", userIds)
      : { data: [] };
    const prefBy = new Map(((prefs as { user_id: string; display_name: string; notify_email: boolean; status: string }[]) ?? []).map((p) => [p.user_id, p]));

    for (const [uid, items] of Array.from(pending.entries())) {
      const pref = prefBy.get(uid);
      const ids = items.map((i) => i.id);
      if (pref?.notify_email && pref.status === "active") {
        const { data: u } = await supabase.auth.admin.getUserById(uid);
        const to = u?.user?.email;
        if (to) {
          const first = (pref.display_name || "").split(" ")[0] || "there";
          const subject = items.length === 1 ? items[0].title : `${items.length} new updates in The LifeCharter Collective`;
          const rows = items
            .slice(0, 12)
            .map(
              (i) => `<tr><td style="padding:12px 0;border-bottom:1px solid #F1EBDF">
                <a href="${APP_URL}${escapeHtml(i.href ?? "/community")}" style="color:#1F2B3A;font-weight:600;text-decoration:none">${escapeHtml(i.title)}</a>
                ${i.body ? `<div style="color:#56616E;font-size:14px;margin-top:3px">${escapeHtml(i.body.slice(0, 180))}</div>` : ""}
              </td></tr>`
            )
            .join("");
          const html = `<!doctype html><html><body style="margin:0;background:#FAF8F3;font-family:Georgia,serif">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:28px 12px"><tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:18px;padding:28px;border:1px solid #E6DDCB">
              <tr><td style="padding-bottom:6px"><img src="${APP_URL}/collective-logo.png" width="240" alt="The LifeCharter Collective" style="display:block;width:240px;max-width:100%;height:auto;border:0"></td></tr>
              <tr><td style="font-size:24px;color:#1F2B3A;padding:8px 0 4px">Hi ${escapeHtml(first)}, here's what's new</td></tr>
              <tr><td><table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:15px">${rows}</table></td></tr>
              <tr><td style="padding-top:22px"><a href="${APP_URL}/community" style="display:inline-block;background:#D4AF63;color:#1F2B3A;font-family:Arial,sans-serif;font-weight:700;padding:12px 22px;border-radius:10px;text-decoration:none">Open the Collective</a></td></tr>
              <tr><td style="padding-top:22px;font-size:12px;color:#7F8894;font-family:Arial,sans-serif">You're receiving this because you're a member of The LifeCharter Collective. <a href="${APP_URL}/community/profile" style="color:#7F8894">Change email settings</a>.</td></tr>
            </table></td></tr></table></body></html>`;
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from, to, subject, html }),
          });
          if (res.ok) result.emailed += 1;
          else {
            console.error("community email:", res.status, await res.text().catch(() => ""));
            continue; // leave unmarked so the next run retries
          }
        }
      }
      await supabase.from("cm_notifications").update({ emailed_at: new Date().toISOString() }).in("id", ids);
    }
  }

  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
