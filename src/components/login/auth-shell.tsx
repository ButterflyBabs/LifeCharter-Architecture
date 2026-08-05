"use client";

// Branded full-screen shell for auth pages (forgot / reset password), matching
// the login's brand-board look. Single centered card.
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const PAGE_BG: React.CSSProperties = {
  background: `
    radial-gradient(1200px 800px at 15% -10%, rgba(94,59,108,0.55), transparent 60%),
    radial-gradient(1100px 900px at 100% 110%, rgba(46,124,131,0.45), transparent 55%),
    radial-gradient(900px 700px at 85% 0%, rgba(31,49,91,0.7), transparent 60%),
    linear-gradient(160deg, #16244a 0%, #1F315B 45%, #0f1a38 100%)`,
};

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main
      style={PAGE_BG}
      className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden px-5 py-10 font-ui text-brand-ivory"
    >
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[22px] bg-gradient-to-b from-brand-indigo-deep/70 to-brand-indigo-dark/80 px-10 py-12 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.65)] ring-1 ring-brand-gold/35 backdrop-blur-sm md:px-12">
        <div className="pointer-events-none absolute inset-[14px] rounded-xl border border-brand-gold/30" />

        <div className="relative">
          <Image
            src="/lifecharter-command-suite-logo.png"
            alt="LifeCharter Command Suite"
            width={1390}
            height={371}
            priority
            className="mx-auto mb-6 w-[72%] max-w-[260px] drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
          />
          <h1 className="text-center font-display text-[24px] font-medium text-brand-ivory">{title}</h1>
          {subtitle && (
            <p className="mb-7 mt-1 text-center text-[12.5px] leading-relaxed tracking-[0.03em] text-brand-taupe">
              {subtitle}
            </p>
          )}
          {children}
          <p className="mt-7 text-center text-[12px] text-brand-taupe">
            <Link
              href="/login"
              className="border-b border-brand-gold/40 text-brand-lavender transition hover:text-brand-gold-soft"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

// Shared field + button styles so the forms match the login exactly.
export const authInputClass =
  "w-full rounded-[10px] border border-brand-gold/30 bg-white/[0.04] px-4 py-3.5 text-[15px] tracking-[0.02em] text-brand-ivory outline-none transition placeholder:text-brand-taupe/55 focus:border-brand-gold focus:bg-white/[0.06] focus:ring-[3px] focus:ring-brand-gold/15";
export const authLabelClass =
  "mb-2 block text-[10.5px] font-medium uppercase tracking-[0.2em] text-brand-lavender";
export const authButtonClass =
  "mt-2 w-full rounded-[10px] bg-gradient-to-br from-brand-gold-soft via-brand-gold to-[#b8923f] py-[15px] text-[12.5px] font-semibold uppercase tracking-[0.28em] text-brand-indigo-dark shadow-[0_12px_28px_-12px_rgba(212,175,99,0.7)] transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70";
