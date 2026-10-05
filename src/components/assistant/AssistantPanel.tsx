"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, PictureInPicture2, Sparkles } from "lucide-react";
import AssistantActionCards, { type ActionCardData } from "@/components/assistant/ActionCards";
import PastConversations from "@/components/assistant/PastConversations";
import { titleForPath } from "@/components/layout/Header";
import { DEFAULT_ASSISTANT_NAME } from "@/lib/ai/defaults";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = ["What's my focus today?", "Schedule focus time", "Draft email to team", "Review weekly goals"];

// The AI assistant: ask box, conversation (newest first), previews to approve, past conversations.
// One component used in two places, both reading the same saved conversation:
//   variant "card"     → on Executive Home
//   variant "floating" → popped out, on top of whatever page you are working on
export default function AssistantPanel({ variant, onPopOut, onBringBack }: { variant: "card" | "floating"; onPopOut?: () => void; onBringBack?: () => void }) {
  const pathname = usePathname();
  // Where the client is, so the assistant knows what they are working on. Pages without a listed title get a readable name from the address.
  const listed = titleForPath(pathname);
  const fromPath = (pathname ?? "").split("/").filter(Boolean).slice(0, 2).map((x) => x.replace(/-/g, " ")).join(" / ");
  const page = variant === "card" ? "Executive Home" : listed === "Dashboard" && pathname !== "/" ? fromPath || listed : listed;
  const floating = variant === "floating";

  const [name, setName] = useState(DEFAULT_ASSISTANT_NAME);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thread, setThread] = useState<Msg[]>([]);
  const [actions, setActions] = useState<ActionCardData[]>([]);
  const [pastOpen, setPastOpen] = useState(false);
  const [pastNote, setPastNote] = useState(false);

  useEffect(() => {
    fetch("/api/ai-settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.assistantName && setName(d.assistantName))
      .catch(() => {});
    loadThread();
  }, []);

  const loadThread = () =>
    fetch("/api/mariposa", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.messages) && setThread(d.messages.map((m: Msg) => ({ id: m.id, role: m.role, content: m.content }))))
      .catch(() => {});

  // `shown` is what the chat displays when the text sent is long (an edit request carries the draft's details).
  const ask = async (q?: string, shown?: string) => {
    const message = (q ?? input).trim();
    if (!message || loading) return;
    setLoading(true);
    setPastNote(false);
    setThread((t) => [...t, { id: `u${Date.now()}`, role: "user", content: shown ?? message }]);
    if (!q) setInput("");
    let tz = "";
    try {
      tz = localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      /* the account's own zone is used */
    }
    try {
      const res = await fetch("/api/mariposa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, shown, page, tz }) });
      const data = await res.json();
      setThread((t) => [...t, { id: `a${Date.now()}`, role: "assistant", content: data.reply ?? "Sorry, I couldn't respond right now." }]);
      setActions(Array.isArray(data.actions) ? data.actions : []);
    } catch {
      setThread((t) => [...t, { id: `a${Date.now()}`, role: "assistant", content: "Sorry, I couldn't respond right now." }]);
    }
    setLoading(false);
  };

  const newConversation = async () => {
    await fetch("/api/assistant/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "new" }) }).catch(() => {});
    setThread([]);
    setActions([]);
    setPastNote(true);
  };

  const link = "hover:text-[#2E7C83] hover:underline";

  return (
    <div className={floating ? "flex h-full min-h-0 flex-col" : "bg-[#FFFFFF] rounded-2xl shadow-sm overflow-hidden h-full"}>
      {!floating && (
        <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5E3B6C] to-[#2E7C83] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-serif text-base text-indigo-900">AI Assistant</h3>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-gray-400">
            {onPopOut && (
              <button onClick={onPopOut} className={`inline-flex items-center gap-1 font-medium text-[#2E7C83] ${link}`} title="Float the assistant over any page so you can work on a task and ask for help side by side">
                <PictureInPicture2 className="w-3.5 h-3.5" /> Pop out
              </button>
            )}
            <button onClick={newConversation} className={link} title={`Start a fresh conversation. This one is saved under Past conversations, and ${name} still knows your account, your notes and your settings.`}>New conversation</button>
            <button onClick={() => setPastOpen((o) => !o)} className={link} aria-expanded={pastOpen} title="Read, continue or delete earlier conversations">Past conversations</button>
            <a href="/settings?tab=ai" className={link} title={`Tell ${name} about you, your team and how you work`}>Teach {name}</a>
            <span>Powered by {name}</span>
          </div>
        </div>
      )}

      {floating && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#1a2b4a]/10 px-4 py-2 text-xs text-gray-500">
          <button onClick={newConversation} className={link} title={`Start a fresh conversation. This one is saved under Past conversations.`}>New conversation</button>
          <button onClick={() => setPastOpen((o) => !o)} className={link} aria-expanded={pastOpen}>Past conversations</button>
          <a href="/settings?tab=ai" className={link}>Teach {name}</a>
          {onBringBack && <button onClick={onBringBack} className={`ml-auto font-medium text-[#2E7C83] ${link}`} title="Put the assistant back on Executive Home">Bring back to Executive Home</button>}
        </div>
      )}

      <div className={floating ? "flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3" : "px-6 pb-6"}>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder={floating ? `Ask ${name}${page ? ` about ${page}` : ""}…` : `Ask ${name} anything about your business...`}
            aria-label={`Ask ${name}`}
            className="w-full px-4 py-3 bg-white rounded-xl text-sm text-indigo-900 placeholder-gray-400 outline-none border border-gray-200/60 focus:border-[#c9a227]/50"
          />
          <button onClick={() => ask()} disabled={loading || !input.trim()} aria-label="Send" className="w-11 h-11 shrink-0 rounded-xl bg-[#1a2b4a] flex items-center justify-center hover:bg-[#1a2b4a]/90 transition-colors disabled:opacity-50">
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>

        <PastConversations open={pastOpen} onClose={() => setPastOpen(false)} onContinued={loadThread} />
        {pastNote && thread.length === 0 && (
          <p className="mb-3 text-xs text-[#7a8a99]">Your last conversation is saved under Past conversations. {name} still knows your account, your notes and your settings.</p>
        )}

        <AssistantActionCards
          fresh={actions}
          onFinished={(line) => setThread((t) => [...t, { id: `d${Date.now()}`, role: "assistant", content: line }])}
          onRevise={(card, instruction) =>
            ask(
              `Please change what you prepared for me: "${card.title}". What to change: ${instruction}\n\nThe details you had prepared (JSON, for your reference): ${JSON.stringify(card.args ?? {}).slice(0, 8000)}\n\nThat earlier preview has been cancelled and nothing was created, so do not look for it or update anything in my account. Call the ${card.tool} tool again now with the full corrected details to prepare a NEW preview for my approval.`,
              `Change "${card.title}": ${instruction}`
            )
          }
        />

        {(loading || thread.length > 0) && (
          <div className={`mb-4 space-y-2 overflow-y-auto rounded-xl border border-gray-200/60 bg-[#F8F5F0] p-3 text-sm text-[#3F4654] ${floating ? "min-h-[8rem] flex-1" : "max-h-96"}`} aria-live="polite" aria-label="Conversation, newest first">
            {loading && <div className="text-xs text-[#7a8a99]">{name} is thinking…</div>}
            {[...thread].reverse().map((m) => /^(Done|Undone): /.test(m.content) && m.role === "assistant" ? (
              <div key={m.id} className="flex items-start gap-1.5 px-1 text-xs text-[#5a6472]">
                <span aria-hidden className={m.content.startsWith("Undone") ? "text-[#7a8a99]" : "text-[#2c6b3f]"}>{m.content.startsWith("Undone") ? "↶" : "✓"}</span>
                <span>{m.content.replace(/^(Done|Undone): /, m.content.startsWith("Undone") ? "Undone: " : "")}</span>
              </div>
            ) : (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 ${m.role === "user" ? "bg-[#1a2b4a] text-white" : "bg-white text-[#3F4654]"}`}>
                  {m.content.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => ask(s)} disabled={loading} className="px-4 py-2 bg-[#F8F5F0] border border-gray-200/60 text-gray-600 rounded-full text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
