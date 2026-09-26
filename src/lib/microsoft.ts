import { createServerClient } from "@/lib/supabase/server";
import type {
  InboxEmail,
  ScheduleEvent,
  MessageDetail,
  OutgoingAttachment,
  MailLabel,
} from "@/lib/google";
import { dayWindowUtc } from "@/lib/tz";
import { scopeOwner, type MailScope } from "@/lib/mailOwner";

// Microsoft 365 (Graph) OAuth + Mail/Calendar helpers — the Microsoft twin of
// lib/google.ts (raw fetch, no SDK). Connections belong to an account
// (owner_id); several mailboxes per account. Uses the "common" endpoint so work/school (incl. GoDaddy-sold
// M365) and personal Microsoft accounts can sign in to a multi-tenant app.

const MS_AUTH = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MS_TOKEN = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const GRAPH = "https://graph.microsoft.com/v1.0";

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

export function getAuthUrl(origin?: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(origin),
    response_type: "code",
    response_mode: "query",
    scope: SCOPES,
    prompt: "select_account",
    ...(state ? { state } : {}),
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

export async function storeCredential(ownerId: string, tokens: TokenResponse, email?: string | null): Promise<string> {
  const supabase = createServerClient();
  const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();
  const accountKey = `${ownerId}:${(email || "unknown").toLowerCase()}`;
  const row: Record<string, unknown> = {
    account_key: accountKey,
    owner_id: ownerId,
    access_token: tokens.access_token ?? null,
    scope: tokens.scope ?? null,
    expiry,
    updated_at: new Date().toISOString(),
  };
  if (tokens.refresh_token) row.refresh_token = tokens.refresh_token;
  if (email) row.email = email;
  await supabase.from("microsoft_credentials").upsert(row, { onConflict: "account_key" });
  return accountKey;
}

// Refreshed tokens for a connection that already exists.
async function updateTokens(accountKey: string, tokens: TokenResponse, keepRefresh: string): Promise<void> {
  const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();
  await createServerClient()
    .from("microsoft_credentials")
    .update({
      access_token: tokens.access_token ?? null,
      refresh_token: keepRefresh,
      scope: tokens.scope ?? null,
      expiry,
      updated_at: new Date().toISOString(),
    })
    .eq("account_key", accountKey);
}

// One connected mailbox belonging to the scope's account: the named one, else
// the oldest. Returns null when the requester has no account or no mailbox.
async function loadRow(scope: MailScope | undefined, columns: string): Promise<Record<string, unknown> | null> {
  const owner = await scopeOwner(scope);
  if (!owner) return null;
  let q = createServerClient().from("microsoft_credentials").select(columns).eq("owner_id", owner);
  if (scope?.accountKey) q = q.eq("account_key", scope.accountKey);
  else q = q.order("created_at", { ascending: true }).limit(1);
  const { data } = await q.maybeSingle();
  return (data as unknown as Record<string, unknown>) ?? null;
}

export async function listConnections(scope?: MailScope): Promise<{ accountKey: string; email: string | null }[]> {
  const owner = await scopeOwner(scope);
  if (!owner) return [];
  const { data } = await createServerClient()
    .from("microsoft_credentials")
    .select("account_key, email")
    .eq("owner_id", owner)
    .order("created_at", { ascending: true });
  return (data ?? []).map((r) => ({ accountKey: r.account_key as string, email: (r.email as string) ?? null }));
}

export async function removeConnection(ownerId: string, accountKey: string): Promise<void> {
  await createServerClient().from("microsoft_credentials").delete().eq("owner_id", ownerId).eq("account_key", accountKey);
}

export async function isConnected(scope?: MailScope): Promise<boolean> {
  return Boolean(await loadRow(scope, "account_key"));
}

export async function connectedEmail(scope?: MailScope): Promise<string | null> {
  const row = await loadRow(scope, "email");
  return (row?.email as string) ?? null;
}

export async function getValidAccessToken(scope?: MailScope): Promise<string | null> {
  const data = await loadRow(scope, "account_key, access_token, refresh_token, expiry");
  if (!data) return null;
  const accountKey = data.account_key as string;
  const expiry = data.expiry as string | null;

  const stillValid = expiry && new Date(expiry).getTime() > Date.now() + 60_000;
  if (stillValid) return (data.access_token as string) ?? null;
  const refreshToken = data.refresh_token as string | null;
  if (!refreshToken) return (data.access_token as string) ?? null;

  try {
    const refreshed = await refreshAccessToken(refreshToken);
    await updateTokens(accountKey, refreshed, refreshed.refresh_token ?? refreshToken);
    return refreshed.access_token ?? null;
  } catch {
    return (data.access_token as string) ?? null;
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
  categories?: string[];
  from?: { emailAddress?: { name?: string; address?: string } };
}

function graphInboxRow(m: GraphMessage): InboxEmail {
  return {
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
    labels: (m.categories ?? []).map((c) => ({ id: c, name: c })),
  };
}

const INBOX_SELECT =
  "id,conversationId,internetMessageId,subject,bodyPreview,from,receivedDateTime,isRead,categories";

export async function fetchInbox(accessToken: string, max = 6): Promise<InboxEmail[]> {
  const url =
    `${GRAPH}/me/mailFolders/inbox/messages?$top=${max}` +
    `&$select=${INBOX_SELECT}&$orderby=receivedDateTime%20desc`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`graph messages ${r.status}`);
  const data = await r.json();
  return ((data.value ?? []) as GraphMessage[]).map(graphInboxRow);
}

// Full-text search across the mailbox ($search).
export async function searchInbox(accessToken: string, query: string, max = 20): Promise<InboxEmail[]> {
  const url =
    `${GRAPH}/me/messages?$search="${encodeURIComponent(query)}"` +
    `&$select=${INBOX_SELECT}&$top=${max}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`graph search ${r.status}`);
  const data = await r.json();
  return ((data.value ?? []) as GraphMessage[]).map(graphInboxRow);
}

export async function fetchTodayEvents(accessToken: string, timeZone = "UTC"): Promise<ScheduleEvent[]> {
  const { startISO, endISO } = dayWindowUtc(timeZone);
  return fetchEventsBetween(accessToken, startISO, endISO, timeZone, 15);
}

// Events between two instants (e.g. the coming week), oldest first.
export async function fetchEventsBetween(
  accessToken: string,
  startISO: string,
  endISO: string,
  timeZone = "UTC",
  max = 40
): Promise<ScheduleEvent[]> {
  // No Prefer:outlook.timezone header, so Graph interprets the window as UTC
  // and returns start.dateTime in UTC (naive, no offset) — we append "Z".
  const url =
    `${GRAPH}/me/calendarView?startDateTime=${encodeURIComponent(startISO)}` +
    `&endDateTime=${encodeURIComponent(endISO)}` +
    `&$select=subject,start,end,isAllDay&$orderby=start/dateTime&$top=${max}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`graph calendar ${r.status}`);
  const data = await r.json();
  return (
    (data.value ?? []) as Array<{
      id: string;
      subject?: string;
      isAllDay?: boolean;
      start?: { dateTime?: string };
      end?: { dateTime?: string };
    }>
  ).map((e) => {
    const iso = e.start?.dateTime ? e.start.dateTime + "Z" : null;
    const endIso = e.end?.dateTime ? e.end.dateTime + "Z" : null;
    const clock = iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone }) : "";
    // Some invitations are created as a timed 24-hour block from midnight instead
    // of a true all-day event; show those as all-day too.
    const spansDay = iso && endIso ? new Date(endIso).getTime() - new Date(iso).getTime() >= 23 * 3600 * 1000 : false;
    const allDay = Boolean(e.isAllDay) || !iso || (spansDay && clock === "12:00 AM");
    return {
      id: e.id,
      title: e.subject ?? "(busy)",
      time: allDay ? "All day" : clock,
      start: iso ? new Date(iso).toISOString() : null,
      end: endIso ? new Date(endIso).toISOString() : null,
      allDay,
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
  categories?: string[];
  attachments?: Array<{
    id?: string;
    name?: string;
    contentType?: string;
    size?: number;
    isInline?: boolean;
  }>;
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
    attachments: (m.attachments ?? [])
      .filter((a) => a.id && a.name && !a.isInline)
      .map((a) => ({
        id: a.id as string,
        name: a.name as string,
        mimeType: a.contentType || "application/octet-stream",
        size: a.size ?? 0,
      })),
    // Outlook categories are stored by display name — that's their id here.
    labels: (m.categories ?? []).map((c) => ({ id: c, name: c })),
  };
}

