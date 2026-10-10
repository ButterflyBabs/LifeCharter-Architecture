"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface View {
  id: string;
  started_at: string;
  ended_at: string | null;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

// Transparency for the account owner: every time LifeCharter support opened this account read-only.
export default function AccountAccessLog() {
  const [views, setViews] = useState<View[] | null>(null);

  useEffect(() => {
    fetch("/api/account-access", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { views: [] }))
      .then((j) => setViews(j.views || []))
      .catch(() => setViews([]));
  }, []);

  if (views === null) return null;

  return (
    <div className="mt-6 rounded-xl border border-[#e8e1d2] dark:border-[#3a3a55] p-4">
      <div className="flex items-center gap-2 mb-1">
        <Eye className="w-4 h-4 text-[#c9a227]" />
        <h3 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Who has opened my account</h3>
      </div>
      <p className="text-xs text-[#7a8a99] mb-3">
        To help with a support request, LifeCharter support can open your account read-only. It can look but not change,
        send or delete anything, and it can&apos;t see your inbox, calendar, connected accounts, logins vault or billing.
        Every time it happens is listed here.
      </p>
      {views.length === 0 ? (
        <p className="text-sm text-[#5a6a7a] dark:text-[#b8a898]">No one has opened your account.</p>
      ) : (
        <ul className="text-sm divide-y divide-[#e8e1d2] dark:divide-[#3a3a55]">
          {views.map((v) => (
            <li key={v.id} className="py-2 text-[#1a2b4a] dark:text-[#F8F5F0]">
              {when(v.started_at)}
              <span className="text-[#7a8a99]"> · LifeCharter support, read-only</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
