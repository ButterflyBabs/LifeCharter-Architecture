"use client";

import { useCallback, useEffect, useState } from "react";
import { HeartHandshake, ArrowLeft, Copy, Plus, Flame } from "lucide-react";
import AccountabilityWorkspace from "@/components/accountability/AccountabilityWorkspace";

interface Row {
  id: string;
  side: "a" | "b";
  status: "invited" | "active" | "paused" | "ended";
  partnerName: string;
  invitedMe: boolean;
  link: string | null;
  open: number;
  done: number;
  overdue: number;
  unread: number;
}

const STATUS: Record<string, string> = { invited: "Waiting for a yes", active: "Active", paused: "Paused", ended: "Ended" };
const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/30 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";

export default function Accountability() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/accountability", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    if (d.error) setMsg(d.error);
    setRows(d.partnerships ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function invite() {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/accountability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invite", name, email }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "Couldn't send that.");
    setName("");
    setEmail("");
    setShowInvite(false);
    setMsg(d.link ? `Invitation sent. They also have their own private link, which you can copy from their card.` : "Invitation sent. They'll find it under Accountability when they sign in.");
    await load();
    if (d.id) setSel(d.id);
  }
  const copy = async (link: string, id: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(id);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      window.prompt("Copy this link", link);
    }
  };

  const current = rows?.find((r) => r.id === sel) || null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a]">
          <HeartHandshake className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Accountability Partner</h1>
          <p className="text-[#7a8a99]">Someone beside you: your commitments, their encouragement, a gentle nudge when it counts.</p>
        </div>
      </div>

      {sel && current ? (
        <div className="space-y-4">
          <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2E7C83] hover:underline" onClick={() => { setSel(null); void load(); }}>
            <ArrowLeft className="h-4 w-4" /> All partners
          </button>
          <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">You &amp; {current.partnerName}</h2>
          <AccountabilityWorkspace
            key={sel}
            mode="app"
            getUrl={`/api/accountability?id=${sel}`}
            postUrl="/api/accountability"
            postExtra={{ id: sel }}
            tasksUrl="/api/accountability?tasks=1"
            onGone={() => { setSel(null); void load(); }}
          />
        </div>
      ) : (
        <div className="space-y-5">
          {msg && <p className="rounded-xl bg-[#2E7C83]/10 px-4 py-3 text-sm text-[#1F5E63]">{msg}</p>}

          {rows === null ? (
            <p className="text-sm text-[#7a8a99]">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-6 dark:bg-[#1a2b4a]/40">
              <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Invite someone to hold the other end</h2>
              <ul className="mt-3 space-y-2 text-sm text-[#5a6472] dark:text-[#b8c2cf]">
                <li><b>Choose what to share.</b> Your partner sees only the commitments you add here. Nothing else in your account.</li>
                <li><b>Anyone can be a partner.</b> Another Suite client, or a friend or colleague with no account. They get a private link and nothing to sign up for.</li>
                <li><b>Both of you write the rules.</b> How you each want to be held accountable, what you&apos;ll reward, and what happens if something slips, with AI help if you want it.</li>
              </ul>
              <p className="mt-3 text-sm text-[#5a6472] dark:text-[#b8c2cf]">Nobody in mind yet? <a className="font-semibold text-[#2E7C83] hover:underline" href="/community/s/commons/accountability-partners">Find one in the Collective</a>.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/40">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{r.partnerName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.status === "active" ? "bg-[#2c6b3f]/15 text-[#2c6b3f]" : r.status === "ended" ? "bg-[#1a2b4a]/10 text-[#5a6472]" : "bg-[#c9a227]/20 text-[#6b5410]"}`}>{r.invitedMe ? "Invited you" : STATUS[r.status]}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">
                    <span><b className="text-[#1a2b4a] dark:text-[#F8F5F0]">{r.open}</b> open</span>
                    <span><b className="text-[#2c6b3f]">{r.done}</b> done</span>
                    {r.overdue > 0 && <span className="inline-flex items-center gap-1 text-[#b3422f]"><Flame className="h-3.5 w-3.5" />{r.overdue} past date</span>}
                    {r.unread > 0 && <span className="font-semibold text-[#2E7C83]">{r.unread} new</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="rounded-full bg-[#1a2b4a] px-4 py-1.5 text-sm font-semibold text-[#F8F5F0]" onClick={() => setSel(r.id)}>{r.invitedMe ? "See the invitation" : "Open"}</button>
                    {r.link && (
                      <button className="inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/20 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]" onClick={() => copy(r.link!, r.id)}>
                        <Copy className="h-3 w-3" /> {copied === r.id ? "Copied" : "Copy their link"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {rows !== null && rows.length > 0 && <p className="text-sm text-[#7a8a99]">Looking for someone new? <a className="font-semibold text-[#2E7C83] hover:underline" href="/community/s/commons/accountability-partners">Find an accountability partner in the Collective</a>.</p>}

          {showInvite ? (
            <div className="max-w-md space-y-2 rounded-2xl border border-[#c9a227]/30 bg-white p-5 dark:bg-[#1a2b4a]/40">
              <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Who do you want beside you?</p>
              <input className={field} placeholder="Their name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              <input className={field} type="email" placeholder="Their email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <p className="text-xs text-[#7a8a99]">They get an email with your invitation. If they&apos;re not a Suite client, they use a private link. No account needed.</p>
              <div className="flex gap-2">
                <button className="rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-[#F8F5F0] disabled:opacity-50" disabled={busy || !name.trim() || !email.trim()} onClick={invite}>{busy ? "Sending…" : "Send invitation"}</button>
                <button className="rounded-full border border-[#1a2b4a]/20 px-4 py-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]" onClick={() => setShowInvite(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="inline-flex items-center gap-1.5 rounded-full bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#1a2b4a]" onClick={() => setShowInvite(true)}>
              <Plus className="h-4 w-4" /> Invite an accountability partner
            </button>
          )}
        </div>
      )}
    </div>
  );
}
