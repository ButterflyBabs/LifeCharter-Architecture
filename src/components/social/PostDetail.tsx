"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import {
  captionOf, findBrackets, fmtDate, INVITE_LABELS, platformDef, replaceBracket, splitSections,
  type Offer, type PlannedPost, type PlatformDef,
} from "@/lib/social/planner";
import { CopyButton, PlatformChip, StatusSelect, cx } from "./ui";

// Text with [brackets] highlighted so the fill-ins stand out.
function Highlighted({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const b of findBrackets(text)) {
    parts.push(text.slice(last, b.start));
    parts.push(
      <mark key={b.start} className="rounded bg-[#D4AF63]/25 px-0.5 text-inherit dark:bg-[#D4AF63]/30">
        [{b.text}]
      </mark>
    );
    last = b.end;
  }
  parts.push(text.slice(last));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}

function FillIns({ notes, onFill }: { notes: string; onFill: (next: string) => void }) {
  const brackets = findBrackets(notes);
  const [values, setValues] = useState<Record<number, string>>({});
  useEffect(() => setValues({}), [notes]);
  if (!brackets.length) return null;
  return (
    <div className={`${cx.card} !p-4 space-y-3`}>
      <div>
        <p className={cx.h3}>Fill in the blanks</p>
        <p className={cx.muted}>
          {brackets.length} {brackets.length === 1 ? "spot needs" : "spots need"} your own words. What you type replaces the [bracket] in the post.
        </p>
      </div>
      {brackets.map((b) => {
        const before = notes.slice(Math.max(0, b.start - 50), b.start).split("\n").pop() || "";
        const after = notes.slice(b.end, b.end + 40).split("\n")[0] || "";
        const long = /^paste|script|story|example/i.test(b.text);
        const v = values[b.index] ?? "";
        return (
          <div key={`${b.index}-${b.start}`} className="space-y-1.5">
            <p className="text-xs text-[#475569] dark:text-[#CBD5E1]">
              …{before}
              <mark className="rounded bg-[#D4AF63]/25 px-0.5 text-inherit">[{b.text}]</mark>
              {after}…
            </p>
            <div className="flex gap-2 items-start">
              {long ? (
                <textarea rows={4} className={cx.input} value={v} placeholder={b.text} aria-label={`Fill in: ${b.text}`} onChange={(e) => setValues({ ...values, [b.index]: e.target.value })} />
              ) : (
                <input className={cx.input} value={v} placeholder={b.text} aria-label={`Fill in: ${b.text}`} onChange={(e) => setValues({ ...values, [b.index]: e.target.value })} />
              )}
              <button type="button" disabled={!v.trim()} className={`${cx.btn} ${cx.primary} shrink-0`} onClick={() => onFill(replaceBracket(notes, b, v))}>
                Fill
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface PostFormValue {
  title: string;
  platform: string;
  format: string;
  date: string;
  notes: string;
  imagePrompt: string;
  link: string;
  series: string;
  offerKey: string | null;
}

export function PostForm({
  initial, platforms, offers, onSave, onCancel, saveLabel,
}: {
  initial: PostFormValue;
  platforms: PlatformDef[];
  offers: Offer[];
  onSave: (v: PostFormValue) => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  const [v, setV] = useState(initial);
  const p = platformDef(v.platform);
  const formats = p.formats.includes(v.format) || !v.format ? p.formats : [v.format, ...p.formats];
  const set = (k: keyof PostFormValue, val: string | null) => setV((x) => ({ ...x, [k]: val }));
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v);
      }}
    >
      <label className="block">
        <span className={cx.label}>Title or hook</span>
        <input className={cx.input} value={v.title} required onChange={(e) => set("title", e.target.value)} placeholder="e.g. Three questions for a fresh start" />
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="block">
          <span className={cx.label}>Platform</span>
          <select
            className={cx.input}
            value={v.platform}
            onChange={(e) => setV((x) => ({ ...x, platform: e.target.value, format: platformDef(e.target.value).formats[0] }))}
          >
            {platforms.map((x) => (
              <option key={x.id} value={x.id}>{x.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={cx.label}>Format</span>
          <select className={cx.input} value={v.format} onChange={(e) => set("format", e.target.value)}>
            {formats.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={cx.label}>Date</span>
          <input type="date" className={cx.input} value={v.date} required onChange={(e) => set("date", e.target.value)} />
        </label>
        <label className="block">
          <span className={cx.label}>Points to offer</span>
          <select className={cx.input} value={v.offerKey || ""} onChange={(e) => set("offerKey", e.target.value || null)}>
            <option value="">None (give-only)</option>
            {offers.map((o) => (
              <option key={o.key} value={o.key}>{o.name}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className={cx.label}>Captions and notes</span>
        <textarea rows={12} className={`${cx.input} font-mono text-[13px]`} value={v.notes} onChange={(e) => set("notes", e.target.value)} placeholder={"CAPTION\nWrite the caption here.\n\nSTORY\nFrame 1: …"} />
        <span className={cx.muted}>Lines in CAPITALS (CAPTION, SCRIPT, FIRST COMMENT…) become sections with their own Copy button. Use [brackets] for anything you&rsquo;ll fill in later.</span>
      </label>
      <label className="block">
        <span className={cx.label}>Graphic prompt for ChatGPT</span>
        <textarea rows={5} className={cx.input} value={v.imagePrompt} onChange={(e) => set("imagePrompt", e.target.value)} placeholder="Paste into ChatGPT to create the image or slides" />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={cx.label}>Series</span>
          <input className={cx.input} value={v.series} onChange={(e) => set("series", e.target.value)} />
        </label>
        <label className="block">
          <span className={cx.label}>Link (after posting)</span>
          <input className={cx.input} value={v.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" />
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className={`${cx.btn} ${cx.ghost}`} onClick={onCancel}>Cancel</button>
        <button type="submit" className={`${cx.btn} ${cx.primary}`}>{saveLabel}</button>
      </div>
    </form>
  );
}

export function PostDetail({
  post, platforms, offers, onSave, onDelete, onClose,
}: {
  post: PlannedPost;
  platforms: PlatformDef[];
  offers: Offer[];
  onSave: (patch: Partial<PlannedPost>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sections = useMemo(() => splitSections(post.notes), [post.notes]);
  const caption = useMemo(() => captionOf(post.notes), [post.notes]);
  const offer = offers.find((o) => o.key === post.offerKey);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F1A38]/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={post.title || "Post"}
        className="h-full w-full max-w-2xl overflow-y-auto bg-[#FAF8F3] dark:bg-[#0E162A] p-5 sm:p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PlatformChip id={post.platform} />
              <span className="text-xs text-[#475569] dark:text-[#CBD5E1]">{post.format}</span>
              <span className="text-xs text-[#475569] dark:text-[#CBD5E1]">· {fmtDate(post.date, { weekday: "long", month: "long", day: "numeric" })}</span>
              {post.inviteLevel && (
                <span className="rounded-full border border-[#D4AF63]/60 px-2 py-0.5 text-[11px] text-[#5b4716] dark:text-[#E9D7A9]">{INVITE_LABELS[post.inviteLevel]}</span>
              )}
            </div>
            <h2 className={cx.h2}>{post.title || "Untitled"}</h2>
            {(post.series || offer) && (
              <p className={cx.muted}>
                {post.series && <>Part of {post.series}</>}
                {post.series && offer && " · "}
                {offer && <>Points to {offer.name}</>}
              </p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-[#0F1A38]/5">
            <X className="h-5 w-5 text-[#64748B]" />
          </button>
        </div>

        {editing ? (
          <PostForm
            initial={{ ...post, offerKey: post.offerKey }}
            platforms={platforms}
            offers={offers}
            saveLabel="Save"
            onCancel={() => setEditing(false)}
            onSave={(v) => {
              onSave(v);
              setEditing(false);
            }}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusSelect value={post.status} onChange={(status) => onSave({ status })} />
              {caption && <CopyButton text={caption} label="Copy caption" variant="primary" />}
              {post.imagePrompt && <CopyButton text={post.imagePrompt} label="Copy graphic prompt" />}
              <button className={`${cx.btn} ${cx.ghost}`} onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            <FillIns notes={post.notes} onFill={(notes) => onSave({ notes })} />

            {sections.length === 0 && <p className={cx.muted}>No captions or notes yet. Use Edit to write them.</p>}
            {sections.map((s, i) => (
              <section key={i} className={`${cx.card} !p-4`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className={cx.eyebrow}>{s.heading || "Notes"}</p>
                  {s.body && <CopyButton text={s.body} variant="ghost" />}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1f2a44] dark:text-[#E2E8F0]">
                  <Highlighted text={s.body} />
                </p>
              </section>
            ))}

            {post.imagePrompt && (
              <section className={`${cx.card} !p-4`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className={cx.eyebrow}>Graphic prompt for ChatGPT</p>
                  <CopyButton text={post.imagePrompt} variant="ghost" />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1f2a44] dark:text-[#E2E8F0]">{post.imagePrompt}</p>
              </section>
            )}

            <label className="block">
              <span className={cx.label}>Link (after posting)</span>
              <input
                className={cx.input}
                defaultValue={post.link}
                placeholder="https://"
                onBlur={(e) => e.target.value !== post.link && onSave({ link: e.target.value })}
              />
            </label>

            <div className="pt-2">
              {confirmDelete ? (
                <div className="flex gap-2">
                  <button className={`${cx.btn} ${cx.danger}`} onClick={onDelete}>Yes, delete this post</button>
                  <button className={`${cx.btn} ${cx.ghost}`} onClick={() => setConfirmDelete(false)}>Keep it</button>
                </div>
              ) : (
                <button className={`${cx.btn} ${cx.danger}`} onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
