"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PenSquare } from "lucide-react";
import { useCommunity, useProfiles } from "@/lib/community/context";
import { timeAgo } from "@/lib/community/format";
import type { DmMessage } from "@/lib/community/types";
import { Avatar, Button, Card, EmptyState, ErrorNote, Heading, Modal, PageLoading } from "@/components/community/ui";
import { MemberPicker } from "@/components/community/MemberPicker";

interface ThreadRow {
  id: string;
  other: string | null;
  last: DmMessage | null;
  lastReadAt: string;
  lastMessageAt: string;
}

export default function MessagesPage() {
  const { supabase, userId } = useCommunity();
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadRow[] | null>(null);
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const people = useProfiles((threads ?? []).map((t) => t.other));

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const { data: mine } = await supabase.from("cm_dm_participants").select("thread_id, last_read_at").eq("user_id", userId);
      const ids = ((mine as { thread_id: string; last_read_at: string }[]) ?? []).map((m) => m.thread_id);
      if (!ids.length) return setThreads([]);
      const [parts, threadRows, msgs] = await Promise.all([
        supabase.from("cm_dm_participants").select("thread_id, user_id").in("thread_id", ids).neq("user_id", userId),
        supabase.from("cm_dm_threads").select("id, last_message_at").in("id", ids),
        supabase.from("cm_dm_messages").select("*").in("thread_id", ids).is("deleted_at", null).order("created_at", { ascending: false }).limit(300),
      ]);
      const other = new Map(((parts.data as { thread_id: string; user_id: string }[]) ?? []).map((p) => [p.thread_id, p.user_id]));
      const last = new Map<string, DmMessage>();
      for (const m of (msgs.data as DmMessage[]) ?? []) if (!last.has(m.thread_id)) last.set(m.thread_id, m);
      const readAt = new Map(((mine as { thread_id: string; last_read_at: string }[]) ?? []).map((m) => [m.thread_id, m.last_read_at]));
      const rows: ThreadRow[] = ((threadRows.data as { id: string; last_message_at: string }[]) ?? [])
        .map((t) => ({ id: t.id, other: other.get(t.id) ?? null, last: last.get(t.id) ?? null, lastReadAt: readAt.get(t.id) ?? t.last_message_at, lastMessageAt: t.last_message_at }))
        .filter((t) => t.last)
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
      setThreads(rows);
    })();
  }, [supabase, userId]);

  async function start(otherId: string) {
    setError(null);
    const { data, error } = await supabase.rpc("cm_start_dm", { p_other: otherId });
    if (error) return setError(error.message);
    router.push(`/community/messages/${data}`);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <Heading sub="Private conversations with fellow members.">Messages</Heading>
        <Button variant="gold" size="sm" onClick={() => setComposing(true)}>
          <PenSquare className="h-4 w-4" /> New
        </Button>
      </div>
      {threads === null ? (
        <PageLoading />
      ) : threads.length === 0 ? (
        <EmptyState icon="💬" title="No conversations yet">
          Start one from a member&rsquo;s profile, or tap <strong>New</strong>.
        </EmptyState>
      ) : (
        <Card className="divide-y divide-[#F0EBE0] overflow-hidden">
          {threads.map((t) => {
            const p = t.other ? people[t.other] : undefined;
            const unread = t.last && t.last.sender_id !== userId && t.last.created_at > t.lastReadAt;
            return (
              <Link key={t.id} href={`/community/messages/${t.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#FBF8F2]">
                <Avatar name={p?.display_name} url={p?.avatar_url} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={unread ? "font-bold text-[#1F315B]" : "font-semibold text-[#1F315B]"}>{p?.display_name ?? "…"}</span>
                    <span className="shrink-0 text-[12px] text-[#8A8FA0]">{t.last ? timeAgo(t.last.created_at) : ""}</span>
                  </div>
                  <p className={unread ? "truncate text-[14px] font-semibold text-[#1F315B]" : "truncate text-[14px] text-[#6B6F80]"}>
                    {t.last?.sender_id === userId ? "You: " : ""}
                    {t.last?.body || (t.last?.attachments?.length ? "📷 Photo" : "")}
                  </p>
                </div>
                {unread && <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF63]" aria-label="Unread" />}
              </Link>
            );
          })}
        </Card>
      )}
      <Modal open={composing} onClose={() => setComposing(false)} title="New message">
        <ErrorNote>{error}</ErrorNote>
        <MemberPicker onPick={(p) => void start(p.user_id)} />
      </Modal>
    </div>
  );
}
