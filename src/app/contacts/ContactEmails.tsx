"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

// A contact's Emails section: mail with them from the owner's connected
// mailboxes (owner only) plus emails the Suite sent them. Opening the record
// quietly syncs the mailboxes once; "Refresh emails" syncs again.

type Email = {
  key: string;
  source: "mailbox" | "suite";
  direction: "in" | "out";
  subject: string;
  from: string;
  to: string;
  sentAt: string | null;
  snippet: string;
  badge: string;
  via?: string;
  provider?: "google" | "microsoft";
  accountKey?: string;
  messageId?: string;
};
type Body = { bodyHtml: string | null; bodyText: string | null };

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

// Sandboxed document for the reader iframe (scripts disabled), as the Inbox does.
function srcDoc(b: Body): string {
  const base =
    "<style>body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2430;font-size:14px;line-height:1.55;margin:0;padding:12px;}img{max-width:100%;height:auto;}a{color:#2E7C83;}blockquote{border-left:3px solid #E8E4E0;margin:0;padding-left:12px;color:#6b7280;}</style>";
  if (b.bodyHtml) return `<!doctype html><html><head><meta charset="utf-8">${base}</head><body>${b.bodyHtml}</body></html>`;
  const t = (b.bodyText ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html><html><head><meta charset="utf-8">${base}</head><body><pre style="white-space:pre-wrap;font-family:inherit;margin:0;">${t}</pre></body></html>`;
}

export default function ContactEmails({ contactId, name }: { contactId: string; name: string }) {
  const [emails, setEmails] = useState<Email[] | null>(null);
  const [owner, setOwner] = useState(false);
  const [mailboxes, setMailboxes] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [openKey, setOpenKey] = useState("");
  const [body, setBody] = useState<Body | null>(null);
  const [bodyErr, setBodyErr] = useState("");
  const current = useRef(contactId);
  const opening = useRef("");

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const r = await fetch(`/api/crm/contacts/${contactId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const d = await r.json().catch(() => ({}));
      if (current.current !== contactId) return;
      if (r.ok) {
        setEmails(d.emails ?? []);
        setMailboxes(d.mailboxes ?? []);
        setErrors(d.errors ?? []);
      }
    } catch {
      /* swallowed — the stored list stays */
    } finally {
      if (current.current === contactId) setSyncing(false);
    }
  }, [contactId]);

  useEffect(() => {
    current.current = contactId;
    setEmails(null);
    setErrors([]);
    setOpenKey("");
    let live = true;
    (async () => {
      const d = await fetch(`/api/crm/contacts/${contactId}/emails`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
      if (!live) return;
      setEmails(d.emails ?? []);
      setOwner(Boolean(d.owner));
      setMailboxes(d.mailboxes ?? []);
      setNote(d.note ?? "");
      // Background sync on open: only for the owner with a mailbox connected.
      if (d.owner && (d.mailboxes ?? []).length) void sync();
    })();
    return () => {
      live = false;
    };
  }, [contactId, sync]);

  async function open(e: Email) {
    if (openKey === e.key) return setOpenKey("");
    setOpenKey(e.key);
    opening.current = e.key;
    setBody(null);
    setBodyErr("");
    if (e.source !== "mailbox" || !e.messageId) return;
    const p = new URLSearchParams({ id: e.messageId, provider: e.provider ?? "google" });
    if (e.accountKey) p.set("accountKey", e.accountKey);
    const r = await fetch(`/api/inbox/message?${p}`, { cache: "no-store" }).catch(() => null);
    const d = r ? await r.json().catch(() => null) : null;
    if (opening.current !== e.key) return;
    if (!r?.ok || !d) return setBodyErr("Couldn't open this email just now. It may have been moved or deleted.");
    setBody({ bodyHtml: d.bodyHtml ?? null, bodyText: d.bodyText ?? null });
  }

  return (
    <section aria-labelledby={`emails-${contactId}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p id={`emails-${contactId}`} className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">Emails</p>
        {owner && mailboxes.length > 0 && (
          <Button variant="outline" onClick={() => void sync()} disabled={syncing} aria-busy={syncing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? "animate-spin" : ""}`} aria-hidden="true" /> {syncing ? "Refreshing…" : "Refresh emails"}
          </Button>
        )}
      </div>

      {owner && mailboxes.length === 0 && (
        <p className="text-sm text-[#5a6472] mb-2">
          <Link href="/settings?tab=integrations" className="text-[#2E7C83] underline">Connect Gmail or Microsoft 365 in Settings</Link> to see your emails with contacts here.
        </p>
      )}
      {!owner && note && <p className="text-xs text-[#7a8a99] mb-2">{note}</p>}
      {errors.length > 0 && (
        <div role="status" className="mb-2 space-y-0.5">
          {errors.map((e) => (
            <p key={e} className="text-xs text-[#9a6b00]">{e}</p>
          ))}
        </div>
      )}

      {emails === null ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : emails.length === 0 ? (
        <p className="text-sm text-[#7a8a99]">{syncing ? "Looking through your mailboxes…" : `No emails with ${name} yet.`}</p>
      ) : (
        <ol className="space-y-2">
          {emails.map((e) => {
            const Arrow = e.direction === "out" ? ArrowUpRight : ArrowDownLeft;
            const isOpen = openKey === e.key;
            return (
              <li key={e.key} className="rounded-xl border border-[#1a2b4a]/10">
                <button
                  onClick={() => void open(e)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-3 hover:bg-[#1a2b4a]/5 rounded-xl"
                >
                  <div className="flex items-start gap-2">
                    <Arrow className={`w-4 h-4 mt-0.5 shrink-0 ${e.direction === "out" ? "text-[#2E7C83]" : "text-[#c9a227]"}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#7a8a99]">
                        <span className="font-medium">{e.direction === "out" ? "Sent" : "Received"}</span> · {when(e.sentAt)}
                      </p>
                      <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] break-words">{e.subject}</p>
                      <p className="text-xs text-[#5a6472] break-all">
                        {e.direction === "out" ? `To ${e.to || "—"}` : `From ${e.from || "—"}`}
                      </p>
                      {e.snippet && !isOpen && <p className="text-xs text-[#5a6472] mt-0.5 line-clamp-2">{e.snippet}</p>}
                      <span className="mt-1 inline-flex items-center rounded-full bg-[#2E7C83]/10 px-2 py-0.5 text-[11px] text-[#1F5E63] dark:text-[#9fd3d6] break-all">
                        {e.via ?? e.badge}
                      </span>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[#1a2b4a]/10 p-2">
                    <div className="flex justify-end">
                      <button onClick={() => setOpenKey("")} aria-label="Close email" className="p-1 rounded-lg hover:bg-[#1a2b4a]/5"><X className="w-4 h-4" /></button>
                    </div>
                    {e.source === "suite" ? (
                      <p className="text-sm text-[#5a6472] px-1 pb-1">{e.snippet || "The full email lives in the sequence or broadcast that sent it."}</p>
                    ) : bodyErr ? (
                      <p className="text-sm text-[#9a6b00] px-1 pb-1">{bodyErr}</p>
                    ) : body ? (
                      <iframe title={`Email: ${e.subject}`} sandbox="" srcDoc={srcDoc(body)} className="w-full h-80 rounded-lg bg-white" />
                    ) : (
                      <p className="text-sm text-[#7a8a99] px-1 pb-1">Opening…</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
