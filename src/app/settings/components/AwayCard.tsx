"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Away {
  starts_on: string;
  ends_on: string;
  message: string | null;
  block_bookings: boolean;
  auto_reply: boolean;
  pause_nudges: boolean;
}

// Settings › Out of office (task 1155): pick your away dates once and the Suite covers for you.
export default function AwayCard() {
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<Away | null>(null);
  const [onNow, setOnNow] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [today, setToday] = useState("");
  const [f, setF] = useState({ startsOn: "", endsOn: "", message: "", blockBookings: true, autoReply: true, pauseNudges: true });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    const d = await fetch("/api/away", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    setLoaded(true);
    if (!d) return;
    setSaved(d.away);
    setOnNow(Boolean(d.onNow));
    setNote(d.note);
    setToday(d.today || "");
    if (d.away) setF({ startsOn: d.away.starts_on, endsOn: d.away.ends_on, message: d.away.message || "", blockBookings: d.away.block_bookings, autoReply: d.away.auto_reply, pauseNudges: d.away.pause_nudges });
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/away", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error || "Couldn't save." });
    setMsg({ ok: true, text: "Saved. The Suite will cover for you on those dates." });
    load();
  }
  async function clear() {
    setBusy(true);
    await fetch("/api/away", { method: "DELETE" });
    setBusy(false);
    setSaved(null);
    setOnNow(false);
    setNote(null);
    setF({ startsOn: "", endsOn: "", message: "", blockBookings: true, autoReply: true, pauseNudges: true });
    setMsg({ ok: true, text: "You're back. Everything runs as normal." });
  }

  const box = (key: "blockBookings" | "autoReply" | "pauseNudges", label: string, help: string) => (
    <label className="flex items-start gap-3 rounded-lg border border-border p-3">
      <input type="checkbox" className="mt-1" checked={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.checked })} />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{help}</span>
      </span>
    </label>
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-semibold">Out of office</h3>
          <p className="text-sm text-muted-foreground">Going away? Pick your dates and the Suite covers for you. Your clients' emails, sequences, events and booking reminders keep running.</p>
        </div>
        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {saved && (
              <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(46,124,131,0.10)" }}>
                <strong>{onNow ? "You're away now." : "Away dates set."}</strong> Clients see: “{note}”
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">First day away</span>
                <input type="date" min={today} className="w-full rounded-md border border-border bg-background px-3 py-2" value={f.startsOn} onChange={(e) => setF({ ...f, startsOn: e.target.value, endsOn: f.endsOn && f.endsOn >= e.target.value ? f.endsOn : e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Last day away</span>
                <input type="date" min={f.startsOn || today} className="w-full rounded-md border border-border bg-background px-3 py-2" value={f.endsOn} onChange={(e) => setF({ ...f, endsOn: e.target.value })} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Note to clients (optional)</span>
              <textarea rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Leave blank for: I'm away right now and back on (date). I'll reply when I'm back." value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
            </label>
            <div className="grid gap-2">
              {box("blockBookings", "Close my booking pages on those dates", "No one can book a time while you're away. Your booking pages show your note.")}
              {box("autoReply", "Answer portal messages for me", "A client who messages you in their portal gets your note back once. You still get their message.")}
              {box("pauseNudges", "Pause my reminder emails", "Your daily alerts, task reminders and to-do emails stop until you're back.")}
            </div>
            <p className="text-xs text-muted-foreground">Your Gmail or Outlook inbox needs its own vacation responder. The Suite can't answer email sent straight to your inbox.</p>
            {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={busy || !f.startsOn || !f.endsOn}>{saved ? "Save changes" : "Set my away dates"}</Button>
              {saved && <Button variant="outline" onClick={clear} disabled={busy}>I'm back (turn off)</Button>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
