import { createHmac, timingSafeEqual } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { redirectUri as googleRedirect } from "@/lib/google";
import { redirectUri as msRedirect } from "@/lib/microsoft";

// A booking host's own calendars (Google and Microsoft, as many as they like).
// Kept apart from the Suite's mailbox connections: hosts grant calendar access
// only, they need no Suite login, and a host's calendars can never be read by
// anything but the booking engine. The OAuth round trip reuses the Suite's
// registered /api/{google,microsoft}/callback; a "bk." state routes it here.

export type Provider = "google" | "microsoft";
export interface Connection {
  id: string;
  host_id: string;
  provider: Provider;
  email: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expiry: string | null;
  check_busy: boolean;
  add_events: boolean;
}
export interface Busy {
  start: number;
  end: number;
}

const G_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/calendar.readonly", "https://www.googleapis.com/auth/calendar.events"].join(" ");
const M_SCOPES = ["openid", "email", "offline_access", "User.Read", "Calendars.ReadWrite"].join(" ");
const gId = () => process.env.GOOGLE_CLIENT_ID || process.env.GoogleClientID || "";
const gSecret = () => process.env.GOOGLE_CLIENT_SECRET || process.env.GoogleClientSecret || "";
const mId = () => process.env.MICROSOFT_CLIENT_ID || process.env.MicrosoftClientID || "";
const mSecret = () => process.env.MICROSOFT_CLIENT_SECRET || process.env.MicrosoftClientSecret || "";
const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || "";

