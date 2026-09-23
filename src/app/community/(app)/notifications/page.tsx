"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useCommunity, useProfiles } from "@/lib/community/context";
import { timeAgo } from "@/lib/community/format";
import type { CommunityNotification } from "@/lib/community/types";
import { Avatar, Button, Card, EmptyState, Heading, PageLoading } from "@/components/community/ui";

const ICON: Record<string, string> = { announcement: "📣", comment: "💬", reply: "↩️", dm: "✉️", mention: "@", event: "📅" };

export default function NotificationsPage() {
  const { supabase, userId, refreshCounts } = useCommunity();
  const router = useRouter();
  const [rows, setRows] = useState<CommunityNotification[] | null>(null);
  const people = useProfiles((rows ?? []).map((r) => r.actor_id));

  useEffect(() => {
    if (!userId) return;
    void supabase
      .from("cm_notifications")
      .select("*")
      .eq("user_id", userId)
      .neq("kind", "dm")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }: { data: CommunityNotification[] | null }) => setRows(data ?? []));
  }, [supabase, userId]);

  async function markAll() {
    if (!userId) return;
    const now = new Date().toISOString();
    await supabase.from("cm_notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
    setRows((r) => (r ?? []).map((x) => ({ ...x, read_at: x.read_at ?? now })));
    await refreshCounts();
  }

  async function open(n: CommunityNotification) {
    if (!n.read_at) {
      await supabase.from("cm_notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
      void refreshCounts();
    }
    if (n.href) router.push(n.href);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <Heading>Notifications</Heading>
        {rows?.some((r) => !r.read_at) && (
          <Button variant="outline" size="sm" onClick={markAll}>
            Mark all read
          </Button>
        )}
      </div>
      {rows === null ? (
        <PageLoading />
      ) : rows.length === 0 ? (
        <EmptyState icon="🔔" title="You're all caught up">
          Announcements and replies to your posts will show up here.
        </EmptyState>
      ) : (
        <Card className="divide-y divide-[var(--cm-line-soft)] overflow-hidden">
          {rows.map((n) => {
            const actor = n.actor_id ? people[n.actor_id] : undefined;
            return (
              <button key={n.id} onClick={() => open(n)} className={cn("flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-[var(--cm-fill)]", !n.read_at && "bg-[var(--cm-fill)]")}>
                <span className="relative">
                  <Avatar name={actor?.display_name} url={actor?.avatar_url} size={40} />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--cm-surface)] text-[11px] shadow">{ICON[n.kind] ?? "•"}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[14.5px] text-[var(--cm-ink)]", !n.read_at && "font-semibold")}>{n.title}</span>
                  {n.body && <span className="line-clamp-2 block text-[13.5px] text-[var(--cm-muted-2)]">{n.body}</span>}
                  <span className="text-[12px] text-[var(--cm-muted)]">{timeAgo(n.created_at)}</span>
                </span>
                {!n.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#D4AF63]" aria-label="Unread" />}
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}
