"use client";

// Add or edit one Alignment Journal entry. Two layers:
//   • headline — the shareable one-liner
//   • private journal — only ever seen by the member
// Sharing posts the headline (+ an optional note written for the Collective)
// into the matching Community pathway; the private journal never leaves.
import { useEffect, useState } from "react";
import { Lock, Share2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { JOURNAL_PROMPTS, SHARE_PATHWAY, weekStartOf, type JournalEntry, type JournalKind } from "@/lib/community/journal";
import { Button, ErrorNote, Input, Label, Modal, TextArea } from "./ui";
import { AI_PRIVACY_NOTE, Suggestion, askJournalAi, useJournalAi } from "./JournalAssist";

type AiSuggestion =
  | { kind: "sharpen"; headline: string; first_step: string }
  | { kind: "unpack"; questions: string[] }
  | { kind: "reflect"; headline: string; note: string; carry_forward: string };

const TITLES: Record<JournalKind, string> = {
  intention: "This week's intention",
  win: "Capture a win",
  reflection: "Reflect on your week",
};

export function useJournalDimensions() {
  const { supabase } = useCommunity();
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    void supabase
      .from("cm_settings")
      .select("value")
      .eq("key", "journal_dimensions")
      .maybeSingle()
      .then(({ data }: { data: { value: { items?: string[] } } | null }) => setItems(data?.value?.items ?? []));
  }, [supabase]);
  return items;
}

