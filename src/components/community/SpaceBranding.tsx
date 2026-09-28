"use client";

// Channel branding for the Collective: a wide cover image and a square logo
// per channel (cm_spaces.cover_url / logo_url). Files live in the private
// "community" bucket under spaces/<channel id>/ — only that channel's admins,
// moderators and Collective admins can upload there.
import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { prepareFile } from "@/lib/community/media";
import { uploadCommunityFile, useFileUrl } from "@/lib/community/storage";
import type { Space } from "@/lib/community/types";
import { Button, ErrorNote, Label } from "./ui";

const MAX_BRAND_BYTES = 10 * 1024 * 1024;

// The channel's logo, falling back to its emoji.
export function SpaceLogo({
  space,
  size = 20,
  className,
  emojiClassName,
}: {
  space: Pick<Space, "logo_url" | "emoji" | "name">;
  size?: number;
  className?: string;
  emojiClassName?: string;
}) {
  const src = useFileUrl(space.logo_url);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn("inline-block shrink-0 rounded-[22%] object-cover align-middle", className)}
      />
    );
  }
  return <span className={emojiClassName}>{space.emoji}</span>;
}

// Wide banner at the top of a channel. Renders nothing without a cover.
export function SpaceCover({ space, className }: { space: Pick<Space, "cover_url">; className?: string }) {
  const src = useFileUrl(space.cover_url);
  if (!space.cover_url) return null;
  return (
    <div
      className={cn(
        "relative aspect-[3/1] w-full overflow-hidden rounded-2xl border border-[var(--cm-line)] bg-[var(--cm-fill-2)] shadow-[0_1px_2px_rgba(31,43,58,0.06),0_12px_28px_-16px_rgba(31,43,58,0.28)]",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="h-full w-full object-cover" />}
    </div>
  );
}

// Upload / replace / remove the cover and logo. Used in the admin console and
// on the Channel admin page for channel admins and moderators.
export function SpaceBrandingEditor({ space }: { space: Space }) {
  const { supabase, refresh } = useCommunity();
  const [cover, setCover] = useState(space.cover_url);
  const [logo, setLogo] = useState(space.logo_url);
  const [busy, setBusy] = useState<"cover" | "logo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverSrc = useFileUrl(cover);
  const logoSrc = useFileUrl(logo);

  async function save(kind: "cover" | "logo", file: File | null) {
    setError(null);
    if (file && !file.type.startsWith("image/")) return setError("Please choose an image (JPG, PNG, WebP or GIF).");
    if (file && file.type === "image/svg+xml") return setError("SVG images aren't supported — please use JPG, PNG or WebP.");
    setBusy(kind);
    try {
      let path: string | null = null;
      if (file) {
        const ready = await prepareFile(file);
        if (ready.size > MAX_BRAND_BYTES) throw new Error("That image is over 10 MB — please choose a smaller one.");
        path = (await uploadCommunityFile(ready, `spaces/${space.id}`)).path ?? null;
      }
      const column = kind === "cover" ? "cover_url" : "logo_url";
      const { error } = await supabase.from("cm_spaces").update({ [column]: path }).eq("id", space.id);
      if (error) throw new Error(error.message);
      // Tidy up the image it replaced (only ever this channel's own folder).
      const old = kind === "cover" ? cover : logo;
      if (old && old.startsWith(`spaces/${space.id}/`)) void supabase.storage.from("community").remove([old]);
      if (kind === "cover") setCover(path);
      else setLogo(path);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that image.");
    } finally {
      setBusy(null);
    }
  }

  function picker(kind: "cover" | "logo", ref: React.RefObject<HTMLInputElement>) {
    return (
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = "";
          if (f) void save(kind, f);
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Cover image</Label>
        <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl border border-dashed border-[var(--cm-line-strong)] bg-[var(--cm-fill-2)]">
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-[13px] text-[var(--cm-muted)]">
              Wide banner, about 1500 × 500
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => coverInput.current?.click()}>
            <ImagePlus className="h-4 w-4" /> {busy === "cover" ? "Uploading…" : cover ? "Replace cover" : "Upload cover"}
          </Button>
          {cover && (
            <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => void save("cover", null)}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          )}
        </div>
        {picker("cover", coverInput)}
      </div>

      <div>
        <Label>Logo</Label>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--cm-line-strong)] bg-[var(--cm-fill-2)] text-[26px]">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden>{space.emoji}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => logoInput.current?.click()}>
              <ImagePlus className="h-4 w-4" /> {busy === "logo" ? "Uploading…" : logo ? "Replace logo" : "Upload logo"}
            </Button>
            {logo && (
              <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => void save("logo", null)}>
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-[12px] text-[var(--cm-muted)]">Square works best. Shown next to the channel name; the emoji is used when there&rsquo;s no logo.</p>
        {picker("logo", logoInput)}
      </div>
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}
