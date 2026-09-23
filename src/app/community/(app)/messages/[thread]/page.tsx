"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity, useProfiles } from "@/lib/community/context";
import type { DmMessage } from "@/lib/community/types";
import { Avatar, EmptyState, PageLoading, RichText } from "@/components/community/ui";
import { AttachButton, DraftStrip, MediaGallery, pasteInto, useMediaDraft } from "@/components/community/Media";

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
  const [sendError, setSendError] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessage[] | null>(null);
  const [other, setOther] = useState<string | null>(null);
  const [text, setText] = useState("");
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
  const people = useProfiles([other]);
  const p = other ? people[other] : undefined;

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const [m, parts] = await Promise.all([
        supabase.from("cm_dm_messages").select("*").eq("thread_id", params.thread).is("deleted_at", null).order("created_at").limit(500),
        supabase.from("cm_dm_participants").select("user_id").eq("thread_id", params.thread),
      ]);
      const ids = ((parts.data as { user_id: string }[]) ?? []).map((x) => x.user_id);
      if (!ids.includes(userId)) return setMessages([]);
      setOther(ids.find((id) => id !== userId) ?? null);
      setMessages((m.data as DmMessage[]) ?? []);
    })();
  }, [supabase, userId, params.thread]);

  // Mark read on open and whenever new messages arrive.
  useEffect(() => {
    if (!userId || !messages) return;
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
  }, [supabase, userId, params.thread, messages, refreshCounts]);

  useEffect(() => {
    const sub = supabase
      .channel(`cm-dm-${params.thread}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cm_dm_messages", filter: `thread_id=eq.${params.thread}` }, (payload: { new: unknown }) => {
        const m = payload.new as DmMessage;
        setMessages((prev) => (prev && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [supabase, params.thread]);

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
    setSendError(error ? "This message couldn't be sent. This member may not be accepting messages from you." : null);
    if (!error && data) {
      setText("");
      media.clear();
      setMessages((prev) => (prev && !prev.some((x) => x.id === (data as DmMessage).id) ? [...prev, data as DmMessage] : prev));
    }
  }

  if (messages === null) return <PageLoading />;
  if (!other && messages.length === 0) {
    return <EmptyState icon="🔒" title="This conversation isn't available" />;
  }

  let lastDay = "";
  return (
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col lg:h-[calc(100dvh-4rem)]">
      <div className="flex items-center gap-3 border-b border-[var(--cm-line)] pb-3">
        <Link href="/community/messages" aria-label="Back to messages" className="rounded-lg p-1.5 text-[var(--cm-muted-2)] hover:bg-black/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {other && (
          <Link href={`/community/members/${other}`} className="flex items-center gap-3">
            <Avatar name={p?.display_name} url={p?.avatar_url} size={38} />
            <span>
              <span className="block font-semibold text-[var(--cm-ink)]">{p?.display_name ?? "…"}</span>
              {p?.headline && <span className="block text-[12.5px] text-[var(--cm-muted)]">{p.headline}</span>}
            </span>
          </Link>
        )}
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto py-4">
        {messages.length === 0 && <p className="py-10 text-center text-[14px] text-[var(--cm-muted)]">Say hello 👋</p>}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          const day = dayLabel(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--cm-faint)]">{day}</p>}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
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
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

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
              placeholder="Write a message…"
              className="max-h-40 min-h-[44px] flex-1 resize-none rounded-2xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-4 py-2.5 text-[15px] text-[var(--cm-ink)] outline-none focus:border-[#D4AF63] focus:ring-[3px] focus:ring-[#D4AF63]/20"
            />
            <button
              onClick={send}
              disabled={sending || (!text.trim() && !media.items.length)}
              aria-label="Send"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#E6C988] via-[#D4AF63] to-[#B8923F] text-[#0F1A38] disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