const MSG_SELECT = "id,subject,from,receivedDateTime,body,internetMessageId,conversationId,categories";
const MSG_EXPAND = "attachments($select=id,name,contentType,size,isInline)";

export async function fetchMessage(accessToken: string, id: string): Promise<MessageDetail> {
  const r = await fetch(`${GRAPH}/me/messages/${id}?$select=${MSG_SELECT}&$expand=${MSG_EXPAND}`, {
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
    `&$select=${MSG_SELECT}&$expand=${MSG_EXPAND}&$top=25`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`graph thread ${r.status}`);
  const data = await r.json();
  const items = ((data.value ?? []) as GraphFullMessage[]).map((m) => graphMessageToDetail(m));
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return items;
}

// Download one attachment's raw bytes (decodes the fileAttachment contentBytes).
export async function getAttachmentBytes(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<Buffer> {
  const r = await fetch(`${GRAPH}/me/messages/${messageId}/attachments/${attachmentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`graph attachment ${r.status}`);
  const a = (await r.json()) as { contentBytes?: string };
  return Buffer.from(a.contentBytes ?? "", "base64");
}

// Outlook master categories (the mailbox's category list).
export async function listLabels(accessToken: string): Promise<MailLabel[]> {
  const r = await fetch(`${GRAPH}/me/outlook/masterCategories`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`graph categories ${r.status}`);
  const data = await r.json();
  return ((data.value ?? []) as Array<{ displayName?: string; color?: string }>)
    .filter((c) => c.displayName)
    .map((c) => ({ id: c.displayName as string, name: c.displayName as string, color: c.color }));
}

// Create a new Outlook master category, returning it.
export async function createLabel(accessToken: string, name: string): Promise<MailLabel> {
  const r = await fetch(`${GRAPH}/me/outlook/masterCategories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: name, color: "preset0" }),
  });
  if (!r.ok) throw new Error(`graph create category ${r.status} ${await r.text()}`);
  const c = (await r.json()) as { displayName?: string; color?: string };
  return { id: c.displayName ?? name, name: c.displayName ?? name, color: c.color };
}

