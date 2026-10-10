"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Search, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  status: string;
  createdAt: string;
}
interface LogRow {
  id: string;
  master_plan_id: string;
  client_name: string | null;
  started_at: string;
  ended_at: string | null;
  reason: string | null;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function ViewAs() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [log, setLog] = useState<LogRow[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/view-as", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Couldn't load clients");
      setClients(j.clients || []);
      setLog(j.log || []);
      setActivePlanId(j.activePlanId || null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s));
  }, [clients, q]);

  const open = async (planId: string) => {
    setBusy(planId);
    setErr(null);
    try {
      const r = await fetch("/api/admin/view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, reason }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Couldn't open that account");
      window.location.assign("/");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't open that account");
      setBusy(null);
    }
  };

  const close = async () => {
    setBusy("close");
    await fetch("/api/admin/view-as", { method: "DELETE" }).catch(() => null);
    setBusy(null);
    load();
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center gap-3 mb-1">
        <Eye className="w-6 h-6 text-[#c9a227]" />
        <h1 className="text-2xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">View as client</h1>
      </div>
      <p className="text-sm text-[#5a6a7a] dark:text-[#b8a898] mb-5 max-w-3xl">
        Open a client&apos;s account to see what they see, for support. It is read-only: nothing can be changed, sent or
        deleted while you are in it, and their inbox, calendar, connected accounts, logins vault and billing stay closed.
        Every opening is logged, and the client can see it in their Settings. It closes by itself after 2 hours.
      </p>

      {activePlanId && (
        <Card className="mb-4 border-[#c9a227]">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">You have a client account open right now.</span>
            <Button onClick={close} disabled={busy === "close"}>
              Close it
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardContent className="p-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="block mb-1 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Why are you opening it? (optional, saved in the log)</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              placeholder="e.g. Support request: setup step stuck"
              className="w-full rounded-lg border border-[#d9d2c3] dark:border-[#3a3a55] bg-white dark:bg-[#22223a] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Find a client</span>
            <span className="relative block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8a99]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name or email"
                className="w-full rounded-lg border border-[#d9d2c3] dark:border-[#3a3a55] bg-white dark:bg-[#22223a] pl-9 pr-3 py-2 text-sm"
              />
            </span>
          </label>
        </CardContent>
      </Card>

      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

      <Card className="mb-6">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-[#7a8a99]">Loading clients…</p>
          ) : shown.length === 0 ? (
            <p className="p-4 text-sm text-[#7a8a99]">No clients match.</p>
          ) : (
            <ul className="divide-y divide-[#e8e1d2] dark:divide-[#3a3a55]">
              {shown.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 p-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{c.name}</div>
                    <div className="text-xs text-[#7a8a99] truncate">
                      {c.email || "no email on file"} · joined {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {c.status !== "active" ? ` · ${c.status}` : ""}
                    </div>
                  </div>
                  <Button onClick={() => open(c.id)} disabled={busy !== null}>
                    {busy === c.id ? "Opening…" : "View read-only"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-[#c9a227]" />
        <h2 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Access log (latest 25)</h2>
      </div>
      <Card>
        <CardContent className="p-0">
          {log.length === 0 ? (
            <p className="p-4 text-sm text-[#7a8a99]">Nothing has been opened yet.</p>
          ) : (
            <ul className="divide-y divide-[#e8e1d2] dark:divide-[#3a3a55]">
              {log.map((l) => (
                <li key={l.id} className="p-3 text-sm">
                  <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{l.client_name || "Client"}</span>
                  <span className="text-[#7a8a99]">
                    {" "}
                    · {when(l.started_at)}
                    {l.ended_at ? ` to ${new Date(l.ended_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : " · still open or timed out"}
                    {l.reason ? ` · ${l.reason}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
