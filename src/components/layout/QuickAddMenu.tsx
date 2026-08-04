"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, CheckSquare, DollarSign, Share2, CalendarPlus, X, Loader2, Check } from "lucide-react";

export function QuickAddMenu() {
  const [open, setOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Inline "new task" quick form.
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const openTask = () => {
    setOpen(false);
    setTitle("");
    setPriority("medium");
    setAdded(false);
    setTaskOpen(true);
  };

  const saveTask = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), priority, status: "today" }),
      });
      if (res.ok) {
        setAdded(true);
        setTitle("");
        setTimeout(() => setTaskOpen(false), 900);
      }
    } finally {
      setSaving(false);
    }
  };

  const items = [
    { label: "New task", icon: <CheckSquare className="w-4 h-4" />, action: openTask, desc: "Add to today" },
    { label: "Log a sale", icon: <DollarSign className="w-4 h-4" />, action: () => go("/daily-compass/sales-activities?add=1"), desc: "Record a sales activity" },
    { label: "Create content", icon: <Share2 className="w-4 h-4" />, action: () => go("/daily-compass/content-studio"), desc: "Compose a post" },
    { label: "Schedule planning session", icon: <CalendarPlus className="w-4 h-4" />, action: () => go("/planning?session=1"), desc: "Add to your calendar" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Quick add"
        className="w-9 h-9 rounded-full bg-[#1a2b4a] text-[#F8F5F0] flex items-center justify-center hover:bg-[#1a2b4a]/90 transition-colors shadow-md"
      >
        <Plus className={`w-5 h-5 transition-transform ${open ? "rotate-45" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#1a2b4a]/12 bg-white dark:bg-[#111d33] shadow-xl z-50 overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#b8a898]">Quick add</p>
          {items.map((it) => (
            <button
              key={it.label}
              onClick={it.action}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#2E7C83]/5"
            >
              <span className="w-8 h-8 rounded-lg bg-[#2E7C83]/10 text-[#2E7C83] flex items-center justify-center flex-shrink-0">
                {it.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{it.label}</span>
                <span className="block text-xs text-[#b8a898]">{it.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Inline new-task modal */}
      {taskOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#111d33] rounded-2xl shadow-2xl w-full max-w-sm my-16">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2b4a]/10">
              <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">New task</h2>
              <button onClick={() => setTaskOpen(false)} aria-label="Close">
                <X className="w-5 h-5 text-[#b8a898]" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTask();
                }}
                placeholder="What needs doing?"
                className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
              <div className="flex items-center gap-2">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                >
                  <option value="high">High priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="low">Low priority</option>
                </select>
                <button
                  onClick={saveTask}
                  disabled={saving || !title.trim()}
                  className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium px-4 h-10 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : added ? <Check className="w-4 h-4" /> : null}
                  {added ? "Added" : "Add to today"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
