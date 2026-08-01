"use client";

// The full two-panel login UI. Left: rotating quotes. Right: sign-in form
// wired to Supabase Auth (the app's existing browser client).
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QuoteCarousel } from "./quote-carousel";

// Where users land after a successful sign-in (the app home).
const POST_LOGIN_ROUTE = "/";
// SSO is not configured for Supabase Auth yet (the Google integration is a
// separate connector). Hide the SSO button until an OAuth provider is enabled.
const SSO_ENABLED = false;
const SUPPORT_MAILTO = "mailto:babs@lifecharter.architecture";

const PAGE_BG: React.CSSProperties = {
  background: `
    radial-gradient(1200px 800px at 15% -10%, rgba(94,59,108,0.55), transparent 60%),
    radial-gradient(1100px 900px at 100% 110%, rgba(46,124,131,0.45), transparent 55%),
    radial-gradient(900px 700px at 85% 0%, rgba(31,49,91,0.7), transparent 60%),
    linear-gradient(160deg, #16244a 0%, #1F315B 45%, #0f1a38 100%)`,
};

const QUOTE_PANEL_BG: React.CSSProperties = {
  background: `
    radial-gradient(700px 500px at 20% 0%, rgba(94,59,108,0.5), transparent 60%),
    radial-gradient(600px 600px at 100% 100%, rgba(46,124,131,0.35), transparent 60%),
    linear-gradient(150deg, rgba(31,49,91,0.55), rgba(15,26,56,0.75))`,
};

export function LoginView() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(POST_LOGIN_ROUTE);
    router.refresh();
  }

  return (
    <main
      style={PAGE_BG}
      className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden px-5 py-10 font-ui text-brand-ivory"
    >
      <div className="relative grid w-full max-w-[1080px] overflow-hidden rounded-[22px] bg-gradient-to-b from-brand-indigo-deep/70 to-brand-indigo-dark/80 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.65)] ring-1 ring-brand-gold/35 backdrop-blur-sm md:grid-cols-[1.05fr_0.95fr]">
        {/* thin inset gold outline */}
        <div className="pointer-events-none absolute inset-[14px] rounded-xl border border-brand-gold/30" />

        {/* ---------- LEFT: quotes ---------- */}
        <section
          style={QUOTE_PANEL_BG}
          className="relative order-2 flex min-h-[560px] flex-col justify-between border-t border-brand-gold/25 px-10 py-11 md:order-1 md:border-r md:border-t-0 md:px-14 md:py-16"
        >
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.42em] text-brand-gold">
            <span className="h-px w-8 flex-none bg-gradient-to-r from-transparent to-brand-gold" />
            Chart Your Course
            <span className="h-px w-8 flex-none bg-gradient-to-r from-brand-gold to-transparent" />
          </div>

          <QuoteCarousel />

          <p className="mt-6 border-t border-brand-gold/20 pt-5 font-editorial text-[15px] italic leading-relaxed tracking-[0.3px] text-brand-taupe">
            One ecosystem. Multiple doorways.
            <br />A life, mission, and business built from Truth rather than fear.
          </p>
        </section>

        {/* ---------- RIGHT: sign-in ---------- */}
        <section className="relative order-1 flex flex-col justify-center bg-gradient-to-b from-brand-indigo-dark/35 to-brand-indigo-dark/15 px-10 py-14 md:order-2 md:px-14">
          <Image
            src="/lifecharter-command-suite-logo.png"
            alt="LifeCharter Command Suite"
            width={1390}
            height={371}
            priority
            className="mx-auto mb-2.5 w-[78%] max-w-[300px] drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
          />
          <div className="mb-8 text-center text-[10.5px] uppercase tracking-[0.4em] text-brand-taupe">
            Architecture &middot; Command Suite
          </div>

          <h1 className="text-center font-display text-[26px] font-medium text-brand-ivory">
            Welcome back
          </h1>
          <p className="mb-7 text-center text-[12.5px] tracking-[0.04em] text-brand-taupe">
            Sign in to your command center
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[10.5px] font-medium uppercase tracking-[0.2em] text-brand-lavender"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@lifecharter.com"
                className="w-full rounded-[10px] border border-brand-gold/30 bg-white/[0.04] px-4 py-3.5 text-[15px] tracking-[0.02em] text-brand-ivory outline-none transition placeholder:text-brand-taupe/55 focus:border-brand-gold focus:bg-white/[0.06] focus:ring-[3px] focus:ring-brand-gold/15"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[10.5px] font-medium uppercase tracking-[0.2em] text-brand-lavender"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••"
                className="w-full rounded-[10px] border border-brand-gold/30 bg-white/[0.04] px-4 py-3.5 text-[15px] tracking-[0.02em] text-brand-ivory outline-none transition placeholder:text-brand-taupe/55 focus:border-brand-gold focus:bg-white/[0.06] focus:ring-[3px] focus:ring-brand-gold/15"
              />
            </div>

            <div className="-mt-1 flex items-center justify-between text-[12.5px]">
              <label className="flex cursor-pointer items-center gap-2 text-brand-taupe">
                <input
                  type="checkbox"
                  name="remember"
                  className="h-[15px] w-[15px] accent-brand-gold"
                />
                Keep me signed in
              </label>
              <a
                href={`${SUPPORT_MAILTO}?subject=Password%20help`}
                className="border-b border-transparent text-brand-lavender transition hover:border-brand-gold hover:text-brand-gold-soft"
              >
                Forgot password?
              </a>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-brand-plum/50 bg-brand-plum/15 px-3 py-2 text-[12.5px] text-brand-lavender"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1.5 w-full rounded-[10px] bg-gradient-to-br from-brand-gold-soft via-brand-gold to-[#b8923f] py-[15px] text-[12.5px] font-semibold uppercase tracking-[0.28em] text-brand-indigo-dark shadow-[0_12px_28px_-12px_rgba(212,175,99,0.7)] transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Charting your course…" : "Enter the Suite"}
            </button>

            {SSO_ENABLED && (
              <>
                <div className="my-1.5 flex items-center gap-3.5 text-[10.5px] uppercase tracking-[0.28em] text-brand-taupe">
                  <span className="h-px flex-1 bg-brand-gold/20" />
                  or
                  <span className="h-px flex-1 bg-brand-gold/20" />
                </div>
                <button
                  type="button"
                  className="w-full rounded-[10px] border border-brand-lavender/30 bg-white/[0.03] py-3.5 text-[12px] uppercase tracking-[0.16em] text-brand-ivory transition hover:border-brand-gold hover:bg-white/[0.06]"
                >
                  Continue with Single Sign-On
                </button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-[12px] text-brand-taupe">
            New to LifeCharter?{" "}
            <a
              href={`${SUPPORT_MAILTO}?subject=Request%20access`}
              className="border-b border-brand-gold/40 text-brand-lavender transition hover:text-brand-gold-soft"
            >
              Request access
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
