"use client";

// Photos, videos and files in the Collective — the draft strip shown while
// composing (with previews and remove), and the gallery + full-screen viewer
// used to show them in posts, replies and messages.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, ImagePlus, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileSize } from "@/lib/community/format";
import { MAX_ATTACHMENTS, MAX_FILE_BYTES, embedFor, isImage, isVideo, prepareFile } from "@/lib/community/media";
import { uploadCommunityFile, useFileUrl } from "@/lib/community/storage";
import type { Attachment } from "@/lib/community/types";

// ─── Draft (composing) ─────────────────────────────────────────────────────

interface DraftItem {
  id: string;
  file: File;
  preview: string | null;
}

export function useMediaDraft() {
  const [items, setItems] = useState<DraftItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => () => itemsRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)), []);

  const add = useCallback((files: FileList | File[]) => {
    setError(null);
    const incoming = Array.from(files);
    const tooBig = incoming.filter((f) => f.size > MAX_FILE_BYTES);
    if (tooBig.length) {
      setError(
        tooBig.some((f) => isVideo(f.type))
          ? "Videos can be up to 50 MB. For longer videos, paste a YouTube, Vimeo or Loom link instead — it plays right in the post."
          : `Files can be up to 50 MB (${tooBig.map((f) => f.name).join(", ")} is too large).`
      );
    }
    const ok = incoming.filter((f) => f.size <= MAX_FILE_BYTES);
    setItems((prev) => {
      const room = MAX_ATTACHMENTS - prev.length;
      if (ok.length > room) setError(`You can add up to ${MAX_ATTACHMENTS} photos or files per post.`);
      return [
        ...prev,
        ...ok.slice(0, Math.max(0, room)).map((file) => ({
          id: crypto.randomUUID(),
          file,
          preview: isImage(file.type) || isVideo(file.type) ? URL.createObjectURL(file) : null,
        })),
      ];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const gone = prev.find((i) => i.id === id);
      if (gone?.preview) URL.revokeObjectURL(gone.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    itemsRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
    setItems([]);
    setError(null);
  }, []);

  // Resize photos, upload everything, and return attachment records in order.
  const upload = useCallback(async (folder: string): Promise<Attachment[]> => {
    const list = itemsRef.current;
    const out: Attachment[] = [];
    for (let i = 0; i < list.length; i++) {
      setProgress(list.length > 1 ? `Uploading ${i + 1} of ${list.length}…` : "Uploading…");
      const prepared = await prepareFile(list[i].file);
      out.push(await uploadCommunityFile(prepared, folder));
    }
    setProgress(null);
    return out;
  }, []);

  return { items, add, remove, clear, upload, error, setError, progress };
}

export type MediaDraft = ReturnType<typeof useMediaDraft>;

export function AttachButton({ draft, children, className, accept = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" }: { draft: MediaDraft; children?: ReactNode; className?: string; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        multiple
        hidden
        accept={accept}
        onChange={(e) => {
          if (e.target.files?.length) draft.add(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn("inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[13px] font-semibold text-[#1F315B] transition hover:bg-[#1F315B]/[0.06]", className)}
      >
        {children ?? (
          <>
            <ImagePlus className="h-4 w-4 text-[#A8873F]" /> Photo / video
          </>
        )}
      </button>
    </>
  );
}

// Paste screenshots straight into a text box.
export function pasteInto(draft: MediaDraft) {
  return (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files ?? []);
    if (files.length) {
      e.preventDefault();
      draft.add(files);
    }
  };
}

export function DraftStrip({ draft, size = 84 }: { draft: MediaDraft; size?: number }) {
  if (!draft.items.length && !draft.error) return null;
  return (
    <div className="space-y-2">
      {draft.items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {draft.items.map((i) => (
            <div key={i.id} className="relative shrink-0 overflow-hidden rounded-xl border border-[#E9E2D3] bg-[#F3EEE3]" style={{ width: size, height: size }}>
              {i.preview && isImage(i.file.type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.preview} alt={i.file.name} className="h-full w-full object-cover" />
              ) : i.preview && isVideo(i.file.type) ? (
                <>
                  <video src={i.preview} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-black/50 p-1.5">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </span>
                  </span>
                </>
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 p-1.5 text-center">
                  <FileText className="h-5 w-5 text-[#A8873F]" />
                  <span className="line-clamp-2 break-all text-[10px] leading-tight text-[#1F315B]">{i.file.name}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => draft.remove(i.id)}
                aria-label={`Remove ${i.file.name}`}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {draft.error && <p className="rounded-lg bg-[#FBF3DF] px-3 py-2 text-[13px] text-[#7A5E1F]">{draft.error}</p>}
    </div>
  );
}

// ─── Display ───────────────────────────────────────────────────────────────

function Thumb({ a, className, onClick, overlay }: { a: Attachment; className?: string; onClick: () => void; overlay?: ReactNode }) {
  const url = useFileUrl(a.path || a.url);
  return (
    <button type="button" onClick={onClick} className={cn("group relative block overflow-hidden bg-[#F0EBE0]", className)} aria-label={`Open ${a.name}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={a.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
      ) : (
        <span className="block h-full w-full animate-pulse" />
      )}
      {overlay}
    </button>
  );
}

export function VideoPlayer({ a, className }: { a: Attachment; className?: string }) {
  const url = useFileUrl(a.path || a.url);
  if (!url) return <div className={cn("aspect-video animate-pulse rounded-xl bg-[#1F315B]/10", className)} />;
  return (
    <video
      src={url}
      controls
      playsInline
      preload="metadata"
      className={cn("max-h-[520px] w-full rounded-xl bg-black", className)}
    />
  );
}

function FileRow({ a }: { a: Attachment }) {
  const url = useFileUrl(a.path || a.url);
  return (
    <a
      href={url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-[#E9E2D3] bg-[#FBF9F5] px-3 py-2.5 text-[14px] hover:border-[#D4AF63]"
    >
      <FileText className="h-5 w-5 shrink-0 text-[#A8873F]" />
      <span className="min-w-0 flex-1 truncate font-medium text-[#1F315B]">{a.name}</span>
      <span className="text-[12px] text-[#8A8FA0]">{fileSize(a.size)}</span>
    </a>
  );
}

// Facebook-style photo layout: 1 large, 2 side by side, 3 as one tall + two,
// 4+ as a 2×2 grid with "+N" on the last tile. Tap opens the full-screen viewer.
export function MediaGallery({ items, compact }: { items: Attachment[]; compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!items?.length) return null;
  const images = items.filter((a) => isImage(a.type));
  const videos = items.filter((a) => isVideo(a.type));
  const files = items.filter((a) => !isImage(a.type) && !isVideo(a.type));
  const shown = images.slice(0, 4);
  const extra = images.length - shown.length;
  const h = compact ? "h-[180px]" : "h-[300px] sm:h-[380px]";

  return (
    <div className={cn("space-y-2", compact ? "mt-2" : "mt-3")}>
      {images.length === 1 && (
        <Thumb a={images[0]} onClick={() => setOpen(0)} className={cn("w-full rounded-xl", compact ? "max-h-[260px]" : "max-h-[520px]", "[&_img]:max-h-[520px] [&_img]:object-contain [&_img]:bg-[#F0EBE0]")} />
      )}
      {images.length === 2 && (
        <div className={cn("grid grid-cols-2 gap-1 overflow-hidden rounded-xl", h)}>
          {shown.map((a, i) => (
            <Thumb key={i} a={a} onClick={() => setOpen(i)} className="h-full" />
          ))}
        </div>
      )}
      {images.length === 3 && (
        <div className={cn("grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl", h)}>
          <Thumb a={shown[0]} onClick={() => setOpen(0)} className="row-span-2 h-full" />
          <Thumb a={shown[1]} onClick={() => setOpen(1)} className="h-full" />
          <Thumb a={shown[2]} onClick={() => setOpen(2)} className="h-full" />
        </div>
      )}
      {images.length >= 4 && (
        <div className={cn("grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl", h)}>
          {shown.map((a, i) => (
            <Thumb
              key={i}
              a={a}
              onClick={() => setOpen(i)}
              className="h-full"
              overlay={
                i === 3 && extra > 0 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-[#0F1A38]/55 font-display text-[34px] font-semibold text-white">+{extra}</span>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
      {videos.map((a, i) => (
        <VideoPlayer key={i} a={a} />
      ))}
      {files.map((a, i) => (
        <FileRow key={i} a={a} />
      ))}
      {open !== null && <Lightbox images={images} start={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function LightboxImage({ a }: { a: Attachment }) {
  const url = useFileUrl(a.path || a.url);
  if (!url) return <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={a.name} className="max-h-full max-w-full select-none object-contain" draggable={false} />;
}

export function Lightbox({ images, start, onClose }: { images: Attachment[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const prev = useCallback(() => setI((n) => (n - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setI((n) => (n + 1) % images.length), [images.length]);
  const current = images[i];
  const url = useFileUrl(current?.path || current?.url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, prev, next]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[100] flex flex-col bg-[#0B1226]/95"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dy) > 90 && Math.abs(dy) > Math.abs(dx)) onClose();
        else if (dx > 50) prev();
        else if (dx < -50) next();
      }}
    >
      <div className="flex items-center justify-between px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] text-white/85">
        <span className="text-[13.5px] font-semibold">{images.length > 1 ? `${i + 1} / ${images.length}` : ""}</span>
        <span className="flex items-center gap-1">
          {url && (
            <a href={url} download={current.name} target="_blank" rel="noopener noreferrer" aria-label="Open original" className="rounded-full p-2 hover:bg-white/10">
              <Download className="h-5 w-5" />
            </a>
          )}
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-white/10">
            <X className="h-6 w-6" />
          </button>
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {current && <LightboxImage key={i} a={current} />}
        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous photo" className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:block">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={next} aria-label="Next photo" className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:block">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {images.map((_, n) => (
            <button key={n} onClick={() => setI(n)} aria-label={`Photo ${n + 1}`} className={cn("h-1.5 rounded-full transition-all", n === i ? "w-5 bg-[#D4AF63]" : "w-1.5 bg-white/40")} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LinkEmbed({ text }: { text: string }) {
  const embed = embedFor(text);
  if (!embed) return null;
  return (
    <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-black">
      <iframe
        src={embed.src}
        title={`${embed.provider} video`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
