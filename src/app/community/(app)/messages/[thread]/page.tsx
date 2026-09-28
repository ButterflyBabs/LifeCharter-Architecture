"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Flag, ImagePlus, Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity, useProfiles } from "@/lib/community/context";
import type { DmMessage, DmThread } from "@/lib/community/types";
import { Avatar, Button, EmptyState, ErrorNote, Input, Label, Modal, PageLoading, RichText } from "@/components/community/ui";
import { AttachButton, DraftStrip, MediaGallery, pasteInto, useMediaDraft } from "@/components/community/Media";
import { ReportDialog } from "@/components/community/ReportDialog";
import { GroupAvatar, PeopleChooser, groupNames, type Chosen } from "@/components/community/PeopleChooser";

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export default function ThreadPage({ params }: { params: { thread: string } }) {
  const { supabase, userId, refreshCounts, blockedIds } = useCommunity();
  const router = useRouter();
  const [sendError, setSendError] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessage[] | null>(null);
  const [thread, setThread] = useState<DmThread | null>(null);
  const [members, setMembers] = useState<string[]>([]); // everyone in it, including me
  const [text, setText] = useState("");
  const [reporting, setReporting] = useState<DmMessage | null>(null);
  const [showPeople, setShowPeople] = useState(false);
  // A pre-written note from an "Explore" card (?draft=…): fill the box once,
  // for the member to edit and send themselves — never sent automatically.
  useEffect(() => {
    const draft = new URLSearchParams(window.location.search).get("draft");
    if (draft) {
      setText(draft.slice(0, 1000));
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  const [sending, setSending] = useState(false);
  const media = useMediaDraft();
  const bottom = useRef<HTMLDivElement>(null);
  const isGroup = !!thread?.is_group;
  const others = members.filter((id) => id !== userId);
  const other = !isGroup ? others[0] ?? null : null;
  const senders = Array.from(new Set((messages ?? []).map((m) => m.sender_id)));
  const people = useProfiles([...members, ...senders]);
  const p = other ? people[other] : undefined;
  const groupLabel = thread?.title || groupNames(others.map((id) => people[id]?.display_name?.split(" ")[0] ?? "").filter(Boolean)) || "Group conversation";

  const loadThread = useCallback(async () => {
    if (!userId) return false;
    const [t, parts] = await Promise.all([
      supabase.from("cm_dm_threads").select("id, is_group, title, created_by, last_message_at").eq("id", params.thread).maybeSingle(),
      supabase.from("cm_dm_participants").select("user_id, joined_at").eq("thread_id", params.thread).order("joined_at"),
    ]);
    const ids = ((parts.data as { user_id: string }[]) ?? []).map((x) => x.user_id);
    setThread((t.data as DmThread | null) ?? null);
    setMembers(ids);
    return ids.includes(userId);
  }, [supabase, userId, params.thread]);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const [inIt, m] = await Promise.all([
        loadThread(),
        supabase.from("cm_dm_messages").select("*").eq("thread_id", params.thread).is("deleted_at", null).order("created_at").limit(500),
      ]);
      setMessages(inIt ? ((m.data as DmMessage[]) ?? []) : []);
    })();
  }, [supabase, userId, params.thread, loadThread]);

  // Mark read on open and whenever new messages arrive.
  useEffect(() => {
    if (!userId || !messages || !members.includes(userId)) return;
    void supabase
      .from("cm_dm_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("thread_id", params.thread)
      .eq("user_id", userId)
      .then(() => {
        void supabase
          .from("cm_notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("href", `/community/messages/${params.thread}`)
          .is("read_at", null)
          .then(() => refreshCounts());
      });
    bottom.current?.scrollIntoView({ block: "end" });
  }, [supabase, userId, params.thread, messages, members, refreshCounts]);

  useEffect(() => {
    const sub = supabase
      .channel(`cm-dm-${params.thread}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cm_dm_messages", filter: `thread_id=eq.${params.thread}` }, (payload: { new: unknown }) => {
        const m = payload.new as DmMessage;
        setMessages((prev) => (prev && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev));
        // Someone joined, left or renamed the group.
        if (m.kind === "system") void loadThread();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [supabase, params.thread, loadThread]);

  async function send() {
    const body = text.trim();
    if ((!body && !media.items.length) || !userId) return;
    setSending(true);
    let attachments: Awaited<ReturnType<typeof media.upload>> = [];
    try {
      attachments = await media.upload(userId);
    } catch (e) {
      media.setError(e instanceof Error ? e.message : "Upload failed.");
      setSending(false);
      return;
    }
    const { data, error } = await supabase.from("cm_dm_messages").insert({ thread_id: params.thread, sender_id: userId, body, attachments }).select("*").single();
    setSending(false);
    setSendError(
      error
        ? isGroup
          ? "This message couldn't be sent. You may no longer be in this conversation."
          : "This message couldn't be sent. This member may not be accepting messages from you."
        : null
    );
    if (!error && data) {
      setText("");
      media.clear();
      setMessages((prev) => (prev && !prev.some((x) => x.id === (data as DmMessage).id) ? [...prev, data as DmMessage] : prev));
    }
  }

  if (messages === null) return <PageLoading />;
  if (!userId || !members.includes(userId)) {
    return <EmptyState icon="🔒" title="This conversation isn't available" />;
  }

  let lastDay = "";
  let lastSender = "";
  return (
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col lg:h-[calc(100dvh-4rem)]">
      <div className="flex items-center gap-3 border-b border-[var(--cm-line)] pb-3">
        <Link href="/community/messages" aria-label="Back to messages" className="rounded-lg p-1.5 text-[var(--cm-muted-2)] hover:bg-black/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {isGroup ? (
          <button onClick={() => setShowPeople(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <GroupAvatar people={others.slice(0, 2).map((id) => people[id] ?? {})} size={38} />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-[var(--cm-ink)]">{groupLabel}</span>
              <span className="block text-[12.5px] text-[var(--cm-muted)]">{members.length} people · tap to see who&rsquo;s here</span>
            </span>
          </button>
        ) : (
          other && (
            <Link href={`/community/members/${other}`} className="flex min-w-0 items-center gap-3">
              <Avatar name={p?.display_name} url={p?.avatar_url} size={38} />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-[var(--cm-ink)]">{p?.display_name ?? "…"}</span>
                {p?.headline && <span className="block truncate text-[12.5px] text-[var(--cm-muted)]">{p.headline}</span>}
              </span>
            </Link>
          )
        )}
        {isGroup && (
          <button onClick={() => setShowPeople(true)} aria-label="People in this conversation" className="ml-auto rounded-lg p-2 text-[var(--cm-muted-2)] hover:bg-black/5">
            <Users className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto py-4">
        {messages.length === 0 && <p className="py-10 text-center text-[14px] text-[var(--cm-muted)]">Say hello 👋</p>}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          const day = dayLabel(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          if (m.kind === "system") {
            lastSender = "";
            return (
              <div key={m.id}>
                {showDay && <p className="my-3 text-center text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--cm-faint)]">{day}</p>}
                <p className="my-2 px-6 text-center text-[12.5px] italic text-[var(--cm-muted)]">{m.body}</p>
              </div>
            );
          }
          // In a group, messages from someone you've blocked are hidden from you.
          if (!mine && isGroup && blockedIds.has(m.sender_id)) return null;
          const sender = people[m.sender_id];
          const showName = isGroup && !mine && (lastSender !== m.sender_id || showDay);
          lastSender = m.sender_id;
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--cm-faint)]">{day}</p>}
              {showName && <p className="ml-10 mt-2 text-[12px] font-semibold text-[var(--cm-muted-2)]">{sender?.display_name ?? "…"}</p>}
              <div className={cn("group flex items-end gap-1.5", mine ? "justify-end" : "justify-start")}>
                {isGroup && !mine && (
                  <span className="w-8 shrink-0">{showName && <Avatar name={sender?.display_name} url={sender?.avatar_url} size={30} />}</span>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm",
                    mine ? "rounded-br-md bg-[var(--cm-navy)] text-white [&_*]:text-white" : "rounded-bl-md border border-[var(--cm-line)] bg-[var(--cm-surface)]"
                  )}
                  title={new Date(m.created_at).toLocaleString()}
                >
                  {m.body && <RichText text={m.body} className={cn("text-[14.5px]", mine && "text-white")} />}
                  <MediaGallery items={m.attachments} compact />
                </div>
                {!mine && (
                  <button
                    onClick={() => setReporting(m)}
                    aria-label="Report message"
                    title="Report"
                    className="rounded-full p-1.5 text-[var(--cm-faint)] opacity-60 hover:bg-black/5 hover:text-[var(--cm-ink)] group-hover:opacity-100"
                  >
                    <Flag className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {reporting && (
        <ReportDialog
          target={{ type: "message", id: reporting.id, userId: reporting.sender_id, userName: people[reporting.sender_id]?.display_name }}
          onClose={() => setReporting(null)}
        />
      )}
      {isGroup && thread && (
        <GroupPeople
          open={showPeople}
          onClose={() => setShowPeople(false)}
          thread={thread}
          members={members}
          onChanged={() => void loadThread()}
          onLeft={() => router.push("/community/messages")}
        />
      )}

      {other && blockedIds.has(other) ? (
        <p className="border-t border-[var(--cm-line)] pt-3 text-center text-[13.5px] text-[var(--cm-muted)]">
          You&rsquo;ve blocked this member. Unblock them from their profile to message again.
        </p>
      ) : (
        <>
          {sendError && <p className="border-t border-[var(--cm-line)] pt-2 text-[13px] text-red-700">{sendError}</p>}
          <div className="border-t border-[var(--cm-line)] pt-3">
            <DraftStrip draft={media} size={64} />
          </div>
          <div className="flex items-end gap-2 pt-2">
            <AttachButton draft={media} accept="image/*,video/*" className="h-11 w-11 justify-center rounded-full px-0">
              <ImagePlus className="h-5 w-5 text-[var(--cm-gold-text)]" aria-label="Add photo or video" />
            </AttachButton>
            <textarea
              onPaste={pasteInto(media)}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder={isGroup ? "Write to the group…" : "Write a message…"}
              className="max-h-40 min-h-[44px] min-w-0 flex-1 resize-none rounded-2xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-4 py-2.5 text-[15px] text-[var(--cm-ink)] outline-none focus:border-[#D4AF63] focus:ring-[3px] focus:ring-[#D4AF63]/20"
            />
            <button
              onClick={send}
              disabled={sending || (!text.trim() && !media.items.length)}
              aria-label="Send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E9D7A9] via-[#D4AF63] to-[#B8923F] text-[#1F2B3A] disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Who's in a group: rename it, add people (anyone), remove people (whoever
// started it), or leave.
function GroupPeople({
  open,
  onClose,
  thread,
  members,
  onChanged,
  onLeft,
}: {
  open: boolean;
  onClose: () => void;
  thread: DmThread;
  members: string[];
  onChanged: () => void;
  onLeft: () => void;
}) {
  const { supabase, userId, isAdmin } = useCommunity();
  const people = useProfiles(members);
  const [name, setName] = useState(thread.title ?? "");
  const [adding, setAdding] = useState<Chosen[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const canRemove = thread.created_by === userId || isAdmin;

  useEffect(() => setName(thread.title ?? ""), [thread.title]);

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>, after?: () => void) {
    setBusy(true);
    setError(null);
    const { error } = await fn();
    setBusy(false);
    if (error) return setError(error.message);
    onChanged();
    after?.();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setAdding(null);
        setConfirmLeave(false);
        setError(null);
        onClose();
      }}
      title={adding ? "Add people" : "People"}
    >
      <ErrorNote>{error}</ErrorNote>
      {adding ? (
        <>
          <PeopleChooser chosen={adding} onChange={setAdding} exclude={members} />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(null)}>
              Back
            </Button>
            <Button
              variant="gold"
              disabled={busy || !adding.length}
              onClick={() => void run(() => supabase.rpc("cm_add_dm_members", { p_thread: thread.id, p_members: adding.map((a) => a.user_id) }), () => setAdding(null))}
            >
              Add {adding.length || ""}
            </Button>
          </div>
        </>
      ) : (
        <>
          <Label htmlFor="cm-group-rename">Group name</Label>
          <div className="flex gap-2">
            <Input id="cm-group-rename" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Add a name (optional)" />
            <Button
              variant="outline"
              disabled={busy || name.trim() === (thread.title ?? "")}
              onClick={() => void run(() => supabase.rpc("cm_rename_dm_group", { p_thread: thread.id, p_title: name.trim() || null }))}
            >
              Save
            </Button>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cm-muted-2)]">{members.length} people</p>
            <Button variant="outline" size="sm" onClick={() => setAdding([])} disabled={members.length >= 50}>
              Add people
            </Button>
          </div>
          <div className="mt-2 space-y-1">
            {members.map((id) => {
              const person = people[id];
              return (
                <div key={id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <Link href={`/community/members/${id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={person?.display_name} url={person?.avatar_url} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[var(--cm-ink)]">
                        {person?.display_name ?? "…"}
                        {id === userId ? " (you)" : ""}
                      </span>
                      {id === thread.created_by && <span className="block text-[12px] text-[var(--cm-muted)]">Started this conversation</span>}
                    </span>
                  </Link>
                  {canRemove && id !== userId && (
                    <button
                      disabled={busy}
                      onClick={() => void run(() => supabase.rpc("cm_remove_dm_member", { p_thread: thread.id, p_user: id }))}
                      className="rounded-lg px-2 py-1 text-[12.5px] font-semibold text-[var(--cm-muted-2)] hover:bg-black/5 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-[var(--cm-line)] pt-4">
            {confirmLeave ? (
              <div className="space-y-2">
                <p className="text-[13.5px] text-[var(--cm-body)]">You&rsquo;ll stop getting messages from this group, and it will leave your list. Someone in it can add you back later.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setConfirmLeave(false)}>
                    Stay
                  </Button>
                  <Button variant="danger" disabled={busy} onClick={() => void run(() => supabase.rpc("cm_leave_dm_group", { p_thread: thread.id }), onLeft)}>
                    Leave group
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setConfirmLeave(true)}>
                Leave this group
              </Button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
