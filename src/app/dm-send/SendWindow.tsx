"use client";

import { useEffect, useState } from "react";
import { SendDm, angleScript, type Card, type Stage, type ScriptLite, type Post, type DmUse } from "../dm-pipeline/DmPipeline";

// Loads the card, the script and the board's stages, shows the message to copy, and tells the pipeline window
// (if it is still open) what was logged.
export default function SendWindow() {
  const [data, setData] = useState<{ card: Card; script: ScriptLite; stages: Stage[]; nextSession: string | null; usage: Record<string, DmUse> } | null>(null);
  const [err, setErr] = useState("");
  const [params] = useState(() => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)));
  const tz = typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Denver";
  const purpose = params.get("purpose") === "affiliate" ? "affiliate" : "outreach";

  useEffect(() => {
    (async () => {
      const q = new URLSearchParams({ tz, purpose });
      if (params.get("board")) q.set("board", params.get("board")!);
      const [d, sc] = await Promise.all([
        fetch(`/api/dm-pipeline?${q}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/scripts", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      ]);
      const card = ((d.cards ?? []) as Card[]).find((c) => c.id === params.get("card"));
      let script = ((sc.items ?? []) as ScriptLite[]).find((s) => s.id === params.get("script"));
      // "angle": the personal DM angle from this card's qualification.
      if (params.get("script") === "angle" && card) {
        const q = await fetch(`/api/qualifier?card=${card.id}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
        if (q.qualification?.dm_angle) script = angleScript(q.qualification.dm_angle as string);
      }
      if (!card || !script) { setErr("Couldn't find that card or message. Close this window and try again from the pipeline."); return; }
      setData({ card, script, stages: d.stages ?? [], nextSession: d.nextSession ?? null, usage: d.dmUsage ?? {} });
    })();
  }, [params, tz, purpose]);

  const post: Post = async (body) => {
    const r = await fetch("/api/dm-pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, tz, purpose }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || "Something went wrong."); return null; }
    setErr("");
    return d;
  };

  if (!data) return <p className="p-6 text-sm text-[#5a6472]">{err || "Loading…"}</p>;
  return (
    <div className="min-h-screen bg-[#F8F5F0] dark:bg-[#1A1A2E]">
      {err && <p className="px-4 pt-3 text-sm text-[#A4523C]">{err}</p>}
      <SendDm
        standalone
        card={data.card}
        script={data.script}
        stages={data.stages}
        sessionIso={data.nextSession}
        post={post}
        usage={data.usage[data.card.platform ?? ""]}
        onClose={() => window.close()}
        onDone={(saved, note, use) => {
          try { window.opener?.postMessage({ type: "dm-sent", card: saved, note, dmUsage: use }, window.location.origin); } catch { /* the pipeline window was closed */ }
          window.close();
        }}
      />
    </div>
  );
}
