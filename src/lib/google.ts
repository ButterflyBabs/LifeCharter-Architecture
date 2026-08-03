import { createServerClient } from "@/lib/supabase/server";
import { dayWindowUtc } from "@/lib/tz";

// Google OAuth + Gmail/Calendar helpers (no external dependency — raw fetch).
// Single-tenant: one stored credential keyed by ACCOUNT_KEY.

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const ACCOUNT_KEY = "primary";

const SCOPES = [
  "openid",
  "email",
  "profile",
  // modify covers reading + label changes (mark-read); send is needed for replies
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

// Accept both SCREAMING_SNAKE_CASE and camelCase names, in case the env vars
// were added as GoogleClientID / GoogleClientSecret.
function clientId(): string {
  return process.env.GOOGLE_CLIENT_ID || process.env.GoogleClientID || "";
}
function clientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || process.env.GoogleClientSecret || "";
}

export function isGoogleConfigured(): boolean {
  return Boolean(clientId() && clientSecret());
}

export function redirectUri(origin?: string): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `${origin ?? process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/google/callback`
  );
}

export function getAuthUrl(origin?: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
};

export async function exchangeCode(code: string, origin?: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status}`);
  return res.json();
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
  // Google only returns a refresh_token on first consent — keep the old one otherwise.
  if (tokens.refresh_token) row.refresh_token = tokens.refresh_token;
  if (email) row.email = email;
  await supabase.from("google_credentials").upsert(row, { onConflict: "account_key" });
}

export async function isConnected(): Promise<boolean> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("google_credentials")
    .select("account_key")
    .eq("account_key", ACCOUNT_KEY)
    .maybeSingle();
  return Boolean(data);
}

export async function connectedEmail(): Promise<string | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("google_credentials")
    .select("email")
    .eq("account_key", ACCOUNT_KEY)
    .maybeSingle();
  return (data?.email as string) ?? null;
}

export async function getValidAccessToken(): Promise<string | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("google_credentials")
    .select("access_token, refresh_token, expiry")
    .eq("account_key", ACCOUNT_KEY)
    .maybeSingle();
  if (!data) return null;

  const stillValid = data.expiry && new Date(data.expiry).getTime() > Date.now() + 60_000;
  if (stillValid) return data.access_token ?? null;
  if (!data.refresh_token) return data.access_token ?? null;

  try {
    const refreshed = await refreshAccessToken(data.refresh_token);
    await storeCredential({ ...refreshed, refresh_token: data.refresh_token });
    return refreshed.access_token ?? null;
  } catch {
    return data.access_token ?? null;
  }
}

// ---------------------------------------------------------------------------
// Gmail + Calendar reads
// ---------------------------------------------------------------------------
export type InboxEmail = {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  messageId: string; // RFC822 Message-ID header, for threading replies
  subject: string;
  preview: string;
  time: string;
  ts: number; // epoch ms of the message date, for cross-account sorting
  unread: boolean;
};

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

// Hydrate a list of Gmail message ids into InboxEmail rows (metadata only).
async function hydrateInboxIds(accessToken: string, ids: string[]): Promise<InboxEmail[]> {
  const results = await Promise.all(
    ids.map(async (id) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=Message-ID`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!r.ok) return null;
      const msg = await r.json();
      const headers: Record<string, string> = Object.fromEntries(
        (msg.payload?.headers ?? []).map((h: { name: string; value: string }) => [
          h.name.toLowerCase(),
          h.value,
        ])
      );
      const fromRaw = headers["from"] ?? "";
      const fromName = fromRaw.replace(/<[^>]*>/, "").replace(/"/g, "").trim() || fromRaw;
      const fromEmail = (fromRaw.match(/<([^>]+)>/)?.[1] ?? fromRaw).trim();
      const email: InboxEmail = {
        id,
        threadId: msg.threadId ?? "",
        from: fromName,
        fromEmail,
        messageId: headers["message-id"] ?? "",
        subject: headers["subject"] ?? "(no subject)",
        preview: msg.snippet ?? "",
        time: relativeTime(headers["date"]),
        ts: headers["date"] ? new Date(headers["date"]).getTime() || 0 : 0,
        unread: (msg.labelIds ?? []).includes("UNREAD"),
      };
      return email;
    })
  );
  return results.filter((e): e is InboxEmail => e !== null);
}

