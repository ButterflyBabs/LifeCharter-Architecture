"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

// One team member's AI use this month on the owner's key, and the owner's
// monthly cap for them (blank = no limit). Admins see the numbers; only the
// account owner can change the cap (the API enforces that too).
export default function MemberAiCap({
  used,
  cap,
  canEdit,
  busy,
  onSave,
}: {
  used: number;
  cap: number | null;
  canEdit: boolean;
  busy: boolean;
  onSave: (cap: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(cap === null ? "" : String(cap));
  useEffect(() => setValue(cap === null ? "" : String(cap)), [cap]);

  const over = cap !== null && used >= cap;
  const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  const parsed = value.trim() === "" ? null : Math.floor(Number(value));
  const valid = parsed === null || (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100000);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#7a8a99]">
      <span className="inline-flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#c9a227]" />
        AI this month:{" "}
        <span className={`font-medium ${over ? "text-red-600" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
          {used}
          {cap !== null ? ` of ${cap}` : ""}
        </span>
        {cap === null && <span>(no limit)</span>}
        {over && <span className="text-red-600">· limit reached</span>}
      </span>
      {cap !== null && cap > 0 && (
        <span className="h-1.5 w-24 rounded-full bg-[#1a2b4a]/10 overflow-hidden" aria-hidden>
          <span className={`block h-full ${over ? "bg-red-500" : "bg-[#2E7C83]"}`} style={{ width: `${pct}%` }} />
        </span>
      )}
      {canEdit && !editing && (
        <button type="button" onClick={() => setEditing(true)} className="text-[#2E7C83] hover:underline">
          {cap === null ? "Set a monthly limit" : "Change limit"}
        </button>
      )}
      {canEdit && editing && (
        <span className="inline-flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5">
            <span className="sr-only">Monthly AI requests</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100000}
              placeholder="No limit"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-24 rounded border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2 py-1 text-[#1a2b4a] dark:text-[#F8F5F0]"
            />
            <span>requests / month</span>
          </label>
          <button
            type="button"
            disabled={busy || !valid}
            onClick={() => {
              onSave(parsed);
              setEditing(false);
            }}
            className="rounded bg-[#2E7C83] px-3 py-1 font-medium text-white hover:bg-[#256b71] disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setValue(cap === null ? "" : String(cap));
              setEditing(false);
            }}
            className="text-[#7a8a99] hover:text-[#1a2b4a]"
          >
            Cancel
          </button>
        </span>
      )}
    </div>
  );
}
