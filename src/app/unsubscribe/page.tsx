"use client";

import { useEffect, useState } from "react";

// Public: the Unsubscribe link at the foot of every sequence email.
export default function UnsubscribePage() {
  const [state, setState] = useState<"working" | "done" | "error">("working");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t") || "";
    fetch("/api/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t }) })
      .then((r) => setState(r.ok ? "done" : "error"))
      .catch(() => setState("error"));
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#FBF8F1", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 460, background: "#fff", border: "1px solid #EADFCF", borderRadius: 18, padding: 32, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
        {state === "working" && <p style={{ color: "#555" }}>One moment…</p>}
        {state === "done" && (
          <>
            <h1 style={{ fontSize: 22, color: "#1F3A3D", margin: "0 0 10px" }}>You&rsquo;re unsubscribed</h1>
            <p style={{ color: "#555", lineHeight: 1.6 }}>You won&rsquo;t get any more emails from this series. If that was a mistake, just write to <a href="mailto:support@amilynnecarroll.com" style={{ color: "#2A7F7A" }}>support@amilynnecarroll.com</a> and we&rsquo;ll put you back.</p>
          </>
        )}
        {state === "error" && (
          <>
            <h1 style={{ fontSize: 22, color: "#1F3A3D", margin: "0 0 10px" }}>That link didn&rsquo;t work</h1>
            <p style={{ color: "#555", lineHeight: 1.6 }}>Please email <a href="mailto:support@amilynnecarroll.com" style={{ color: "#2A7F7A" }}>support@amilynnecarroll.com</a> and we&rsquo;ll take you off the list right away.</p>
          </>
        )}
      </div>
    </main>
  );
}
