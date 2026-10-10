/**
 * Integrations Panel
 * The account's real connections: how many plan integration spots are used
 * (PostStream and future tools — email accounts and the AI key
 * are counted separately), plus Calendar & Email.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// "2 of 5 integrations used" — reads the plan limit and live count from the server.
export function IntegrationUsage({ refreshKey = 0 }: { refreshKey?: number }) {
  const [usage, setUsage] = useState<{ count: number; limit: number | null } | null>(null);
  useEffect(() => {
    fetch("/api/integrations/usage", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUsage({ count: d.count ?? 0, limit: typeof d.limit === "number" ? d.limit : null }))
      .catch(() => {});
  }, [refreshKey]);
  if (!usage) return null;
  const unlimited = usage.limit === null || usage.limit < 0;
  const full = !unlimited && usage.count >= (usage.limit as number);
  return (
    <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
      <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Integrations</h4>
      <p className="text-sm text-[#7a8a99]">
        {unlimited ? `${usage.count} connected · no limit on your plan` : `${usage.count} of ${usage.limit} used`} · your AI key and email accounts don&apos;t count toward this.
      </p>
      {full && <p className="mt-2 text-sm text-[#8a6a15]">You&apos;ve used every integration spot on your plan. Disconnect one, or upgrade under Billing, to add another.</p>}
    </div>
  );
}

export function IntegrationsPanel() {
  return (
    <div className="space-y-4">
      {/* Real calendar & email connections (Google / Microsoft OAuth) */}
      <CalendarConnections />
    </div>
  );
}

// Real Google / Microsoft calendar + email connections (actual OAuth). Lists this account's connected email accounts, how
// many its plan allows, and lets it add or disconnect one.
interface ConnectedMailbox {
  provider: "google" | "microsoft";
  accountKey: string;
  email: string | null;
  canWriteCalendar?: boolean;
}

function CalendarConnections() {
  const [accounts, setAccounts] = useState<ConnectedMailbox[]>([]);
  const [limit, setLimit] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mail/accounts");
      const d = await res.json().catch(() => ({}));
      setAccounts(Array.isArray(d.accounts) ? d.accounts : []);
      setLimit(typeof d.limit === "number" ? d.limit : null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    setLimitHit(new URLSearchParams(window.location.search).get("mail") === "limit");
  }, [load]);

  const disconnect = async (a: ConnectedMailbox) => {
    if (!confirm(`Disconnect ${a.email || (a.provider === "google" ? "this Google account" : "this Microsoft account")}?`)) return;
    await fetch("/api/mail/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: a.provider, accountKey: a.accountKey }),
    });
    load();
  };

  const atLimit = limit !== null && accounts.length >= limit;
  const addBtn = "text-sm font-medium px-3 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]";

  return (
    <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Calendar &amp; Email</h3>
        {loaded && limit !== null && (
          <span className="text-xs font-medium text-[#7a8a99]">
            {accounts.length} of {limit} email {limit === 1 ? "account" : "accounts"} used
          </span>
        )}
      </div>
      <p className="text-xs text-[#b8a898] mb-3">
        Connect Google or Microsoft to read your inbox &amp; calendar and let the app add events (like planning sessions).
        Each connected email account counts toward your plan&apos;s limit.
      </p>
      <p className="text-xs text-[#b8a898] mb-3">
        <strong className="text-[#F8F5F0]">Emailing your contacts is separate.</strong> Campaigns, broadcasts and booking emails go out through
        your own free Resend account and your own verified domain, not through the accounts above. Set it up in{" "}
        <a href="/contacts?tab=sending" className="font-semibold text-[#E3C27C] underline">Contacts &gt; Email sending</a>.
      </p>
      {limitHit && (
        <p className="text-xs text-[#8a6a15] mb-3">
          You&apos;ve reached your plan&apos;s email account limit. Disconnect one below, or upgrade your plan to add more.
        </p>
      )}
      <div className="space-y-2">
        {!loaded && <p className="text-xs text-[#b8a898]">Checking…</p>}
        {loaded && accounts.length === 0 && (
          <p className="text-xs text-[#b8a898]">No email accounts connected yet.</p>
        )}
        {accounts.map((a) => (
          <div
            key={a.accountKey}
            className="flex items-center justify-between p-3 rounded-lg border border-green-500/30 bg-green-500/5"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: a.provider === "google" ? "#4285F420" : "#D83B0120" }}
              >
                {a.provider === "google" ? "📧" : "🏢"}
              </div>
              <div>
                <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {a.email || (a.provider === "google" ? "Google account" : "Microsoft 365 account")}
                </p>
                <p className="text-xs text-[#b8a898]">
                  {a.provider === "google" ? "Google Workspace / Gmail" : "Microsoft 365"} · email + calendar
                </p>
                {a.provider === "google" && a.canWriteCalendar === false && (
                  <p className="text-xs text-[#8a6a15] mt-0.5">
                    Calendar is read-only — add this Google account again to let the app add events.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => disconnect(a)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#1a2b4a]/20 text-[#7a8a99] hover:text-[#1a2b4a] dark:hover:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
            >
              Disconnect
            </button>
          </div>
        ))}
      </div>
      {loaded && (
        <div className="flex flex-wrap gap-2 mt-3">
          {atLimit ? (
            <p className="text-xs text-[#7a8a99]">Email account limit reached — upgrade your plan to connect more.</p>
          ) : (
            <>
              <a href="/api/google/auth" className={addBtn}>
                Add Google account
              </a>
              <a href="/api/microsoft/auth" className={addBtn}>
                Add Microsoft 365 account
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
