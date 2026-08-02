"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, authInputClass, authLabelClass, authButtonClass } from "@/components/login/auth-shell";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean | null>(null); // is there a recovery session?

  useEffect(() => {
    if (params.get("error") === "link") {
      setReady(false);
      return;
    }
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then((res: { data: { session: unknown } }) => setReady(Boolean(res.data.session)))
      .catch(() => setReady(false));
  }, [params]);

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
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (ready === false) {
    return (
      <AuthShell
        title="This link has expired"
        subtitle="Reset links are single-use and time-limited. Request a fresh one and we'll email it right over."
      >
        <a href="/forgot-password" className={authButtonClass + " block text-center no-underline"}>
          Request a new link
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <div>
          <label htmlFor="password" className={authLabelClass}>
            New password
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

        <button type="submit" disabled={loading || ready === null} className={authButtonClass}>
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
