"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Check } from "lucide-react";
import type { Block } from "@/lib/customPages";

const field = "w-full rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const rid = () => Math.random().toString(36).slice(2, 10);

// One of the client's own pages (made by them or by their AI assistant). Everything on it is editable here,
// and saves by itself.
export default function CustomPage({ params }: { params: { slug: string } }) {
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [saved, setSaved] = useState<"saved" | "saving" | "error">("saved");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    fetch(`/api/custom-pages?slug=${encodeURIComponent(params.slug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.page) return setState("missing");
        setTitle(d.page.title);
        setBlocks(d.page.blocks ?? []);
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
      type === "heading" ? { id: rid(), type, text: "New heading" }
      : type === "text" ? { id: rid(), type, text: "" }
      : type === "checklist" ? { id: rid(), type, title: "Checklist", items: [] }
      : type === "table" ? { id: rid(), type, title: "Table", columns: ["Name", "Notes"], rows: [["", ""]] }
      : { id: rid(), type: "link", label: "Link", url: "https://" },
    ]);

  async function deletePage() {
    if (timer.current) clearTimeout(timer.current);
    await fetch("/api/custom-pages", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: params.slug }) }).catch(() => {});
    window.dispatchEvent(new Event("custom-pages-changed"));
    window.location.assign("/");
  }

  if (state === "loading") return <p className="p-8 text-sm text-[#7b6b8d]">Loading…</p>;
  if (state === "missing") return <p className="p-8 text-sm text-[#7b6b8d]">That page isn&apos;t here. It may have been removed.</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <input aria-label="Page title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent text-3xl font-semibold text-[#1a2b4a] outline-none dark:text-[#F8F5F0]" />
        <span className="mt-2 shrink-0 text-xs text-[#7b6b8d]" role="status">{saved === "saving" ? "Saving…" : saved === "error" ? "Couldn't save" : "Saved"}</span>
      </div>

      <div className="space-y-4">
        {blocks.map((b, i) => (
          <div key={b.id} className="group rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
            <div className="mb-2 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
              <button aria-label="Move up" onClick={() => move(i, -1)} className="rounded p-1 text-[#7b6b8d] hover:bg-[#1a2b4a]/5"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button aria-label="Move down" onClick={() => move(i, 1)} className="rounded p-1 text-[#7b6b8d] hover:bg-[#1a2b4a]/5"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button aria-label="Delete this block" onClick={() => setBlocks((bs) => bs.filter((x) => x.id !== b.id))} className="rounded p-1 text-[#8a2f2f] hover:bg-[#8a2f2f]/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>

            {b.type === "heading" && <input aria-label="Heading" value={b.text} onChange={(e) => set(b.id, { text: e.target.value })} className="w-full bg-transparent text-xl font-semibold text-[#1a2b4a] outline-none dark:text-[#F8F5F0]" />}
            {b.type === "text" && <textarea aria-label="Text" rows={Math.max(3, Math.min(14, b.text.split("\n").length + 1))} value={b.text} onChange={(e) => set(b.id, { text: e.target.value })} className={field} placeholder="Write here…" />}

            {b.type === "checklist" && (
              <div>
                <input aria-label="Checklist title" placeholder="Checklist title" value={b.title} onChange={(e) => set(b.id, { title: e.target.value })} className="mb-2 w-full bg-transparent font-semibold text-[#1a2b4a] outline-none dark:text-[#F8F5F0]" />
                <ul className="space-y-1.5">
                  {b.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-2">
                      <button
                        aria-label={it.done ? "Mark not done" : "Mark done"}
                        aria-pressed={it.done}
                        onClick={() => set(b.id, { items: b.items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)) } as Partial<Block>)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${it.done ? "border-[#2E7C83] bg-[#2E7C83] text-white" : "border-[#1a2b4a]/30"}`}
                      >
                        {it.done && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <input aria-label="Checklist item" value={it.text} onChange={(e) => set(b.id, { items: b.items.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)) } as Partial<Block>)} className={`w-full bg-transparent text-sm outline-none ${it.done ? "text-[#7b6b8d] line-through" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`} />
                      <button aria-label="Remove item" onClick={() => set(b.id, { items: b.items.filter((x) => x.id !== it.id) } as Partial<Block>)} className="text-[#b8a898] hover:text-[#8a2f2f]"><Trash2 className="h-3.5 w-3.5" /></button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => set(b.id, { items: [...b.items, { id: rid(), text: "New item", done: false }] } as Partial<Block>)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#2E7C83] hover:underline"><Plus className="h-3.5 w-3.5" /> Add item</button>
              </div>
            )}

            {b.type === "table" && (
              <div>
                <input aria-label="Table title" placeholder="Table title" value={b.title} onChange={(e) => set(b.id, { title: e.target.value })} className="mb-2 w-full bg-transparent font-semibold text-[#1a2b4a] outline-none dark:text-[#F8F5F0]" />
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        {b.columns.map((c, ci) => (
                          <th key={ci} className="pr-2 pb-1 text-left"><input aria-label="Column name" value={c} onChange={(e) => set(b.id, { columns: b.columns.map((x, k) => (k === ci ? e.target.value : x)) } as Partial<Block>)} className="w-full min-w-[7rem] bg-transparent text-xs font-semibold uppercase tracking-wide text-[#7b6b8d] outline-none" /></th>
                        ))}
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {b.rows.map((r, ri) => (
                        <tr key={ri}>
                          {b.columns.map((_, ci) => (
                            <td key={ci} className="pr-2 pb-1.5"><input aria-label="Cell" value={r[ci] ?? ""} onChange={(e) => set(b.id, { rows: b.rows.map((row, k) => (k === ri ? b.columns.map((__, c2) => (c2 === ci ? e.target.value : row[c2] ?? "")) : row)) } as Partial<Block>)} className={field} /></td>
                          ))}
                          <td><button aria-label="Remove row" onClick={() => set(b.id, { rows: b.rows.filter((_, k) => k !== ri) } as Partial<Block>)} className="text-[#b8a898] hover:text-[#8a2f2f]"><Trash2 className="h-3.5 w-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-1 flex gap-4">
                  <button onClick={() => set(b.id, { rows: [...b.rows, b.columns.map(() => "")] } as Partial<Block>)} className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7C83] hover:underline"><Plus className="h-3.5 w-3.5" /> Add row</button>
                  {b.columns.length < 12 && (
                    <button onClick={() => set(b.id, { columns: [...b.columns, "New column"], rows: b.rows.map((r) => [...r, ""]) } as Partial<Block>)} className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7C83] hover:underline"><Plus className="h-3.5 w-3.5" /> Add column</button>
                  )}
                </div>
              </div>
            )}

            {b.type === "link" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <input aria-label="Link text" value={b.label} onChange={(e) => set(b.id, { label: e.target.value })} className={field} />
                <input aria-label="Link address" value={b.url} onChange={(e) => set(b.id, { url: e.target.value })} className={field} />
                {/^https?:\/\//i.test(b.url) && <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2E7C83] hover:underline sm:col-span-2">Open {b.label} →</a>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#7b6b8d]">Add:</span>
        {(["heading", "text", "checklist", "table", "link"] as const).map((t) => (
          <button key={t} onClick={() => add(t)} className="rounded-full border border-[#1a2b4a]/15 px-3 py-1 text-xs font-medium capitalize text-[#1a2b4a] hover:border-[#c9a227] dark:text-[#F8F5F0] dark:border-white/15">{t}</button>
        ))}
      </div>
      <div className="mt-8 border-t border-[#1a2b4a]/10 pt-4">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1 text-xs text-[#8a2f2f] hover:underline"><Trash2 className="h-3.5 w-3.5" /> Delete this page</button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-[#3F4654] dark:text-[#d8d2c8]">Delete &ldquo;{title}&rdquo; and everything on it for good?</span>
            <button onClick={deletePage} className="rounded-lg bg-[#8a2f2f] px-3 py-1.5 font-semibold text-white">Yes, delete it</button>
            <button onClick={() => setConfirmDelete(false)} className="text-[#2E7C83] hover:underline">Keep it</button>
          </div>
        )}
      </div>
      <p className="mt-6 text-xs text-[#7b6b8d]">Tip: ask your AI assistant to add to or update this page for you. It shows you what it will change and waits for your approval.</p>
    </div>
  );
}
