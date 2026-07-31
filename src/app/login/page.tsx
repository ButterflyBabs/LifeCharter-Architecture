"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0] px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-full bg-[#1a2b4a] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#c9a227]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20M2 12h20" />
              <path d="M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-[#1a2b4a] leading-none">LifeCharter</h1>
            <p className="text-xs text-[#7b6b8d]">Command Suite</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#c9a227]/20 shadow-sm p-6">
          <h2 className="font-serif text-lg text-[#1a2b4a] mb-4">Sign in</h2>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2.5 bg-[#F8F5F0] border border-gray-200 rounded-lg text-sm outline-none focus:border-[#84AEB2]"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2.5 bg-[#F8F5F0] border border-gray-200 rounded-lg text-sm outline-none focus:border-[#84AEB2]"
            />
            {error && <p className="text-sm text-[#D83A34]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1a2b4a] text-white rounded-lg text-sm hover:bg-[#1a2b4a]/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
