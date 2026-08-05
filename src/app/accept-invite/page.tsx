"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, authInputClass, authLabelClass, authButtonClass } from "@/components/login/auth-shell";

function AcceptInviteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [state, setState] = useState<"checking" | "ready" | "invalid" | "expired">("checking");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate the token on load and learn whose login this is.
  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    fetch("/api/invite?token=" + encodeURIComponent(token))
      .then(async (r) => {
        if (r.ok) {
          const d = await r.json();
          setEmail(d.email || "");
          setName(d.name || "");
          setState("ready");
        } else if (r.status === 410) {
          setState("expired");
        } else {
          setState("invalid");
        }
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setLoading(true);
    // 1) Set the password server-side (consumes the token, activates the member).
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setError(data?.error || "Something went wrong. Ask for a fresh link.");
      return;
    }

    // 2) Sign in with the new credentials to establish the session, then land in.
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: data.email || email,
      password,
    });
    setLoading(false);
    if (signInErr) {
      // Password is set — they can still sign in from the login page.
      router.push("/login");
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (state === "checking") {
    return (
      <AuthShell title="Setting things up…" subtitle="One moment while we check your invitation.">
        <div />
      </AuthShell>
    );
  }

  if (state === "invalid" || state === "expired") {
    return (
      <AuthShell
        title={state === "expired" ? "This invitation has expired" : "This invitation link isn't valid"}
        subtitle="Invitation links are single-use and time-limited. Ask whoever invited you to send a fresh one."
      >
        <a href="/login" className={authButtonClass + " block text-center no-underline"}>
          Go to sign in
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={name ? `Welcome, ${name}` : "Set your password"}
      subtitle={email ? `Create a password for ${email} to finish setting up your login.` : "Create a password to finish setting up your login."}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <div>
          <label htmlFor="password" className={authLabelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••••"
            className={authInputClass}
          />
        </div>
        <div>
          <label htmlFor="confirm" className={authLabelClass}>
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••••"
            className={authInputClass}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-brand-plum/50 bg-brand-plum/15 px-3 py-2 text-[12.5px] text-brand-lavender"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Setting up…" : "Set password & sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteInner />
    </Suspense>
  );
}