export async function fetchInbox(accessToken: string, max = 6): Promise<InboxEmail[]> {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!listRes.ok) throw new Error(`gmail list ${listRes.status}`);
  const list = await listRes.json();
  const ids: string[] = (list.messages ?? []).map((m: { id: string }) => m.id);
  return hydrateInboxIds(accessToken, ids);
}

// Full-text search across the mailbox (Gmail search syntax).
export async function searchInbox(accessToken: string, query: string, max = 20): Promise<InboxEmail[]> {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!listRes.ok) throw new Error(`gmail search ${listRes.status}`);
  const list = await listRes.json();
  const ids: string[] = (list.messages ?? []).map((m: { id: string }) => m.id);
  return hydrateInboxIds(accessToken, ids);
}

// Full message body for the reading view.
export type MessageDetail = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  messageId: string;
  date: string;
  bodyHtml: string | null;
  bodyText: string | null;
};

type GmailPart = { mimeType?: string; body?: { data?: string }; parts?: GmailPart[] };

function decodeBody(data?: string): string {
  if (!data) return "";
  try {
    return Buffer.from(data, "base64url").toString("utf-8");
  } catch {
    return "";
  }
}

// Walk the MIME tree and pull out the first html and first plain-text parts.
function extractBody(payload?: GmailPart): { html: string | null; text: string | null } {
  let html: string | null = null;
  let text: string | null = null;
  const visit = (part?: GmailPart) => {
    if (!part) return;
    const mime = part.mimeType ?? "";
    if (mime === "text/html" && part.body?.data && html === null) html = decodeBody(part.body.data);
    else if (mime === "text/plain" && part.body?.data && text === null) text = decodeBody(part.body.data);
    (part.parts ?? []).forEach(visit);
  };
  visit(payload);
  return { html, text };
}

type GmailFullMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  payload?: GmailPart & { headers?: { name: string; value: string }[] };
};

function gmailMessageToDetail(msg: GmailFullMessage): MessageDetail {
  const headers: Record<string, string> = Object.fromEntries(
    (msg.payload?.headers ?? []).map((h) => [h.name.toLowerCase(), h.value])
  );
  const fromRaw = headers["from"] ?? "";
  const fromName = fromRaw.replace(/<[^>]*>/, "").replace(/"/g, "").trim() || fromRaw;
  const fromEmail = (fromRaw.match(/<([^>]+)>/)?.[1] ?? fromRaw).trim();
  const { html, text } = extractBody(msg.payload as GmailPart);
  return {
    id: msg.id,
    threadId: msg.threadId ?? "",
    subject: headers["subject"] ?? "(no subject)",
    from: fromName,
    fromEmail,
    messageId: headers["message-id"] ?? "",
    date: headers["date"] ?? "",
    bodyHtml: html,
    bodyText: text || (html ? null : (msg.snippet ?? "")),
  };
}

export async function fetchMessage(accessToken: string, id: string): Promise<MessageDetail> {
  const r = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!r.ok) throw new Error(`gmail message ${r.status}`);
  return gmailMessageToDetail(await r.json());
}

// All messages in a Gmail thread, oldest → newest.
export async function fetchThread(accessToken: string, threadId: string): Promise<MessageDetail[]> {
  const r = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!r.ok) throw new Error(`gmail thread ${r.status}`);
  const data = await r.json();
  return ((data.messages ?? []) as GmailFullMessage[]).map(gmailMessageToDetail);
}

export type ScheduleEvent = {
  id: string;
  title: string;
  time: string;
  start: string | null;
};

