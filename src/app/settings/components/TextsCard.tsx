"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Settings › Text messages (task 1151): get the account's own texting number approved, choose the reminders, see use.

type Biz = { legalName: string; dba: string; website: string; type: string; ein: string; street: string; street2: string; city: string; state: string; postal: string; contactFirst: string; contactLast: string; contactEmail: string; contactPhone: string; privacyUrl: string };
type Data = {
  ready: boolean;
  account: { status: string; status_note: string | null; phonePretty: string; reminders_on: boolean; reminder_24h: boolean; reminder_1h: boolean; template_24h: string | null; template_1h: string | null; submitted_at: string | null } | null;
  business: Biz;
  gaps: string[];
  cap: number;
  used: number;
  defaults: { template24h: string; template1h: string };
  consent: string;
  preview24h: string;
  preview1h: string;
  recent: { id: string; direction: "in" | "out"; kind: string; to: string; from: string; body: string; status: string; error: string | null; created_at: string }[];
};

const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
const STATUS: Record<string, { label: string; tone: string; text: string }> = {
  none: { label: "Not set up", tone: "bg-gray-100 text-gray-700", text: "Fill in your business details below and press Get my texting number." },
  pending: { label: "Waiting for approval", tone: "bg-amber-100 text-amber-800", text: "Your number is with the carriers for approval. It usually takes 5 to 15 business days. We check every hour and this page updates on its own." },
  in_review: { label: "In review", tone: "bg-amber-100 text-amber-800", text: "The carriers are reviewing your details now. It usually takes a few more business days." },
  approved: { label: "Approved", tone: "bg-emerald-100 text-emerald-800", text: "Texting is on. Your booking pages now offer a 'text me reminders' box." },
  rejected: { label: "Needs changes", tone: "bg-red-100 text-red-800", text: "The carriers asked for changes. Check the note, fix your details below and send them again (same number, no extra cost)." },
  suspended: { label: "Paused", tone: "bg-red-100 text-red-800", text: "Texting is paused on this account. Please contact support." },
};

