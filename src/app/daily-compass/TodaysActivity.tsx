"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendingUp, Phone, MessageSquare, Share2, Link2 } from "lucide-react";

interface ActivityItem {
  id: string;
  contactId: string;
  contactName: string;
  type: "call" | "followup";
  note: string;
  createdAt: string;
}

// Fires whenever a call/follow-up is logged elsewhere on the page so this panel
// can refresh its counts without prop-drilling across the layout.
export const ACTIVITY_EVENT = "gc-activity-logged";

function tz(): string {
  if (typeof window === "undefined") return "UTC";
  return localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function TodaysActivity() {
  const [calls, setCalls] = useState(0);
  const [followups, setFollowups] = useState(0);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/global-control/activity?tz=${encodeURIComponent(tz())}`);
      const d = await res.json().catch(() => ({}));
      setCalls(d.calls || 0);
      setFollowups(d.followups || 0);
      setItems(Array.isArray(d.items) ? d.items : []);
    } catch {
      /* leave as-is */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const onLogged = () => load();
    window.addEventListener(ACTIVITY_EVENT, onLogged);
    return () => window.removeEventListener(ACTIVITY_EVENT, onLogged);
  }, [load]);

  const rows: { label: string; value: number; icon: React.ReactNode }[] = [
    { label: "Sales Calls", value: calls, icon: <Phone className="w-3.5 h-3.5" /> },
    { label: "Follow-ups", value: followups, icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#c9a227]" />
          Today&apos;s Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#7b6b8d]">{row.icon}</span>
              <span className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{row.label}</span>
            </div>
            <span className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] tabular-nums">
              {loaded ? row.value : "—"}
            </span>
          </div>
        ))}

        {/* Recent entries */}
        {items.length > 0 && (
          <div className="pt-3 border-t border-[#1a2b4a]/10 space-y-2">
            {items.slice(0, 4).map((it) => (
              <div key={it.id} className="flex items-start gap-2 text-xs">
                <span
                  className={`mt-0.5 flex-shrink-0 ${
                    it.type === "call" ? "text-[#7b6b8d]" : "text-[#2E7C83]"
                  }`}
                >
                  {it.type === "call" ? (
                    <Phone className="w-3 h-3" />
                  ) : (
                    <MessageSquare className="w-3 h-3" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[#1a2b4a] dark:text-[#F8F5F0] truncate">
                    {it.type === "call" ? "Call" : "Follow-up"}
                    {it.contactName ? ` · ${it.contactName}` : ""}
                  </p>
                  {it.note && <p className="text-[#b8a898] truncate">{it.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PostStream seam (posts still pending its integration) */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1a2b4a]/10">
          <div className="flex items-center gap-2">
            <span className="text-[#7b6b8d]">
              <Share2 className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Posts</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8a7f74] bg-[#1a2b4a]/5 px-2 py-1 rounded-full">
            <Link2 className="w-3 h-3" />
            PostStream
          </span>
        </div>

        <p className="text-xs text-[#b8a898]">
          Calls &amp; follow-ups you log against Global Control contacts appear here for today. Social posts are
          created and scheduled through PostStream in Create Content &amp; the Content Calendar.
        </p>
      </CardContent>
    </Card>
  );
}
