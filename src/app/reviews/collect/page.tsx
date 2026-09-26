"use client";

import { useEffect, useState } from "react";
import { Star, CheckCircle2, Loader2, Heart } from "lucide-react";

// The page a client's client sees from a personal review link. No account, no
// navigation, nothing about the sender's business beyond the name on the request.

const input = "w-full px-3 h-11 rounded-xl border border-[#1a2b4a]/20 bg-white text-[#1a2b4a]";

export default function ReviewCollectionPage() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<"loading" | "invalid" | "done-before" | "form" | "thanks">("loading");
  const [info, setInfo] = useState<{ clientName: string; program: string; fromName: string; message: string }>({ clientName: "", program: "", fromName: "", message: "" });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [f, setF] = useState({ name: "", headline: "", content: "", mediaUrl: "", consent: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t") || "";
    setToken(t);
    fetch(`/api/reviews/collect?t=${encodeURIComponent(t)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) return setState("invalid");
        setInfo(d);
        setF((x) => ({ ...x, name: d.clientName || "" }));
        setState(d.completed ? "done-before" : "form");
      })
      .catch(() => setState("invalid"));
  }, []);

  const submit = async () => {
    setErr("");
    if (!rating) return setErr("Please choose a star rating.");
    if (!f.content.trim()) return setErr("Please write a few words.");
    if (!f.consent) return setErr("Please confirm you're happy for this to be shared.");
    setBusy(true);
    const res = await fetch("/api/reviews/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ t: token, rating, name: f.name, headline: f.headline, content: f.content, mediaUrl: f.mediaUrl, consent: true }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setState("thanks");
    else setErr(d.error || "Something went wrong — please try again.");
  };

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-[#faf7f2] py-10 px-4">
      <div className="max-w-xl mx-auto">{children}</div>
    </main>
  );

  if (state === "loading") return shell(<p className="text-center text-[#7a8a99]">Loading…</p>);
  if (state === "invalid") return shell(<div className="text-center"><h1 className="text-2xl font-bold text-[#1a2b4a]">This link isn&apos;t valid</h1><p className="mt-2 text-[#7a8a99]">It may have been mistyped. Please ask for a fresh link.</p></div>);
  if (state === "done-before") return shell(<div className="text-center"><CheckCircle2 className="w-12 h-12 text-[#2c6b3f] mx-auto mb-3" /><h1 className="text-2xl font-bold text-[#1a2b4a]">Already received — thank you!</h1><p className="mt-2 text-[#7a8a99]">Your review has been shared with {info.fromName || "them"}.</p></div>);
  if (state === "thanks") return shell(<div className="text-center"><Heart className="w-12 h-12 text-[#c9a227] mx-auto mb-3" /><h1 className="text-2xl font-bold text-[#1a2b4a]">Thank you{f.name ? `, ${f.name.split(" ")[0]}` : ""}!</h1><p className="mt-2 text-[#7a8a99]">Your words mean a great deal to {info.fromName || "them"}.</p></div>);

  return shell(
    <div className="bg-white rounded-2xl shadow-sm border border-[#1a2b4a]/10 p-6 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#1a2b4a]">{info.fromName ? `Share a few words about ${info.fromName}` : "Share a few words"}</h1>
        {info.program && <p className="text-sm text-[#7a8a99] mt-1">Regarding: {info.program}</p>}
      </div>
      {info.message && <p className="text-sm text-[#3F4654] whitespace-pre-wrap bg-[#faf7f2] rounded-xl p-3">{info.message.replace(/\[review link\]/gi, "").trim()}</p>}

      <div>
        <p className="block text-sm font-medium text-[#1a2b4a] mb-1">Your rating</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} stars`} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)}>
              <Star className={`w-9 h-9 ${i <= (hover || rating) ? "fill-[#c9a227] text-[#c9a227]" : "text-[#cdbfae]"}`} />
            </button>
          ))}
        </div>
      </div>
      <label className="block"><span className="block text-sm font-medium text-[#1a2b4a] mb-1">Your name</span><input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="block"><span className="block text-sm font-medium text-[#1a2b4a] mb-1">A headline (optional)</span><input className={input} placeholder="e.g. “Finally, a clear plan”" value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} /></label>
      <label className="block"><span className="block text-sm font-medium text-[#1a2b4a] mb-1">Your experience</span><textarea rows={6} className="w-full px-3 py-2 rounded-xl border border-[#1a2b4a]/20 bg-white text-[#1a2b4a]" placeholder="What was it like working together? What changed for you?" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></label>
      <label className="block"><span className="block text-sm font-medium text-[#1a2b4a] mb-1">A video or audio link (optional)</span><input className={input} placeholder="https://" value={f.mediaUrl} onChange={(e) => setF({ ...f, mediaUrl: e.target.value })} /></label>
      <label className="flex items-start gap-2 text-sm text-[#3F4654]"><input type="checkbox" className="mt-1" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} /> I&apos;m happy for {info.fromName || "them"} to share my words and name publicly, for example on their website and social media.</label>
      {err && <p className="text-sm text-[#8a2f2f]" role="alert">{err}</p>}
      <button onClick={submit} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 text-base font-semibold py-3 rounded-xl bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60">{busy && <Loader2 className="w-5 h-5 animate-spin" />} Send my review</button>
    </div>
  );
}
