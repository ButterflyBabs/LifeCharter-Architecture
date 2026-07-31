"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.signOut().finally(() => {
      window.location.href = "/login";
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0]">
      <p className="text-sm text-[#7b6b8d]">Signing out…</p>
    </div>
  );
}
