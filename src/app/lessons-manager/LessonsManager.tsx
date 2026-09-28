"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DIMENSION_KEYS, DIMENSION_LABEL, type DimensionKey } from "@/lib/scoring/dimensionModel";

interface Lesson {
  id: string;
  dimension_key: DimensionKey;
  title: string;
  summary: string | null;
  body: string | null;
  video_url: string | null;
  resource_url: string | null;
  sort_order: number;
  published: boolean;
}
const EMPTY = { id: "", dimensionKey: "marketing" as DimensionKey, title: "", summary: "", body: "", videoUrl: "", resourceUrl: "", published: false };

export default function LessonsManager() {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/lessons?all=1", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setLessons(d.lessons ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!form.title.trim()) return setMsg("Give the lesson a title.");
    const r = await fetch("/api/lessons", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Couldn't save.");
    setMsg(form.published ? "Saved and live for clients." : "Saved as a draft (clients don't see drafts).");
    setForm(EMPTY);
    void load();
  }

  async function remove(l: Lesson) {
    if (!confirm(`Delete "${l.title}"?`)) return;
    await fetch("/api/lessons", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: l.id }) });
    void load();
  }

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a] flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Lessons</h1>
          <p className="text-[#7a8a99]">Short &ldquo;how to run this part&rdquo; lessons clients see on each business area, especially where they score low. Only you see this page.</p>
        </div>
      </div>
      {msg && <p className="mb-4 rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">{msg}</p>}
      <Card className="mb-6">
        <CardContent className="p-5 space-y-3">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{form.id ? "Edit lesson" : "New lesson"}</p>
          <div className="grid gap-2 md:grid-cols-[200px_1fr]">
            <select value={form.dimensionKey} onChange={(e) => setForm({ ...form, dimensionKey: e.target.value as DimensionKey })} className="h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 text-sm" aria-label="Area">
              {DIMENSION_KEYS.map((k) => <option key={k} value={k}>{DIMENSION_LABEL[k]}</option>)}
            </select>
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <Input placeholder="One-line summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} placeholder="The lesson (plain text; short paragraphs work best)" className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-3 text-sm" />
          <div className="grid gap-2 md:grid-cols-2">
            <Input placeholder="Video link (Vimeo, YouTube, MasterClass clip)" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
            <Input placeholder="Resource link (worksheet, Collective Library item)" value={form.resourceUrl} onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4" /> Live for clients</label>
          <div className="flex gap-2">
            <Button onClick={save}><Plus className="w-4 h-4 mr-1" />{form.id ? "Save changes" : "Add lesson"}</Button>
            {form.id && <Button variant="outline" onClick={() => setForm(EMPTY)}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
      {lessons === null ? (
        <p className="text-[#7a8a99]">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {DIMENSION_KEYS.map((k) => {
            const list = lessons.filter((l) => l.dimension_key === k);
            return (
              <Card key={k}>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{DIMENSION_LABEL[k]} <span className="font-normal text-[#7a8a99]">· {list.length}</span></p>
                  {!list.length && <p className="mt-1 text-xs text-[#7a8a99]">No lessons yet. Clients still get their assistant&apos;s personal lesson here.</p>}
                  {list.map((l) => (
                    <div key={l.id} className="mt-2 flex items-center gap-2 text-sm">
                      <button
                        className="flex-1 text-left text-[#1a2b4a] dark:text-[#F8F5F0] hover:underline"
                        onClick={() => setForm({ id: l.id, dimensionKey: l.dimension_key, title: l.title, summary: l.summary ?? "", body: l.body ?? "", videoUrl: l.video_url ?? "", resourceUrl: l.resource_url ?? "", published: l.published })}
                      >
                        {l.title}
                      </button>
                      <span className={`text-[11px] ${l.published ? "text-[#2c6b3f]" : "text-[#8a7f74]"}`}>{l.published ? "Live" : "Draft"}</span>
                      <Button size="sm" variant="ghost" onClick={() => remove(l)} aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
