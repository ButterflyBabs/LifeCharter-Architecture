"use client";

import { useEffect, useState } from "react";

// Public: the Unsubscribe link at the foot of every sequence email.
export default function UnsubscribePage() {
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [support, setSupport] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState(false);
  const [token, setToken] = useState("");
  const [allState, setAllState] = useState<"idle" | "working" | "done" | "error">("idle");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("t") || "";
    const c = q.get("c") || "";
    const list = q.get("list") === "newsletter" ? "newsletter" : "";
    setToken(t);
    setNewsletter(Boolean(list) && !c);
    const call = c ? fetch(`/api/cold-unsubscribe?c=${encodeURIComponent(c)}`, { method: "POST" }) : fetch("/api/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(list ? { t, list } : { t }) });
    call
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        setSupport(typeof d.support === "string" ? d.support : null);
        setState(r.ok ? "done" : "error");
      })
      .catch(() => setState("error"));
  }, []);

  const stopAll = () => {
    setAllState("working");
    fetch("/api/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token }) })
      .then((r) => setAllState(r.ok ? "done" : "error"))
      .catch(() => setAllState("error"));
  };

  return (
    <main style={{ minHeight: "100vh", background: "#FBF8F1", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 460, background: "#fff", border: "1px solid #EADFCF", borderRadius: 18, padding: 32, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
        {state === "working" && <p style={{ color: "#555" }}>One moment…</p>}
        {state === "done" && newsletter && (
          <>
            <h1 style={{ fontSize: 22, color: "#1F3A3D", margin: "0 0 10px" }}>{allState === "done" ? "You\u2019re unsubscribed from everything" : "You\u2019re off the newsletter"}</h1>
            <p style={{ color: "#555", lineHeight: 1.6 }}>
              {allState === "done"
                ? "You won\u2019t get any more emails from us."
                : "You won\u2019t get the Head Up, Wings Out newsletter anymore. You\u2019ll still get emails about classes and events you sign up for."}
              {allState !== "done" && support && <> If that was a mistake, write to <a href={`mailto:${support}`} style={{ color: "#2A7F7A" }}>{support}</a>.</>}
            </p>
            {allState !== "done" && (
              <button type="button" onClick={stopAll} disabled={allState === "working"} style={{ marginTop: 8, background: "none", border: "1px solid #CFC4B0", borderRadius: 999, padding: "10px 18px", color: "#1F3A3D", fontSize: 14, cursor: "pointer" }}>
                {allState === "working" ? "One moment\u2026" : "Stop all emails from us"}
              </button>
            )}
            {allState === "error" && <p style={{ color: "#8a2f2f", fontSize: 13 }}>That didn&rsquo;t go through. Please reply to any email and we&rsquo;ll do it right away.</p>}
          </>
        )}
        {state === "done" && !newsletter && (
          <>
            <h1 style={{ fontSize: 22, color: "#1F3A3D", margin: "0 0 10px" }}>You&rsquo;re unsubscribed</h1>
            <p style={{ color: "#555", lineHeight: 1.6 }}>
              You won&rsquo;t get any more emails from this series.{" "}
              {support ? (
                <>If that was a mistake, just write to <a href={`mailto:${support}`} style={{ color: "#2A7F7A" }}>{support}</a> and we&rsquo;ll put you back.</>
              ) : (
                <>If that was a mistake, just reply to one of the emails and we&rsquo;ll put you back.</>
              )}
            </p>
          </>
        )}
        {state === "error" && (
          <>
            <h1 style={{ fontSize: 22, color: "#1F3A3D", margin: "0 0 10px" }}>That link didn&rsquo;t work</h1>
            <p style={{ color: "#555", lineHeight: 1.6 }}>Please reply to the email you received and ask to be taken off the list. We&rsquo;ll do it right away.</p>
          </>
        )}
      </div>
    </main>
  );
}
