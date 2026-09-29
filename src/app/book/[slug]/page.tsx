"use client";

import { useEffect, useState } from "react";
import SlotPicker from "@/components/booking/SlotPicker";

// Public booking page: lccommandsuite.com/book/<slug>. ?name=&email= prefill.
interface Q {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
}
interface Meta {
  name: string;
  description: string | null;
  duration: number;
  location: string;
  questions: Q[];
  hostName: string | null;
}
const box = "mt-1 w-full rounded-xl border border-[#EADFCF] bg-white px-4 py-2.5 text-[15px] text-[#1F2B3A] outline-none focus:border-[#2E7C83] focus:ring-2 focus:ring-[#2E7C83]/20";

export default function BookPage({ params }: { params: { slug: string } }) {
  const [tz, setTz] = useState("America/Denver");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [pick, setPick] = useState("");
  const [prefill, setPrefill] = useState({ name: "", email: "" });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ start: string; manage: string } | null>(null);

  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver");
    const q = new URLSearchParams(window.location.search);
    let saved: { name?: string; email?: string } = {};
    try { saved = JSON.parse(sessionStorage.getItem("bk_prefill") || "{}"); } catch {}
    setPrefill({ name: q.get("name") || saved.name || "", email: q.get("email") || saved.email || "" });
  }, []);

  const when = (s: string) => new Date(s).toLocaleString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setErr("");
    const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const answers = Object.fromEntries((meta?.questions ?? []).map((q) => [q.name, f[`q_${q.name}`] || ""]));
    const r = await fetch(`/api/book/${params.slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: pick, name: f.name, email: f.email, phone: f.phone, timezone: tz, answers, _hp: f._hp }),
    });
    const d = await r.json().catch(() => ({}));
    setSending(false);
    if (r.ok) setDone({ start: pick, manage: d.manage });
    else {
      setErr(d.error || "Something went wrong. Please try again.");
      if (r.status === 409) setPick("");
    }
  }

  return (
    <main className="min-h-screen bg-[#FBF8F1] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#EADFCF] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8">
        <h1 className="text-2xl font-semibold text-[#1F3A3D]">{meta?.name || " "}</h1>
        {meta && (
          <p className="mt-1 text-sm text-[#56616E]">
            {meta.duration} minutes{meta.hostName ? ` with ${meta.hostName}` : ""}
            {meta.location === "zoom" ? " · Zoom" : meta.location === "phone" ? " · Phone" : ""}
          </p>
        )}
        {meta?.description && <p className="mt-3 leading-relaxed text-[#2E3A46] whitespace-pre-line">{meta.description}</p>}

        <div className="mt-6">
          {done ? (
            <div>
              <h2 className="text-xl font-semibold text-[#1F3A3D]">You&rsquo;re booked</h2>
              <p className="mt-2 text-[#2E3A46]">{when(done.start)}</p>
              <p className="mt-2 text-sm text-[#56616E]">A confirmation email and a calendar invitation are on their way.</p>
              <a href={done.manage} className="mt-4 inline-block text-sm text-[#2E7C83] underline">Reschedule or cancel</a>
            </div>
          ) : !pick ? (
            <>
              {err && <p className="mb-3 text-sm text-[#8a2f2f]">{err}</p>}
              <SlotPicker slug={params.slug} tz={tz} onPick={setPick} onMeta={(m) => setMeta(m as unknown as Meta)} />
            </>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-[#2E7C83]/10 px-4 py-3 text-sm">
                <span className="font-medium text-[#1F5E63]">{when(pick)}</span>
                <button type="button" onClick={() => setPick("")} className="text-[#2E7C83] underline">Change</button>
              </div>
              <label className="block text-sm font-medium">Name *<input name="name" required defaultValue={prefill.name} autoComplete="name" className={box} /></label>
              <label className="block text-sm font-medium">Email *<input name="email" type="email" required defaultValue={prefill.email} autoComplete="email" className={box} /></label>
              <label className="block text-sm font-medium">Phone{meta?.location === "phone" ? " *" : ""}<input name="phone" type="tel" required={meta?.location === "phone"} autoComplete="tel" className={box} /></label>
              {(meta?.questions ?? []).map((q) => (
                <label key={q.name} className="block text-sm font-medium">
                  {q.label}
                  {q.required ? " *" : ""}
                  {q.type === "textarea" ? (
                    <textarea name={`q_${q.name}`} required={q.required} rows={3} className={box} />
                  ) : q.options?.length ? (
                    <select name={`q_${q.name}`} required={q.required} defaultValue="" className={box}>
                      <option value="" disabled>Choose one</option>
                      {q.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input name={`q_${q.name}`} required={q.required} className={box} />
                  )}
                </label>
              ))}
              <input name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              {err && <p className="text-sm text-[#8a2f2f]">{err}</p>}
              <button disabled={sending} className="w-full rounded-full bg-[#2E7C83] px-6 py-3 font-semibold text-white hover:bg-[#256b71] disabled:opacity-60">
                {sending ? "Booking…" : "Confirm booking"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