// Add/remove categories (by display name) on a message — set the full array.
export async function modifyLabels(
  accessToken: string,
  id: string,
  add: string[],
  remove: string[]
): Promise<void> {
  const cur = await fetch(`${GRAPH}/me/messages/${id}?$select=categories`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!cur.ok) throw new Error(`graph categories read ${cur.status}`);
  const data = (await cur.json()) as { categories?: string[] };
  const set = new Set(data.categories ?? []);
  add.forEach((a) => set.add(a));
  remove.forEach((r) => set.delete(r));
  const patch = await fetch(`${GRAPH}/me/messages/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ categories: Array.from(set) }),
  });
  if (!patch.ok) throw new Error(`graph categories write ${patch.status}`);
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

async function graphPost(accessToken: string, path: string, body: unknown): Promise<unknown> {
  const r = await fetch(`${GRAPH}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`graph ${path} ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}

// Add file attachments to a draft, prepend the comment into its body, then send it.
async function finishDraftWithAttachments(
  accessToken: string,
  draftId: string,
  comment: string,
  attachments: OutgoingAttachment[]
): Promise<void> {
  if (comment) {
    const g = await fetch(`${GRAPH}/me/messages/${draftId}?$select=body`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (g.ok) {
      const { body } = (await g.json()) as { body?: { contentType?: string; content?: string } };
      const isHtml = (body?.contentType ?? "").toLowerCase() === "html";
      const lead = isHtml ? `<div>${escapeHtml(comment)}</div><br>` : `${comment}\n\n`;
      await fetch(`${GRAPH}/me/messages/${draftId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          body: { contentType: body?.contentType ?? "HTML", content: lead + (body?.content ?? "") },
        }),
      });
    }
  }
  for (const a of attachments) {
    await graphPost(accessToken, `/me/messages/${draftId}/attachments`, {
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: a.name,
      contentType: a.mimeType || "application/octet-stream",
      contentBytes: a.contentBase64.replace(/\r?\n/g, ""),
    });
  }
  await graphPost(accessToken, `/me/messages/${draftId}/send`, {});
}

