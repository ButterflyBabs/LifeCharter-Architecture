"use client";

import { useEffect, useState } from "react";

// A host's private page for connecting the calendars their bookings check.
interface Conn {
  id: string;
  provider: string;
  email: string | null;
}

export default function ConnectCalendars({ params }: { params: { hostId: string } }) {
  const [k, setK] = useState("");
  const [data, setData] = useState<{ name: string; connections: Conn[] } | null | undefined>(undefined);
  const [flash, setFlash] = useState("");

  const load = (key: string) =>
    fetch(`/api/book/connect?host=${params.hostId}&k=${key}`)
      .then((r) => r.json())
      .then((d) => setData(d.name ? d : null))
      .catch(() => setData(null));
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const key = q.get("k") || "";
    setK(key);
    const c = q.get("connected");
    if (c === "error") setFlash("That didn't connect. Please try again.");
    else if (c) setFlash(`${c === "google" ? "Google" : "Microsoft"} calendar connected.`);
    void load(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(id: string) {
    if (!confirm("Disconnect this calendar?")) return;
    await fetch("/api/book/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ host: params.hostId, k, action: "remove", id }) });
    void load(k);
  }

  const start = (p: string) => `/api/book/connect?host=${params.hostId}&k=${k}&provider=${p}`;
  return (
    <main className="min-h-screen bg-[#FBF8F1] px-4 py-10 text-[#1F3A3D] [color-scheme:light]">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#EADFCF] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8">
        {data === undefined && <p className="text-[#56616E]">Loading…</p>}
        {data === null && <p className="text-[#56616E]">This link isn&rsquo;t valid. Please ask for a new one.</p>}
        {data && (
          <>
            <h1 className="text-2xl font-semibold text-[#1F3A3D]">Connect your calendars, {data.name.split(" ")[0]}</h1>
            <p className="mt-2 leading-relaxed text-[#2E3A46]">
              Connect every calendar you use. People can only book times when all of them are free, and new meetings are added to the first one you connect. This only gives the booking system access to your calendar, not your email.
            </p>
            {flash && <p className="mt-4 rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">{flash}</p>}
            <div className="mt-5 space-y-2">
              {data.connections.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#EADFCF] px-4 py-3 text-sm">
                  <span>
                    <strong className="capitalize">{c.provider}</strong> · {c.email || "calendar"}
                  </span>
                  <button onClick={() => remove(c.id)} className="text-[#C76F56] underline">Disconnect</button>
                </div>
              ))}
              {!data.connections.length && <p className="text-sm text-[#7a8a99]">No calendars connected yet.</p>}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={start("google")} className="rounded-full bg-[#2E7C83] px-5 py-2.5 text-sm font-semibold text-white">Connect a Google calendar</a>
              <a href={start("microsoft")} className="rounded-full bg-[#1a2b4a] px-5 py-2.5 text-sm font-semibold text-white">Connect a Microsoft calendar</a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
