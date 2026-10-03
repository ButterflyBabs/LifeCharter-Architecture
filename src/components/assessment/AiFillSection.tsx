"use client";

import { useMemo, useState } from "react";
import { Sparkles, Copy, Check, X, ArrowLeft, ArrowRight, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * "Fill this section with my AI"
 *
 * Lets a client use the AI they already use (ChatGPT, Claude, Gemini, Copilot…),
 * which already knows them, to draft one assessment section at a time:
 *   1. Copy a ready-made prompt for this section.
 *   2. Their AI asks clarifying questions, then returns answers in a fixed format.
 *   3. They paste the reply back, review every answer, edit, and choose what to keep.
 * Nothing is applied without review, and private questions are opt-in.
 */

export interface AiFillQuestion {
  id: string;
  text: string;
  type: string; // "text" | "textarea" | "number" | "radio" | "likert" | "multiselect"
  options?: { value: string; label: string }[];
  placeholder?: string;
  tip?: string;
  sensitive?: boolean;
}

interface AiFillSectionProps {
  assessmentName: string; // e.g. "Brain"
  assessmentAbout: string; // e.g. "my business: how it runs, sells and is organized"
  sectionName: string;
  questions: AiFillQuestion[];
  answers: Record<string, string>;
  onApply: (updates: Record<string, string>) => void;
  accent?: string; // hex color for the trigger button
}

const START = "===LCCS-ANSWERS===";
const END = "===END===";

const isChoice = (q: AiFillQuestion) =>
  (q.type === "radio" || q.type === "likert" || q.type === "multiselect") && !!q.options?.length;

function buildPrompt(
  p: Pick<AiFillSectionProps, "assessmentName" | "assessmentAbout" | "sectionName" | "answers">,
  qs: AiFillQuestion[],
  includeCurrent: boolean
) {
  const lines: string[] = [];
  lines.push(
    `I'm completing the "${p.sectionName}" section of my LifeCharter Command Suite ${p.assessmentName} Assessment, which is about ${p.assessmentAbout}. Please help me draft my answers.`,
    "",
    "How to do this:",
    "1. Use everything you already know about me from our past conversations and your memory.",
    "2. Before you answer, ask me any clarifying questions you need, all in one message (8 at most), only about things you truly don't know or aren't sure about. Then wait for my reply.",
    "3. After I reply, answer every question below in my voice (first person), specific and concise. If you still don't know something, write \"Not sure yet:\" and your best guess. Never invent facts, numbers, names, credentials, results or testimonials.",
    "4. Questions marked PRIVATE are personal. For those, use only what I tell you in this conversation, not your memory. If I haven't told you, write SKIP.",
    "5. Never include passwords, API keys, or account or card numbers.",
    "6. For multiple-choice questions, answer with the option code(s) exactly as shown. For \"choose all that apply\", separate codes with commas.",
    `7. Put your final answers in ONE block in exactly this format, so I can paste it back. Start each answer with its code in square brackets:`,
    "",
    START,
    "[question_code] your answer (it can be several lines)",
    "[question_code] your answer",
    END,
    "",
    "Questions:"
  );
  for (const q of qs) {
    lines.push("");
    lines.push(`[${q.id}]${q.sensitive ? " (PRIVATE)" : ""} ${q.text}`);
    if (isChoice(q)) {
      const how = q.type === "multiselect" ? "Choose ALL that apply" : "Choose ONE";
      lines.push(`  ${how}: ` + q.options!.map((o) => `${o.value} = ${o.label}`).join("; "));
    } else if (q.type === "number") {
      lines.push("  Answer with a number only.");
    }
    const hint = q.tip || q.placeholder;
    if (hint) lines.push(`  Guidance: ${hint}`);
    const cur = (p.answers[q.id] ?? "").trim();
    if (includeCurrent && cur) lines.push(`  My current answer (improve or keep it): ${cur.replace(/\s+/g, " ").slice(0, 600)}`);
  }
  lines.push("", "Start by asking me your clarifying questions.");
  return lines.join("\n");
}

type Parsed = { value: string; problem?: string };

function normalizeChoice(q: AiFillQuestion, raw: string): Parsed {
  const opts = q.options ?? [];
  const find = (token: string) => {
    const t = token.trim().replace(/^["'`*]+|["'`*.]+$/g, "").toLowerCase();
    if (!t) return null;
    return (
      opts.find((o) => o.value.toLowerCase() === t) ||
      opts.find((o) => o.label.toLowerCase() === t) ||
      opts.find((o) => o.label.toLowerCase().startsWith(t)) ||
      null
    );
  };
  if (q.type === "multiselect") {
    const tokens = raw.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    const hits = tokens.map(find);
    const ok = opts.filter((o) => hits.some((h) => h?.value === o.value)).map((o) => o.value);
    const bad = tokens.filter((_, i) => !hits[i]);
    return { value: ok.join(","), problem: bad.length ? `Couldn't match: ${bad.join(", ")}` : undefined };
  }
  const hit = find(raw.split(/[,;\n]/)[0] ?? "");
  return hit ? { value: hit.value } : { value: "", problem: `Couldn't match "${raw.slice(0, 60)}" to an option` };
}

export function parseAiReply(text: string, qs: AiFillQuestion[]): Record<string, Parsed> {
  let body = text.replace(/```[a-z]*\n?/gi, "");
  const s = body.indexOf(START);
  if (s !== -1) body = body.slice(s + START.length);
  const e = body.indexOf(END);
  if (e !== -1) body = body.slice(0, e);
  const byId = new Map(qs.map((q) => [q.id.toLowerCase(), q]));
  const out: Record<string, Parsed> = {};
  const re = /^[ \t>*-]*\*{0,2}\[([A-Za-z0-9_]+)\]\*{0,2}[ \t]*(?:\(PRIVATE\))?[ \t:]*/gm;
  const marks: { id: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  // Only known question codes count as markers, so a line like "[TBD]" inside an answer is kept as text.
  while ((m = re.exec(body))) {
    if (byId.has(m[1].toLowerCase())) marks.push({ id: m[1], start: m.index, end: m.index + m[0].length });
  }
  marks.forEach((mk, i) => {
    const q = byId.get(mk.id.toLowerCase());
    if (!q) return;
    const raw = body.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : body.length).trim();
    if (!raw || /^skip\.?$/i.test(raw)) return;
    if (isChoice(q)) out[q.id] = normalizeChoice(q, raw);
    else if (q.type === "number") {
      const num = raw.replace(/,/g, "").match(/\d+(\.\d+)?/)?.[0] ?? "";
      out[q.id] = num ? { value: num } : { value: "", problem: "No number found" };
    } else out[q.id] = { value: raw };
  });
  return out;
}

export function AiFillSection(props: AiFillSectionProps) {
  const { assessmentName, sectionName, questions, answers, onApply, accent = "#4a9b9b" } = props;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [includePrivate, setIncludePrivate] = useState(false);
  const [includeCurrent, setIncludeCurrent] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [problems, setProblems] = useState<Record<string, string>>({});
  const [use, setUse] = useState<Record<string, boolean>>({});
  const [parseError, setParseError] = useState<string | null>(null);

  const hasPrivate = questions.some((q) => q.sensitive);
  const promptQs = useMemo(
    () => questions.filter((q) => includePrivate || !q.sensitive),
    [questions, includePrivate]
  );
  const prompt = useMemo(
    () => buildPrompt(props, promptQs, includeCurrent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [promptQs, includeCurrent, answers, sectionName]
  );
  const answeredCount = questions.filter((q) => (answers[q.id] ?? "").trim()).length;

  const reset = () => {
    setStep(1);
    setCopied(false);
    setReply("");
    setDraft({});
    setProblems({});
    setUse({});
    setParseError(null);
  };
  const close = () => {
    setOpen(false);
    reset();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const preview = () => {
    const parsed = parseAiReply(reply, promptQs);
    const ids = Object.keys(parsed);
    if (ids.length === 0) {
      setParseError(
        `I couldn't find any answers. Make sure you copied your AI's whole final reply, including the ${START} and ${END} lines.`
      );
      return;
    }
    const d: Record<string, string> = {};
    const pr: Record<string, string> = {};
    const u: Record<string, boolean> = {};
    for (const id of ids) {
      d[id] = parsed[id].value;
      if (parsed[id].problem) pr[id] = parsed[id].problem!;
      u[id] = !!parsed[id].value;
    }
    setDraft(d);
    setProblems(pr);
    setUse(u);
    setParseError(null);
    setStep(3);
  };

  const apply = () => {
    const updates: Record<string, string> = {};
    for (const [id, v] of Object.entries(draft)) if (use[id] && v.trim()) updates[id] = v;
    onApply(updates);
    close();
  };

  const selectedCount = Object.entries(draft).filter(([id, v]) => use[id] && v.trim()).length;

  const field = (q: AiFillQuestion) => {
    const v = draft[q.id] ?? "";
    const set = (nv: string) => setDraft((d) => ({ ...d, [q.id]: nv }));
    const base =
      "w-full rounded-lg border border-[#c9a227]/30 bg-white dark:bg-[#1a1a2e] p-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] focus:border-[#4a9b9b] outline-none";
    if (q.type === "multiselect" && q.options) {
      const sel = v.split(",").filter(Boolean);
      return (
        <div className="grid gap-1 sm:grid-cols-2">
          {q.options.map((o) => (
            <label key={o.value} className="flex items-start gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              <input
                type="checkbox"
                className="mt-1"
                checked={sel.includes(o.value)}
                onChange={() => {
                  const next = sel.includes(o.value) ? sel.filter((x) => x !== o.value) : [...sel, o.value];
                  set(q.options!.map((x) => x.value).filter((x) => next.includes(x)).join(","));
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
    if (isChoice(q)) {
      return (
        <select className={base} value={v} onChange={(e) => set(e.target.value)}>
          <option value="">Choose…</option>
          {q.options!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    return (
      <textarea
        className={`${base} resize-y`}
        rows={Math.min(8, Math.max(2, Math.ceil(v.length / 90)))}
        value={v}
        onChange={(e) => set(e.target.value)}
      />
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition hover:opacity-90"
        style={{ borderColor: accent, color: accent }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Fill this section with my AI
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Fill ${sectionName} with your AI`}
        >
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-[#FBF7EF] dark:bg-[#16233F] shadow-xl">
            <div className="flex items-start justify-between border-b border-[#c9a227]/20 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: accent }}>
                  {assessmentName} Assessment · Step {step} of 3
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                  Fill “{sectionName}” with your AI
                </h2>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="p-1 text-[#6b5d52] hover:text-[#1a2b4a]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {step === 1 && (
              <div className="space-y-4 p-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                <p>
                  Use the AI you already talk to most (ChatGPT, Claude, Gemini, Copilot). It already knows you, so it can
                  draft this section in minutes. You&apos;ll review every answer before anything is saved.
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-[#6b5d52] dark:text-[#e8e4f0]">
                  <li>Copy the prompt below and paste it into a new chat with your AI.</li>
                  <li>Answer the clarifying questions it asks you.</li>
                  <li>Copy its final reply (the block between the {START} lines) and paste it here in the next step.</li>
                </ol>
                <div className="flex flex-wrap gap-4 text-sm">
                  {answeredCount > 0 && (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={includeCurrent} onChange={(e) => setIncludeCurrent(e.target.checked)} />
                      Include my current answers ({answeredCount}) so the AI can build on them
                    </label>
                  )}
                  {hasPrivate && (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={includePrivate} onChange={(e) => setIncludePrivate(e.target.checked)} />
                      <Shield className="h-4 w-4 text-amber-600" />
                      Include private questions
                    </label>
                  )}
                </div>
                {hasPrivate && !includePrivate && (
                  <p className="text-xs text-[#6b5d52]">
                    Private questions are left out, so you can answer them yourself. If you include them, your AI is told to
                    use only what you tell it in that chat, not its memory.
                  </p>
                )}
                <textarea
                  readOnly
                  value={prompt}
                  rows={10}
                  className="w-full rounded-lg border border-[#c9a227]/30 bg-white dark:bg-[#1a1a2e] p-3 font-mono text-xs text-[#1a2b4a] dark:text-[#F8F5F0]"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <p className="text-xs text-[#6b5d52]">
                  {promptQs.length} questions. Never paste passwords, API keys, or account numbers into any AI.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button variant="outline" onClick={copy}>
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? "Copied" : "Copy prompt"}
                  </Button>
                  <Button variant="primary" onClick={() => setStep(2)}>
                    I have my AI&apos;s answers
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 p-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                <p>Paste your AI&apos;s final reply below. It&apos;s fine to paste the whole message.</p>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={14}
                  placeholder={`${START}\n[question_code] answer…\n${END}`}
                  className="w-full rounded-lg border border-[#c9a227]/30 bg-white dark:bg-[#1a1a2e] p-3 font-mono text-xs text-[#1a2b4a] dark:text-[#F8F5F0]"
                />
                {parseError && (
                  <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {parseError}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to prompt
                  </Button>
                  <Button variant="primary" onClick={preview} disabled={!reply.trim()}>
                    Review answers
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 p-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                <p>
                  Review each answer. Edit anything that isn&apos;t quite right, and untick any you don&apos;t want to use.
                  Only ticked answers are saved.
                </p>
                <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                  {questions.map((q) => {
                    const inDraft = q.id in draft;
                    const current = (answers[q.id] ?? "").trim();
                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl border p-3 ${
                          inDraft ? "border-[#c9a227]/30 bg-white/60 dark:bg-white/5" : "border-dashed border-[#c9a227]/20 opacity-70"
                        }`}
                      >
                        <div className="mb-2 flex items-start gap-2">
                          {inDraft && (
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={!!use[q.id]}
                              onChange={(e) => setUse((u) => ({ ...u, [q.id]: e.target.checked }))}
                              aria-label={`Use this answer for: ${q.text}`}
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{q.text}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs">
                              {!inDraft && <span className="text-[#6b5d52]">Not answered by your AI. You can answer it yourself.</span>}
                              {inDraft && current && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">Replaces your current answer</span>}
                              {inDraft && !current && <span className="rounded bg-teal-100 px-1.5 py-0.5 text-teal-800">New</span>}
                              {q.sensitive && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">Private</span>}
                              {problems[q.id] && <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700">{problems[q.id]}</span>}
                            </div>
                          </div>
                        </div>
                        {inDraft && field(q)}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button variant="primary" onClick={apply} disabled={selectedCount === 0}>
                    Save {selectedCount} answer{selectedCount === 1 ? "" : "s"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
