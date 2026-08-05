import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/postStreamConstants";

// Client for the PostStream / Post Bridge API.
//   Base: https://api.poststream.io  (all routes under /api/v1)
//   Auth: x-api-key: <client key>   (per-client key, stored in client_integrations)
// Nothing here runs client-side; the key never leaves the server.

const BASE = "https://api.poststream.io/api/v1";
const PROVIDER = "poststream";

export { PLATFORMS, PLATFORM_LABELS };
export type { Platform };

export class PostStreamError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface PsAccount {
  id: string;
  platform: string;
  username: string;
  avatarUrl: string;
  followersCount: number;
}

export interface PsPost {
  id: string;
  title: string;
  caption: string;
  platforms: string[];
  status: string; // draft | scheduled | published
  scheduledAt: string | null;
  mediaUrls: string[];
  mediaType: string;
  createdAt: string | null;
  publishedAt: string | null;
}

function authHeaders(key: string, hasBody: boolean): Record<string, string> {
  const h: Record<string, string> = { "x-api-key": key, Accept: "application/json" };
  if (hasBody) h["Content-Type"] = "application/json";
  return h;
}

// Low-level call. Defensive about the response envelope ({data:...} vs raw).
async function ps<T = unknown>(key: string, path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...authHeaders(key, init?.body != null), ...(init?.headers || {}) },
      cache: "no-store",
    });
  } catch {
    throw new PostStreamError("Couldn't reach PostStream.", 502);
  }
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const j = (json || {}) as Record<string, unknown>;
    const msg =
      (typeof j.message === "string" && j.message) ||
      (Array.isArray(j.message) ? (j.message as string[]).join(", ") : "") ||
      (typeof j.error === "string" && j.error) ||
      (text ? text.replace(/<[^>]*>/g, "").trim().slice(0, 180) : "") ||
      `HTTP ${res.status}`;
    throw new PostStreamError(msg, res.status);
  }
  const env = json as { data?: T } | T;
  return (env && typeof env === "object" && "data" in (env as object) ? (env as { data: T }).data : (env as T));
}

// The current client's stored PostStream key, or null if not connected.
export async function getClientKey(): Promise<string | null> {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return null;
  const { data } = await supabase
    .from("client_integrations")
    .select("api_key")
    .eq("master_plan_id", masterPlanId)
    .eq("provider", PROVIDER)
    .maybeSingle();
  const key = ((data?.api_key as string) || "").trim();
  return key || null;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeAccount(raw: Record<string, unknown>): PsAccount {
  return {
    id: String(raw.id ?? raw._id ?? raw.externalAccountId ?? ""),
    platform: String(raw.platform ?? ""),
    username: String(raw.username ?? raw.handle ?? ""),
    avatarUrl: String(raw.avatarUrl ?? ""),
    followersCount: num(raw.followersCount ?? raw.followers),
  };
}

function normalizePost(raw: Record<string, unknown>): PsPost {
  const platforms = Array.isArray(raw.platforms) ? (raw.platforms as unknown[]).map(String) : [];
  const mediaUrls = Array.isArray(raw.mediaUrls) ? (raw.mediaUrls as unknown[]).map(String) : [];
  return {
    id: String(raw.id ?? raw._id ?? ""),
    title: String(raw.title ?? ""),
    caption: String(raw.caption ?? ""),
    platforms,
    status: String(raw.status ?? "draft"),
    scheduledAt: (raw.scheduledAt as string) ?? null,
    mediaUrls,
    mediaType: String(raw.mediaType ?? ""),
    createdAt: (raw.createdAt as string) ?? null,
    publishedAt: (raw.publishedAt as string) ?? null,
  };
}

// Validate a key by listing accounts (cheap authenticated call).
export async function validateKey(key: string): Promise<boolean> {
  try {
    await ps(key, "/accounts");
    return true;
  } catch (e) {
    if (e instanceof PostStreamError && (e.status === 401 || e.status === 403)) return false;
    // Reachable but some other error — treat as valid-enough so we don't block saving.
    if (e instanceof PostStreamError && e.status >= 500) return true;
    return false;
  }
}

export async function listAccounts(key: string): Promise<PsAccount[]> {
  const data = await ps<unknown>(key, "/accounts");
  const arr = Array.isArray(data) ? data : ((data as { accounts?: unknown[] })?.accounts ?? []);
  return (arr as Record<string, unknown>[]).map(normalizeAccount);
}

export async function listPosts(
  key: string,
  filters: { status?: string; platform?: string; search?: string } = {}
): Promise<PsPost[]> {
  const qs = new URLSearchParams();
  if (filters.status) qs.set("status", filters.status);
  if (filters.platform) qs.set("platform", filters.platform);
  if (filters.search) qs.set("search", filters.search);
  const q = qs.toString();
  const data = await ps<unknown>(key, `/posts${q ? `?${q}` : ""}`);
  const arr = Array.isArray(data) ? data : ((data as { posts?: unknown[] })?.posts ?? []);
  return (arr as Record<string, unknown>[]).map(normalizePost);
}

export interface CreatePostInput {
  title: string;
  caption?: string;
  platforms: string[];
  status?: "draft" | "scheduled" | "published";
  scheduledAt?: string | null;
  mediaUrls?: string[];
  mediaType?: "image" | "video" | "carousel";
  tags?: string[];
}

function buildBody(input: Partial<CreatePostInput>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (input.title !== undefined) body.title = input.title;
  if (input.caption !== undefined) body.caption = input.caption;
  if (input.platforms !== undefined) body.platforms = input.platforms;
  if (input.status !== undefined) body.status = input.status;
  if (input.scheduledAt !== undefined && input.scheduledAt) body.scheduledAt = input.scheduledAt;
  if (input.mediaUrls !== undefined && input.mediaUrls.length) body.mediaUrls = input.mediaUrls;
  if (input.mediaType !== undefined) body.mediaType = input.mediaType;
  if (input.tags !== undefined && input.tags.length) body.tags = input.tags;
  return body;
}

export async function createPost(key: string, input: CreatePostInput): Promise<PsPost> {
  const data = await ps<Record<string, unknown>>(key, "/posts", {
    method: "POST",
    body: JSON.stringify(buildBody(input)),
  });
  return normalizePost(data);
}

export async function updatePost(key: string, id: string, input: Partial<CreatePostInput>): Promise<PsPost> {
  const data = await ps<Record<string, unknown>>(key, `/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(buildBody(input)),
  });
  return normalizePost(data);
}

export async function deletePost(key: string, id: string): Promise<void> {
  await ps(key, `/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function publishPost(key: string, id: string): Promise<PsPost> {
  const data = await ps<Record<string, unknown>>(key, `/posts/${encodeURIComponent(id)}/publish`, {
    method: "POST",
  });
  return normalizePost(data);
}
