"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Sparkles, X } from "lucide-react";
import AssistantPanel from "@/components/assistant/AssistantPanel";
import { setPopped, usePopped } from "@/lib/assistantPopout";
import { DEFAULT_ASSISTANT_NAME } from "@/lib/ai/defaults";

const POS_KEY = "assistant-popout-pos";
const MIN_KEY = "assistant-popout-min";

// The assistant floating over whatever page you are on. Drag it by its title bar, resize it from the
// corner, minimize it, or bring it back to Executive Home. It stays put as you move between pages.
export default function AssistantPopout() {
  const popped = usePopped();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [min, setMin] = useState(false);
  const [name, setName] = useState(DEFAULT_ASSISTANT_NAME);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(POS_KEY) || "null");
      if (p && typeof p.x === "number" && typeof p.y === "number") setPos(p);
      setMin(localStorage.getItem(MIN_KEY) === "1");
    } catch {
      /* default place */
    }
  }, []);
  useEffect(() => {
    if (!popped) return;
    fetch("/api/ai-settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.assistantName && setName(d.assistantName))
      .catch(() => {});
  }, [popped]);

  if (!popped) return null;

  const clamp = (x: number, y: number) => ({
    x: Math.max(8, Math.min(x, window.innerWidth - 120)),
    y: Math.max(8, Math.min(y, window.innerHeight - 56)),
  });
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    try {
      if (pos) localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {
      /* not remembered */
    }
  };
  const toggleMin = () => {
    const next = !min;
    setMin(next);
    try {
      localStorage.setItem(MIN_KEY, next ? "1" : "0");
    } catch {
      /* not remembered */
    }
  };

  const style: React.CSSProperties = pos ? { left: pos.x, top: pos.y } : { right: 16, bottom: 96 };

  if (min) {
    return (
      <button onClick={toggleMin} style={style} className="fixed z-[70] inline-flex items-center gap-2 rounded-full bg-[#1a2b4a] px-4 py-2.5 text-sm font-semibold text-white shadow-xl hover:opacity-90" aria-label={`Open ${name}`}>
        <Sparkles className="h-4 w-4 text-[#c9a227]" /> {name}
      </button>
    );
  }

  return (
    <div
      ref={box}
      role="dialog"
      aria-label={`${name}, floating assistant`}
      style={{ ...style, width: 400, height: 560, minWidth: 300, minHeight: 320, maxWidth: "calc(100vw - 16px)", maxHeight: "calc(100vh - 16px)", resize: "both", overflow: "hidden" }}
      className="fixed z-[70] flex flex-col rounded-2xl border border-[#1a2b4a]/15 bg-white shadow-2xl"
    >
      <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} className="flex cursor-move touch-none items-center justify-between gap-2 bg-[#1a2b4a] px-4 py-2.5 text-white select-none">
        <span className="inline-flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-[#c9a227]" /> {name}</span>
        <span className="flex items-center gap-1">
          <button onClick={toggleMin} aria-label="Minimize" title="Minimize" className="rounded p-1 hover:bg-white/10"><Minus className="h-4 w-4" /></button>
          <button onClick={() => setPopped(false)} aria-label="Close and bring back to Executive Home" title="Close (brings it back to Executive Home)" className="rounded p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <AssistantPanel variant="floating" onBringBack={() => setPopped(false)} />
      </div>
    </div>
  );
}
