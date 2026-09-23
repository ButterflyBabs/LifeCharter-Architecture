"use client";

// A text box that suggests members as you type "@". Picking one inserts
// "@Their Name"; the parent turns those into stored mentions on save with
// `mentions.encode(text)`.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { decodeMentions, encodeMentions } from "@/lib/community/mentions";
import { Avatar, TextArea } from "./ui";

interface Suggestion {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
}

export function useMentions(initialStored = "") {
  const picked = useRef<Map<string, string>>(decodeMentions(initialStored).picked);
  return {
    picked,
    add: (name: string, id: string) => picked.current.set(name, id),
    encode: (text: string) => encodeMentions(text, picked.current),
    reset: () => picked.current.clear(),
  };
}
export type Mentions = ReturnType<typeof useMentions>;

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (v: string) => void;
  mentions: Mentions;
};

export const MentionTextArea = forwardRef<HTMLTextAreaElement, Props>(function MentionTextArea(
  { value, onValueChange, mentions, onKeyDown, className, ...rest },
  ref
) {
  const { supabase, userId, blockedIds } = useCommunity();
  const box = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => box.current as HTMLTextAreaElement);
  const [query, setQuery] = useState<string | null>(null);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(0);

  // Find an "@word" right before the cursor.
  const detect = useCallback((text: string, caret: number) => {
    const before = text.slice(0, caret);
    const m = before.match(/(^|\s)@([^\s@]{0,30})$/);
    setQuery(m ? m[2] : null);
  }, []);

  useEffect(() => {
    if (query === null) return setItems([]);
    const t = setTimeout(async () => {
      let q = supabase.from("cm_profiles").select("user_id, display_name, avatar_url, headline").eq("status", "active").order("display_name").limit(6);
      if (query) q = q.ilike("display_name", `%${query.replace(/[%_,()]/g, "")}%`);
      const { data } = await q;
      setItems(((data as Suggestion[]) ?? []).filter((p) => p.user_id !== userId && !blockedIds.has(p.user_id)));
      setActive(0);
    }, 150);
    return () => clearTimeout(t);
  }, [query, supabase, userId, blockedIds]);

  function pick(p: Suggestion) {
    const el = box.current;
    if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@([^\s@]{0,30})$/, `@${p.display_name} `);
    const next = before + value.slice(caret);
    mentions.add(p.display_name, p.user_id);
    onValueChange(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(before.length, before.length);
    });
  }

  const open = query !== null && items.length > 0;

  return (
    <div className="relative">
      <TextArea
        ref={box}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          detect(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onClick={(e) => detect(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
        onBlur={() => setTimeout(() => setQuery(null), 150)}
        onKeyDown={(e) => {
          if (open) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              return setActive((a) => (a + 1) % items.length);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              return setActive((a) => (a - 1 + items.length) % items.length);
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              return pick(items[active]);
            }
            if (e.key === "Escape") {
              e.preventDefault();
              return setQuery(null);
            }
          }
          onKeyDown?.(e);
        }}
        aria-autocomplete="list"
        aria-expanded={open}
        className={className}
        {...rest}
      />
      {open && (
        <ul role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-[var(--cm-line)] bg-[var(--cm-surface)] py-1 shadow-lg">
          {items.map((p, i) => (
            <li key={p.user_id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
                className={cn("flex w-full items-center gap-2.5 px-3 py-2 text-left", i === active ? "bg-[var(--cm-fill-2)]" : "hover:bg-[var(--cm-fill)]")}
              >
                <Avatar name={p.display_name} url={p.avatar_url} size={28} />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-[var(--cm-ink)]">{p.display_name}</span>
                  {p.headline && <span className="block truncate text-[12px] text-[var(--cm-muted)]">{p.headline}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
