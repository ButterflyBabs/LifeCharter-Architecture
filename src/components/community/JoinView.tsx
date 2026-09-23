"use client";

// The Collective's front door — modelled on a private-group join page:
// "New here" creates an account with an invite code; "Already a member"
// signs in and (with the code) adds the channel. Also used, without one,
// as the plain sign-in page for returning members.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface JoinSpace {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  emoji: string | null;
  logo_url: string | null;
  visibility: "public" | "private";
  join_enabled: boolean;
}

const PAGE_BG: React.CSSProperties = {
  background: `
    radial-gradient(900px 600px at 10% -10%, rgba(212,175,99,0.22), transparent 60%),
    radial-gradient(900px 700px at 110% 110%, rgba(31,49,91,0.16), transparent 60%),
    #F8F5F0`,
};

const field =
  "w-full rounded-xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-4 py-3 text-[15px] text-[var(--cm-ink)] outline-none transition placeholder:text-[var(--cm-faint)] focus:border-[#D4AF63] focus:ring-[3px] focus:ring-[#D4AF63]/20";
const goldButton =
  "w-full rounded-xl bg-gradient-to-br from-[#E6C988] via-[#D4AF63] to-[#B8923F] py-3.5 text-[15px] font-semibold tracking-[0.02em] text-[#0F1A38] shadow-[0_12px_26px_-12px_rgba(184,146,63,0.9)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70";

