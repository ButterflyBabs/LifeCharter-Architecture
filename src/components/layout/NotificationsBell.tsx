"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, X, AlertTriangle, Zap, Info, CheckCircle2 } from "lucide-react";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-4 h-4 text-[#c0632f]" />,
  action: <Zap className="w-4 h-4 text-[#c9a227]" />,
  success: <CheckCircle2 className="w-4 h-4 text-[#2c6b3f]" />,
  info: <Info className="w-4 h-4 text-[#2E7C83]" />,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const d = await res.json().catch(() => ({}));
      if (Array.isArray(d.items)) setItems(d.items);
      if (typeof d.unread === "number") setUnread(d.unread);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 120000); // refresh every 2 min
    return () => clearInterval(t);
  }, [load]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", id }),
    });
  };

  const dismiss = async (id: string, wasUnread: boolean) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnread((u) => Math.max(0, u - 1));
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss", id }),
    });
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read_all" }),
    });
  };

  const openItem = (n: Notif) => {
    if (!n.read) markRead(n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-full bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 flex items-center justify-center hover:bg-[#1a2b4a]/10 dark:hover:bg-[#e8e4f0]/20 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[#1a2b4a] dark:text-[#e8e4f0]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-[#c9a227] text-[#1a2b4a] text-xs font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-2xl border border-[#1a2b4a]/12 bg-white dark:bg-[#111d33] shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2b4a]/10">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs text-[#2E7C83] hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {!loaded ? (
              <p className="p-4 text-sm text-[#b8a898]">Loading…</p>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-6 h-6 text-[#b8a898] mx-auto mb-2" />
                <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf]">You&apos;re all caught up.</p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`group flex items-start gap-3 px-4 py-3 border-b border-[#1a2b4a]/6 cursor-pointer hover:bg-[#2E7C83]/5 ${
                    n.read ? "" : "bg-[#c9a227]/5"
                  }`}
                  onClick={() => openItem(n)}
                >
                  <span className="mt-0.5 flex-shrink-0">{TYPE_ICON[n.type] || TYPE_ICON.info}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#c9a227] flex-shrink-0" />}
                      <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{n.title}</p>
                    </div>
                    {n.body && <p className="text-xs text-[#7a8a99] dark:text-[#b8c2cf] mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[11px] text-[#b8a898] mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(n.id, !n.read);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-[#1a2b4a]/10 flex-shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5 text-[#b8a898]" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
