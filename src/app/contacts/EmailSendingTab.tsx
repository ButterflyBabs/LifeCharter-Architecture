"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, RefreshCw, Trash2, CheckCircle2, Clock, AlertTriangle, MailCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Contacts → Email sending: the account's own sending domain (DNS records to add,
// verification status) and who its emails come from. Babs's account keeps its
// existing setup and just sees a note here.

interface DnsRecord { record: string; type: string; name: string; value: string; priority: number | null; ttl: string | null; status: string | null }
type Status = "not_started" | "pending" | "verified" | "failed";
interface Profile { senderName: string | null; replyTo: string | null; signoff: string | null; supportEmail: string | null; address: string | null }
interface View {
  house: boolean;
  available?: boolean;
  domain?: { name: string; status: Status; records: DnsRecord[]; fromEmail: string | null } | null;
  fromLocal?: string;
  saved?: Profile;
  defaults?: { senderName: string; replyTo: string; signoff: string; supportEmail: string };
  using?: { senderName: string; replyTo: string; signoff: string; supportEmail: string; address: string };
  ready?: { bookings: boolean; marketing: boolean; reason: string | null };
}

const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-3 text-sm";
const BADGE: Record<Status, { label: string; cls: string; Icon: typeof Clock }> = {
  verified: { label: "Verified", cls: "bg-[#2E7C83]/15 text-[#1F5E63] dark:text-[#9fd3d6]", Icon: CheckCircle2 },
  pending: { label: "Checking", cls: "bg-[#c9a227]/15 text-[#8a6d12] dark:text-[#e6c96a]", Icon: Clock },
  not_started: { label: "Not verified yet", cls: "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#F8F5F0]", Icon: Clock },
  failed: { label: "Not found yet", cls: "bg-[#C76F56]/15 text-[#a4513a] dark:text-[#f0a893]", Icon: AlertTriangle },
};

