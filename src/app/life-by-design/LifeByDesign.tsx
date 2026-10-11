"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ListPlus, Plus, Trash2 } from "lucide-react";

type Row = Record<string, string | null>;
interface Page { id: string; kind: "speakers" | "topics" | "notes" | "tracker"; title: string; body: string | null; built_in: boolean }
interface Speaker extends Row { id: string; name: string }
interface Topic extends Row { id: string; title: string }
interface Item { id: string; page_id: string; title: string; status: "todo" | "doing" | "done"; owner: string | null; due_date: string | null; note: string | null; task_id: number | null }

const DIMENSIONS = ["Quality of Life", "Character", "Intellectual Life", "Emotional Life", "Health & Fitness", "Love Relationship", "Parenting", "Spiritual Life", "Social Life", "Financial Life", "Career", "Life Vision"];
const SPEAKER_STATUS = ["Interested", "Invited", "Confirmed", "Declined", "Complete"];
const TOPIC_STATUS = ["Idea", "Open", "Assigned", "Ready"];
const DAYS = ["", "Day 1", "Day 2", "Day 3", "Any day"];

const ink = "text-[#1a2b4a] dark:text-[#F8F5F0]";
const faint = "text-[#7a8a99] dark:text-[#b8c2cf]";
const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/40 dark:text-[#F8F5F0]";
const btn = "inline-flex items-center gap-2 rounded-lg bg-[#1a2b4a] px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-[#c9a227] dark:text-[#1a2b4a]";
const ghost = "inline-flex items-center gap-2 rounded-lg border border-[#1a2b4a]/20 px-3 py-2 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]";

async function act(action: string, payload: Record<string, unknown> = {}): Promise<{ ok?: boolean; error?: string; id?: string }> {
  const r = await fetch("/api/life-by-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
  return r.json().catch(() => ({ error: "Something went wrong." }));
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium">
      <span className={faint}>{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

export default function LifeByDesign() {
  const [data, setData] = useState<{ pages: Page[]; speakers: Speaker[]; topics: Topic[]; items: Item[] } | null>(null);
  const [tab, setTab] = useState("");
  const [msg, setMsg] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    fetch("/api/life-by-design", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d) => {
        setData(d);
        setTab((t) => (t && d.pages.some((p: Page) => p.id === t) ? t : d.pages[0]?.id ?? ""));
      })
      .catch(() => setMsg("Couldn't load. Refresh to try again."));
  }, []);
  useEffect(load, [load]);

  const page = useMemo(() => data?.pages.find((p) => p.id === tab), [data, tab]);

  async function run(action: string, payload: Record<string, unknown>, done?: string) {
    setMsg("");
    const r = await act(action, payload);
    if (r.error) setMsg(r.error);
    else if (done) setMsg(done);
    load();
    return r;
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className={`font-serif text-2xl font-bold ${ink}`}>Life by Design Summit</h1>
      <p className={`mt-1 max-w-3xl text-sm ${faint}`}>
        April 15, 16 and 17, 2027 · 9am to 2pm Mountain · free and online. Speakers, topics and every page you add for planning and tracking. A row you add to your task list lives in Tasks too, so finishing it counts toward your business health.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2" role="tablist" aria-label="Life by Design pages">
        {data?.pages.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={tab === p.id}
            onClick={() => setTab(p.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === p.id ? "bg-[#1a2b4a] text-white dark:bg-[#c9a227] dark:text-[#1a2b4a]" : `border border-[#1a2b4a]/15 ${ink}`}`}
          >
            {p.title}
          </button>
        ))}
        <button onClick={() => setAdding((v) => !v)} className={`${ghost} rounded-full`}>
          <Plus className="h-4 w-4" aria-hidden /> Add a page
        </button>
      </div>

      {adding && (
        <AddPage
          onAdd={async (kind, title) => {
            const r = await act("add_page", { kind, title });
            if (r.error) setMsg(r.error);
            else {
              setAdding(false);
              await new Promise<void>((res) => { load(); res(); });
              if (r.id) setTab(r.id);
            }
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {msg && <p className="mt-3 text-sm text-[#2E7C83]" role="status">{msg}</p>}
      {!data && !msg && <p className={`mt-6 text-sm ${faint}`}>Loading…</p>}

      {data && page && (
        <div className="mt-5">
          {page.kind === "speakers" && <Speakers speakers={data.speakers} run={run} />}
          {page.kind === "topics" && <Topics topics={data.topics} speakers={data.speakers} run={run} />}
          {page.kind === "notes" && <Notes page={page} run={run} />}
          {page.kind === "tracker" && <Tracker page={page} items={data.items.filter((i) => i.page_id === page.id)} run={run} />}
          {!page.built_in && (
            <PageTools
              page={page}
              onRename={(title) => run("rename_page", { id: page.id, title })}
              onDelete={() => run("delete_page", { id: page.id }, "Page removed.")}
            />
          )}
        </div>
      )}
    </div>
  );
}

type Run = (action: string, payload: Record<string, unknown>, done?: string) => Promise<{ ok?: boolean; error?: string; id?: string }>;

function AddPage({ onAdd, onCancel }: { onAdd: (kind: string, title: string) => void; onCancel: () => void }) {
  const [kind, setKind] = useState("tracker");
  const [title, setTitle] = useState("");
  return (
    <div className="mt-3 flex max-w-2xl flex-wrap items-end gap-3 rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40">
      <div className="min-w-[12rem] flex-1">
        <Labeled label="Page name">
          <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promotion, Tech check, Giveaways…" />
        </Labeled>
      </div>
      <Labeled label="Type">
        <select className={field} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="tracker">Tracker (a list you tick off)</option>
          <option value="notes">Notes (free writing)</option>
        </select>
      </Labeled>
      <button className={btn} onClick={() => title.trim() && onAdd(kind, title.trim())}>Add</button>
      <button className={ghost} onClick={onCancel}>Cancel</button>
    </div>
  );
}

function PageTools({ page, onRename, onDelete }: { page: Page; onRename: (t: string) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(page.title);
  const [sure, setSure] = useState(false);
  useEffect(() => setTitle(page.title), [page.title]);
  return (
    <div className="mt-8 flex flex-wrap items-end gap-3 border-t border-[#1a2b4a]/10 pt-4">
      <Labeled label="Page name">
        <input className={`${field} w-56`} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Labeled>
      <button className={ghost} onClick={() => title.trim() && title !== page.title && onRename(title.trim())}>Rename</button>
      {sure ? (
        <>
          <span className={`text-sm ${ink}`}>Remove this page and everything on it?</span>
          <button className={btn} onClick={onDelete}>Yes, remove it</button>
          <button className={ghost} onClick={() => setSure(false)}>Keep it</button>
        </>
      ) : (
        <button className={ghost} onClick={() => setSure(true)}><Trash2 className="h-4 w-4" aria-hidden /> Remove page</button>
      )}
    </div>
  );
}

const SPEAKER_COLS: [string, string][] = [
  ["promo_name", "Name for promotion"], ["email", "Email"], ["phone", "Phone"], ["topic", "Session topic"], ["dimension", "Dimension"],
  ["session_date", "Session date"], ["session_time", "Time (MT)"], ["length", "Length"], ["style", "Session style"],
  ["promo_agreement", "Promo agreement"], ["freebie", "Freebie"], ["giveaway", "Giveaway"], ["assets", "Assets (bio, headshot)"], ["tech_check", "Tech check"],
];

function Speakers({ speakers, run }: { speakers: Speaker[]; run: Run }) {
  const [open, setOpen] = useState<string | null>(null);
  const [name, setName] = useState("");
  const counts = SPEAKER_STATUS.map((s) => [s, speakers.filter((x) => x.status === s).length] as const).filter(([, n]) => n);
  return (
    <div>
      <p className={`text-sm ${faint}`}>{speakers.length} named{counts.length ? " · " + counts.map(([s, n]) => `${n} ${s.toLowerCase()}`).join(", ") : ""}. No promo agreement, no speaker slot.</p>
      <div className="mt-3 space-y-3">
        {speakers.map((s) => (
          <SpeakerCard key={s.id} s={s} open={open === s.id} toggle={() => setOpen(open === s.id ? null : s.id)} run={run} />
        ))}
      </div>
      <div className="mt-4 flex max-w-xl flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <Labeled label="Add a speaker">
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </Labeled>
        </div>
        <button className={btn} onClick={async () => { if (name.trim()) { await run("save_speaker", { name: name.trim(), status: "Interested" }); setName(""); } }}>
          <Plus className="h-4 w-4" aria-hidden /> Add speaker
        </button>
      </div>
    </div>
  );
}

function SpeakerCard({ s, open, toggle, run }: { s: Speaker; open: boolean; toggle: () => void; run: Run }) {
  const [f, setF] = useState<Row>(s);
  useEffect(() => setF(s), [s]);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <section className="overflow-hidden rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left">
        <span className="min-w-0 flex-1 basis-56">
          <span className={`block font-semibold ${ink}`}>{s.name}</span>
          <span className={`block text-xs ${faint}`}>{s.topic || "No topic yet"}</span>
        </span>
        <span className="rounded-full bg-[#2E7C83]/15 px-2.5 py-1 text-xs font-medium text-[#1f5a60] dark:text-[#7fd0d6]">{s.status}</span>
        <ChevronDown className={`h-4 w-4 ${faint} transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-[#1a2b4a]/10 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Labeled label="Name"><input className={field} value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Labeled>
            <Labeled label="Status">
              <select className={field} value={f.status ?? ""} onChange={(e) => set("status", e.target.value)}>
                {SPEAKER_STATUS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Labeled>
            {SPEAKER_COLS.map(([k, label]) => (
              <Labeled key={k} label={label}>
                {k === "dimension" ? (
                  <select className={field} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)}>
                    <option value="" />
                    {DIMENSIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                ) : (
                  <input className={field} type={k === "session_date" ? "date" : "text"} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
                )}
              </Labeled>
            ))}
          </div>
          <div className="mt-3">
            <Labeled label="Notes"><textarea className={field} rows={3} value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Labeled>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={btn} onClick={() => run("save_speaker", { ...f, id: s.id }, "Saved.")}>Save</button>
            <button className={ghost} onClick={() => run("delete_speaker", { id: s.id }, "Speaker removed.")}><Trash2 className="h-4 w-4" aria-hidden /> Remove</button>
          </div>
        </div>
      )}
    </section>
  );
}

function Topics({ topics, speakers, run }: { topics: Topic[]; speakers: Speaker[]; run: Run }) {
  const [title, setTitle] = useState("");
  const byDimension = DIMENSIONS.map((d) => topics.filter((t) => t.dimension === d).length);
  const uncovered = DIMENSIONS.filter((_, i) => byDimension[i] === 0);
  return (
    <div>
      <p className={`text-sm ${faint}`}>
        One topic per dimension to start. {uncovered.length ? `Not covered yet: ${uncovered.join(", ")}.` : "Every dimension has a topic."}
      </p>
      <div className="mt-3 space-y-3">
        {topics.map((t) => <TopicRow key={t.id} t={t} speakers={speakers} run={run} />)}
      </div>
      <div className="mt-4 flex max-w-xl flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <Labeled label="Add a topic">
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Topic or session title" />
          </Labeled>
        </div>
        <button className={btn} onClick={async () => { if (title.trim()) { await run("save_topic", { title: title.trim(), status: "Idea" }); setTitle(""); } }}>
          <Plus className="h-4 w-4" aria-hidden /> Add topic
        </button>
      </div>
    </div>
  );
}

function TopicRow({ t, speakers, run }: { t: Topic; speakers: Speaker[]; run: Run }) {
  const [f, setF] = useState<Row>(t);
  useEffect(() => setF(t), [t]);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <section className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2"><Labeled label="Title"><input className={field} value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Labeled></div>
        <Labeled label="Dimension">
          <select className={field} value={f.dimension ?? ""} onChange={(e) => set("dimension", e.target.value)}>
            <option value="" />
            {DIMENSIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Labeled>
        <Labeled label="Day">
          <select className={field} value={f.day ?? ""} onChange={(e) => set("day", e.target.value)}>
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Labeled>
        <Labeled label="Speaker">
          <select className={field} value={f.speaker_id ?? ""} onChange={(e) => set("speaker_id", e.target.value)}>
            <option value="">Not assigned</option>
            {speakers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Labeled>
        <Labeled label="Status">
          <select className={field} value={f.status ?? ""} onChange={(e) => set("status", e.target.value)}>
            {TOPIC_STATUS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Labeled>
        <div className="sm:col-span-2"><Labeled label="What it covers"><input className={field} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Labeled></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={btn} onClick={() => run("save_topic", { ...f, id: t.id }, "Saved.")}>Save</button>
        <button className={ghost} onClick={() => run("delete_topic", { id: t.id }, "Topic removed.")}><Trash2 className="h-4 w-4" aria-hidden /> Remove</button>
      </div>
    </section>
  );
}

function Notes({ page, run }: { page: Page; run: Run }) {
  const [body, setBody] = useState(page.body ?? "");
  useEffect(() => setBody(page.body ?? ""), [page.id, page.body]);
  return (
    <div className="max-w-3xl">
      <textarea className={`${field} min-h-[22rem]`} value={body} onChange={(e) => setBody(e.target.value)} aria-label={`${page.title} notes`} />
      <button className={`${btn} mt-3`} onClick={() => run("save_notes", { id: page.id, body }, "Saved.")}>Save notes</button>
    </div>
  );
}

function Tracker({ page, items, run }: { page: Page; items: Item[]; run: Run }) {
  const [title, setTitle] = useState("");
  const done = items.filter((i) => i.status === "done").length;
  return (
    <div>
      <p className={`text-sm ${faint}`}>{done} of {items.length} done. Add a row to your task list and it also appears in Tasks under the Life by Design project.</p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => <ItemRow key={i.id} i={i} run={run} />)}
      </ul>
      <div className="mt-4 flex max-w-2xl flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <Labeled label="Add a row">
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) { run("save_item", { page_id: page.id, title: title.trim() }); setTitle(""); } }} />
          </Labeled>
        </div>
        <button className={btn} onClick={async () => { if (title.trim()) { await run("save_item", { page_id: page.id, title: title.trim() }); setTitle(""); } }}>
          <Plus className="h-4 w-4" aria-hidden /> Add
        </button>
      </div>
    </div>
  );
}

