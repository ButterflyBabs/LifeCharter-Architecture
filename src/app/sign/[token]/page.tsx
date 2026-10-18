"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A signer's private page (task 1072): confirm the emailed code, read, agree to sign electronically, sign or decline.
type View = {
  state: "code" | "ready" | "waiting" | "signed" | "completed" | "declined" | "voided" | "expired";
  business: string;
  logo: string | null;
  title: string;
  kind: string;
  signer: { name: string; email: string };
  others: { name: string; signed: boolean }[];
  body: string | null;
  fileUrl: string | null;
  fileName: string | null;
  amount: number | null;
  consent: string;
  agree: string;
  canDownload: boolean;
  next: string | null;
};

const btn = "rounded-full bg-[#2E7C83] px-6 py-3 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50";
const box = "w-full rounded-xl border border-[#E5DDCF] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#2E7C83]/30";

export default function SignPage({ params }: { params: { token: string } }) {
  const [v, setV] = useState<View | null | undefined>(undefined);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [mode, setMode] = useState<"typed" | "drawn">("typed");
  const [typed, setTyped] = useState("");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [drawn, setDrawn] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/sign/${params.token}`, { cache: "no-store" });
    const d = await r.json().catch(() => null);
    if (!r.ok) {
      setErr(d?.error || "This signing link isn't active.");
      setV(null);
      return;
    }
    setV(d);
    if (d.signer?.name) setTyped((t) => t || d.signer.name);
  }, [params.token]);
  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setErr("");
    const r = await fetch(`/api/sign/${params.token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setErr(d.error || "Something went wrong. Please try again.");
      return null;
    }
    return d;
  }

  // Drawing the signature (mouse, finger or stylus).
  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    canvas.current!.setPointerCapture(e.pointerId);
    const p = pos(e);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1F2B3A";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setDrawn(true);
  };
  const clear = () => {
    const c = canvas.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setDrawn(false);
  };

  async function sign() {
    const image = mode === "drawn" ? canvas.current?.toDataURL("image/png") : undefined;
    const d = await post({ action: "sign", consent, type: mode, text: mode === "typed" ? typed : undefined, image });
    if (d) {
      setDone(d.completed ? "Thank you. Everyone has signed, and a signed copy is on its way to your email." : "Thank you. Your signature is saved. When everyone has signed, you'll get a signed copy by email.");
      await load();
    }
  }

  async function download() {
    const d = await post({ action: "download" });
    if (d?.url) window.location.href = d.url;
  }

  if (v === undefined) return <main className="flex min-h-screen items-center justify-center bg-[#FBF8F1] text-[#56616E]">Loading…</main>;
  if (v === null) return <main className="flex min-h-screen items-center justify-center bg-[#FBF8F1] p-6 text-center text-[#2E3A46]"><p className="max-w-md">{err}</p></main>;

  const paras = (v.body || "").split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);

  return (
    <main className="min-h-screen bg-[#FBF8F1] text-[#2E3A46] [color-scheme:light]">
      <div className="h-1.5 bg-[#2E7C83]" />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        <header className="flex items-center gap-3">
          {v.logo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={v.logo} alt="" className="h-12 w-12 rounded-full bg-white object-contain" />}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2E7C83]">{v.business}</p>
            <h1 className="text-2xl font-semibold [font-family:Georgia,serif]">{v.title}</h1>
          </div>
        </header>

        {err && <p className="rounded-xl bg-[#fbeaea] px-4 py-3 text-sm text-[#8a2f2f]" role="alert">{err}</p>}
        {done && <p className="rounded-xl bg-[#2E7C83]/10 px-4 py-3 text-[15px] font-semibold" role="status">{done}</p>}

        {v.state === "code" && (
          <section className="space-y-3 rounded-2xl border border-[#E5DDCF] bg-white p-6">
            <p>Hi {v.signer.name.split(" ")[0]}. To keep this private, we&apos;ll email a 6-digit code to <strong>{v.signer.email}</strong>.</p>
            {!sent ? (
              <button className={btn} disabled={busy} onClick={async () => { if (await post({ action: "code" })) setSent(true); }}>{busy ? "Sending…" : "Email me a code"}</button>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-semibold">Your code<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={`${box} mt-1 max-w-[200px] text-center text-2xl tracking-[0.4em]`} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></label>
                <div className="flex flex-wrap items-center gap-3">
                  <button className={btn} disabled={busy || code.length !== 6} onClick={async () => { if (await post({ action: "verify", code })) await load(); }}>Continue</button>
                  <button className="text-sm font-semibold text-[#2E7C83] underline" disabled={busy} onClick={async () => { setCode(""); await post({ action: "code" }); }}>Send a new code</button>
                </div>
                <p className="text-xs text-[#56616E]">It can take a minute to arrive. Check your spam folder too.</p>
              </div>
            )}
          </section>
        )}

        {v.state === "waiting" && <p className="rounded-2xl border border-[#E5DDCF] bg-white p-6">Someone else signs before you. We&apos;ll email you when it&apos;s your turn.</p>}
        {v.state === "declined" && <p className="rounded-2xl border border-[#E5DDCF] bg-white p-6">This document was declined, so it can&apos;t be signed. {v.business} has been told.</p>}
        {v.state === "voided" && <p className="rounded-2xl border border-[#E5DDCF] bg-white p-6">{v.business} cancelled this document. Nothing more is needed from you.</p>}
        {v.state === "expired" && <p className="rounded-2xl border border-[#E5DDCF] bg-white p-6">This document has expired. Please ask {v.business} to send it again.</p>}

        {(v.state === "ready" || v.state === "signed" || v.state === "completed") && (
          <>
            {v.body && (
              <article className="space-y-3 rounded-2xl border border-[#E5DDCF] bg-white p-6 text-[15px] leading-relaxed sm:p-8">
                {paras.map((p, i) => {
                  if (!/^#{1,3}\s/.test(p)) return <p key={i} className="whitespace-pre-line">{p}</p>;
                  const [first, ...rest] = p.split("\n");
                  return (
                    <div key={i}>
                      <h2 className="pt-2 text-lg font-semibold">{first.replace(/^#{1,3}\s+/, "")}</h2>
                      {rest.join("\n").trim() && <p className="mt-2 whitespace-pre-line">{rest.join("\n").trim()}</p>}
                    </div>
                  );
                })}
              </article>
            )}
            {v.fileUrl && (
              <div className="space-y-2">
                <iframe title={v.title} src={v.fileUrl} className="h-[70vh] w-full rounded-2xl border border-[#E5DDCF] bg-white" />
                <a href={v.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#2E7C83] underline">Open the document in a new tab</a>
              </div>
            )}
            {v.kind === "proposal" && v.amount ? <p className="rounded-xl bg-white px-4 py-3 text-[15px]">Investment: <strong>${Number(v.amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</strong></p> : null}
            {v.others.length > 0 && <p className="text-sm text-[#56616E]">Also signing: {v.others.map((o) => `${o.name}${o.signed ? " (signed)" : ""}`).join(", ")}</p>}
          </>
        )}

        {v.state === "ready" && !done && (
          <section className="space-y-4 rounded-2xl border border-[#E5DDCF] bg-white p-6">
            <h2 className="text-lg font-semibold">Sign</h2>
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>{v.consent}</span></label>
            <div className="flex gap-2 text-sm">
              <button className={`rounded-full px-4 py-1.5 font-semibold ${mode === "typed" ? "bg-[#2E3A46] text-white" : "border border-[#E5DDCF]"}`} onClick={() => setMode("typed")}>Type</button>
              <button className={`rounded-full px-4 py-1.5 font-semibold ${mode === "drawn" ? "bg-[#2E3A46] text-white" : "border border-[#E5DDCF]"}`} onClick={() => setMode("drawn")}>Draw</button>
            </div>
            {mode === "typed" ? (
              <div>
                <input className={box} value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Type your full name" />
                <p className="mt-2 border-b border-[#2E3A46]/40 pb-1 text-3xl [font-family:'Brush_Script_MT','Segoe_Script',cursive]">{typed || " "}</p>
              </div>
            ) : (
              <div>
                <canvas ref={canvas} width={600} height={160} onPointerDown={down} onPointerMove={move} onPointerUp={() => (drawing.current = false)} onPointerLeave={() => (drawing.current = false)} className="h-40 w-full touch-none rounded-xl border border-dashed border-[#2E3A46]/40 bg-white" aria-label="Draw your signature" />
                <button className="mt-1 text-xs font-semibold text-[#2E7C83] underline" onClick={clear}>Clear</button>
              </div>
            )}
            <p className="text-xs text-[#56616E]">{v.agree}</p>
            <div className="flex flex-wrap items-center gap-4">
              <button className={btn} disabled={busy || !consent || (mode === "typed" ? typed.trim().length < 2 : !drawn)} onClick={sign}>{busy ? "Signing…" : "Sign"}</button>
              <button className="text-sm font-semibold text-[#8a2f2f] underline" onClick={() => setDeclining((x) => !x)}>Decline to sign</button>
            </div>
            {declining && (
              <div className="space-y-2">
                <textarea className={box} rows={2} placeholder="Optional: tell them why" value={reason} onChange={(e) => setReason(e.target.value)} />
                <button className="rounded-full border border-[#8a2f2f] px-4 py-2 text-sm font-semibold text-[#8a2f2f]" disabled={busy} onClick={async () => { if (await post({ action: "decline", reason })) await load(); }}>Decline</button>
              </div>
            )}
          </section>
        )}

        {(v.state === "signed" || v.state === "completed") && !done && (
          <p className="rounded-2xl bg-[#2E7C83]/10 p-6">{v.state === "completed" ? "Everyone has signed." : "You've signed. We'll email you a signed copy when everyone has signed."}</p>
        )}
        {v.next && <a href={v.next} className={`${btn} inline-block`}>Continue</a>}
        {v.canDownload && <button className={btn} disabled={busy} onClick={download}>Download the signed copy</button>}
        <footer className="pt-6 text-center text-xs text-[#9aa3ad]">Signed electronically with LC Plume, part of the LifeCharter Command Suite. Every step is recorded in a certificate of completion.</footer>
      </div>
    </main>
  );
}
