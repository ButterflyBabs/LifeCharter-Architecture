"use client";

// Client-side media prep for the Collective: big phone photos are resized
// before upload (fast on mobile data, lighter to load), and files are checked
// against the storage limit up front with a friendly message.

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // matches the storage bucket limit
export const MAX_ATTACHMENTS = 10;
const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.85;

export const isImage = (type?: string | null) => !!type && type.startsWith("image/");
export const isVideo = (type?: string | null) => !!type && type.startsWith("video/");

// Resize a still image to at most MAX_EDGE on its long side and re-encode as
// JPEG (PNG kept when it has transparency-friendly small size). GIFs and
// anything the browser can't decode are passed through untouched.
export async function prepareFile(file: File): Promise<File> {
  if (!isImage(file.type) || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const keepPng = file.type === "image/png" && file.size < 1024 * 1024;
    const type = keepPng ? "image/png" : "image/jpeg";
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, type, JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = keepPng ? file.name : file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type, lastModified: file.lastModified });
  } catch {
    return file;
  }
}

// YouTube / Vimeo / Loom links in a post become an inline player.
export function embedFor(text: string): { src: string; provider: string } | null {
  const url = text.match(/https?:\/\/[^\s<>()]+/g) ?? [];
  for (const u of url) {
    let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    if (m) return { src: `https://www.youtube-nocookie.com/embed/${m[1]}`, provider: "YouTube" };
    m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { src: `https://player.vimeo.com/video/${m[1]}`, provider: "Vimeo" };
    m = u.match(/loom\.com\/share\/([\w]+)/);
    if (m) return { src: `https://www.loom.com/embed/${m[1]}`, provider: "Loom" };
  }
  return null;
}
