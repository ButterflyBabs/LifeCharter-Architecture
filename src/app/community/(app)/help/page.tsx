"use client";

// Help & FAQ — searchable questions grouped by topic. Super admins edit the
// questions right here (pencil on each, "Add question" at the top).
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, EyeOff, MessageCircle, Pencil, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { Badge, Button, Card, EmptyState, ErrorNote, Heading, Input, Label, Modal, PageLoading, RichText, TextArea } from "@/components/community/ui";

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
}

const CATEGORY_ORDER = ["Getting started", "Posting & conversation", "Messages & members", "Events & sessions", "App & notifications", "Your account", "Getting help"];

export default function HelpPage() {
  const { supabase, userId, isAdmin } = useCommunity();
  const router = useRouter();
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Faq> | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("cm_faqs").select("*").order("sort_order");
    setFaqs((data as Faq[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    void load();
    void supabase
      .from("cm_admins")
      .select("user_id")
      .order("created_at")
      .then(({ data }: { data: { user_id: string }[] | null }) => setAdminId((data ?? []).find((a) => a.user_id !== userId)?.user_id ?? null));
  }, [load, supabase, userId]);

  const categories = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = (faqs ?? []).filter((f) => !term || `${f.question} ${f.answer} ${f.category}`.toLowerCase().includes(term));
    const names = Array.from(new Set(list.map((f) => f.category)));
    names.sort((a, b) => (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99));
    return names.map((name) => ({ name, items: list.filter((f) => f.category === name) }));
  }, [faqs, q]);

  async function messageAdmin() {
    if (!adminId) return;
    setError(null);
    const { data, error } = await supabase.rpc("cm_start_dm", { p_other: adminId });
    if (error) return setError(error.message);
    router.push(`/community/messages/${data}`);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <Heading sub="Answers to common questions about the Collective.">Help &amp; FAQ</Heading>
        {isAdmin && (
          <Button variant="gold" size="sm" onClick={() => setEditing({ category: categories[0]?.name ?? "Getting started", published: true, sort_order: 100 })}>
            <Plus className="h-4 w-4" /> Add question
          </Button>
        )}
      </div>

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA0B0]" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions" className="pl-9" />
      </div>

      {faqs === null ? (
        <PageLoading />
      ) : categories.length === 0 ? (
        <EmptyState icon="🔍" title={q ? "No matching questions" : "No questions yet"}>
          {q ? "Try a different word, or message an admin below." : null}
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <section key={cat.name}>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A8873F]">{cat.name}</h2>
              <Card className="divide-y divide-[#F0EBE0] overflow-hidden">
                {cat.items.map((f) => {
                  const isOpen = open === f.id || !!q.trim();
                  return (
                    <div key={f.id} className={cn(!f.published && "bg-[#F7F7F9]")}>
                      <div className="flex items-start">
                        <button
                          onClick={() => setOpen(open === f.id ? null : f.id)}
                          aria-expanded={isOpen}
                          className="flex flex-1 items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#FBF8F2]"
                        >
                          <span className="font-semibold text-[#1F315B]">
                            {f.question}
                            {!f.published && (
                              <span className="ml-2 align-middle">
                                <Badge tone="gray">
                                  <EyeOff className="h-3 w-3" /> Hidden
                                </Badge>
                              </span>
                            )}
                          </span>
                          <ChevronDown className={cn("mt-0.5 h-5 w-5 shrink-0 text-[#A8873F] transition", isOpen && "rotate-180")} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => setEditing(f)} aria-label={`Edit “${f.question}”`} className="px-3 py-3.5 text-[#B0B4C0] hover:text-[#1F315B]">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <RichText text={f.answer} className="text-[14.5px]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </Card>
            </section>
          ))}
        </div>
      )}

      {adminId && (
        <Card className="mt-8 flex flex-col items-start justify-between gap-3 bg-gradient-to-br from-[#FFFDF8] to-[#FBF3DF] p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-[21px] font-semibold text-[#1F315B]">Still need help?</p>
            <p className="text-[14px] text-[#5B6275]">Send a private message to a LifeCharter admin.</p>
          </div>
          <Button variant="gold" onClick={messageAdmin}>
            <MessageCircle className="h-4 w-4" /> Message an admin
          </Button>
        </Card>
      )}
      <div className="mt-3">
        <ErrorNote>{error}</ErrorNote>
      </div>

      {editing && (
        <FaqEditor
          initial={editing}
          categories={Array.from(new Set([...CATEGORY_ORDER, ...(faqs ?? []).map((f) => f.category)]))}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function FaqEditor({ initial, categories, onClose, onSaved }: { initial: Partial<Faq>; categories: string[]; onClose: () => void; onSaved: () => void }) {
  const { supabase } = useCommunity();
  const [f, setF] = useState({
    category: initial.category ?? "Getting started",
    question: initial.question ?? "",
    answer: initial.answer ?? "",
    sort_order: initial.sort_order ?? 100,
    published: initial.published ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.question.trim() || !f.answer.trim()) return setError("Please add both a question and an answer.");
    setBusy(true);
    const row = { ...f, category: f.category.trim() || "Getting started", question: f.question.trim(), answer: f.answer.trim(), updated_at: new Date().toISOString() };
    const { error } = initial.id ? await supabase.from("cm_faqs").update(row).eq("id", initial.id) : await supabase.from("cm_faqs").insert(row);
    setBusy(false);
    if (error) return setError(error.message);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={initial.id ? "Edit question" : "Add a question"} wide>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
          <div>
            <Label>Topic</Label>
            <Input list="cm-faq-categories" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
            <datalist id="cm-faq-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>Order</Label>
            <Input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <Label>Question</Label>
          <Input value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} />
        </div>
        <div>
          <Label>Answer</Label>
          <TextArea value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} className="min-h-[160px]" />
          <p className="mt-1 text-[12px] text-[#8A8FA0]">Line breaks are kept. Full links (https://…) become clickable.</p>
        </div>
        <label className="flex items-center gap-2 text-[14px] text-[#2A3552]">
          <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /> Visible to members
        </label>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex items-center justify-between gap-2">
          {initial.id ? (
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (!confirm("Delete this question?")) return;
                await supabase.from("cm_faqs").delete().eq("id", initial.id);
                onSaved();
              }}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="gold" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