// Reply in-thread. Without attachments, the simple reply action; with
// attachments, create a reply draft, attach, and send.
export async function replyToMessage(
  accessToken: string,
  messageId: string,
  body: string,
  attachments?: OutgoingAttachment[]
): Promise<void> {
  if (!attachments || attachments.length === 0) {
    await graphPost(accessToken, `/me/messages/${messageId}/reply`, { comment: body });
    return;
  }
  const draft = (await graphPost(accessToken, `/me/messages/${messageId}/createReply`, {})) as {
    id?: string;
  };
  if (!draft?.id) throw new Error("graph createReply: no draft id");
  await finishDraftWithAttachments(accessToken, draft.id, body, attachments);
}

// Forward. Without new attachments, the native forward (keeps original
// attachments); with new attachments, a forward draft + attach + send.
export async function forwardMessage(
  accessToken: string,
  id: string,
  to: string,
  comment: string,
  attachments?: OutgoingAttachment[]
): Promise<void> {
  if (!attachments || attachments.length === 0) {
    await graphPost(accessToken, `/me/messages/${id}/forward`, {
      comment: comment ?? "",
      toRecipients: [{ emailAddress: { address: to } }],
    });
    return;
  }
  const draft = (await graphPost(accessToken, `/me/messages/${id}/createForward`, {})) as {
    id?: string;
  };
  if (!draft?.id) throw new Error("graph createForward: no draft id");
  await fetch(`${GRAPH}/me/messages/${draft.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ toRecipients: [{ emailAddress: { address: to } }] }),
  });
  await finishDraftWithAttachments(accessToken, draft.id, comment, attachments);
}

export async function sendEmail(
  accessToken: string,
  opts: { to: string; subject: string; body: string; attachments?: OutgoingAttachment[] }
): Promise<void> {
  const attachments = (opts.attachments ?? []).map((a) => ({
    "@odata.type": "#microsoft.graph.fileAttachment",
    name: a.name,
    contentType: a.mimeType || "application/octet-stream",
    contentBytes: a.contentBase64.replace(/\r?\n/g, ""),
  }));
  const r = await fetch(`${GRAPH}/me/sendMail`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject: opts.subject,
        body: { contentType: "Text", content: opts.body },
        toRecipients: [{ emailAddress: { address: opts.to } }],
        ...(attachments.length ? { attachments } : {}),
      },
      saveToSentItems: true,
    }),
  });
  if (!r.ok) throw new Error(`graph sendMail ${r.status} ${await r.text()}`);
}

// Create a calendar event (used for follow-up "time blocks"). start/end are UTC
// ISO instants; we hand Graph the wall-clock plus timeZone UTC. Returns the id.
export async function createEvent(
  accessToken: string,
  opts: { subject: string; startISO: string; endISO: string; body?: string }
): Promise<string> {
  const toGraph = (iso: string) => iso.replace(/\.\d+Z$/, "Z").replace(/Z$/, "");
  const r = await fetch(`${GRAPH}/me/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: opts.subject,
      body: { contentType: "Text", content: opts.body || "" },
      start: { dateTime: toGraph(opts.startISO), timeZone: "UTC" },
      end: { dateTime: toGraph(opts.endISO), timeZone: "UTC" },
    }),
  });
  if (!r.ok) throw new Error(`graph createEvent ${r.status} ${await r.text()}`);
  const j = await r.json().catch(() => ({}));
  return String(j.id ?? "");
}
