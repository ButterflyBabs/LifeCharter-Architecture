"use client";

import { useEffect, useId, useRef, useState } from "react";
import { UserCheck } from "lucide-react";

export interface LookupContact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company?: string | null;
  unsubscribed_at?: string | null;
}

export const lookupName = (c: Pick<LookupContact, "first_name" | "last_name" | "email">) => [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;

// A text box that, as you type, suggests people already in your Contacts.
// Pick one and `onPick` gets their details (to fill the rest of a form);
// keep typing to use what you wrote instead.
export default function ContactLookupInput({
  value,
  onChange,
  onPick,
  placeholder,
  className,
  id,
  type = "text",
  pickLabel = "Use",
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (c: LookupContact) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  type?: string;
  pickLabel?: string;
}) {
  const [results, setResults] = useState<LookupContact[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const skip = useRef(false); // don't search again for the value we just picked

  useEffect(() => {
    const q = value.trim();
    if (skip.current || q.length < 2) {
      skip.current = false;
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const d: { contacts?: LookupContact[] } = await fetch(`/api/crm/contacts?q=${encodeURIComponent(q)}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
      setResults(((d.contacts ?? []) as LookupContact[]).slice(0, 6));
      setActive(-1);
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  const pick = (c: LookupContact) => {
    skip.current = true;
    setOpen(false);
    setResults([]);
    onPick(c);
  };

  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !results.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(results[active]); }
          else if (e.key === "Escape") setOpen(false);
        }}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {open && results.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 w-full min-w-[240px] rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a] shadow-lg overflow-hidden">
          <li className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#7a8a99]">Already in your contacts</li>
          {results.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm ${i === active ? "bg-[#2E7C83]/10" : "hover:bg-[#2E7C83]/5"}`}
              >
                <span className="min-w-0">
                  <span className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{lookupName(c)}</span>
                  <span className="block text-xs text-[#7a8a99] truncate">
                    {c.email}
                    {c.company ? ` · ${c.company}` : ""}
                    {c.unsubscribed_at ? " · unsubscribed" : ""}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7C83] shrink-0"><UserCheck className="w-3.5 h-3.5" /> {pickLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
