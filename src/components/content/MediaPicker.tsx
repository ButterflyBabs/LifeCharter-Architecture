"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Film, Image as ImageIcon, Link2, Loader2, Upload, X } from "lucide-react";

export interface MediaValue {
  urls: string[]; // ready to post, in order
  mediaType?: "image" | "video" | "carousel";
  uploading: boolean;
}

interface Item {
  id: string;
  name: string;
  kind: "image" | "video";
  url: string; // public URL once uploaded, or the pasted link
  preview: string; // what to show (local object URL while uploading)
  progress: number | null; // 0–100 while uploading, null when done
  error: string;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,video/mp4,video/quicktime";
const kindOfUrl = (u: string): "image" | "video" => (/\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(u) ? "video" : "image");
const newId = () => Math.random().toString(36).slice(2, 10);

// Upload a file straight to Supabase Storage with a signed URL from
// /api/content/media (same request shape as supabase-js uploadToSignedUrl),
// reporting progress.
function putFile(uploadUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("x-upsert", "false");
    // The project's public (anon) key, as supabase-js sends; the signed token authorises the upload.
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anon) {
      xhr.setRequestHeader("apikey", anon);
      xhr.setRequestHeader("Authorization", `Bearer ${anon}`);
    }
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(form);
  });
}

// Images and videos for a post: upload from this device, or paste a link.
export function MediaPicker({ onChange, resetKey }: { onChange: (v: MediaValue) => void; resetKey: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [link, setLink] = useState("");
  const [linkMsg, setLinkMsg] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Clear after the post is saved.
  useEffect(() => {
    setItems([]);
    setLink("");
    setLinkMsg("");
  }, [resetKey]);

  useEffect(() => {
    const ready = items.filter((i) => i.progress === null && !i.error);
    const hasVideo = ready.some((i) => i.kind === "video");
    onChange({
      urls: ready.map((i) => i.url),
      mediaType: !ready.length ? undefined : hasVideo ? "video" : ready.length > 1 ? "carousel" : "image",
      uploading: items.some((i) => i.progress !== null && !i.error),
    });
  }, [items, onChange]);

  const patch = (id: string, p: Partial<Item>) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const upload = async (file: File) => {
    const id = newId();
    const kind = file.type.startsWith("video/") ? "video" : "image";
    setItems((prev) => [...prev, { id, name: file.name, kind, url: "", preview: URL.createObjectURL(file), progress: 0, error: "" }]);
    try {
      const res = await fetch("/api/content/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.uploadUrl) throw new Error(d.error || "Couldn't start the upload.");
      await putFile(d.uploadUrl, file, (pct) => patch(id, { progress: pct }));
      patch(id, { url: d.publicUrl, progress: null });
    } catch (e) {
      patch(id, { error: e instanceof Error ? e.message : "Upload failed.", progress: null });
    }
  };

  const addLink = () => {
    const u = link.trim();
    if (!u) {
      setLinkMsg("Paste a link to an image or video first, or use Upload.");
      return;
    }
    if (!/^https?:\/\//i.test(u)) {
      setLinkMsg("Links need to start with https://");
      return;
    }
    setLinkMsg("");
    if (!items.some((i) => i.url === u)) setItems((prev) => [...prev, { id: newId(), name: u, kind: kindOfUrl(u), url: u, preview: u, progress: null, error: "" }]);
    setLink("");
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Images or video</label>
      <p className="text-xs text-[#7a8a99] mb-2">PNG, JPEG, WebP, GIF, MP4 or MOV, up to 50 MB each. Several images post as a carousel.</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 h-10 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]"
        >
          <Upload className="w-4 h-4" /> Upload image or video
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            Array.from(e.target.files || []).forEach(upload);
            e.target.value = "";
          }}
        />
        <span className="text-xs text-[#7a8a99]">or</span>
        <div className="flex flex-1 min-w-[220px] items-center gap-2">
          <input
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setLinkMsg("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="Paste a link (https://…)"
            aria-label="Media link"
            className="flex-1 px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
          />
          <button
            type="button"
            onClick={addLink}
            className="inline-flex items-center gap-1 text-sm font-medium px-3 h-10 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
          >
            <Link2 className="w-4 h-4" /> Add link
          </button>
        </div>
      </div>
      {linkMsg && (
        <p className="mt-1 text-xs text-[#8a6a15]" role="status">
          {linkMsg}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {items.map((i) => (
            <li key={i.id} className="relative w-28">
              <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-[#1a2b4a]/15 bg-[#1a2b4a]/5">
                {i.kind === "video" ? (
                  <video src={i.preview} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.preview} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute left-1 top-1 rounded bg-black/55 p-0.5 text-white">
                  {i.kind === "video" ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                </span>
                {i.progress !== null && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/70 text-xs text-[#1a2b4a]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {i.progress}%
                  </div>
                )}
                {i.error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#8a2f2f]/80 p-1 text-center text-[10px] text-white">
                    <AlertCircle className="mr-0.5 w-3 h-3 shrink-0" /> {i.error}
                  </div>
                )}
              </div>
              <p className="mt-1 truncate text-[11px] text-[#7a8a99]" title={i.name}>
                {i.name}
              </p>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}
                aria-label={`Remove ${i.name}`}
                className="absolute -right-2 -top-2 rounded-full border border-[#1a2b4a]/15 bg-white p-1 shadow-sm hover:bg-[#f6dcdc]"
              >
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
