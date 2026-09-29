"use client";

import { useEffect, useState } from "react";
import SlotPicker from "@/components/booking/SlotPicker";

// The invitee's private page to reschedule or cancel (link in every email).
interface Data {
  booking: { status: string; start: string; name: string; timezone: string | null; meetingUrl: string | null };
  calendar: { name: string; slug: string; duration: number };
  hostName: string;
}

export default function ManageBooking({ params }: { params: { token: string } }) {
  const [d, setD] = useState<Data | null | undefined>(undefined);
  const [tz, setTz] = useState("America/Denver");
  const [mode, setMode] = useState<"" | "cancel" | "move">("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch(`/api/book/manage/${params.token}`)
      .then((r) => r.json())
      .then((x) => setD(x.booking ? x : null))
      .catch(() => setD(null));
  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver");
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const when = (s: string) => new Date(s).toLocaleString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    const r = await fetch(`/api/book/manage/${params.token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const x = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(x.error || "Something went wrong.");
    if (x.manage) window.location.href = x.manage;
    else {
      setMode("");
      setMsg(body.action === "cancel" ? "Your meeting is canceled. A confirmation is on its way." : "Done.");
      void load();
    }
  }

  return (
    <main className="min-h-screen bg-[#FBF8F1] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#EADFCF] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8">
        {d === undefined && <p className="text-[#56616E]">Loading…</p>}
        {d === null && <p className="text-[#56616E]">We couldn&rsquo;t find that booking. Please check the link in your email, or reply to your confirmation email.</p>}
        {d && (
          <>
            <h1 className="text-2xl font-semibold text-[#1F3A3D]">{d.calendar.name}</h1>
            <p className="mt-1 text-[#2E3A46]">
              {when(d.booking.start)} · {d.calendar.duration} minutes{d.hostName ? ` with ${d.hostName}` : ""}
            </p>
            <p className="mt-1 text-sm capitalize text-[#56616E]">{d.booking.status === "confirmed" ? "Confirmed" : d.booking.status}</p>
            {d.booking.meetingUrl && (
              <a href={d.booking.meetingUrl} className="mt-3 inline-block text-sm text-[#2E7C83] underline">Join on Zoom</a>
            )}
            {msg && <p className="mt-4 rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">{msg}</p>}
            {d.booking.status === "confirmed" && Date.parse(d.booking.start) > Date.now() && (
              <div className="mt-6">
                {mode === "" && (
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setMode("move")} className="rounded-full bg-[#2E7C83] px-5 py-2.5 text-sm font-semibold text-white">Reschedule</button>
                    <button onClick={() => setMode("cancel")} className="rounded-full border border-[#C76F56] px-5 py-2.5 text-sm font-semibold text-[#C76F56]">Cancel</button>
                  </div>
                )}
                {mode === "cancel" && (
                  <div className="space-y-3">
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Anything you'd like to share (optional)" className="w-full rounded-xl border border-[#EADFCF] p-3 text-sm" />
                    <div className="flex gap-3">
                      <button disabled={busy} onClick={() => act({ action: "cancel", reason })} className="rounded-full bg-[#C76F56] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Cancel my meeting</button>
                      <button onClick={() => setMode("")} className="text-sm text-[#56616E] underline">Keep it</button>
                    </div>
                  </div>
                )}
                {mode === "move" && (
                  <div>
                    <p className="mb-3 text-sm text-[#56616E]">Choose a new time. Your current time stays booked until you pick one.</p>
                    <SlotPicker slug={d.calendar.slug} tz={tz} onPick={(s) => !busy && act({ action: "reschedule", start: s, timezone: tz })} />
                    <button onClick={() => setMode("")} className="mt-4 text-sm text-[#56616E] underline">Never mind</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
