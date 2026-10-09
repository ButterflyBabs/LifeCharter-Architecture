"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Copy, Check, Loader2, Search } from "lucide-react";
import { fillQuickWinText, unfilledParts, type QuickWinEmail as Template } from "@/lib/quickWinEmails";

type Person = { id: string; email: string; first_name: string | null; last_name: string | null; unsubscribed_at: string | null };
const nameOf = (p: Person) => [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email;

// A Quick Win that sends a ready-made email: pick the person, read it over, change anything, send. Sending (or marking it
// done when you sent it yourself) adds today's task as complete and counts toward the day's activity.
export default function QuickWinEmail({ tpl, emoji, onClose, onDone }: { tpl: Template; emoji: string; onClose: () => void; onDone: (msg: string) => void }) {
  const [info, setInfo] = useState<{ myName: string; canSend: boolean; reason: string | null; templates?: Record<string, { subject: string; body: string }> } | null>(null);
  // The wording this email starts from: the account's own saved wording if it has one, else ours.
  const [base, setBase] = useState<{ subject: string; body: string }>({ subject: tpl.subject, body: tpl.body });
  const [savedOwn, setSavedOwn] = useState(false);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [person, setPerson] = useState<Person | null>(null);
  const [subject, setSubject] = useState(tpl.subject);
  const [body, setBody] = useState(tpl.body);
  const [busy, setBusy] = useState<"" | "send" | "done">("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const edited = useRef(false);

  useEffect(() => {
    fetch("/api/quick-wins/email").then((r) => r.json()).then((d) => { setInfo(d); const own = d?.templates?.[tpl.kind]; if (own) { setBase(own); setSavedOwn(true); } }).catch(() => setInfo({ myName: "", canSend: false, reason: "Couldn't check your email setup." }));
  }, []);

  // Search the account's own contacts as they type.
  useEffect(() => {
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/crm/contacts?q=${encodeURIComponent(search.trim())}`);
        const d = await r.json().catch(() => ({}));
        setResults(Array.isArray(d.contacts) ? (d.contacts as Person[]).slice(0, 8) : []);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const vars = { first_name: person?.first_name || "", my_name: info?.myName || "" };
  // Until the person edits the words, the name and signature follow the person they pick.
  useEffect(() => {
    if (edited.current) return;
    setSubject(fillQuickWinText(base.subject, vars));
    setBody(fillQuickWinText(base.body, vars));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, info, base]);

  const missing = unfilledParts(subject + "\n" + body);
  const ready = Boolean(person) && missing.length === 0 && subject.trim() && body.trim();

  async function submit(mode: "send" | "done") {
    if (!person) return;
    setBusy(mode);
    setError("");
    try {
      const r = await fetch("/api/quick-wins/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: tpl.title, contactId: person.id, subject, body, mode }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error || "That didn't work. Try again."); return; }
      onDone(mode === "send" ? `Sent to ${nameOf(person)}, and added to today as done.` : `Logged as done for ${nameOf(person)}.`);
    } catch {
      setError("That didn't work. Try again.");
    } finally {
      setBusy("");
    }
  }

  // Keep the wording as the account's own: the person's name and the owner's name go back to placeholders.
  const unfill = (t: string) => {
    let out = t;
    if (vars.my_name) out = out.replace(new RegExp(`(\\n)${vars.my_name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`), "$1{{my_name}}");
    if (vars.first_name) out = out.replace(new RegExp(`\\b${vars.first_name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), "{{first_name}}");
    return out;
  };
  async function saveWording(reset: boolean) {
    setError("");
    setNote("");
    try {
      const r = await fetch("/api/quick-wins/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reset ? { title: tpl.title, mode: "reset-template" } : { title: tpl.title, mode: "save-template", subject: unfill(subject), body: unfill(body) }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error || "Couldn't save that."); return; }
      if (reset) { edited.current = false; setBase({ subject: tpl.subject, body: tpl.body }); setSavedOwn(false); setNote("Back to the starting wording."); }
      else { const nb = { subject: unfill(subject), body: unfill(body) }; setBase(nb); setSavedOwn(true); setNote("Saved. This email will start from your wording every time."); }
    } catch {
      setError("Couldn't save that.");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy. Select the text and copy it yourself.");
    }
  }

  const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={tpl.title}>
      <div className="my-6 w-full max-w-2xl rounded-2xl bg-[#FBF8F1] p-5 shadow-xl dark:bg-[#12203a] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{emoji} {tpl.title}</h2>
            <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">Pick {tpl.who}, read the email, change anything you like, and send. It is added to today as done.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[#5a6472] hover:bg-[#1a2b4a]/10"><X className="h-5 w-5" /></button>
        </div>

        <label className="mt-4 block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Who is it going to?</label>
        {person ? (
          <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-[#2E7C83]/40 bg-[#2E7C83]/10 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
            <span><strong>{nameOf(person)}</strong> · {person.email}</span>
            <button onClick={() => { setPerson(null); edited.current = edited.current; }} className="text-xs font-semibold text-[#1f6a70] underline">Change</button>
          </div>
        ) : (
          <div className="mt-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#7a8a99]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your contacts by name or email" className={`${field} pl-9`} autoFocus />
            </div>
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/30">
              {searching && !results.length ? <li className="px-3 py-2 text-sm text-[#7a8a99]">Searching…</li> : null}
              {!searching && !results.length ? <li className="px-3 py-2 text-sm text-[#7a8a99]">No one found. Add them under Clients &amp; Sales → Contacts first.</li> : null}
              {results.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setPerson(p)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#2E7C83]/10">
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{nameOf(p)}</span>
                    <span className="truncate text-xs text-[#7a8a99]">{p.unsubscribed_at ? "unsubscribed" : p.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <label className="mt-4 block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Subject</label>
        <input value={subject} onChange={(e) => { edited.current = true; setSubject(e.target.value); }} className={`${field} mt-1`} />
        <label className="mt-3 block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Message</label>
        <textarea value={body} onChange={(e) => { edited.current = true; setBody(e.target.value); }} rows={12} className={`${field} mt-1 leading-relaxed`} />
        {missing.length > 0 && (
          <p className="mt-2 text-sm text-[#7a5a0e] dark:text-[#f0d98f]">Fill in the {missing.length === 1 ? "part" : "parts"} in [square brackets] before you send: {missing.map((m) => `[${m}]`).join(", ")}.</p>
        )}
        {info && !info.canSend && (
          <p className="mt-2 rounded-lg bg-[#c9a227]/15 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
            {info.reason} Until then, copy the email, send it from your own email, and press <strong>I sent it myself</strong>.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-[#8a2f2f] dark:text-[#f0b8b8]">{error}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={() => void submit("send")} disabled={!ready || !info?.canSend || Boolean(busy) || Boolean(person?.unsubscribed_at)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256b71] disabled:opacity-50">
            {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send it
          </button>
          <button onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a2b4a]/25 px-3 py-2 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={() => void submit("done")} disabled={!ready || Boolean(busy)} className="rounded-lg border border-[#1a2b4a]/25 px-3 py-2 text-sm font-medium text-[#1a2b4a] disabled:opacity-50 dark:text-[#F8F5F0]">
            {busy === "done" ? "Saving…" : "I sent it myself"}
          </button>
          <button onClick={onClose} className="ml-auto text-sm text-[#5a6472] underline">Not now</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#1a2b4a]/10 pt-3 text-sm">
          <button onClick={() => void saveWording(false)} className="font-semibold text-[#1f6a70] underline dark:text-[#7fd0d6]">Save this as my wording</button>
          {savedOwn && <button onClick={() => void saveWording(true)} className="text-[#5a6472] underline">Go back to the starting wording</button>}
          <span className="text-xs text-[#7a8a99]">{note || (savedOwn ? "This email starts from your own wording." : "Change the words so they sound like you, then save them to use every time.")}</span>
        </div>
      </div>
    </div>
  );
}
