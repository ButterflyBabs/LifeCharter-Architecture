"use client";

// Search the Collective's posts and replies. Results come from
// /api/community/search, which only ever returns content from channels the
// signed-in member can open.
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { MessageCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/community/format";
import { Avatar, Spinner } from "./ui";
import { SpaceLogo } from "./SpaceBranding";

interface Result {
  kind: "post" | "reply";
  id: string;
  postId: string;
  postTitle: string | null;
  snippet: string;
  channel: { slug: string; name: string; emoji: string | null; logo: string | null };
  pathway: { slug: string; name: string };
  author: { id: string; name: string; avatar: string | null };
  createdAt: string;
  href: string;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Bold the words the member searched for (plain React text — never HTML).
function Highlight({ text, q }: { text: string; q: string }) {
  const terms = q
    .split(/\s+/)
    .map((t) => t.replace(/^["-]+|"+$/g, ""))
    .filter((t) => t.length >= 2);
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map(escapeRe).join("|")})`, "gi");
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-[#D4AF63]/30 px-0.5 font-semibold text-[var(--cm-ink)]">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

export function CollectiveSearch({ className }: { className?: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const term = q.trim();

  // Debounced fetch; a newer keystroke cancels the older request.
  useEffect(() => {
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/community/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal, cache: "no-store" });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(out.error || "Search didn't work — please try again.");
        setResults((out.results as Result[]) ?? []);
        setError(null);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Search didn't work — please try again.");
        setResults(null);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);

  // Close when tapping outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const showPanel = open && term.length >= 2;

  return (
    <div ref={box} className={cn("relative", className)}>
      <label className="sr-only" htmlFor="cm-search">
        Search posts and replies
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--cm-muted)]" aria-hidden />
        <input
          id="cm-search"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Search posts and replies"
          className="w-full rounded-2xl border border-[var(--cm-line)] bg-[var(--cm-surface)] py-3 pl-10 pr-10 text-[15px] text-[var(--cm-ink)] shadow-[0_1px_2px_rgba(31,43,58,0.06),0_12px_28px_-16px_rgba(31,43,58,0.28)] outline-none transition placeholder:text-[var(--cm-faint)] focus:border-[#D4AF63] focus:ring-[3px] focus:ring-[#D4AF63]/20 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--cm-muted)] hover:bg-[var(--cm-ink-tint)] hover:text-[var(--cm-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showPanel && (
        <div
          role="region"
          aria-live="polite"
          aria-label="Search results"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--cm-line)] bg-[var(--cm-surface)] p-2 shadow-[0_2px_4px_rgba(31,43,58,0.06),0_24px_48px_-20px_rgba(31,43,58,0.45)]"
        >
          {loading && !results && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}
          {error && <p className="px-3 py-4 text-[14px] text-red-700">{error}</p>}
          {results && results.length === 0 && !loading && (
            <p className="px-3 py-5 text-center text-[14px] text-[var(--cm-muted-2)]">
              Nothing found for &ldquo;{term}&rdquo; in the channels you&rsquo;re in.
            </p>
          )}
          {results && results.length > 0 && (
            <ul className={cn("space-y-1", loading && "opacity-70")}>
              {results.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link href={r.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 transition hover:bg-[var(--cm-fill)] focus:bg-[var(--cm-fill)] focus:outline-none">
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[var(--cm-gold-text)]">
                      <SpaceLogo space={{ logo_url: r.channel.logo, emoji: r.channel.emoji, name: r.channel.name }} size={14} />
                      <span>{r.channel.name}</span>
                      <span aria-hidden>·</span>
                      <span className="normal-case tracking-normal">{r.pathway.name}</span>
                    </p>
                    {r.kind === "reply" ? (
                      <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-[var(--cm-muted-2)]">
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">Reply on {r.postTitle ? <>&ldquo;{r.postTitle}&rdquo;</> : "a post"}</span>
                      </p>
                    ) : (
                      r.postTitle && (
                        <p className="mt-0.5 font-semibold text-[var(--cm-ink)]">
                          <Highlight text={r.postTitle} q={term} />
                        </p>
                      )
                    )}
                    {r.snippet && (
                      <p className="mt-0.5 line-clamp-3 break-words text-[14px] leading-snug text-[var(--cm-body)]">
                        <Highlight text={r.snippet} q={term} />
                      </p>
                    )}
                    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--cm-muted)]">
                      <Avatar name={r.author.name} url={r.author.avatar} size={18} className="ring-0" />
                      <span className="truncate">{r.author.name}</span>
                      <span aria-hidden>·</span>
                      <time dateTime={r.createdAt} title={new Date(r.createdAt).toLocaleString()}>
                        {timeAgo(r.createdAt)}
                      </time>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