// ── OAuth state: which host, which provider, signed, 20 minutes ─────────────
export function signHostState(hostId: string, provider: Provider, back: string): string {
  const payload = Buffer.from(JSON.stringify({ h: hostId, p: provider, b: back.slice(0, 300), t: Date.now() })).toString("base64url");
  return `bk.${payload}.${createHmac("sha256", secret()).update(`bk.${payload}`).digest("base64url")}`;
}
export const isHostState = (state: string | null) => Boolean(state && state.startsWith("bk."));
export function verifyHostState(state: string | null): { hostId: string; provider: Provider; back: string } | null {
  if (!state || !secret()) return null;
  const [, payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  const want = createHmac("sha256", secret()).update(`bk.${payload}`).digest("base64url");
  if (Buffer.from(sig).length !== Buffer.from(want).length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (Date.now() - o.t > 20 * 60 * 1000) return null;
    return { hostId: o.h, provider: o.p, back: o.b || "/" };
  } catch {
    return null;
  }
}

export function hostAuthUrl(provider: Provider, origin: string, state: string): string {
  if (provider === "google") {
    const p = new URLSearchParams({ client_id: gId(), redirect_uri: googleRedirect(origin), response_type: "code", scope: G_SCOPES, access_type: "offline", prompt: "select_account consent", state });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
  }
  const p = new URLSearchParams({ client_id: mId(), redirect_uri: msRedirect(origin), response_type: "code", response_mode: "query", scope: M_SCOPES, prompt: "select_account", state });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${p}`;
}

type Tokens = { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string };

async function tokenCall(provider: Provider, body: Record<string, string>): Promise<Tokens> {
  const url = provider === "google" ? "https://oauth2.googleapis.com/token" : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: provider === "google" ? gId() : mId(),
      client_secret: provider === "google" ? gSecret() : mSecret(),
      ...(provider === "microsoft" ? { scope: M_SCOPES } : {}),
      ...body,
    }),
  });
  if (!res.ok) throw new Error(`${provider} token ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function whoAmI(provider: Provider, token: string): Promise<string | null> {
  const r = await fetch(provider === "google" ? "https://www.googleapis.com/oauth2/v3/userinfo" : "https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!r?.ok) return null;
  const me = await r.json();
  return (me.email || me.mail || me.userPrincipalName || null)?.toLowerCase() ?? null;
}

// Finishes the OAuth round trip for a host: stores (or refreshes) the calendar.
export async function completeHostConnect(provider: Provider, code: string, origin: string, hostId: string): Promise<void> {
  const tokens = await tokenCall(provider, { code, grant_type: "authorization_code", redirect_uri: provider === "google" ? googleRedirect(origin) : msRedirect(origin) });
  if (!tokens.access_token) throw new Error("no access token");
  const email = await whoAmI(provider, tokens.access_token);
  const db = createServerClient();
  const { data: existing } = await db.from("booking_connections").select("id").eq("host_id", hostId);
  const row = {
    host_id: hostId,
    provider,
    email,
    access_token: tokens.access_token,
    ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
    expiry: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    scope: tokens.scope ?? null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from("booking_connections").upsert({ ...row, add_events: !(existing ?? []).length }, { onConflict: "host_id,provider,email" });
  if (error) throw new Error(error.message);
}

async function tokenFor(c: Connection): Promise<string | null> {
  if (c.access_token && c.expiry && new Date(c.expiry).getTime() - Date.now() > 60_000) return c.access_token;
  if (!c.refresh_token) return null;
  try {
    const t = await tokenCall(c.provider, { refresh_token: c.refresh_token, grant_type: "refresh_token" });
    if (!t.access_token) return null;
    await createServerClient()
      .from("booking_connections")
      .update({
        access_token: t.access_token,
        ...(t.refresh_token ? { refresh_token: t.refresh_token } : {}),
        expiry: new Date(Date.now() + (t.expires_in ?? 3600) * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", c.id);
    return t.access_token;
  } catch (e) {
    console.error("booking token refresh:", c.id, e);
    return null;
  }
}

// ── Busy time ────────────────────────────────────────────────────────────────
// Google: every calendar the account shows (not just primary) via freeBusy.
// Microsoft: the default calendar's events not marked "free".
// A calendar we can't read counts as fully busy, so nobody is double-booked.
export async function busyFor(c: Connection, fromISO: string, toISO: string): Promise<Busy[] | "error"> {
  const token = await tokenFor(c);
  if (!token) return "error";
  try {
    if (c.provider === "google") {
      const cl = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=freeBusyReader&maxResults=50", { headers: { Authorization: `Bearer ${token}` } });
      const ids: string[] = cl.ok ? ((await cl.json()).items ?? []).filter((x: { selected?: boolean; primary?: boolean }) => x.selected || x.primary).map((x: { id: string }) => x.id).slice(0, 20) : ["primary"];
      const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ timeMin: fromISO, timeMax: toISO, items: (ids.length ? ids : ["primary"]).map((id) => ({ id })) }),
      });
      if (!res.ok) return "error";
      const cals = (await res.json()).calendars ?? {};
      return Object.values(cals).flatMap((v) => ((v as { busy?: { start: string; end: string }[] }).busy ?? []).map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) })));
    }
    const out: Busy[] = [];
    let url: string | null = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(fromISO)}&endDateTime=${encodeURIComponent(toISO)}&$select=start,end,showAs,isCancelled&$top=250`;
    for (let i = 0; url && i < 8; i++) {
      const res: Response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' } });
      if (!res.ok) return "error";
      const d = await res.json();
      for (const e of d.value ?? []) {
        if (e.isCancelled || e.showAs === "free") continue;
        out.push({ start: Date.parse(`${e.start.dateTime}Z`), end: Date.parse(`${e.end.dateTime}Z`) });
      }
      url = d["@odata.nextLink"] ?? null;
    }
    return out;
  } catch (e) {
    console.error("booking busy:", c.id, e);
    return "error";
  }
}

// ── Events on the host's calendar ────────────────────────────────────────────
// Guests (the invitee and anyone copied) get the calendar's own invitation, so
// the meeting lands on their calendars and a cancellation removes it.
export interface EventInput {
  title: string;
  description: string;
  startISO: string;
  endISO: string;
  location?: string | null;
  guests: { email: string; name?: string }[];
}

export async function createHostEvent(c: Connection, e: EventInput): Promise<string | null> {
  const token = await tokenFor(c);
  if (!token) return null;
  if (c.provider === "google") {
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: e.title,
        description: e.description,
        location: e.location || undefined,
        start: { dateTime: e.startISO },
        end: { dateTime: e.endISO },
        attendees: e.guests.map((g) => ({ email: g.email, displayName: g.name })),
        reminders: { useDefault: true },
      }),
    });
    if (!res.ok) {
      console.error("google create event:", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    return (await res.json()).id ?? null;
  }
  const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: e.title,
      body: { contentType: "Text", content: e.description },
      start: { dateTime: e.startISO.replace("Z", ""), timeZone: "UTC" },
      end: { dateTime: e.endISO.replace("Z", ""), timeZone: "UTC" },
      location: e.location ? { displayName: e.location } : undefined,
      attendees: e.guests.map((g) => ({ emailAddress: { address: g.email, name: g.name || g.email }, type: "required" })),
    }),
  });
  if (!res.ok) {
    console.error("microsoft create event:", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  return (await res.json()).id ?? null;
}

export async function cancelHostEvent(c: Connection, eventId: string): Promise<void> {
  const token = await tokenFor(c);
  if (!token) return;
  if (c.provider === "google") {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    return;
  }
  const r = await fetch(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ comment: "This meeting was canceled." }),
  }).catch(() => null);
  if (!r?.ok) await fetch(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
}
