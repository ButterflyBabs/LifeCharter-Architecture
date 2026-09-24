"use client";

// Small UI kit for the Collective (Sept 2026 Collective board): ivory page,
// dusk ink, warm gold accents, EB Garamond headings, lifted white cards.
import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials, linkify } from "@/lib/community/format";
import { useFileUrl } from "@/lib/community/storage";
import { splitMentions } from "@/lib/community/mentions";
import Link from "next/link";

export const INK = "#1F2B3A";

export function Card({
  className,
  children,
  as: Tag = "div",
  style,
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
  style?: React.CSSProperties;
}) {
  return (
    <Tag
      style={style}
      className={cn(
        "rounded-2xl border border-[var(--cm-line)] bg-[var(--cm-surface)] shadow-[0_1px_2px_rgba(31,43,58,0.06),0_12px_28px_-16px_rgba(31,43,58,0.28)]",
        className
      )}
    >
      {children}
    </Tag>
  );
}

type ButtonVariant = "gold" | "navy" | "ghost" | "outline" | "danger";
const BUTTON: Record<ButtonVariant, string> = {
  gold: "bg-gradient-to-br from-[#E9D7A9] via-[#D4AF63] to-[#B8923F] text-[#1F2B3A] shadow-[0_10px_22px_-12px_rgba(184,146,63,0.9)] hover:brightness-105",
  navy: "bg-[var(--cm-navy)] text-[#FAF8F3] hover:bg-[#16202C]",
  ghost: "text-[var(--cm-ink)] hover:bg-[var(--cm-ink-tint)]",
  outline: "border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] text-[var(--cm-ink)] hover:border-[#D4AF63] hover:bg-[var(--cm-fill)]",
  danger: "border border-red-200 bg-[var(--cm-surface)] text-red-700 hover:bg-red-50",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" }>(
  function Button({ variant = "navy", size = "md", className, ...props }, ref) {
    return (
      <button
        ref={ref}
        {...props}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold tracking-[0.01em] transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#D4AF63]/45 disabled:cursor-not-allowed disabled:opacity-60",
          size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-[14px]",
          BUTTON[variant],
          className
        )}
      />
    );
  }
);

export const inputClass =
  "w-full rounded-xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-3.5 py-2.5 text-[15px] text-[var(--cm-ink)] outline-none transition placeholder:text-[var(--cm-faint)] focus:border-[#D4AF63] focus:ring-[3px] focus:ring-[#D4AF63]/20";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} {...props} className={cn(inputClass, className)} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className, ...props }, ref) {
  return <textarea ref={ref} {...props} className={cn(inputClass, "min-h-[96px] resize-y leading-relaxed", className)} />;
});

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cm-muted-2)]">
      {children}
    </label>
  );
}

export function Avatar({ name, url, size = 40, className }: { name?: string | null; url?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.38)) };
  const src = useFileUrl(url);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={style} className={cn("shrink-0 rounded-full object-cover ring-2 ring-[var(--cm-surface)]", className)} />;
  }
  return (
    <span
      style={style}
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F5D8CF] via-[#D4AF63] to-[#94A3B8] font-semibold text-[#1F2B3A] ring-2 ring-[var(--cm-surface)]",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

export function Heading({ children, className, sub }: { children: ReactNode; className?: string; sub?: ReactNode }) {
  return (
    <div className={cn("mb-5", className)}>
      <h1 className="font-editorial text-[30px] font-semibold leading-tight text-[var(--cm-ink)] md:text-[34px]">{children}</h1>
      {sub && <p className="mt-1 text-[14.5px] text-[var(--cm-muted-2)]">{sub}</p>}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cm-gold-text)]", className)}>{children}</p>;
}

export function Badge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "navy" | "gray" | "green" }) {
  const tones = {
    gold: "bg-[var(--cm-gold-soft)] text-[var(--cm-gold-ink)]",
    navy: "bg-[var(--cm-ink-tint)] text-[var(--cm-ink)]",
    gray: "bg-[var(--cm-fill-2)] text-[var(--cm-muted-2)]",
    green: "bg-emerald-50 text-emerald-700",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", tones[tone])}>{children}</span>;
}

export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[var(--cm-body)]", className)}>
      {splitMentions(text).map((part, j) =>
        part.mention ? (
          <Link
            key={`m${j}`}
            href={`/community/members/${part.mention.id}`}
            className="rounded bg-[var(--cm-ink-tint)] px-0.5 font-semibold text-[var(--cm-ink)] hover:bg-[#D4AF63]/25"
          >
            {part.text}
          </Link>
        ) : (
          linkify(part.text).map((seg, i) =>
            seg.href ? (
              <a key={`${j}-${i}`} href={seg.href} target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--cm-link)] underline decoration-[var(--cm-link)] underline-offset-2 hover:decoration-[var(--cm-link)]">
                {seg.text}
              </a>
            ) : (
              <span key={`${j}-${i}`}>{seg.text}</span>
            )
          )
        )
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#D4AF63]/30 border-t-[#D4AF63]", className)}
    />
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-6 py-10 text-center">
      {icon && <div className="mb-2 text-3xl">{icon}</div>}
      <p className="font-editorial text-[20px] font-semibold text-[var(--cm-ink)]">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-[14px] text-[var(--cm-muted-2)]">{children}</div>}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] text-red-700">{children}</p>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#1F2B3A]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-[var(--cm-fill)] p-5 shadow-2xl sm:rounded-2xl sm:p-6",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-editorial text-[24px] font-semibold text-[var(--cm-ink)]">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[var(--cm-muted-2)] hover:bg-black/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// The small gold Collective Plus mark next to a member's name.
export function PlusMark({ className }: { className?: string }) {
  return (
    <span
      title="Collective Plus member"
      className={cn("inline-flex items-center rounded-full bg-gradient-to-br from-[#E9D7A9] to-[#B8923F] px-1.5 py-px align-middle text-[10px] font-bold uppercase tracking-[0.08em] text-[#1F2B3A]", className)}
    >
      Plus
    </span>
  );
}
