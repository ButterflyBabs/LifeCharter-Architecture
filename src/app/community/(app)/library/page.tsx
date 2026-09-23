"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Link2, Plus, PlayCircle, Search, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { fileSize } from "@/lib/community/format";
import { signedUrl, uploadCommunityFile } from "@/lib/community/storage";
import type { Resource } from "@/lib/community/types";
import { Button, Card, EmptyState, ErrorNote, Heading, Input, Label, Modal, PageLoading, TextArea } from "@/components/community/ui";
import { AI_PRIVACY_NOTE, PlusInvite, useJournalAi, usePlusAccess } from "@/components/community/JournalAssist";

const DEFAULT_CATEGORIES = ["Templates", "Worksheets", "Assessments", "Recordings", "Guides", "Recommended Tools", "Command Suite Resources", "Alignment Exercises"];

export default function LibraryPage() {
  const { supabase, spaces, isAdmin, canModerate, isPlus } = useCommunity();
  const access = usePlusAccess(isPlus);
  const [rows, setRows] = useState<Resource[] | null>(null);
  const [teaching, setTeaching] = useState<Resource | null>(null);
  const [scope, setScope] = useState<string>("library");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("cm_resources").select("*").order("category").order("sort_order").order("created_at", { ascending: false });
    setRows((data as Resource[]) ?? []);
  }, [supabase]);
  useEffect(() => {
    void load();
  }, [load]);

  const scopes = useMemo(() => {
    const ids = new Set((rows ?? []).map((r) => r.space_id).filter(Boolean) as string[]);
    return spaces.filter((s) => ids.has(s.id));
  }, [rows, spaces]);

  const visible = (rows ?? []).filter(
    (r) =>
      (scope === "library" ? r.space_id === null : r.space_id === scope) &&
      (!q.trim() || `${r.title} ${r.description ?? ""} ${r.category}`.toLowerCase().includes(q.trim().toLowerCase()))
  );
  const byCategory = visible.reduce<Record<string, Resource[]>>((acc, r) => ((acc[r.category] ||= []).push(r), acc), {});
  const canAdd = isAdmin || spaces.some((s) => canModerate(s.id));

  async function open(r: Resource) {
    const url = r.storage_path ? await signedUrl(r.storage_path) : r.url;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <Heading sub="Templates, worksheets, recordings and tools — one place, always current.">LifeCharter Library</Heading>
        {canAdd && (
          <Button variant="gold" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>

      {!access.loading && (access.has ? <AskLibrary onOpen={(id) => { const r = rows?.find((x) => x.id === id); if (r) void open(r); }} /> : <div className="mb-4"><PlusInvite title="Ask the Library" what="Ask Mariposa anything about LifeCharter's frameworks and get answers drawn from the Library." /></div>)}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          <ScopeChip active={scope === "library"} onClick={() => setScope("library")}>
            📚 Library
          </ScopeChip>
          {scopes.map((s) => (
            <ScopeChip key={s.id} active={scope === s.id} onClick={() => setScope(s.id)}>
              {s.emoji} {s.name}
            </ScopeChip>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cm-faint)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-9" />
        </div>
      </div>

      {rows === null ? (
        <PageLoading />
      ) : visible.length === 0 ? (
        <EmptyState icon="📚" title="The shelves are being stocked">
          Resources will appear here as they&rsquo;re added.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="mb-2 font-display text-[22px] font-semibold text-[var(--cm-ink)]">{cat}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((r) => {
                  const Icon = r.kind === "video" ? PlayCircle : r.kind === "file" ? FileText : Link2;
                  const manage = isAdmin || (r.space_id ? canModerate(r.space_id) : false);
                  return (
                    <Card key={r.id} className="flex items-start gap-3 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cm-fill-2)] text-[var(--cm-gold-text)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <button onClick={() => open(r)} className="text-left font-semibold text-[var(--cm-ink)] hover:underline">
                          {r.title}
                        </button>
                        {r.description && <p className="mt-0.5 text-[13.5px] text-[var(--cm-muted-2)]">{r.description}</p>}
                        <p className="mt-1 text-[12px] text-[var(--cm-muted)]">{r.kind === "file" ? `${r.file_name ?? "File"} ${fileSize(r.file_size)}` : r.kind === "video" ? "Video" : "Link"}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => open(r)} aria-label={`Open ${r.title}`} className="rounded-lg p-1.5 text-[var(--cm-muted)] hover:bg-black/5 hover:text-[var(--cm-ink)]">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        {manage && (
                          <button
                            aria-label={`Teach Mariposa about ${r.title}`}
                            title={r.ai_text ? "Mariposa knows this item — update" : "Teach Mariposa about this item"}
                            onClick={() => setTeaching(r)}
                            className={cn("rounded-lg p-1.5 hover:bg-black/5", r.ai_text ? "text-[var(--cm-gold-text)]" : "text-[var(--cm-faint)] hover:text-[var(--cm-ink)]")}
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                        )}
                        {manage && (
                          <button
                            aria-label={`Remove ${r.title}`}
                            onClick={async () => {
                              if (!confirm(`Remove “${r.title}” from the library?`)) return;
                              await supabase.from("cm_resources").update({ deleted_at: new Date().toISOString() }).eq("id", r.id);
                              void load();
                            }}
                            className="rounded-lg p-1.5 text-[var(--cm-faint)] hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {teaching && (
        <TeachMariposa
          resource={teaching}
          onClose={() => setTeaching(null)}
          onSaved={() => {
            setTeaching(null);
            void load();
          }}
        />
      )}

      {adding && (
        <ResourceEditor
          categories={Array.from(new Set([...DEFAULT_CATEGORIES, ...(rows ?? []).map((r) => r.category)]))}
          defaultScope={scope === "library" ? "" : scope}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function ScopeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[13px] font-semibold transition",
        active ? "border-[var(--cm-ink)] bg-[var(--cm-navy)] text-white" : "border-[var(--cm-line-strong)] bg-[var(--cm-surface)] text-[var(--cm-ink)] hover:border-[#D4AF63]"
      )}
    >
      {children}
    </button>
  );
}

function ResourceEditor({ categories, defaultScope, onClose, onSaved }: { categories: string[]; defaultScope: string; onClose: () => void; onSaved: () => void }) {
  const { supabase, userId, spaces, isAdmin, canModerate } = useCommunity();
  const [f, setF] = useState({ title: "", category: categories[0], description: "", kind: "link" as Resource["kind"], url: "", space_id: defaultScope, notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.title.trim()) return setError("Please add a title.");
    if (f.kind === "file" ? !file : !f.url.trim()) return setError(f.kind === "file" ? "Choose a file to upload." : "Add the link.");
    if (!f.space_id && !isAdmin) return setError("Choose a channel.");
    setBusy(true);
    setError(null);
    try {
      let storage: { storage_path: string; file_name: string; file_size: number; mime_type: string } | null = null;
      if (f.kind === "file" && file) {
        const a = await uploadCommunityFile(file, isAdmin ? "library" : userId!);
        storage = { storage_path: a.path!, file_name: file.name, file_size: file.size, mime_type: file.type };
      }
      const { data: created, error } = await supabase
        .from("cm_resources")
        .insert({
          title: f.title.trim(),
          category: f.category.trim() || "Guides",
          description: f.description.trim() || null,
          kind: f.kind,
          url: f.kind === "file" ? null : f.url.trim(),
          space_id: f.space_id || null,
          created_by: userId,
          ...(storage ?? {}),
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      // Let Mariposa learn it (reads uploaded PDFs/text files + any notes).
      if (storage || f.notes.trim()) await teach((created as { id: string }).id, f.notes);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add to the library">
      <div className="space-y-3">
        <div>
          <Label>Title</Label>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Category</Label>
            <Input list="cm-categories" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
            <datalist id="cm-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>Where</Label>
            <select value={f.space_id} onChange={(e) => setF({ ...f, space_id: e.target.value })} className="w-full rounded-xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-3 py-2.5 text-[15px]">
              {isAdmin && <option value="">LifeCharter Library (everyone)</option>}
              {spaces
                .filter((s) => isAdmin || canModerate(s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div>
          <Label>Type</Label>
          <div className="flex gap-1.5">
            {(["link", "video", "file"] as const).map((k) => (
              <ScopeChip key={k} active={f.kind === k} onClick={() => setF({ ...f, kind: k })}>
                {k === "link" ? "Link" : k === "video" ? "Video" : "Upload file"}
              </ScopeChip>
            ))}
          </div>
        </div>
        {f.kind === "file" ? (
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-[14px]" />
        ) : (
          <div>
            <Label>{f.kind === "video" ? "Video link" : "Link"}</Label>
            <Input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://…" />
          </div>
        )}
        <div>
          <Label>Description (optional)</Label>
          <TextArea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="min-h-[70px]" />
        </div>
        <div>
          <Label>What Mariposa should know (optional)</Label>
          <TextArea
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
            className="min-h-[70px]"
            placeholder="Key ideas, steps or who it's for — used to answer members' questions. Uploaded PDFs and text files are read automatically."
          />
        </div>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gold" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

async function teach(id: string, notes: string): Promise<{ chars: number; fromFile: boolean }> {
  const r = await fetch("/api/community/library/learn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, notes }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Mariposa couldn't read that item.");
  return j;
}

function TeachMariposa({ resource, onClose, onSaved }: { resource: Resource; onClose: () => void; onSaved: () => void }) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const known = resource.ai_text?.length ?? 0;
  return (
    <Modal open onClose={onClose} title="Teach Mariposa">
      <div className="space-y-3">
        <p className="text-[14px] text-[var(--cm-body)]">
          <strong>{resource.title}</strong>
          <br />
          <span className="text-[13px] text-[var(--cm-muted-2)]">
            {known ? `Mariposa currently knows about ${Math.round(known / 5)} words from this item.` : "Mariposa doesn't know this item yet."}
            {resource.storage_path ? " Saving re-reads the uploaded file." : ""}
          </span>
        </p>
        <div>
          <Label>What Mariposa should know</Label>
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[140px]" placeholder="Key ideas, steps, who it's for, when to use it…" />
          <p className="mt-1 text-[12px] text-[var(--cm-muted)]">This replaces what she knew before{resource.storage_path ? " (plus the file's text)" : ""}.</p>
        </div>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gold"
            disabled={busy || (!notes.trim() && !resource.storage_path)}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await teach(resource.id, notes);
                onSaved();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Couldn't save.");
                setBusy(false);
              }
            }}
          >
            {busy ? "Teaching…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// "Ask the Library" (Collective Plus / Command Suite).
function AskLibrary({ onOpen }: { onOpen: (id: string) => void }) {
  const ai = useJournalAi();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ question: string; answer: string; sources: { id: string; title: string }[] } | null>(null);
  const name = ai?.assistantName ?? "Mariposa";

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 3) return;
    setBusy(true);
    setError(null);
    const r = await fetch("/api/community/library/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.result) setResult({ question: q.trim(), ...j.result });
    else setError(j.error ?? "Try again in a moment.");
    setBusy(false);
  }

  return (
    <Card className="mb-5 border-[#D4AF63]/40 bg-[var(--cm-gold-soft)] p-4">
      <form onSubmit={ask} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cm-gold-text)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Ask ${name} about LifeCharter's frameworks and resources`} className="pl-9" maxLength={500} />
        </div>
        <Button variant="gold" type="submit" disabled={busy || q.trim().length < 3}>
          {busy ? "Thinking…" : "Ask"}
        </Button>
      </form>
      <p className="mt-1.5 text-[12px] text-[var(--cm-muted)]">{error ?? AI_PRIVACY_NOTE}</p>
      {result && (
        <div className="mt-3 rounded-xl bg-[var(--cm-surface)] p-3.5">
          <p className="text-[12.5px] font-semibold text-[var(--cm-muted-2)]">{result.question}</p>
          <p className="mt-1 whitespace-pre-line text-[14.5px] text-[var(--cm-ink)]">{result.answer}</p>
          {result.sources.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1.5 text-[12.5px]">
              <span className="text-[var(--cm-muted)]">From:</span>
              {result.sources.map((s) => (
                <button key={s.id} onClick={() => onOpen(s.id)} className="rounded-full border border-[var(--cm-line-strong)] px-2 py-0.5 font-semibold text-[var(--cm-ink)] hover:border-[#D4AF63]">
                  {s.title}
                </button>
              ))}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
