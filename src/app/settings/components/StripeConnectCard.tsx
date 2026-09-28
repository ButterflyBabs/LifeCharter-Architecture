"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Status {
  connected: boolean;
  account: string;
  lastSyncAt: string | null;
  lastAdded: number | null;
  lastError: string | null;
}

// The client's own Stripe account: payments, fees and refunds sync into their
// ledger every morning (and on demand). Uses a read-only restricted key.
export default function StripeConnectCard() {
  const [s, setS] = useState<Status | null>(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const d = await fetch("/api/integrations/stripe", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (d) setS(d);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function call(method: string, body?: Record<string, unknown>) {
    const r = await fetch("/api/integrations/stripe", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    return { ok: r.ok, d };
  }

  async function connect() {
    if (!key.trim()) return setMsg({ ok: false, text: "Paste your Stripe restricted key first." });
    setBusy("connect");
    setMsg(null);
    const { ok, d } = await call("POST", { apiKey: key.trim() });
    setBusy("");
    if (!ok) return setMsg({ ok: false, text: d.error || "Couldn't connect." });
    setKey("");
    setMsg({ ok: true, text: `Stripe connected${d.account ? ` (${d.account})` : ""}. ${d.added ?? 0} ledger entries added from the last 90 days.` });
    void load();
  }
  async function sync() {
    setBusy("sync");
    setMsg(null);
    const { ok, d } = await call("POST", { action: "sync" });
    setBusy("");
    setMsg(ok ? { ok: true, text: `Synced. ${d.added} new entr${d.added === 1 ? "y" : "ies"} added.` } : { ok: false, text: d.error || "Couldn't sync." });
    void load();
  }
  async function disconnect() {
    if (!confirm("Disconnect Stripe? Payments already in your ledger stay there.")) return;
    setBusy("disconnect");
    await call("DELETE");
    setBusy("");
    setMsg({ ok: true, text: "Stripe disconnected." });
    void load();
  }

  return (
    <Card className="border-[#635bff]/30">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#635bff]/15 flex items-center justify-center text-2xl">💳</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Stripe (your payments → your ledger)</h3>
              {s?.connected && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected{s.account ? ` · ${s.account}` : ""}
                </span>
              )}
            </div>
            <p className="text-sm text-[#7a8a99]">
              Every payment you take through Stripe (including paid Stripe invoices) is added to your Finance Center as income, with Stripe&apos;s fees and any refunds as expenses. It syncs each morning, never twice.
            </p>
          </div>
        </div>
        {s?.connected ? (
          <div className="space-y-2">
            <p className="text-xs text-[#7a8a99]">
              {s.lastSyncAt ? `Last synced ${new Date(s.lastSyncAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : "Not synced yet"}
              {s.lastError ? ` · last problem: ${s.lastError}` : ""}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={sync} disabled={!!busy}>{busy === "sync" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}Sync now</Button>
              <Button size="sm" variant="outline" onClick={disconnect} disabled={!!busy}>Disconnect</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <ol className="list-decimal pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] space-y-1">
              <li>In Stripe, go to <strong>Developers → API keys → Create restricted key</strong>.</li>
              <li>Name it &ldquo;LifeCharter Command Suite&rdquo; and set <strong>Balance</strong> and <strong>Charges</strong> to <strong>Read</strong> (leave everything else as None).</li>
              <li>Create it, copy the key (it starts with <code>rk_live_</code>) and paste it here.</li>
            </ol>
            <div className="flex gap-2">
              <Input type="password" placeholder="rk_live_…" value={key} onChange={(e) => setKey(e.target.value)} />
              <Button onClick={connect} disabled={busy === "connect"}>{busy === "connect" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}</Button>
            </div>
          </div>
        )}
        {msg && <p className={`text-sm ${msg.ok ? "text-[#2c6b3f]" : "text-[#8a2f2f]"}`}>{msg.text}</p>}
      </CardContent>
    </Card>
  );
}
