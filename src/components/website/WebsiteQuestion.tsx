"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

// "What's your website address?" Saved to the account's workspace (same field as Settings >
// Workspace > Website). It's what Babs's team reviews for the Website Alignment Review.
export default function WebsiteQuestion({ onSaved }: { onSaved?: (website: string) => void }) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/website-review")
      .then((r) => r.json())
      .then((d) => {
        if (d?.website) {
          setValue(d.website);
          setSaved(d.website);
        }
      })
      .catch(() => {});
  }, []);

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/website-review", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ website: value }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Couldn't save.");
      setSaved(d.website ?? value.trim());
      setValue(d.website ?? value.trim());
      setMsg("Saved");
      onSaved?.(d.website ?? value.trim());
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const done = !!saved;
  return (
    <div className={`rounded-2xl border p-4 ${done ? "border-green-500/30 bg-green-500/5" : "border-[#1a2b4a]/12 bg-white dark:bg-[#1a2b4a]/20"}`}>
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-[#2E7C83]" />
        <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">What&rsquo;s your website address?</h3>
      </div>
      <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf] mt-0.5">
        We&rsquo;ll review it against the positioning and offer you&rsquo;re building here, and your Website Alignment Review will appear in your account. No website yet? Leave it blank.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          inputMode="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="yourbusiness.com"
          className="min-w-0 flex-1 rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]"
        />
        <button
          onClick={save}
          disabled={busy || value.trim() === saved}
          className="rounded-lg bg-[#2E7C83] px-4 py-2 text-sm font-medium text-white hover:bg-[#256b71] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-[#7a8a99]">{msg}</p>}
    </div>
  );
}