function F({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

export default function TextsCard() {
  const [d, setD] = useState<Data | null>(null);
  const [closed, setClosed] = useState(false);
  const [biz, setBiz] = useState<Biz | null>(null);
  const [set, setSet] = useState({ remindersOn: true, reminder24h: true, reminder1h: true, template24h: "", template1h: "" });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testTo, setTestTo] = useState("");

  async function load() {
    const r = await fetch("/api/sms/account", { cache: "no-store" });
    if (r.status === 404) return setClosed(true);
    const x = (await r.json().catch(() => null)) as Data | null;
    if (!x) return;
    setD(x);
    setBiz(x.business);
    setSet({ remindersOn: x.account?.reminders_on ?? true, reminder24h: x.account?.reminder_24h ?? true, reminder1h: x.account?.reminder_1h ?? true, template24h: x.account?.template_24h || x.defaults.template24h, template1h: x.account?.template_1h || x.defaults.template1h });
  }
  useEffect(() => {
    load();
  }, []);

  async function post(action: string, extra: Record<string, unknown>, ok: string) {
    setBusy(action);
    setMsg(null);
    const r = await fetch("/api/sms/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    const x = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) return setMsg({ ok: false, text: x.error || "That didn't work." });
    setMsg({ ok: true, text: ok });
    load();
  }

  if (closed)
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold">Text messages</h3>
          <p className="mt-1 text-sm text-muted-foreground">Text reminders are coming to your account soon.</p>
        </CardContent>
      </Card>
    );
  if (!d || !biz) return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  const st = d.account?.status || "none";
  const info = STATUS[st] ?? STATUS.none;
  const locked = st === "pending" || st === "in_review" || st === "approved";
  const b = (k: keyof Biz) => ({ value: biz[k], disabled: locked, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setBiz({ ...biz, [k]: e.target.value }) });
  const pct = Math.min(100, Math.round((d.used / Math.max(1, d.cap)) * 100));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Text messages</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${info.tone}`}>{info.label}</span>
          </div>
          <p className="text-sm text-muted-foreground">Text reminders to people who book with you, from your own number. Included in your plan: {d.cap.toLocaleString()} texts a month.</p>
          <p className="text-sm">{info.text}</p>
          {d.account?.phonePretty && <p className="text-sm">Your texting number: <strong>{d.account.phonePretty}</strong></p>}
          {st === "rejected" && d.account?.status_note && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">Note from the carriers: {d.account.status_note}</p>}
          <div>
            <div className="h-2 w-full rounded-full bg-muted"><div className="h-2 rounded-full bg-[#2E7C83]" style={{ width: `${pct}%` }} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{d.used.toLocaleString()} of {d.cap.toLocaleString()} texts used this month. Starts fresh on the 1st.</p>
          </div>
          {!d.ready && <p className="text-sm text-red-700">Texting isn&apos;t connected on the Suite yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <h3 className="font-semibold">Your business details</h3>
          <p className="text-xs text-muted-foreground">US carriers approve every texting number for a real business. These details go to Twilio (our texting provider) and the carriers only.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Legal business name"><input className={input} {...b("legalName")} /></F>
            <F label="Name clients know you by (optional)"><input className={input} {...b("dba")} /></F>
            <F label="Website"><input className={input} placeholder="https://" {...b("website")} /></F>
            <F label="Business type">
              <select className={input} {...b("type")}>
                <option value="PRIVATE_PROFIT">Company (LLC, corporation)</option>
                <option value="SOLE_PROPRIETOR">Sole proprietor (no EIN)</option>
                <option value="NON_PROFIT">Nonprofit</option>
              </select>
            </F>
            {biz.type !== "SOLE_PROPRIETOR" && <F label="EIN"><input className={input} placeholder="12-3456789" {...b("ein")} /></F>}
            <F label="Privacy policy link (optional)"><input className={input} placeholder="https://" {...b("privacyUrl")} /></F>
            <F label="Street address" wide><input className={input} {...b("street")} /></F>
            <F label="City"><input className={input} {...b("city")} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="State"><input className={input} {...b("state")} /></F>
              <F label="ZIP"><input className={input} {...b("postal")} /></F>
            </div>
            <F label="Contact first name"><input className={input} {...b("contactFirst")} /></F>
            <F label="Contact last name"><input className={input} {...b("contactLast")} /></F>
            <F label="Contact email"><input className={input} type="email" {...b("contactEmail")} /></F>
            <F label="Contact phone"><input className={input} type="tel" {...b("contactPhone")} /></F>
          </div>
          {!locked && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={!!busy} onClick={() => post("business", { business: biz }, "Saved.")}>Save details</Button>
              <Button disabled={!!busy || !d.ready} onClick={() => post("register", { business: biz }, "Sent for approval. We'll keep checking.")}>{busy === "register" ? "Sending…" : st === "rejected" ? "Send again for approval" : "Get my texting number"}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <h3 className="font-semibold">Booking reminders by text</h3>
          <p className="text-xs text-muted-foreground">People only get texts if they tick this box when they book: “{d.consent}” Texts only go out between 8 AM and 9 PM their time, never to anyone who replied STOP.</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={set.remindersOn} onChange={(e) => setSet({ ...set, remindersOn: e.target.checked })} /> Offer text reminders on my booking pages</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={set.reminder24h} onChange={(e) => setSet({ ...set, reminder24h: e.target.checked })} /> The day before</label>
          <textarea className={input} rows={2} value={set.template24h} onChange={(e) => setSet({ ...set, template24h: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={set.reminder1h} onChange={(e) => setSet({ ...set, reminder1h: e.target.checked })} /> About an hour before</label>
          <textarea className={input} rows={2} value={set.template1h} onChange={(e) => setSet({ ...set, template1h: e.target.value })} />
          <p className="text-xs text-muted-foreground">Use {"{first}"}, {"{business}"}, {"{event}"}, {"{time}"} and {"{date}"}. Your business name and “Reply STOP to opt out” are always included. Example: {d.preview24h}</p>
          <Button disabled={!!busy} onClick={() => post("settings", set, "Saved.")}>Save reminders</Button>
          {st === "approved" && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <input className={`${input} max-w-xs`} type="tel" placeholder="Your mobile, to send yourself a test" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
              <Button variant="outline" disabled={!!busy || !testTo} onClick={() => post("test", { to: testTo }, "Test text sent.")}>Send me a test</Button>
            </div>
          )}
          {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}
        </CardContent>
      </Card>

      {d.recent.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold">Recent texts</h3>
            <div className="mt-3 divide-y divide-border">
              {d.recent.map((m) => (
                <div key={m.id} className="py-2 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {m.direction === "out" ? `to ${m.to}` : `from ${m.from}`} · {m.kind} · {m.status}
                  </p>
                  <p className="whitespace-pre-line">{m.body}</p>
                  {m.error && <p className="text-xs text-red-700">{m.error}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
