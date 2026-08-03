import { createServerClient } from "@/lib/supabase/server";
import type { InboxEmail, ScheduleEvent, MessageDetail } from "@/lib/google";
import { dayWindowUtc } from "@/lib/tz";

// Microsoft 365 (Graph) OAuth + Mail/Calendar helpers — the Microsoft twin of
// lib/google.ts (raw fetch, no SDK). Single stored credential keyed by
// ACCOUNT_KEY. Uses the "common" endpoint so work/school (incl. GoDaddy-sold
// M365) and personal Microsoft accounts can sign in to a multi-tenant app.

const MS_AUTH = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MS_TOKEN = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const GRAPH = "https://graph.microsoft.com/v1.0";
const ACCOUNT_KEY = "primary";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "offline_access", // gets us a refresh_token
  "Mail.Read",
  "Mail.Send",
  "Mail.ReadWrite", // mark-as-read
  "Calendars.ReadWrite",
  "User.Read", // lets /me return the account's email for labeling
].join(" ");

function clientId(): string {
  return process.env.MICROSOFT_CLIENT_ID || process.env.MicrosoftClientID || "";
}
function clientSecret(): string {
  return process.env.MICROSOFT_CLIENT_SECRET || process.env.MicrosoftClientSecret || "";
}

export function isMicrosoftConfigured(): boolean {
  return Boolean(clientId() && clientSecret());
}

export function redirectUri(origin?: string): string {
  return (
    process.env.MICROSOFT_REDIRECT_URI ||
    `${origin ?? process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/microsoft/callback`
  );
}

export function getAuthUrl(origin?: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(origin),
    response_type: "code",
    response_mode: "query",
    scope: SCOPES,
    prompt: "select_account",
  });
  return `${MS_AUTH}?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
};

export async function exchangeCode(code: string, origin?: string): Promise<TokenResponse> {
  const res = await fetch(MS_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
      scope: SCOPES,
    }),
  });
  if (!res.ok) throw new Error(`ms token exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(MS_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
      scope: SCOPES,
    }),
  });
  if (!res.ok) throw new Error(`ms token refresh failed: ${res.status}`);
  return res.json();
}

export async function getConnectedEmail(accessToken: string): Promise<string | null> {
  try {
    const r = await fetch(`${GRAPH}/me?$select=mail,userPrincipalName`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) return null;
    const me = await r.json();
    return me.mail ?? me.userPrincipalName ?? null;
  } catch {
    return null;
  }
}

export async function storeCredential(tokens: TokenResponse, email?: string): Promise<void> {
  const supabase = createServerClient();
  const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();
  const row: Record<string, unknown> = {
    account_key: ACCOUNT_KEY,
    access_token: tokens.access_token ?? null,
    scope: tokens.scope ?? null,
    expiry,
    updated_at: new Date().toISOString(),
  };
  if (tokens.refresh_token) row.refresh_token = tokens.refresh_token;
  if (email) row.email = email;
  await supabase.from("microsoft_credentials").upsert(row, { onConflict: "account_key" });
}

export async function isConnected(): Promise<boolean> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("microsoft_credentials")
    .select("account_key")
    .eq("account_key", ACCOUNT_KEY)
    .maybeSingle();
  return Boolean(data);
}

export async function connectedEmail(): Promise<string | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("microsoft_credentials")
    .select("email")
    .eq("account_key", ACCOUNT_KEY)
    .maybeSingle();
  return (data?.email as string) ?? null;
}

export async function getValidAccessToken(): Promise<string | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("microsoft_credentials")
    .select("access_token, refresh_token, expiry")
    .eq("account_key", ACCOUNT_KEY)
    .maybeSingle();
  if (!data) return null;

  const stillValid = data.expiry && new Date(data.expiry).getTime() > Date.now() + 60_000;
  if (stillValid) return data.access_token ?? null;
  if (!data.refresh_token) return data.access_token ?? null;

  try {
    const refreshed = await refreshAccessToken(data.refresh_token);
    await storeCredential({ ...refreshed, refresh_token: refreshed.refresh_token ?? data.refresh_token });
    return refreshed.access_token ?? null;
  } catch {
    return data.access_token ?? null;
  }
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