function ItemRow({ i, run }: { i: Item; run: Run }) {
  const [f, setF] = useState(i);
  useEffect(() => setF(i), [i]);
  const save = (patch: Partial<Item>) => {
    const next = { ...f, ...patch };
    setF(next);
    run("save_item", { id: i.id, title: next.title, status: next.status, owner: next.owner, due_date: next.due_date, note: next.note });
  };
  return (
    <li className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-3 dark:bg-[#1a2b4a]/40">
      <div className="flex flex-wrap items-center gap-3">
        <input type="checkbox" checked={f.status === "done"} onChange={(e) => save({ status: e.target.checked ? "done" : "todo" })} aria-label={`Done: ${i.title}`} className="h-5 w-5" />
        <input className={`${field} min-w-[12rem] flex-1 ${f.status === "done" ? "line-through opacity-60" : ""}`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} onBlur={() => f.title !== i.title && save({})} aria-label="Title" />
        <select className={`${field} w-28`} value={f.status} onChange={(e) => save({ status: e.target.value as Item["status"] })} aria-label="Status">
          <option value="todo">To do</option>
          <option value="doing">Doing</option>
          <option value="done">Done</option>
        </select>
        <input className={`${field} w-32`} placeholder="Owner" value={f.owner ?? ""} onChange={(e) => setF({ ...f, owner: e.target.value })} onBlur={() => f.owner !== i.owner && save({})} aria-label="Owner" />
        <input className={`${field} w-40`} type="date" value={f.due_date ?? ""} onChange={(e) => save({ due_date: e.target.value || null })} aria-label="Due date" />
        {i.task_id ? (
          <span className="rounded-full bg-[#2c6b3f]/15 px-2.5 py-1 text-xs font-medium text-[#1f4d2d] dark:text-[#8fd6a5]">In your task list</span>
        ) : (
          <button className={ghost} onClick={() => run("to_task", { id: i.id }, "Added to your task list.")}><ListPlus className="h-4 w-4" aria-hidden /> Add to my task list</button>
        )}
        <button className={ghost} onClick={() => run("delete_item", { id: i.id })} aria-label={`Remove ${i.title}`}><Trash2 className="h-4 w-4" aria-hidden /></button>
      </div>
      <input className={`${field} mt-2`} placeholder="Note" value={f.note ?? ""} onChange={(e) => setF({ ...f, note: e.target.value })} onBlur={() => f.note !== i.note && save({})} aria-label="Note" />
    </li>
  );
}