export function JournalSheet({
  kind,
  entry,
  onClose,
  onSaved,
}: {
  kind: JournalKind;
  entry?: JournalEntry | null;
  onClose: () => void;
  onSaved: (e: JournalEntry | null) => void;
}) {
  const { supabase, userId, profile, spaces, channels, refresh } = useCommunity();
  const dimensions = useJournalDimensions();
  const shareable = kind !== "reflection";
  const defaultShare = kind === "win" ? profile?.journal_share_win ?? true : kind === "intention" ? profile?.journal_share_intention ?? false : false;
  const [f, setF] = useState({
    headline: entry?.headline ?? "",
    private_note: entry?.private_note ?? "",
    community_note: entry?.community_note ?? "",
    dimension: entry?.dimension ?? "",
    rating: entry?.rating ?? 0,
    carry_forward: entry?.carry_forward ?? "",
    share: entry ? Boolean(entry.shared_post_id) : defaultShare,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const prompt = JOURNAL_PROMPTS[kind];
  const ai = useJournalAi();
  const [aiBusy, setAiBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);

  async function assist() {
    setAiBusy(true);
    setError(null);
    setSuggestion(null);
    try {
      if (kind === "intention") {
        const r = await askJournalAi<{ headline: string; first_step: string }>("sharpen", { headline: f.headline, note: f.private_note });
        setSuggestion({ kind: "sharpen", ...r });
      } else if (kind === "win") {
        const r = await askJournalAi<{ questions: string[] }>("unpack", { headline: f.headline, note: f.private_note });
        setSuggestion({ kind: "unpack", ...r });
      } else {
        const r = await askJournalAi<{ headline: string; note: string; carry_forward: string }>("reflect", { weekStart: entry?.week_start ?? weekStartOf() });
        setSuggestion({ kind: "reflect", ...r });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The AI didn't respond — try again.");
    } finally {
      setAiBusy(false);
    }
  }

  function applySuggestion() {
    if (!suggestion) return;
    const addTo = (text: string, extra: string) => (text.trim() ? `${text.trim()}\n\n${extra}` : extra);
    if (suggestion.kind === "sharpen") {
      setF({ ...f, headline: suggestion.headline || f.headline, private_note: suggestion.first_step ? addTo(f.private_note, `First step: ${suggestion.first_step}`) : f.private_note });
    } else if (suggestion.kind === "unpack") {
      setF({ ...f, private_note: addTo(f.private_note, suggestion.questions.map((q) => `${q}\n`).join("\n")) });
    } else {
      setF({
        ...f,
        headline: suggestion.headline || f.headline,
        private_note: suggestion.note ? addTo(f.private_note, suggestion.note) : f.private_note,
        carry_forward: suggestion.carry_forward || f.carry_forward,
      });
    }
    setSuggestion(null);
  }

  const assistLabel = ai
    ? kind === "intention"
      ? "Sharpen my intention"
      : kind === "win"
        ? "Help me unpack this"
        : "Draft my reflection"
    : "";

  const commons = spaces.find((s) => s.slug === "commons");
  const pathway = commons && SHARE_PATHWAY[kind] ? channels.find((c) => c.space_id === commons.id && c.slug === SHARE_PATHWAY[kind]) : undefined;

  async function save() {
    if (!userId) return;
    if (kind !== "reflection" && !f.headline.trim()) return setError("Add a headline — one line is plenty.");
    if (kind === "reflection" && !f.rating && !f.headline.trim() && !f.private_note.trim()) return setError("Rate your week or write a line about it.");
    setBusy(true);
    setError(null);
    try {
      const row = {
        user_id: userId,
        kind,
        week_start: entry?.week_start ?? weekStartOf(),
        headline: f.headline.trim() || null,
        private_note: f.private_note.trim() || null,
        community_note: f.community_note.trim() || null,
        dimension: f.dimension || null,
        rating: kind === "reflection" ? f.rating || null : null,
        carry_forward: kind === "reflection" ? f.carry_forward.trim() || null : null,
        updated_at: new Date().toISOString(),
      };
      // Save the private entry first.
      const { data: saved, error: saveErr } = entry
        ? await supabase.from("cm_journal_entries").update(row).eq("id", entry.id).select("*").single()
        : await supabase.from("cm_journal_entries").insert(row).select("*").single();
      if (saveErr || !saved) {
        throw new Error(saveErr?.message.includes("cm_journal_one") ? "You already have one for this week — edit it from your journal." : saveErr?.message ?? "Couldn't save.");
      }
      let result = saved as JournalEntry;

      // Then share / update / unshare the Community post (headline + note only).
      if (shareable && pathway) {
        const postBody = { title: f.headline.trim(), body: f.community_note.trim() };
        if (f.share && !result.shared_post_id) {
          const { data: post, error: postErr } = await supabase
            .from("cm_posts")
            .insert({ channel_id: pathway.id, space_id: pathway.space_id, author_id: userId, ...postBody })
            .select("id")
            .single();
          if (postErr) throw new Error(postErr.message);
          const { data: linked } = await supabase
            .from("cm_journal_entries")
            .update({ shared_post_id: (post as { id: string }).id })
            .eq("id", result.id)
            .select("*")
            .single();
          if (linked) result = linked as JournalEntry;
        } else if (f.share && result.shared_post_id) {
          await supabase.from("cm_posts").update(postBody).eq("id", result.shared_post_id);
        } else if (!f.share && result.shared_post_id) {
          await supabase.from("cm_posts").update({ deleted_at: new Date().toISOString() }).eq("id", result.shared_post_id);
          const { data: unlinked } = await supabase.from("cm_journal_entries").update({ shared_post_id: null }).eq("id", result.id).select("*").single();
          if (unlinked) result = unlinked as JournalEntry;
        }
        // Remember this member's sharing choice for next time.
        const pref = kind === "win" ? "journal_share_win" : "journal_share_intention";
        if (profile && (profile as unknown as Record<string, boolean>)[pref] !== f.share) {
          await supabase.from("cm_profiles").update({ [pref]: f.share }).eq("user_id", userId);
          void refresh();
        }
      }
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!entry) return;
    setBusy(true);
    if (entry.shared_post_id) await supabase.from("cm_posts").update({ deleted_at: new Date().toISOString() }).eq("id", entry.shared_post_id);
    await supabase.from("cm_journal_entries").delete().eq("id", entry.id);
    setBusy(false);
    onSaved(null);
  }

  return (
    <Modal open onClose={onClose} title={entry ? `Edit ${TITLES[kind].toLowerCase()}` : TITLES[kind]} wide>
      <div className="space-y-4">
        <div>
          <Label htmlFor="j-headline">{kind === "reflection" ? "Your week in a sentence (optional)" : "Headline"}</Label>
          <Input id="j-headline" value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} placeholder={prompt.headline} maxLength={140} autoFocus />
        </div>


        {kind === "reflection" && (
          <div>
            <Label>How aligned did this week feel?</Label>
            <div className="flex gap-2" role="radiogroup" aria-label="How aligned did this week feel?">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  role="radio"
                  aria-checked={f.rating === n}
                  onClick={() => setF({ ...f, rating: n })}
                  className={cn(
                    "h-11 w-11 rounded-full border text-[15px] font-semibold transition",
                    f.rating === n ? "border-[#D4AF63] bg-[#D4AF63] text-[#0F1A38]" : "border-[var(--cm-line-strong)] bg-[var(--cm-surface)] text-[var(--cm-ink)] hover:border-[#D4AF63]"
                  )}
                >
                  {n}
                </button>
              ))}
              <span className="self-center text-[12.5px] text-[var(--cm-muted)]">1 = scattered · 5 = fully aligned</span>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="j-private">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> Private journal — only you ever see this
            </span>
          </Label>
          <TextArea id="j-private" value={f.private_note} onChange={(e) => setF({ ...f, private_note: e.target.value })} placeholder={prompt.note} className="min-h-[120px]" />
        </div>

        {kind === "reflection" && (
          <div>
            <Label htmlFor="j-carry">What will you carry into next week?</Label>
            <Input id="j-carry" value={f.carry_forward} onChange={(e) => setF({ ...f, carry_forward: e.target.value })} />
          </div>
        )}

        {dimensions.length > 0 && (
          <div>
            <Label htmlFor="j-dim">Area of life (optional, private)</Label>
            <select
              id="j-dim"
              value={f.dimension}
              onChange={(e) => setF({ ...f, dimension: e.target.value })}
              className="w-full rounded-xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-3 py-2.5 text-[15px] text-[var(--cm-ink)]"
            >
              <option value="">—</option>
              {dimensions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {ai && (
          <div className="rounded-2xl border border-[#D4AF63]/40 bg-[var(--cm-gold-soft)] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[14.5px] font-semibold text-[var(--cm-ink)]">
                <Sparkles className="h-4 w-4 text-[var(--cm-gold-text)]" /> {ai.assistantName} can help
              </span>
              {!suggestion && (
                <Button type="button" size="sm" variant="gold" onClick={assist} disabled={aiBusy}>
                  <Sparkles className="h-4 w-4" /> {aiBusy ? "Thinking…" : assistLabel}
                </Button>
              )}
            </div>
            <p className="mt-1 text-[12.5px] text-[var(--cm-muted)]">
              {kind === "intention"
                ? "Write a rough intention, then ask for a clearer headline and a first step."
                : kind === "win"
                  ? "Write the win, then get three questions to help you see what made it happen."
                  : "Get a first draft of your reflection from this week's intention and wins."}{" "}
              {AI_PRIVACY_NOTE}
            </p>
            {suggestion && (
              <div className="mt-3">
              <Suggestion
                name={ai.assistantName}
                onUse={applySuggestion}
                onDismiss={() => setSuggestion(null)}
                useLabel={suggestion.kind === "unpack" ? "Add to my journal" : suggestion.kind === "reflect" ? "Use this draft" : "Use this"}
              >
                {suggestion.kind === "sharpen" && (
                  <>
                    <p className="font-semibold">{suggestion.headline}</p>
                    {suggestion.first_step && <p className="mt-1 text-[var(--cm-muted-2)]">First step: {suggestion.first_step}</p>}
                  </>
                )}
                {suggestion.kind === "unpack" && (
                  <ul className="list-disc space-y-1 pl-5">
                    {suggestion.questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                )}
                {suggestion.kind === "reflect" && (
                  <>
                    <p className="font-semibold">{suggestion.headline}</p>
                    <p className="mt-1 whitespace-pre-line">{suggestion.note}</p>
                    {suggestion.carry_forward && <p className="mt-1 text-[var(--cm-muted-2)]">Carry forward: {suggestion.carry_forward}</p>}
                    <p className="mt-1.5 text-[12px] text-[var(--cm-muted)]">You still choose your own rating.</p>
                  </>
                )}
              </Suggestion>
              </div>
            )}
          </div>
        )}

        {shareable && pathway && (
          <div className="rounded-2xl border border-[var(--cm-line)] bg-[var(--cm-fill)] p-3.5">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[14.5px] font-semibold text-[var(--cm-ink)]">
                <Share2 className="h-4 w-4 text-[var(--cm-gold-text)]" /> Also share with the Collective
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={f.share}
                onClick={() => setF({ ...f, share: !f.share })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${f.share ? "bg-[var(--cm-navy)]" : "bg-[var(--cm-line-strong)]"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${f.share ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </label>
            <p className="mt-1 text-[12.5px] text-[var(--cm-muted)]">
              Posts your headline to {pathway.emoji} {pathway.name}. Your private journal is never shared.
            </p>
            {f.share && (
              <div className="mt-3">
                <Label htmlFor="j-community">Add a note for the Collective (optional)</Label>
                <TextArea
                  id="j-community"
                  value={f.community_note}
                  onChange={(e) => setF({ ...f, community_note: e.target.value })}
                  placeholder={kind === "intention" ? "Would love accountability — check in with me Friday!" : "What would you like the Collective to know?"}
                  className="min-h-[70px]"
                />
              </div>
            )}
          </div>
        )}

        <ErrorNote>{error}</ErrorNote>
        <div className="flex items-center justify-between gap-2">
          {entry ? (
            confirmDelete ? (
              <span className="flex items-center gap-2 text-[13px] text-[var(--cm-muted-2)]">
                Delete for good?
                <Button size="sm" variant="danger" onClick={remove} disabled={busy}>
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="gold" onClick={save} disabled={busy}>
              {busy ? "Saving…" : f.share && shareable ? "Save & share" : "Save to journal"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