interface GraphMessage {
  id: string;
  conversationId?: string;
  internetMessageId?: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  from?: { emailAddress?: { name?: string; address?: string } };
}

export async function fetchInbox(accessToken: string, max = 6): Promise<InboxEmail[]> {
  const url =
    `${GRAPH}/me/mailFolders/inbox/messages?$top=${max}` +
    `&$select=id,conversationId,internetMessageId,subject,bodyPreview,from,receivedDateTime,isRead` +
    `&$orderby=receivedDateTime%20desc`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`graph messages ${r.status}`);
  const data = await r.json();
  return ((data.value ?? []) as GraphMessage[]).map((m) => ({
    id: m.id,
    threadId: m.conversationId ?? "",
    from: m.from?.emailAddress?.name ?? m.from?.emailAddress?.address ?? "",
    fromEmail: m.from?.emailAddress?.address ?? "",
    messageId: m.internetMessageId ?? "",
    subject: m.subject || "(no subject)",
    preview: m.bodyPreview ?? "",
    time: relativeTime(m.receivedDateTime),
    ts: m.receivedDateTime ? new Date(m.receivedDateTime).getTime() || 0 : 0,
    unread: m.isRead === false,
  }));
}

// Full-text search across the mailbox ($search).
export async function searchInbox(accessToken: string, query: string, max = 20): Promise<InboxEmail[]> {
  const url =
    `${GRAPH}/me/messages?$search="${encodeURIComponent(query)}"` +
    `&$select=id,conversationId,internetMessageId,subject,bodyPreview,from,receivedDateTime,isRead&$top=${max}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`graph search ${r.status}`);
  const data = await r.json();
  return ((data.value ?? []) as GraphMessage[]).map((m) => ({
    id: m.id,
    threadId: m.conversationId ?? "",
    from: m.from?.emailAddress?.name ?? m.from?.emailAddress?.address ?? "",
    fromEmail: m.from?.emailAddress?.address ?? "",
    messageId: m.internetMessageId ?? "",
    subject: m.subject || "(no subject)",
    preview: m.bodyPreview ?? "",
    time: relativeTime(m.receivedDateTime),
    ts: m.receivedDateTime ? new Date(m.receivedDateTime).getTime() || 0 : 0,
    unread: m.isRead === false,
  }));
}

export async function fetchTodayEvents(accessToken: string, timeZone = "UTC"): Promise<ScheduleEvent[]> {
  const { startISO, endISO } = dayWindowUtc(timeZone);
  // No Prefer:outlook.timezone header, so Graph interprets the window as UTC
  // and returns start.dateTime in UTC (naive, no offset) — we append "Z".
  const url =
    `${GRAPH}/me/calendarView?startDateTime=${encodeURIComponent(startISO)}` +
    `&endDateTime=${encodeURIComponent(endISO)}` +
    `&$select=subject,start,isAllDay&$orderby=start/dateTime&$top=15`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`graph calendar ${r.status}`);
  const data = await r.json();
  return (
    (data.value ?? []) as Array<{
      id: string;
      subject?: string;
      isAllDay?: boolean;
      start?: { dateTime?: string };
    }>
  ).map((e) => {
    const iso = e.start?.dateTime ? e.start.dateTime + "Z" : null;
    return {
      id: e.id,
      title: e.subject ?? "(busy)",
      time: e.isAllDay
        ? "All day"
        : iso
          ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone })
          : "All day",
      start: iso ? new Date(iso).toISOString() : null,
    };
  });
}

type GraphFullMessage = {
  id?: string;
  subject?: string;
  from?: { emailAddress?: { name?: string; address?: string } };
  receivedDateTime?: string;
  body?: { contentType?: string; content?: string };
  internetMessageId?: string;
  conversationId?: string;
};

function graphMessageToDetail(m: GraphFullMessage, fallbackId = ""): MessageDetail {
  const isHtml = (m.body?.contentType ?? "").toLowerCase() === "html";
  return {
    id: m.id ?? fallbackId,
    threadId: m.conversationId ?? "",
    subject: m.subject || "(no subject)",
    from: m.from?.emailAddress?.name ?? m.from?.emailAddress?.address ?? "",
    fromEmail: m.from?.emailAddress?.address ?? "",
    messageId: m.internetMessageId ?? "",
    date: m.receivedDateTime ?? "",
    bodyHtml: isHtml ? (m.body?.content ?? null) : null,
    bodyText: isHtml ? null : (m.body?.content ?? null),
  };
}

const MSG_SELECT = "id,subject,from,receivedDateTime,body,internetMessageId,conversationId";

export async function fetchMessage(accessToken: string, id: string): Promise<MessageDetail> {
  const r = await fetch(`${GRAPH}/me/messages/${id}?$select=${MSG_SELECT}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`graph message ${r.status}`);
  return graphMessageToDetail((await r.json()) as GraphFullMessage, id);
}

