"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Check, CheckCircle2, Pencil, Sparkles } from "lucide-react";
import type { Block } from "@/lib/customPages";

const rid = () => Math.random().toString(36).slice(2, 10);

// LifeCharter Command Suite look, shared by EVERY custom page (whoever or whatever builds it):
// ivory ground, indigo type, gold accents, Cormorant Garamond headlines, EB Garamond reading text,
// Montserrat for labels and controls, raised white cards with a soft shadow. Dark mode follows the app.
const card = "group rounded-2xl border border-[#E8E0D4] bg-white p-5 shadow-[0_6px_20px_-8px_rgba(15,26,56,0.18)] dark:border-[#334060] dark:bg-[#1E2A48]";
const inputBase = "w-full rounded-lg border border-[#E8E0D4] bg-white px-3 py-2 font-ui text-sm text-[#0F1A38] outline-none focus:border-[#D4AF63] dark:border-[#334060] dark:bg-[#0E162A] dark:text-[#FAF8F3]";
const label = "font-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A8E7F]";
const ghost = "inline-flex items-center gap-1 font-ui text-xs font-medium text-[#2E7C83] hover:underline";

export default function CustomPage({ params }: { params: { slug: string } }) {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<"my_pages" | "alignment_architect">("my_pages");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [saved, setSaved] = useState<"saved" | "saving" | "error">("saved");
  const [confirmDelete, setConfirmDelete] = useState(false);
  // A page made for review opens read-first, with an Edit button and an Approved button. Any other page is always editable.
  const [review, setReview] = useState<"draft" | "approved" | null>(null);
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [approving, setApproving] = useState(false);
  const editing = !review || editMode;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    fetch(`/api/custom-pages?slug=${encodeURIComponent(params.slug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.page) return setState("missing");
        setTitle(d.page.title);
        setSection(d.page.nav_section === "alignment_architect" ? "alignment_architect" : "my_pages");
        setBlocks(d.page.blocks ?? []);
        setReview(d.page.review_status === "draft" || d.page.review_status === "approved" ? d.page.review_status : null);
        setApprovedAt(d.page.approved_at ?? null);
        setState("ready");
      })
      .catch(() => setState("missing"));
  }, [params.slug]);

  const persist = useCallback(
    (t: string, b: Block[]) => {
      if (timer.current) clearTimeout(timer.current);
      setSaved("saving");
      timer.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/custom-pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: params.slug, title: t, blocks: b }) });
          setSaved(res.ok ? "saved" : "error");
          if (res.ok) window.dispatchEvent(new Event("custom-pages-changed"));
        } catch {
          setSaved("error");
        }
      }, 700);
    },
    [params.slug]
  );

  useEffect(() => {
    if (state !== "ready") return;
    if (first.current) {
      first.current = false;
      return;
    }
    persist(title, blocks);
  }, [title, blocks, state, persist]);

  const set = (id: string, patch: Partial<Block>) => setBlocks((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  const move = (i: number, d: number) =>
    setBlocks((bs) => {
      const j = i + d;
      if (j < 0 || j >= bs.length) return bs;
      const c = [...bs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  const add = (type: Block["type"]) =>
    setBlocks((bs) => [
      ...bs,
      type === "heading" ? { id: rid(), type, text: "New section" }
      : type === "text" ? { id: rid(), type, text: "" }
      : type === "callout" ? { id: rid(), type, text: "" }
      : type === "checklist" ? { id: rid(), type, title: "", items: [] }
      : type === "table" ? { id: rid(), type, title: "", columns: ["Name", "Notes"], rows: [["", ""]] }
      : { id: rid(), type: "link", label: "Link", url: "https://" },
    ]);

  // Approved (or reopened): saves what is on screen in the same step, so nothing typed a moment ago is lost.
  async function setReviewStatus(next: "approved" | "draft") {
    if (timer.current) clearTimeout(timer.current);
    setApproving(true);
    const res = await fetch("/api/custom-pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: params.slug, title, blocks, review: next }) }).catch(() => null);
    const d = res?.ok ? await res.json().catch(() => null) : null;
    setApproving(false);
    if (!d?.page) return setSaved("error");
    first.current = true; // the blocks below came from the server: don't save them straight back
    setBlocks(d.page.blocks ?? []);
    setReview(d.page.review_status ?? null);
    setApprovedAt(d.page.approved_at ?? null);
    setEditMode(false);
    setSaved("saved");
  }

  async function deletePage() {
    if (timer.current) clearTimeout(timer.current);
    await fetch("/api/custom-pages", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: params.slug }) }).catch(() => {});
    window.dispatchEvent(new Event("custom-pages-changed"));
    window.location.assign("/");
  }

  if (state === "loading") return <p className="p-8 font-ui text-sm text-[#9A8E7F]">Loading…</p>;
  if (state === "missing") return <p className="p-8 font-ui text-sm text-[#9A8E7F]">That page isn&apos;t here. It may have been removed.</p>;

  return (
    <div className="w-full px-4 py-10 font-ui sm:px-6 lg:px-10">
      <header className="mb-8">
        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">{section === "alignment_architect" ? "Alignment Architect" : "My Pages"}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <input
            aria-label="Page title"
            value={title}
            readOnly={!editing}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent font-display text-4xl font-semibold leading-tight text-[#0F1A38] outline-none dark:text-[#FAF8F3] sm:text-5xl"
          />
          <span className="mt-3 shrink-0 font-ui text-xs text-[#9A8E7F]" role="status">{saved === "saving" ? "Saving…" : saved === "error" ? "Couldn't save" : "Saved"}</span>
        </div>
        <div className="mt-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-[#D4AF63] to-transparent" />
          <Sparkles className="h-3.5 w-3.5 text-[#D4AF63]" />
        </div>
        {review && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E8E0D4] bg-white px-4 py-3 shadow-[0_6px_20px_-8px_rgba(15,26,56,0.18)] dark:border-[#334060] dark:bg-[#1E2A48]">
            <span className={`rounded-full px-3 py-1 font-ui text-xs font-semibold ${review === "approved" ? "bg-[#2E7C83]/15 text-[#1F5E63] dark:text-[#8fd0d6]" : "bg-[#FAF3DF] text-[#8a6a15]"}`} role="status">
              {review === "approved" ? `Approved${approvedAt ? ` ${new Date(approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}` : "Draft · waiting for your approval"}
            </span>
            <span className="flex-1" />
            <button onClick={() => setEditMode((v) => !v)} aria-pressed={editMode} className="inline-flex items-center gap-1.5 rounded-full border border-[#0F1A38]/25 px-5 py-2 font-ui text-sm font-semibold text-[#0F1A38] hover:border-[#D4AF63] dark:border-white/25 dark:text-[#FAF8F3]">
              <Pencil className="h-4 w-4" /> {editMode ? "Done editing" : "Edit"}
            </button>
            {review === "draft" ? (
              <button onClick={() => setReviewStatus("approved")} disabled={approving} className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7C83] px-5 py-2 font-ui text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                <CheckCircle2 className="h-4 w-4" /> {approving ? "Saving…" : "Approved"}
              </button>
            ) : (
              <button onClick={() => setReviewStatus("draft")} disabled={approving} className="font-ui text-xs text-[#2E7C83] hover:underline disabled:opacity-60">Reopen as a draft</button>
            )}
          </div>
        )}
      </header>

      <div className="space-y-5">
        {blocks.map((b, i) => (
          <section key={b.id} className={b.type === "heading" ? "group relative pt-2" : b.type === "callout" ? "group relative" : card}>
            <div className={`mb-1 justify-end gap-1 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100 ${editing ? "flex" : "hidden"}`}>
              <button aria-label="Move up" onClick={() => move(i, -1)} className="rounded p-1 text-[#9A8E7F] hover:bg-[#E8E0D4]/50"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button aria-label="Move down" onClick={() => move(i, 1)} className="rounded p-1 text-[#9A8E7F] hover:bg-[#E8E0D4]/50"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button aria-label="Delete this block" onClick={() => setBlocks((bs) => bs.filter((x) => x.id !== b.id))} className="rounded p-1 text-[#D83A34] hover:bg-[#D83A34]/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>

            {b.type === "heading" && (
              <div className="flex items-center gap-3">
                <span className="h-6 w-1 rounded-full bg-[#D4AF63]" aria-hidden="true" />
                <input aria-label="Section heading" readOnly={!editing} value={b.text} onChange={(e) => set(b.id, { text: e.target.value })} className="w-full bg-transparent font-display text-3xl font-semibold text-[#0F1A38] outline-none dark:text-[#FAF8F3]" />
              </div>
            )}

            {b.type === "text" && (
              <textarea
                aria-label="Text" readOnly={!editing}
                rows={Math.max(3, Math.min(60, b.text.split("\n").length + 1))}
                value={b.text}
                onChange={(e) => set(b.id, { text: e.target.value })}
                placeholder="Write here…"
                className="w-full resize-y bg-transparent font-editorial text-[17px] leading-relaxed text-[#0F1A38] outline-none placeholder:text-[#C9B8A7] dark:text-[#E8E0D4]"
              />
            )}

            {b.type === "callout" && (
              <div className="rounded-2xl border border-[#D4AF63]/50 border-l-4 border-l-[#D4AF63] bg-[#FAF3DF] p-5 dark:bg-[#2a2415]">
                <p className={`${label} mb-1 text-[#9A7B22]`}>Key note</p>
                <textarea aria-label="Highlighted note" readOnly={!editing} rows={Math.max(2, Math.min(10, b.text.split("\n").length + 1))} value={b.text} onChange={(e) => set(b.id, { text: e.target.value })} placeholder="The one thing to remember…" className="w-full resize-y bg-transparent font-editorial text-[17px] italic leading-relaxed text-[#0F1A38] outline-none placeholder:text-[#C9B8A7] dark:text-[#E8E0D4]" />
              </div>
            )}

            {b.type === "checklist" && (
              <div>
                <input aria-label="Checklist title" readOnly={!editing} placeholder="Checklist" value={b.title} onChange={(e) => set(b.id, { title: e.target.value })} className="mb-3 w-full bg-transparent font-display text-2xl font-semibold text-[#0F1A38] outline-none placeholder:text-[#C9B8A7] dark:text-[#FAF8F3]" />
                <ul className="space-y-2">
                  {b.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3">
                      <button
                        aria-label={it.done ? "Mark not done" : "Mark done"}
                        aria-pressed={it.done}
                        onClick={() => set(b.id, { items: b.items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)) } as Partial<Block>)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${it.done ? "border-[#2E7C83] bg-[#2E7C83] text-white" : "border-[#C9B8A7] bg-white hover:border-[#D4AF63] dark:bg-[#0E162A]"}`}
                      >
                        {it.done && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <input aria-label="Checklist item" readOnly={!editing} value={it.text} onChange={(e) => set(b.id, { items: b.items.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)) } as Partial<Block>)} className={`w-full bg-transparent font-editorial text-[17px] outline-none ${it.done ? "text-[#9A8E7F] line-through" : "text-[#0F1A38] dark:text-[#E8E0D4]"}`} />
                      <button hidden={!editing} aria-label="Remove item" onClick={() => set(b.id, { items: b.items.filter((x) => x.id !== it.id) } as Partial<Block>)} className="text-[#C9B8A7] opacity-0 hover:text-[#D83A34] group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => set(b.id, { items: [...b.items, { id: rid(), text: "", done: false }] } as Partial<Block>)} className={`${ghost} mt-3 ${editing ? "" : "!hidden"}`}><Plus className="h-3.5 w-3.5" /> Add item</button>
              </div>
            )}

            {b.type === "table" && (
              <div>
                <input aria-label="Table title" readOnly={!editing} placeholder="Table" value={b.title} onChange={(e) => set(b.id, { title: e.target.value })} className="mb-3 w-full bg-transparent font-display text-2xl font-semibold text-[#0F1A38] outline-none placeholder:text-[#C9B8A7] dark:text-[#FAF8F3]" />
                <div className="overflow-x-auto rounded-xl border border-[#E8E0D4] dark:border-[#334060]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#0F1A38] text-[#E9D7A9]">
                      <tr>
                        {b.columns.map((c, ci) => (
                          <th key={ci} className="px-3 py-2 text-left"><input aria-label="Column name" readOnly={!editing} value={c} onChange={(e) => set(b.id, { columns: b.columns.map((x, k) => (k === ci ? e.target.value : x)) } as Partial<Block>)} className="w-full min-w-[7rem] bg-transparent font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E9D7A9] outline-none placeholder:text-[#9A8E7F]" /></th>
                        ))}
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {b.rows.map((r, ri) => (
                        <tr key={ri} className={ri % 2 ? "bg-[#FAF8F3] dark:bg-[#17213a]" : "bg-white dark:bg-[#1E2A48]"}>
                          {b.columns.map((_, ci) => (
                            <td key={ci} className="px-2 py-1.5"><input aria-label="Cell" readOnly={!editing} value={r[ci] ?? ""} onChange={(e) => set(b.id, { rows: b.rows.map((row, k) => (k === ri ? b.columns.map((__, c2) => (c2 === ci ? e.target.value : row[c2] ?? "")) : row)) } as Partial<Block>)} className="w-full rounded-md bg-transparent px-1.5 py-1 font-editorial text-[16px] text-[#0F1A38] outline-none focus:bg-white focus:ring-1 focus:ring-[#D4AF63] dark:text-[#E8E0D4] dark:focus:bg-[#0E162A]" /></td>
                          ))}
                          <td><button hidden={!editing} aria-label="Remove row" onClick={() => set(b.id, { rows: b.rows.filter((_, k) => k !== ri) } as Partial<Block>)} className="p-1 text-[#C9B8A7] hover:text-[#D83A34]"><Trash2 className="h-3.5 w-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={`mt-3 gap-4 ${editing ? "flex" : "hidden"}`}>
                  <button onClick={() => set(b.id, { rows: [...b.rows, b.columns.map(() => "")] } as Partial<Block>)} className={ghost}><Plus className="h-3.5 w-3.5" /> Add row</button>
                  {b.columns.length < 12 && (
                    <button onClick={() => set(b.id, { columns: [...b.columns, "New column"], rows: b.rows.map((r) => [...r, ""]) } as Partial<Block>)} className={ghost}><Plus className="h-3.5 w-3.5" /> Add column</button>
                  )}
                </div>
              </div>
            )}

            {b.type === "link" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <input aria-label="Link text" readOnly={!editing} value={b.label} onChange={(e) => set(b.id, { label: e.target.value })} className={inputBase} />
                <input aria-label="Link address" readOnly={!editing} value={b.url} onChange={(e) => set(b.id, { url: e.target.value })} className={inputBase} />
                {/^https?:\/\//i.test(b.url) && (
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0F1A38] px-4 py-2 font-ui text-xs font-semibold text-[#E9D7A9] hover:opacity-90 sm:col-span-2">
                    {b.label || b.url} →
                  </a>
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      <div className={`mt-8 flex-wrap items-center gap-2 ${editing ? "flex" : "hidden"}`}>
        <span className={label}>Add</span>
        {(["heading", "text", "callout", "checklist", "table", "link"] as const).map((t) => (
          <button key={t} onClick={() => add(t)} className="rounded-full border border-[#E8E0D4] bg-white px-3.5 py-1.5 font-ui text-xs font-medium capitalize text-[#0F1A38] hover:border-[#D4AF63] dark:border-[#334060] dark:bg-[#1E2A48] dark:text-[#FAF8F3]">{t === "callout" ? "highlighted note" : t}</button>
        ))}
      </div>

      <footer className="mt-10 border-t border-[#E8E0D4] pt-4 dark:border-[#334060]">
        <p className="font-editorial text-sm italic text-[#9A8E7F]">Ask your AI assistant to add to or update this page. It shows you what it will change and waits for your approval.</p>
        <div className="mt-3">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1 font-ui text-xs text-[#D83A34] hover:underline"><Trash2 className="h-3.5 w-3.5" /> Delete this page</button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 font-ui text-xs">
              <span className="text-[#0F1A38] dark:text-[#E8E0D4]">Delete &ldquo;{title}&rdquo; and everything on it for good?</span>
              <button onClick={deletePage} className="rounded-lg bg-[#D83A34] px-3 py-1.5 font-semibold text-white">Yes, delete it</button>
              <button onClick={() => setConfirmDelete(false)} className="text-[#2E7C83] hover:underline">Keep it</button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
