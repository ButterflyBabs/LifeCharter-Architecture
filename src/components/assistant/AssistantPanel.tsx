"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Mic, PictureInPicture2, Sparkles, Square, Volume2, VolumeX } from "lucide-react";
import AssistantActionCards, { type ActionCardData } from "@/components/assistant/ActionCards";
import PastConversations from "@/components/assistant/PastConversations";
import { titleForPath } from "@/components/layout/Header";
import { DEFAULT_ASSISTANT_NAME } from "@/lib/ai/defaults";

type Msg = { id: string; role: "user" | "assistant"; content: string };

// The browser's own speech tools: speaking a question in, and hearing the reply read aloud. Nothing is sent anywhere
// for this except what the browser itself does, so it costs nothing and needs no key. (Chrome, Edge and Safari.)
type SpeechResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> };
type Recognizer = { lang: string; interimResults: boolean; continuous: boolean; onresult: ((e: SpeechResultEvent) => void) | null; onend: (() => void) | null; onerror: ((e: { error?: string }) => void) | null; start: () => void; stop: () => void };
const getRecognizer = (): (new () => Recognizer) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};
const plainForSpeech = (t: string) => t.replace(/\*\*/g, "").replace(/[^\x20-\x7E\u00A0-\u024F\u2018-\u201D\u2026\n]/g, "").replace(/\s+/g, " ").trim();

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
  // Voice: speak a question in (microphone), and hear the reply read aloud (speaker).
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speakOn, setSpeakOn] = useState(false);
  const [voiceNote, setVoiceNote] = useState("");
  const rec = useRef<Recognizer | null>(null);
  const heard = useRef("");
  const speakOnRef = useRef(false);
  speakOnRef.current = speakOn;
  useEffect(() => {
    setCanListen(Boolean(getRecognizer()));
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
    try {
      setSpeakOn(localStorage.getItem("assistantSpeak") === "1");
    } catch {
      /* off by default */
    }
    return () => {
      try { rec.current?.stop(); } catch { /* already stopped */ }
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  const speak = (text: string) => {
    if (!canSpeak || !speakOnRef.current) return;
    const t = plainForSpeech(text);
    if (!t) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "en-US";
    u.rate = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };
  const stopSpeaking = () => {
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeaking(false);
  };
  const toggleSpeak = () => {
    const next = !speakOn;
    setSpeakOn(next);
    try { localStorage.setItem("assistantSpeak", next ? "1" : "0"); } catch { /* not remembered */ }
    if (!next) stopSpeaking();
    setVoiceNote(next ? "Replies will be read aloud." : "");
  };
  const toggleListen = () => {
    if (listening) {
      try { rec.current?.stop(); } catch { /* already stopped */ }
      return;
    }
    const R = getRecognizer();
    if (!R) return;
    stopSpeaking();
    setVoiceNote("");
    heard.current = "";
    const r = new R();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      heard.current = text.trim();
      setInput(heard.current);
    };
    r.onerror = (e) => {
      setListening(false);
      setVoiceNote(e.error === "not-allowed" || e.error === "service-not-allowed" ? "The microphone is blocked. Allow it for this site in your browser, then try again." : e.error === "no-speech" ? "I didn't hear anything. Tap the microphone and try again." : "Voice didn't work just now. You can still type.");
    };
    r.onend = () => {
      setListening(false);
      // When replies are read aloud, a spoken question is sent when you stop talking, so it works like a conversation.
      if (speakOnRef.current && heard.current) ask(heard.current);
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setVoiceNote("Voice didn't start. You can still type.");
    }
  };


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
      if (data.reply) speak(String(data.reply));
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
          {canListen && (
            <button type="button" onClick={toggleListen} aria-pressed={listening} aria-label={listening ? "Stop listening" : `Speak to ${name}`} title={listening ? "Listening… tap to stop" : `Tap and speak your question to ${name}`} className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center transition-colors ${listening ? "border-[#c0632f] bg-[#c0632f] text-white animate-pulse" : "border-gray-200 bg-white text-[#1a2b4a] hover:border-[#2E7C83]"}`}>
              <Mic className="w-5 h-5" />
            </button>
          )}
          {canSpeak && (
            <button type="button" onClick={speaking ? stopSpeaking : toggleSpeak} aria-pressed={speakOn} aria-label={speaking ? "Stop reading aloud" : speakOn ? "Turn off reading replies aloud" : "Read replies aloud"} title={speaking ? "Stop reading aloud" : speakOn ? "Replies are read aloud. Tap to turn off." : "Tap to have replies read aloud"} className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center transition-colors ${speakOn ? "border-[#2E7C83] bg-[#2E7C83]/10 text-[#1f6a70]" : "border-gray-200 bg-white text-[#5a6472] hover:border-[#2E7C83]"}`}>
              {speaking ? <Square className="w-4 h-4" /> : speakOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}
          <button onClick={() => ask()} disabled={loading || !input.trim()} aria-label="Send" className="w-11 h-11 shrink-0 rounded-xl bg-[#1a2b4a] flex items-center justify-center hover:bg-[#1a2b4a]/90 transition-colors disabled:opacity-50">
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {(voiceNote || (canListen && speakOn)) && (
          <p className="-mt-2 mb-3 text-xs text-[#7a8a99]" role="status">{voiceNote || `Speak your question and pause: ${name} answers and reads it aloud.`}</p>
        )}

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
