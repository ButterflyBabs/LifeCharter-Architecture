"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";

export interface PickedContact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  timezone?: string | null;
  unsubscribed_at?: string | null;
}

export const personName = (c: Pick<PickedContact, "first_name" | "last_name" | "email">) => [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;

// Search your own Contacts by name or email and pick someone. `taken` marks
// people who are already in (shown with a check, not clickable).
export default function ContactPicker({ onPick, taken = [], placeholder = "Search your contacts by name or email" }: { onPick: (c: PickedContact) => void; taken?: string[]; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PickedContact[] | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      const d = await fetch(`/api/crm/contacts?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
      setResults(((d.contacts ?? []) as PickedContact[]).slice(0, 8));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8a99]" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="pl-9" aria-label="Search contacts" />
      </div>
      {results && (
        <ul className="rounded-lg border border-[#1a2b4a]/10 divide-y divide-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/30">
          {results.map((c) => {
            const isIn = taken.includes(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={isIn || Boolean(c.unsubscribed_at)}
                  onClick={() => {
                    onPick(c);
                    setQ("");
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-[#2E7C83]/5 disabled:opacity-60 disabled:hover:bg-transparent"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{personName(c)}</span>
                    <span className="block text-xs text-[#7a8a99] truncate">
                      {c.email}
                      {c.unsubscribed_at ? " · unsubscribed" : ""}
                    </span>
                  </span>
                  {isIn ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[#2E7C83] shrink-0"><Check className="w-3.5 h-3.5" /> Added</span>
                  ) : !c.unsubscribed_at ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7C83] shrink-0"><Plus className="w-3.5 h-3.5" /> Add</span>
                  ) : null}
                </button>
              </li>
            );
          })}
          {!results.length && <li className="px-3 py-2 text-sm text-[#7a8a99]">No one matches. Add them in Contacts first.</li>}
        </ul>
      )}
    </div>
  );
}