// All messages in a Microsoft conversation, oldest → newest.
export async function fetchThread(accessToken: string, conversationId: string): Promise<MessageDetail[]> {
  const filter = `conversationId eq '${conversationId.replace(/'/g, "''")}'`;
  const url =
    `${GRAPH}/me/messages?$filter=${encodeURIComponent(filter)}` +
    `&$select=${MSG_SELECT}&$top=25`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`graph thread ${r.status}`);
  const data = await r.json();
  const items = ((data.value ?? []) as GraphFullMessage[]).map((m) => graphMessageToDetail(m));
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return items;
}

export async function markRead(accessToken: string, id: string): Promise<void> {
  await setReadState(accessToken, id, true);
}

export async function setUnread(accessToken: string, id: string): Promise<void> {
  await setReadState(accessToken, id, false);
}

async function setReadState(accessToken: string, id: string, isRead: boolean): Promise<void> {
  const r = await fetch(`${GRAPH}/me/messages/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ isRead }),
  });
  if (!r.ok) throw new Error(`graph set-read ${r.status}`);
}

async function moveMessage(accessToken: string, id: string, destinationId: string): Promise<void> {
  const r = await fetch(`${GRAPH}/me/messages/${id}/move`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ destinationId }),
  });
  if (!r.ok) throw new Error(`graph move ${r.status} ${await r.text()}`);
}

// Move to the Archive well-known folder.
export async function archiveMessage(accessToken: string, id: string): Promise<void> {
  await moveMessage(accessToken, id, "archive");
}

// Move to Deleted Items — reversible, not a hard delete.
export async function trashMessage(accessToken: string, id: string): Promise<void> {
  await moveMessage(accessToken, id, "deleteditems");
}

// Reply in-thread to a Graph message (Graph addresses + subjects it for us).
export async function replyToMessage(accessToken: string, messageId: string, body: string): Promise<void> {
  const r = await fetch(`${GRAPH}/me/messages/${messageId}/reply`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ comment: body }),
  });
  if (!r.ok) throw new Error(`graph reply ${r.status} ${await r.text()}`);
}

// Native Graph forward — carries the original body and attachments.
export async function forwardMessage(
  accessToken: string,
  id: string,
  to: string,
  comment: string
): Promise<void> {
  const r = await fetch(`${GRAPH}/me/messages/${id}/forward`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      comment: comment ?? "",
      toRecipients: [{ emailAddress: { address: to } }],
    }),
  });
  if (!r.ok) throw new Error(`graph forward ${r.status} ${await r.text()}`);
}

export async function sendEmail(
  accessToken: string,
  opts: { to: string; subject: string; body: string }
): Promise<void> {
  const r = await fetch(`${GRAPH}/me/sendMail`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject: opts.subject,
        body: { contentType: "Text", content: opts.body },
        toRecipients: [{ emailAddress: { address: opts.to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!r.ok) throw new Error(`graph sendMail ${r.status} ${await r.text()}`);
}
