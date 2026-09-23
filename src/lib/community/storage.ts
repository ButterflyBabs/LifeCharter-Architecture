"use client";

import { useEffect, useState } from "react";
import { communityClient } from "./context";
import type { Attachment } from "./types";

const BUCKET = "community";
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

export async function signedUrl(path: string): Promise<string | null> {
  const hit = signed.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data } = await communityClient().storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (!data?.signedUrl) return null;
  signed.set(path, { url: data.signedUrl, exp: Date.now() + 55 * 60_000 });
  return data.signedUrl;
}

// Resolve a stored path (or pass through a plain URL) to something an <img>/<a> can use.
export function useFileUrl(pathOrUrl: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (!pathOrUrl) return null;
    if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
    return signed.get(pathOrUrl)?.url ?? null;
  });
  useEffect(() => {
    if (!pathOrUrl) return setUrl(null);
    if (/^https?:\/\//.test(pathOrUrl)) return setUrl(pathOrUrl);
    let live = true;
    void signedUrl(pathOrUrl).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [pathOrUrl]);
  return url;
}
