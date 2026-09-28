"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PenSquare } from "lucide-react";
import { useCommunity, useProfiles } from "@/lib/community/context";
import { timeAgo } from "@/lib/community/format";
import type { DmMessage } from "@/lib/community/types";
import { Avatar, Button, Card, EmptyState, ErrorNote, Heading, Input, Label, Modal, PageLoading } from "@/components/community/ui";
import { GroupAvatar, PeopleChooser, groupNames, type Chosen } from "@/components/community/PeopleChooser";

interface ThreadRow {
  id: string;
  isGroup: boolean;
  title: string | null;
  others: string[];
  last: DmMessage | null;
  lastReadAt: string;
  lastMessageAt: string;
}

export default function MessagesPage() {
  const { supabase, userId, blockedIds } = useCommunity();
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadRow[] | null>(null);
  const [composing, setComposing] = useState(false);
  const [chosen, setChosen] = useState<Chosen[]>([]);
  const [groupName, setGroupName] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const people = useProfiles((threads ?? []).flatMap((t) => [...t.others.slice(0, 4), t.last?.sender_id]));

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const { data: mine } = await supabase.from("cm_dm_participants").select("thread_id, last_read_at").eq("user_id", userId);
      const ids = ((mine as { thread_id: string; last_read_at: string }[]) ?? []).map((m) => m.thread_id);
      if (!ids.length) return setThreads([]);
      const [parts, threadRows, msgs] = await Promise.all([
        supabase.from("cm_dm_participants").select("thread_id, user_id, joined_at").in("thread_id", ids).neq("user_id", userId).order("joined_at"),
        supabase.from("cm_dm_threads").select("id, is_group, title, last_message_at").in("id", ids),
        supabase.from("cm_dm_messages").select("*").in("thread_id", ids).is("deleted_at", null).order("created_at", { ascending: false }).limit(400),
      ]);
      const others = new Map<string, string[]>();
      for (const p of (parts.data as { thread_id: string; user_id: string }[]) ?? []) others.set(p.thread_id, [...(others.get(p.thread_id) ?? []), p.user_id]);
      const last = new Map<string, DmMessage>();
      for (const m of (msgs.data as DmMessage[]) ?? []) {
        // In a group, messages from someone you've blocked stay out of view.
        if (m.sender_id !== userId && blockedIds.has(m.sender_id) && m.kind !== "system") continue;
        if (!last.has(m.thread_id)) last.set(m.thread_id, m);
      }
      const readAt = new Map(((mine as { thread_id: string; last_read_at: string }[]) ?? []).map((m) => [m.thread_id, m.last_read_at]));
      const rows: ThreadRow[] = ((threadRows.data as { id: string; is_group: boolean; title: string | null; last_message_at: string }[]) ?? [])
        .map((t) => ({
          id: t.id,
          isGroup: t.is_group,
          title: t.title,
          others: others.get(t.id) ?? [],
          last: last.get(t.id) ?? null,
          lastReadAt: readAt.get(t.id) ?? t.last_message_at,
          lastMessageAt: t.last_message_at,
        }))
        .filter((t) => t.last)
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
      setThreads(rows);
    })();
  }, [supabase, userId, blockedIds]);

  function closeCompose() {
    setComposing(false);
    setChosen([]);
    setGroupName("");
    setError(null);
  }

  async function start() {
    if (!chosen.length) return;
    setError(null);
    setStarting(true);
    const { data, error } =
      chosen.length === 1
        ? await supabase.rpc("cm_start_dm", { p_other: chosen[0].user_id })
        : await supabase.rpc("cm_start_group_dm", { p_members: chosen.map((c) => c.user_id), p_title: groupName.trim() || null });
    setStarting(false);
    if (error) return setError(error.message);
    router.push(`/community/messages/${data}`);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <Heading sub="Private conversations with fellow members — one-on-one or in a small group.">Messages</Heading>
        <Button variant="gold" size="sm" onClick={() => setComposing(true)}>
          <PenSquare className="h-4 w-4" /> New
        </Button>
      </div>
      {threads === null ? (
        <PageLoading />
      ) : threads.length === 0 ? (
        <EmptyState icon="💬" title="No conversations yet">
          Start one from a member&rsquo;s profile, or tap <strong>New</strong> to message one person or a few at once.
        </EmptyState>
      ) : (
        <Card className="divide-y divide-[var(--cm-line-soft)] overflow-hidden">
          {threads.map((t) => {
            const first = t.others[0] ? people[t.others[0]] : undefined;
            const names = t.others.map((id) => people[id]?.display_name?.split(" ")[0] ?? "").filter(Boolean);
            const label = t.isGroup ? t.title || groupNames(names) || "Group conversation" : first?.display_name ?? "…";
            const system = t.last?.kind === "system";
            const unread = !!t.last && !system && t.last.sender_id !== userId && t.last.created_at > t.lastReadAt;
            const sender = t.last && t.isGroup && !system && t.last.sender_id !== userId ? people[t.last.sender_id]?.display_name?.split(" ")[0] : null;
            return (
              <Link key={t.id} href={`/community/messages/${t.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--cm-fill)]">
                {t.isGroup ? (
                  <GroupAvatar people={t.others.slice(0, 2).map((id) => people[id] ?? {})} size={44} />
                ) : (
                  <Avatar name={first?.display_name} url={first?.avatar_url} size={44} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`truncate ${unread ? "font-bold" : "font-semibold"} text-[var(--cm-ink)]`}>{label}</span>
                    <span className="shrink-0 text-[12px] text-[var(--cm-muted)]">{t.last ? timeAgo(t.last.created_at) : ""}</span>
                  </div>
                  <p className={unread ? "truncate text-[14px] font-semibold text-[var(--cm-ink)]" : "truncate text-[14px] text-[var(--cm-muted-2)]"}>
                    {system ? (
                      <span className="italic">{t.last?.body}</span>
                    ) : (
                      <>
                        {t.last?.sender_id === userId ? "You: " : sender ? `${sender}: ` : ""}
                        {t.last?.body || (t.last?.attachments?.length ? "📷 Photo" : "")}
                      </>
                    )}
                  </p>
                  {t.isGroup && <p className="text-[12px] text-[var(--cm-muted)]">{t.others.length + 1} people</p>}
                </div>
                {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#D4AF63]" aria-label="Unread" />}
              </Link>
            );
          })}
        </Card>
      )}
      <Modal open={composing} onClose={closeCompose} title="New message">
        <ErrorNote>{error}</ErrorNote>
        <p className="mb-3 text-[13.5px] text-[var(--cm-muted-2)]">Choose one person for a private message, or two or more to start a group.</p>
        <PeopleChooser chosen={chosen} onChange={setChosen} />
        {chosen.length >= 2 && (
          <div className="mt-4">
            <Label htmlFor="cm-group-name">Group name (optional)</Label>
            <Input id="cm-group-name" value={groupName} maxLength={80} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Tuesday accountability circle" />
          </div>
        )}
        {chosen.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button variant="gold" onClick={() => void start()} disabled={starting}>
              {starting ? "Starting…" : chosen.length === 1 ? `Message ${chosen[0].display_name.split(" ")[0]}` : `Start group of ${chosen.length + 1}`}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