export default function EmailSendingTab({ setMsg }: { setMsg: (m: string) => void }) {
  const [v, setV] = useState<View | null>(null);
  const [busy, setBusy] = useState(false);
  const [domain, setDomain] = useState("");
  const [p, setP] = useState({ senderName: "", replyTo: "", signoff: "", supportEmail: "", address: "", fromLocal: "hello" });

  const apply = useCallback((d: View) => {
    setV(d);
    if (!d.house && d.saved) setP({ senderName: d.saved.senderName ?? "", replyTo: d.saved.replyTo ?? "", signoff: d.saved.signoff ?? "", supportEmail: d.saved.supportEmail ?? "", address: d.saved.address ?? "", fromLocal: d.fromLocal ?? "hello" });
  }, []);
  useEffect(() => {
    fetch("/api/crm/sender", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d && typeof d.house === "boolean" && apply(d))
      .catch(() => {});
  }, [apply]);

  async function act(body: Record<string, unknown>, ok: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/crm/sender", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setMsg(d.error || "Something went wrong.");
      apply(d);
      setMsg(ok);
    } finally {
      setBusy(false);
    }
  }
  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => setMsg("Copied."));

  if (!v) return <p className="text-sm text-[#7a8a99]">Loading…</p>;
  if (v.house)
    return (
      <Card>
        <CardContent className="p-6 text-sm text-[#5a6472]">
          <MailCheck className="w-6 h-6 mb-2 text-[#c9a227]" />
          Your account sends exactly as it always has: each sequence&rsquo;s and broadcast&rsquo;s own From address, your sign-off, your support address and your business address. Nothing to set up here. Client accounts set up their own sending domain on this tab.
        </CardContent>
      </Card>
    );
  if (!v.available)
    return <Card><CardContent className="p-6 text-sm text-[#5a6472]">Email sending isn&rsquo;t switched on for accounts yet. Please contact support.</CardContent></Card>;

  const d = v.domain;
  const badge = d ? BADGE[d.status] : null;
  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardContent className="p-5 space-y-2 text-sm">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">How your emails go out</p>
          <p className="text-[#5a6472]">
            Campaigns, broadcasts and booking emails are sent from your own domain, so they come from your business and land in inboxes. Until your domain is verified, the Suite doesn&rsquo;t email your contacts at all. Calendar invites from a host&rsquo;s connected Google or Microsoft calendar still go out.
          </p>
          <ul className="space-y-1">
            <li>{v.ready?.bookings ? "✓" : "○"} Booking confirmations and reminders {v.ready?.bookings ? "are on" : "are waiting on your verified domain"}</li>
            <li>{v.ready?.marketing ? "✓" : "○"} Campaigns and broadcasts {v.ready?.marketing ? "are ready to send" : `are waiting: ${v.ready?.reason ?? ""}`}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">1. Your sending domain</p>
            {badge && (
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${badge.cls}`}>
                <badge.Icon className="w-3.5 h-3.5" /> {badge.label}
              </span>
            )}
          </div>
          {!d && (
            <>
              <p className="text-[#5a6472]">
                Use a subdomain of your business website, like <strong>mail.yourbusiness.com</strong>. It keeps your everyday email untouched. Only the account owner can add or remove it.
              </p>
              <div className="flex flex-wrap gap-2">
                <Input className="max-w-sm" placeholder="mail.yourbusiness.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
                <Button disabled={busy || !domain.trim()} onClick={() => act({ action: "add-domain", domain }, "Domain added. Now add the DNS records below.")}>Add domain</Button>
              </div>
            </>
          )}
          {d && (
            <>
              <p>
                <strong>{d.name}</strong>
                {d.fromEmail ? <span className="text-[#7a8a99]"> · your emails come from {d.fromEmail}</span> : null}
              </p>
              {d.status !== "verified" && (
                <ol className="list-decimal pl-5 space-y-1 text-[#5a6472]">
                  <li>Sign in where you manage your domain (for example GoDaddy, Squarespace, Cloudflare or Namecheap) and open its DNS settings.</li>
                  <li>Add each record below exactly as shown. Use the copy buttons so nothing gets mistyped.</li>
                  <li>Come back and click <strong>Check verification</strong>. It can take a few minutes, and up to 48 hours for some providers.</li>
                </ol>
              )}
              <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10">
                <table className="w-full text-xs">
                  <thead className="bg-[#1a2b4a]/5 text-left">
                    <tr><th className="p-2">Type</th><th className="p-2">Name / Host</th><th className="p-2">Value</th><th className="p-2">Priority</th><th className="p-2">Status</th></tr>
                  </thead>
                  <tbody>
                    {d.records.map((r, i) => (
                      <tr key={`${r.type}-${r.name}-${i}`} className="border-t border-[#1a2b4a]/10 align-top">
                        <td className="p-2 font-semibold">{r.type}</td>
                        <td className="p-2">
                          <span className="font-mono break-all">{r.name}</span>
                          <button onClick={() => copy(r.name)} className="ml-1 p-1 rounded hover:bg-[#1a2b4a]/5" aria-label="Copy name"><Copy className="inline w-3 h-3" /></button>
                        </td>
                        <td className="p-2 max-w-[340px]">
                          <span className="font-mono break-all">{r.value}</span>
                          <button onClick={() => copy(r.value)} className="ml-1 p-1 rounded hover:bg-[#1a2b4a]/5" aria-label="Copy value"><Copy className="inline w-3 h-3" /></button>
                        </td>
                        <td className="p-2">{r.priority ?? ""}</td>
                        <td className="p-2 capitalize">{(r.status || "").replace(/_/g, " ")}</td>
                      </tr>
                    ))}
                    {!d.records.length && <tr><td colSpan={5} className="p-3 text-[#7a8a99]">Click Check verification to load the records.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => act({ action: "check-domain" }, "Checked.")}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Check verification
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => confirm(`Remove ${d.name}? Emails from the Suite stop until you add a domain again.`) && act({ action: "remove-domain" }, "Domain removed.")}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3 text-sm">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">2. Who your emails come from</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">From name
              <Input placeholder={v.defaults?.senderName} value={p.senderName} onChange={(e) => setP({ ...p, senderName: e.target.value })} />
            </label>
            <label className="block">From address (before the @)
              <div className="flex items-center gap-1">
                <Input value={p.fromLocal} onChange={(e) => setP({ ...p, fromLocal: e.target.value })} />
                <span className="text-[#7a8a99] whitespace-nowrap">@{d?.name || "your domain"}</span>
              </div>
            </label>
            <label className="block">Replies go to
              <Input placeholder={v.defaults?.replyTo} value={p.replyTo} onChange={(e) => setP({ ...p, replyTo: e.target.value })} />
            </label>
            <label className="block">Support email in the footer
              <Input placeholder={v.using?.replyTo || v.defaults?.supportEmail} value={p.supportEmail} onChange={(e) => setP({ ...p, supportEmail: e.target.value })} />
            </label>
          </div>
          <label className="block">Sign-off (under every sequence and broadcast email)
            <textarea rows={2} placeholder={v.defaults?.signoff || "e.g. Warmly,\nJordan"} value={p.signoff} onChange={(e) => setP({ ...p, signoff: e.target.value })} className={field} />
          </label>
          <label className="block">Business mailing address <span className="text-[#C76F56]">(required for sequences and broadcasts)</span>
            <Input placeholder="Your Business LLC · 123 Main St · City, ST 00000" value={p.address} onChange={(e) => setP({ ...p, address: e.target.value })} />
            <span className="text-xs text-[#7a8a99]">Anti-spam law (CAN-SPAM) requires a real postal address on marketing emails. A PO box or registered mail service is fine.</span>
          </label>
          <p className="text-xs text-[#7a8a99]">Leave a box empty to use what&rsquo;s shown in grey.</p>
          <Button disabled={busy} onClick={() => act({ action: "save-profile", ...p }, "Saved.")}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}
