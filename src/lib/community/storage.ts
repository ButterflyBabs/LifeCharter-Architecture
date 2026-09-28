"use client";

import { useEffect, useState } from "react";
import { communityClient } from "./context";
import type { Attachment } from "./types";

const BUCKET = "community";
// Links come from /api/community/files, which signs a file only after checking
// the member can see what it belongs to. They last 15 minutes; re-sign a
// little before that.
const REUSE_MS = 12 * 60_000;
const signed = new Map<string, { url: string; exp: number }>();

// Upload into the member's own folder (or library/ for admins) and return an attachment record.
export async function uploadCommunityFile(file: File, folder: string): Promise<Attachment> {
  const supabase = communityClient();
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = `${folder}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error(error.message);
  return { name: file.name, url: "", path, type: file.type, size: file.size };
}

// Older records may hold a full Supabase storage link to this bucket (public,
// signed or authenticated form). Turn it back into the object path so it is
// re-signed through the access check; any other web address passes through.
const STORAGE_LINK = new RegExp(`/storage/v1/object/(?:sign|public|authenticated)/${BUCKET}/([^?#]+)`);
export function storagePathOf(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (!/^https?:\/\//.test(pathOrUrl)) return pathOrUrl.replace(/^\/+/, "");
  const m = pathOrUrl.match(STORAGE_LINK);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

// Collect requests made in the same moment (a feed full of photos) into one call.
let queue: { path: string; resolve: (url: string | null) => void }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  const batch = queue;
  queue = [];
  timer = null;
  const paths = Array.from(new Set(batch.map((b) => b.path)));
  let urls: Record<string, string> = {};
  try {
    for (let i = 0; i < paths.length; i += 60) {
      const res = await fetch("/api/community/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ paths: paths.slice(i, i + 60) }),
      });
      if (res.ok) urls = { ...urls, ...((await res.json()) as { urls?: Record<string, string> }).urls };
    }
  } catch {
    // leave missing ones unresolved
  }
  const exp = Date.now() + REUSE_MS;
  for (const [p, u] of Object.entries(urls)) signed.set(p, { url: u, exp });
  for (const b of batch) b.resolve(urls[b.path] ?? null);
}

export async function signedUrl(pathOrUrl: string): Promise<string | null> {
  const path = storagePathOf(pathOrUrl);
  if (!path) return null;
  const hit = signed.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  return new Promise((resolve) => {
    queue.push({ path, resolve });
    if (!timer) timer = setTimeout(() => void flush(), 25);
  });
}

// Resolve a stored path (or pass through a plain URL) to something an <img>/<a> can use.
export function useFileUrl(pathOrUrl: string | null | undefined): string | null {
  const path = storagePathOf(pathOrUrl);
  const external = !!pathOrUrl && !path && /^https?:\/\//.test(pathOrUrl);
  const [url, setUrl] = useState<string | null>(() => {
    if (external) return pathOrUrl!;
    if (!path) return null;
    const hit = signed.get(path);
    return hit && hit.exp > Date.now() ? hit.url : null;
  });
  useEffect(() => {
    if (external) return setUrl(pathOrUrl!);
    if (!path) return setUrl(null);
    let live = true;
    let refresh: ReturnType<typeof setTimeout> | null = null;
    const load = () => {
      void signedUrl(path).then((u) => {
        if (!live) return;
        setUrl(u);
        // Keep links fresh on long-open screens (videos, file links).
        if (u) refresh = setTimeout(load, REUSE_MS + 1000);
      });
    };
    load();
    return () => {
      live = false;
      if (refresh) clearTimeout(refresh);
    };
  }, [path, external, pathOrUrl]);
  return url;
}