export function JoinView({ space, mode = "join" }: { space: JoinSpace | null; mode?: "join" | "signin" }) {
  const router = useRouter();
  const signinOnly = mode === "signin";
  const [tab, setTab] = useState<"new" | "member">(signinOnly ? "member" : "new");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  // Invitation emails link here with ?code=… so the code is already filled in.
  const [prefill, setPrefill] = useState("");
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("code");
    if (c) setPrefill(c.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32));
  }, []);

  const isMain = !space || space.slug === "start-here";
  const title = isMain ? "The LifeCharter Collective" : space!.name;
  const joinLabel = isMain ? "Join the Collective" : `Join ${space!.name}`;

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }: { data: { user: { email?: string } | null } }) => setSignedInAs(data.user?.email ?? null));
  }, []);

  // Brand-new members land on the welcome; returning members go straight home.
  function enter(isNew = false) {
    router.push(isNew ? "/community?welcome=1" : "/community");
    router.refresh();
  }

  async function joinSpace(code: string): Promise<boolean> {
    if (!space) return true;
    const { error } = await createClient().rpc("cm_join_with_code", { p_slug: space.slug, p_code: code });
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  async function onNew(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!space) return;
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const payload = {
      slug: space.slug,
      name: String(f.get("name") ?? ""),
      email: String(f.get("email") ?? ""),
      phone: String(f.get("phone") ?? ""),
      password: String(f.get("password") ?? ""),
      code: String(f.get("code") ?? ""),
    };
    const res = await fetch("/api/community/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(out.error || "Something went wrong. Please try again.");
      if (out.code === "exists") setTab("member");
      setBusy(false);
      return;
    }
    const { error } = await createClient().auth.signInWithPassword({ email: payload.email, password: payload.password });
    if (error) {
      setError("Your account is ready — please sign in with “Already a member”.");
      setTab("member");
      setBusy(false);
      return;
    }
    enter(true);
  }

  async function onMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const code = String(f.get("code") ?? "");
    if (!signedInAs) {
      const { error } = await createClient().auth.signInWithPassword({
        email: String(f.get("email") ?? ""),
        password: String(f.get("password") ?? ""),
      });
      if (error) {
        setError(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message);
        setBusy(false);
        return;
      }
    }
    if (!signinOnly && !(await joinSpace(code))) {
      setBusy(false);
      return;
    }
    enter();
  }

  async function signOut() {
    await createClient().auth.signOut();
    setSignedInAs(null);
  }

  if (!signinOnly && !space) {
    return (
      <Shell>
        <p className="mb-2 text-center font-display text-[26px] font-semibold text-[var(--cm-ink)]">This link isn&rsquo;t active</p>
        <p className="text-center text-[14.5px] text-[var(--cm-muted-2)]">Please check the link you were given, or ask whoever invited you for a new one.</p>
      </Shell>
    );
  }

  const closed = !signinOnly && space && !space.join_enabled;

  return (
    <Shell>
      {!signinOnly && (
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cm-ink-tint)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--cm-ink)]">
            <Lock className="h-3.5 w-3.5 text-[#B8923F]" /> Private Access — Do Not Share This Page
          </span>
        </div>
      )}
      <Image
        src="/lifecharter-collective-mark.png"
        alt="LifeCharter Command Suite"
        width={803}
        height={772}
        priority
        className="mx-auto mb-4 h-auto w-[148px]"
      />
      {!isMain && <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cm-gold-text)]">The LifeCharter Collective</p>}
      <h1 className="mt-1 text-center font-display text-[32px] font-semibold leading-tight text-[var(--cm-ink)]">
        {signinOnly ? "Welcome back" : title}
      </h1>
      <p className="mx-auto mt-1.5 max-w-sm text-center text-[14.5px] leading-relaxed text-[var(--cm-muted-2)]">
        {signinOnly
          ? "Sign in to The LifeCharter Collective."
          : isMain
            ? "Your community for Purpose, Clarity and Aligned Action."
            : space!.description || space!.tagline}
      </p>

      {closed ? (
        <p className="mt-6 rounded-xl bg-[var(--cm-gold-soft)] px-4 py-3 text-center text-[14px] text-[var(--cm-gold-ink)]">
          This channel isn&rsquo;t accepting new members right now.
        </p>
      ) : signedInAs && !signinOnly ? (
        <form onSubmit={onMember} className="mt-6 space-y-3">
          <p className="text-center text-[13.5px] text-[var(--cm-muted-2)]">
            Signed in as <strong className="text-[var(--cm-ink)]">{signedInAs}</strong> ·{" "}
            <button type="button" onClick={signOut} className="underline underline-offset-2">
              not you?
            </button>
          </p>
          <input key={`c1-${prefill}`} defaultValue={prefill} name="code" placeholder="Invite code" autoComplete="off" className={cn(field, "uppercase tracking-[0.12em]")} />
          {error && <ErrorLine>{error}</ErrorLine>}
          <button disabled={busy} className={goldButton}>
            {busy ? "Joining…" : joinLabel}
          </button>
        </form>
      ) : (
        <>
          {!signinOnly && (
            <div className="mt-6 grid grid-cols-2 rounded-full bg-[var(--cm-ink-tint)] p-1" role="tablist">
              {(["new", "member"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    setError(null);
                  }}
                  className={cn(
                    "rounded-full py-2 text-[14px] font-semibold transition",
                    tab === t ? "bg-[var(--cm-surface)] text-[var(--cm-ink)] shadow-sm" : "text-[var(--cm-muted-2)] hover:text-[var(--cm-ink)]"
                  )}
                >
                  {t === "new" ? "New here" : "Already a member"}
                </button>
              ))}
            </div>
          )}

          {tab === "new" && !signinOnly ? (
            <form onSubmit={onNew} className="mt-5 space-y-3">
              <input name="name" required placeholder="Your name" autoComplete="name" className={field} />
              <input name="email" required type="email" placeholder="Email" autoComplete="email" className={field} />
              <input name="phone" type="tel" placeholder="Phone number (optional)" autoComplete="tel" className={field} />
              <input name="password" required type="password" minLength={8} placeholder="Create a password" autoComplete="new-password" className={field} />
              <input key={`c2-${prefill}`} defaultValue={prefill} name="code" required placeholder="Invite code" autoComplete="off" className={cn(field, "uppercase tracking-[0.12em]")} />
              {error && <ErrorLine>{error}</ErrorLine>}
              <button disabled={busy} className={goldButton}>
                {busy ? "Creating your account…" : joinLabel}
              </button>
              <p className="pt-1 text-center text-[12px] leading-relaxed text-[var(--cm-muted)]">
                By joining you agree to the{" "}
                <Link href="/legal/community-guidelines" className="underline underline-offset-2">
                  Terms of Use
                </Link>
                . There is zero tolerance for objectionable content or abusive behavior.
              </p>
            </form>
          ) : (
            <form onSubmit={onMember} className="mt-5 space-y-3">
              <input name="email" required type="email" placeholder="Email" autoComplete="email" className={field} />
              <input name="password" required type="password" placeholder="Password" autoComplete="current-password" className={field} />
              {!signinOnly && (
                <input
                  key={`c3-${prefill}`}
                  defaultValue={prefill}
                  name="code"
                  placeholder="Invite code (if you're new to this channel)"
                  autoComplete="off"
                  className={cn(field, "uppercase tracking-[0.12em] placeholder:normal-case placeholder:tracking-normal")}
                />
              )}
              {error && <ErrorLine>{error}</ErrorLine>}
              <button disabled={busy} className={goldButton}>
                {busy ? "Signing in…" : signinOnly ? "Sign in" : joinLabel}
              </button>
              <p className="pt-1 text-center text-[13px]">
                <Link href="/forgot-password" className="text-[var(--cm-muted-2)] underline underline-offset-2 hover:text-[var(--cm-ink)]">
                  Forgot password?
                </Link>
              </p>
            </form>
          )}
        </>
      )}
    </Shell>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] text-red-700">
      {children}
    </p>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={PAGE_BG} className="flex min-h-screen w-full items-center justify-center px-4 py-10 font-ui">
      <div className="w-full max-w-[440px] rounded-[26px] border border-[var(--cm-line)] bg-[var(--cm-surface)] px-6 py-8 shadow-[0_2px_4px_rgba(31,49,91,0.05),0_30px_60px_-30px_rgba(31,49,91,0.45)] sm:px-9 sm:py-10">
        {children}
      </div>
    </main>
  );
}