export async function fetchTodayEvents(accessToken: string, timeZone = "UTC"): Promise<ScheduleEvent[]> {
  const { startISO, endISO } = dayWindowUtc(timeZone);
  const params = new URLSearchParams({
    timeMin: startISO,
    timeMax: endISO,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "15",
    timeZone,
  });
  const r = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!r.ok) throw new Error(`calendar ${r.status}`);
  const data = await r.json();
  return (data.items ?? []).map(
    (e: { id: string; summary?: string; start?: { dateTime?: string; date?: string } }) => ({
      id: e.id,
      title: e.summary ?? "(busy)",
      // dateTime => timed event (format in the viewer's tz); bare date => all-day.
      time: e.start?.dateTime
        ? new Date(e.start.dateTime).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone,
          })
        : "All day",
      start: e.start?.dateTime ?? e.start?.date ?? null,
    })
  );
}

// ---------------------------------------------------------------------------
// Gmail writes (require gmail.modify / gmail.send scopes)
// ---------------------------------------------------------------------------
async function gmailModify(
  accessToken: string,
  id: string,
  body: { addLabelIds?: string[]; removeLabelIds?: string[] }
): Promise<void> {
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`gmail modify ${r.status}`);
}

export async function markRead(accessToken: string, id: string): Promise<void> {
  await gmailModify(accessToken, id, { removeLabelIds: ["UNREAD"] });
}

export async function setUnread(accessToken: string, id: string): Promise<void> {
  await gmailModify(accessToken, id, { addLabelIds: ["UNREAD"] });
}

// Remove from Inbox (Gmail "archive"). Still searchable / in All Mail.
export async function archiveMessage(accessToken: string, id: string): Promise<void> {
  await gmailModify(accessToken, id, { removeLabelIds: ["INBOX"] });
}

// Move to Trash — reversible (Gmail keeps it ~30 days), not a hard delete.
export async function trashMessage(accessToken: string, id: string): Promise<void> {
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`gmail trash ${r.status}`);
}

function base64Url(str: string): string {
  return Buffer.from(str, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendReply(
  accessToken: string,
  opts: { threadId: string; to: string; subject: string; inReplyTo: string; body: string }
): Promise<void> {
  const subject = /^re:/i.test(opts.subject) ? opts.subject : `Re: ${opts.subject}`;
  const headerLines = [
    `To: ${opts.to}`,
    `Subject: ${subject}`,
    ...(opts.inReplyTo ? [`In-Reply-To: ${opts.inReplyTo}`, `References: ${opts.inReplyTo}`] : []),
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
  ].join("\r\n");
  const raw = base64Url(`${headerLines}\r\n\r\n${opts.body}`);
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw, threadId: opts.threadId || undefined }),
  });
  if (!r.ok) throw new Error(`gmail send ${r.status} ${await r.text()}`);
}

// Compose and send a brand-new email (not a reply — no thread, subject as-is).
export async function sendEmail(
  accessToken: string,
  opts: { to: string; subject: string; body: string }
): Promise<void> {
  const headerLines = [
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
  ].join("\r\n");
  const raw = base64Url(`${headerLines}\r\n\r\n${opts.body}`);
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!r.ok) throw new Error(`gmail send ${r.status} ${await r.text()}`);
}

// Rough HTML → text, for quoting an html-only message into a plain-text forward.
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Forward a message: quote the original body into a new plain-text email.
// (Attachments aren't carried yet — that arrives with the attachments work.)
export async function forwardMessage(
  accessToken: string,
  id: string,
  to: string,
  comment: string
): Promise<void> {
  const msg = await fetchMessage(accessToken, id);
  const original = msg.bodyText || (msg.bodyHtml ? htmlToText(msg.bodyHtml) : msg.subject);
  const subject = /^fwd:/i.test(msg.subject) ? msg.subject : `Fwd: ${msg.subject}`;
  const body =
    (comment ? `${comment}\n\n` : "") +
    "---------- Forwarded message ----------\n" +
    `From: ${msg.from}${msg.fromEmail ? ` <${msg.fromEmail}>` : ""}\n` +
    (msg.date ? `Date: ${msg.date}\n` : "") +
    `Subject: ${msg.subject}\n\n` +
    original;
  await sendEmail(accessToken, { to, subject, body });
}
