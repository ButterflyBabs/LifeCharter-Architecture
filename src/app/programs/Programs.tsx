"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, GraduationCap, Loader2, Paperclip, Pin, Plus, Send, Trash2 } from "lucide-react";
import ContactLookupInput, { lookupName, type LookupContact } from "@/components/crm/ContactLookupInput";

type ProgramRow = { id: string; name: string; starts_on: string | null; ends_on: string | null; status: string; members: number };
type Detail = {
  program: { id: string; name: string; description: string | null; offer_id: string | null; starts_on: string | null; ends_on: string | null; feed_on: boolean; status: string };
  members: { contact_id: string; status: string; source: string | null; name: string; email: string; portal: { active: boolean; sent_at: string | null; last_seen_at: string | null } | null }[];
  sessions: { id: string; title: string; starts_at: string; duration_min: number; join_url: string | null }[];
  lessons: { id: string; title: string; body: string | null; url: string | null; video_url: string | null; file_name: string | null; opens_on: string | null }[];
  tasks: { id: string; title: string; due_on: string | null; doneBy: string[] }[];
  posts: { id: string; parent_id: string | null; author: string; by: string; body: string; pinned: boolean; created_at: string }[];
  reports: { id: string; title: string; session_date: string; program_id: string | null; program_shared_at: string | null }[];
  offers: { id: string; name: string }[];
};

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898] mb-1";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]";
const primary = "inline-flex items-center gap-1.5 rounded-full bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const h2 = "mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";
const day = (d: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function Programs({ programId }: { programId: string | null }) {
  const [list, setList] = useState<ProgramRow[] | null>(null);
  const [sel, setSel] = useState<string | null>(programId);
  const [d, setD] = useState<Detail | null>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const j = await fetch("/api/programs", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setList(j.programs ?? []);
  }, []);
  const loadOne = useCallback(async (id: string) => {
    const r = await fetch(`/api/programs?id=${id}`, { cache: "no-store" });
    if (!r.ok) return setMsg("That program could not be found.");
    setD(await r.json());
  }, []);
  useEffect(() => {
    void loadList();
  }, [loadList]);
  useEffect(() => {
    setD(null);
    if (sel) {
      void loadOne(sel);
      window.history.replaceState(null, "", `/programs?id=${sel}`);
    }
  }, [sel, loadOne]);

  const act = useCallback(async (body: Record<string, unknown>, ok?: string) => {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sel, ...body }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setMsg(j.error || "That didn't work.");
      return null;
    }
    if (ok) setMsg(ok);
    if (sel) await loadOne(sel);
    await loadList();
    return j as Record<string, unknown>;
  }, [sel, loadOne, loadList]);

  async function create() {
    const j = await act({ action: "create", name }, "Program created. Add members, sessions and lessons below.");
    if (j?.id) {
      setName("");
      setSel(j.id as string);
    }
  }

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a2b4a] to-[#c9a227]"><GraduationCap className="h-6 w-6 text-white" /></div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Clients &amp; Sales</p>
          <h1 className="text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Programs</h1>
          <p className="mt-1 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">Run group programs and cohorts: members, live sessions, lessons that open when you choose, group homework, a group conversation and session notes, all inside each member&apos;s own client portal.</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className={card}>
            <label className={label} htmlFor="prog-new">New program</label>
            <input id="prog-new" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring 2027 Cohort" />
            <button className={`${primary} mt-2`} disabled={busy || !name.trim()} onClick={() => void create()}><Plus className="h-4 w-4" />Create</button>
          </div>
          <div className={`${card} p-0`}>
            {list === null ? <p className="p-4 text-sm text-[#7b6b8d]">Loading…</p> : !list.length ? <p className="p-4 text-sm text-[#7b6b8d]">No programs yet.</p> : (
              <ul className="divide-y divide-[#1a2b4a]/10">
                {list.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => setSel(p.id)} className={`block w-full px-4 py-3 text-left hover:bg-[#1a2b4a]/5 ${sel === p.id ? "bg-[#c9a227]/10" : ""}`}>
                      <span className="block truncate font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.name}</span>
                      <span className="block text-xs text-[#7b6b8d]">{p.members} member{p.members === 1 ? "" : "s"}{p.status === "archived" ? " · archived" : p.starts_on ? ` · starts ${day(p.starts_on)}` : ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        <main className="min-w-0 space-y-5">
          {msg && <p className="rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm" role="status">{msg}</p>}
          {!sel && <p className="text-sm text-[#7b6b8d]">Choose a program, or create one.</p>}
          {sel && !d && <p className="flex items-center gap-2 text-sm text-[#7b6b8d]"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
          {d && <Detail key={d.program.id} d={d} act={act} busy={busy} setMsg={setMsg} reload={() => loadOne(sel!)} />}
        </main>
      </div>
    </div>
  );
}

function Detail({ d, act, busy, setMsg, reload }: { d: Detail; act: (b: Record<string, unknown>, ok?: string) => Promise<Record<string, unknown> | null>; busy: boolean; setMsg: (m: string) => void; reload: () => Promise<void> }) {
  const p = d.program;
  const [info, setInfo] = useState({ name: p.name, description: p.description ?? "", startsOn: p.starts_on ?? "", endsOn: p.ends_on ?? "", offerId: p.offer_id ?? "", feedOn: p.feed_on });
  const [who, setWho] = useState("");
  const [pick, setPick] = useState<LookupContact | null>(null);
  const [sendLink, setSendLink] = useState(true);
  const [ses, setSes] = useState({ title: "", startsAt: "", durationMin: "60", joinUrl: "" });
  const [les, setLes] = useState({ title: "", opensOn: "", videoUrl: "", url: "", body: "" });
  const [task, setTask] = useState({ title: "", dueOn: "" });
  const [post, setPost] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const active = d.members.filter((m) => m.status === "active");
  const top = d.posts.filter((x) => !x.parent_id).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at));

  async function upload(lessonId: string, file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.append("lessonId", lessonId);
    fd.append("file", file);
    const r = await fetch("/api/programs/upload", { method: "POST", body: fd });
    if (!r.ok) return setMsg((await r.json().catch(() => ({}))).error || "The file didn't upload.");
    setMsg("File attached to the lesson.");
    await reload();
  }

  return (
    <>
      <section className={card}>
        <h2 className={h2}>Program details</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div><label className={label} htmlFor="p-name">Name</label><input id="p-name" className={input} value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></div>
          <div><label className={label} htmlFor="p-offer">Sold as (buyers join automatically)</label><select id="p-offer" className={input} value={info.offerId} onChange={(e) => setInfo({ ...info, offerId: e.target.value })}><option value="">No offer</option>{d.offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
          <div><label className={label} htmlFor="p-start">Starts</label><input id="p-start" type="date" className={input} value={info.startsOn} onChange={(e) => setInfo({ ...info, startsOn: e.target.value })} /></div>
          <div><label className={label} htmlFor="p-end">Ends</label><input id="p-end" type="date" className={input} value={info.endsOn} onChange={(e) => setInfo({ ...info, endsOn: e.target.value })} /></div>
          <div className="md:col-span-2"><label className={label} htmlFor="p-desc">Description (members see it)</label><textarea id="p-desc" rows={3} className={input} value={info.description} onChange={(e) => setInfo({ ...info, description: e.target.value })} /></div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={info.feedOn} onChange={(e) => setInfo({ ...info, feedOn: e.target.checked })} />Group conversation on (members see each other&apos;s posts, first names only)</label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={primary} disabled={busy} onClick={() => void act({ action: "update", ...info }, "Program saved.")}>Save details</button>
          <button className={btn} disabled={busy} onClick={() => void act({ action: "update", status: p.status === "active" ? "archived" : "active" }, p.status === "active" ? "Archived: members no longer see it." : "Back on: members see it again.")}>{p.status === "active" ? "Archive" : "Bring back"}</button>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Members ({active.length})</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1"><label className={label} htmlFor="p-add">Add a member</label><ContactLookupInput id="p-add" value={who} onChange={(v) => { setWho(v); setPick(null); }} onPick={(c) => { setPick(c); setWho(lookupName(c)); }} placeholder="Name or email" className={input} pickLabel="Choose" /></div>
          <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={sendLink} onChange={(e) => setSendLink(e.target.checked)} />Email their portal link if they don&apos;t have one yet</label>
          <button className={primary} disabled={busy || !pick} onClick={async () => { const j = await act({ action: "member-add", contactId: pick!.id, sendLink }, "Member added."); if (j) { setWho(""); setPick(null); if (j.linkSent) setMsg("Member added and their portal link emailed."); } }}><Plus className="h-4 w-4" />Add</button>
        </div>
        <ul className="mt-4 divide-y divide-[#1a2b4a]/10 text-sm">
          {active.map((m) => (
            <li key={m.contact_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span><a href={`/client-portals?contact=${m.contact_id}`} className="font-semibold text-[#2E7C83] hover:underline">{m.name}</a> <span className="text-xs text-[#7b6b8d]">{m.email} · {m.portal?.last_seen_at ? `last visit ${day(m.portal.last_seen_at)}` : m.portal?.sent_at ? "link sent, not opened yet" : "link not sent"}{m.source === "payment" ? " · joined by paying" : ""}</span></span>
              <span className="flex gap-1">
                <button className={btn} disabled={busy} onClick={() => void act({ action: "member-send-link", contactId: m.contact_id }, `Portal link emailed to ${m.email}.`)}><Send className="h-3.5 w-3.5" />Email link</button>
                <button className={btn} disabled={busy} onClick={() => void act({ action: "member-remove", contactId: m.contact_id }, `${m.name} removed from the program.`)}>Remove</button>
              </span>
            </li>
          ))}
          {!active.length && <li className="py-2 text-[#7b6b8d]">No members yet.</li>}
        </ul>
      </section>

      <section className={card}>
        <h2 className={h2}>Sessions</h2>
        <ul className="mb-3 space-y-2 text-sm">
          {d.sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#1a2b4a]/5 px-3 py-2">
              <span><span className="font-semibold">{s.title}</span> · {when(s.starts_at)} · {s.duration_min} min{s.join_url ? " · join link set" : ""}</span>
              <button className={btn} aria-label={`Delete ${s.title}`} disabled={busy} onClick={() => void act({ action: "session-delete", sessionId: s.id })}><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div><label className={label} htmlFor="s-title">Title</label><input id="s-title" className={input} value={ses.title} onChange={(e) => setSes({ ...ses, title: e.target.value })} placeholder="Week 1: Foundations" /></div>
          <div><label className={label} htmlFor="s-at">Date and time</label><input id="s-at" type="datetime-local" className={input} value={ses.startsAt} onChange={(e) => setSes({ ...ses, startsAt: e.target.value })} /></div>
          <div><label className={label} htmlFor="s-min">Minutes</label><input id="s-min" inputMode="numeric" className={input} value={ses.durationMin} onChange={(e) => setSes({ ...ses, durationMin: e.target.value })} /></div>
          <div><label className={label} htmlFor="s-url">Join link (Zoom, Meet…)</label><input id="s-url" className={input} value={ses.joinUrl} onChange={(e) => setSes({ ...ses, joinUrl: e.target.value })} placeholder="https://" /></div>
        </div>
        <button className={`${primary} mt-3`} disabled={busy || !ses.title.trim() || !ses.startsAt} onClick={async () => { if (await act({ action: "session-add", ...ses, startsAt: new Date(ses.startsAt).toISOString(), durationMin: Number(ses.durationMin) }, "Session added.")) setSes({ title: "", startsAt: "", durationMin: ses.durationMin, joinUrl: ses.joinUrl }); }}><Plus className="h-4 w-4" />Add session</button>
      </section>

      <section className={card}>
        <h2 className={h2}>Lessons</h2>
        <ul className="mb-3 space-y-2 text-sm">
          {d.lessons.map((l, i) => (
            <li key={l.id} className="rounded-xl bg-[#1a2b4a]/5 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{l.title}</span>
                <span className="flex flex-wrap items-center gap-1">
                  <label className="flex items-center gap-1 text-xs">Opens<input type="date" aria-label={`Opens on for ${l.title}`} className="rounded border border-[#1a2b4a]/15 bg-transparent px-1 py-0.5 text-xs" value={l.opens_on ?? ""} onChange={(e) => void act({ action: "lesson-update", lessonId: l.id, opensOn: e.target.value || null })} /></label>
                  <label className={`${btn} cursor-pointer`}><input type="file" className="sr-only" onChange={(e) => void upload(l.id, e.target.files?.[0])} /><Paperclip className="h-3.5 w-3.5" />{l.file_name ? "Replace file" : "Attach file"}</label>
                  <button className={btn} aria-label="Move up" disabled={busy || i === 0} onClick={() => void act({ action: "lesson-move", lessonId: l.id, dir: -1 })}><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button className={btn} aria-label="Move down" disabled={busy || i === d.lessons.length - 1} onClick={() => void act({ action: "lesson-move", lessonId: l.id, dir: 1 })}><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button className={btn} aria-label={`Delete ${l.title}`} disabled={busy} onClick={() => void act({ action: "lesson-delete", lessonId: l.id }, "Lesson removed.")}><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              </div>
              <p className="text-xs text-[#7b6b8d]">{l.opens_on ? `Opens ${day(l.opens_on)}` : "Open now"}{l.video_url ? " · video" : ""}{l.url ? " · link" : ""}{l.file_name ? ` · ${l.file_name}` : ""}</p>
            </li>
          ))}
        </ul>
        <div className="grid gap-3 md:grid-cols-2">
          <div><label className={label} htmlFor="l-title">Lesson title</label><input id="l-title" className={input} value={les.title} onChange={(e) => setLes({ ...les, title: e.target.value })} placeholder="Module 1: Your why" /></div>
          <div><label className={label} htmlFor="l-open">Opens on (empty = now)</label><input id="l-open" type="date" className={input} value={les.opensOn} onChange={(e) => setLes({ ...les, opensOn: e.target.value })} /></div>
          <div><label className={label} htmlFor="l-video">Video link (YouTube, Vimeo, Loom…)</label><input id="l-video" className={input} value={les.videoUrl} onChange={(e) => setLes({ ...les, videoUrl: e.target.value })} placeholder="https://" /></div>
          <div><label className={label} htmlFor="l-url">Other link</label><input id="l-url" className={input} value={les.url} onChange={(e) => setLes({ ...les, url: e.target.value })} placeholder="https://" /></div>
          <div className="md:col-span-2"><label className={label} htmlFor="l-body">Lesson text</label><textarea id="l-body" rows={3} className={input} value={les.body} onChange={(e) => setLes({ ...les, body: e.target.value })} /></div>
        </div>
        <button className={`${primary} mt-3`} disabled={busy || !les.title.trim()} onClick={async () => { if (await act({ action: "lesson-add", ...les }, "Lesson added. Attach a file to it from the list if you like.")) setLes({ title: "", opensOn: "", videoUrl: "", url: "", body: "" }); }}><Plus className="h-4 w-4" />Add lesson</button>
      </section>

      <section className={card}>
        <h2 className={h2}>Group homework</h2>
        <ul className="mb-3 space-y-2 text-sm">
          {d.tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#1a2b4a]/5 px-3 py-2">
              <span><span className="font-semibold">{t.title}</span>{t.due_on ? ` · by ${day(t.due_on)}` : ""} · <span className="text-[#2E7C83]">{t.doneBy.length} of {active.length} done</span>{t.doneBy.length ? <span className="text-xs text-[#7b6b8d]"> ({t.doneBy.join(", ")})</span> : null}</span>
              <button className={btn} aria-label={`Delete ${t.title}`} disabled={busy} onClick={() => void act({ action: "task-delete", taskId: t.id })}><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1"><label className={label} htmlFor="t-title">Homework</label><input id="t-title" className={input} value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} placeholder="Write your 90-day goal" /></div>
          <div><label className={label} htmlFor="t-due">By</label><input id="t-due" type="date" className={input} value={task.dueOn} onChange={(e) => setTask({ ...task, dueOn: e.target.value })} /></div>
          <button className={primary} disabled={busy || !task.title.trim()} onClick={async () => { if (await act({ action: "task-add", ...task }, "Homework added.")) setTask({ title: "", dueOn: "" }); }}><Plus className="h-4 w-4" />Add</button>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Group session notes from LC Volant</h2>
        {!d.reports.length ? <p className="text-sm text-[#7b6b8d]">No LC Volant reports yet. Write one from a group session recording, then share it here.</p> : (
          <ul className="space-y-2 text-sm">
            {d.reports.map((r) => {
              const here = r.program_id === p.id && r.program_shared_at;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span><span className="font-semibold">{r.title}</span> · {day(r.session_date)}{r.program_id && r.program_id !== p.id ? " · shared with another program" : ""}</span>
                  <button className={btn} disabled={busy} onClick={() => void act({ action: "share-report", reportId: r.id, on: !here }, here ? "Hidden from members." : "Shared with every member. Private notes and drafts never show.")}>{here ? "Shared ✓ (hide)" : "Share with members"}</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className={h2}>Group conversation{p.feed_on ? "" : " (off: members can't see or post)"}</h2>
        <div className="flex gap-2">
          <label htmlFor="p-post" className="sr-only">Post to the group</label>
          <textarea id="p-post" rows={2} className={`${input} min-w-0 flex-1`} value={post} onChange={(e) => setPost(e.target.value)} placeholder="Post to everyone in the program as the host…" />
          <button className={`${primary} self-end`} disabled={busy || !post.trim()} onClick={async () => { if (await act({ action: "post", body: post })) setPost(""); }}><Send className="h-4 w-4" />Post</button>
        </div>
        <ul className="mt-3 space-y-3">
          {top.map((f) => (
            <li key={f.id} className={`rounded-xl px-3 py-2 text-sm ${f.pinned ? "bg-[#c9a227]/10" : "bg-[#1a2b4a]/5"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#7b6b8d]">{f.pinned && <Pin className="mr-1 inline h-3 w-3" />}{f.by} · {when(f.created_at)}</p>
                <span className="flex gap-1">
                  <button className={btn} disabled={busy} onClick={() => void act({ action: "post-pin", postId: f.id, on: !f.pinned })}>{f.pinned ? "Unpin" : "Pin"}</button>
                  <button className={btn} aria-label="Delete post" disabled={busy} onClick={() => void act({ action: "post-delete", postId: f.id })}><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap">{f.body}</p>
              {d.posts.filter((r) => r.parent_id === f.id).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((r) => (
                <div key={r.id} className="ml-4 mt-2 flex items-start justify-between gap-2 border-l-2 border-[#1a2b4a]/10 pl-3">
                  <div><p className="text-xs font-semibold text-[#7b6b8d]">{r.by} · {when(r.created_at)}</p><p className="whitespace-pre-wrap">{r.body}</p></div>
                  <button className={btn} aria-label="Delete reply" disabled={busy} onClick={() => void act({ action: "post-delete", postId: r.id })}><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
              <div className="ml-4 mt-2 flex gap-2">
                <input aria-label="Reply" className="min-w-0 flex-1 rounded-lg border border-[#1a2b4a]/15 bg-transparent px-2 py-1 text-xs" value={reply[f.id] ?? ""} onChange={(e) => setReply({ ...reply, [f.id]: e.target.value })} placeholder="Reply as the host…" />
                <button className="text-xs font-semibold text-[#2E7C83] disabled:opacity-50" disabled={busy || !(reply[f.id] ?? "").trim()} onClick={async () => { if (await act({ action: "post", body: reply[f.id], parentId: f.id })) setReply({ ...reply, [f.id]: "" }); }}>Reply</button>
              </div>
            </li>
          ))}
          {!top.length && <li className="text-sm text-[#7b6b8d]">No posts yet.</li>}
        </ul>
      </section>
    </>
  );
}
