"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Loader2, Megaphone, Plus, Send, Trash2 } from "lucide-react";

type EvRow = { id: string; kind: "live" | "challenge"; slug: string; title: string; starts_at: string | null; starts_on: string | null; days: number | null; status: string; registrations: number };
type Ev = { id: string; kind: "live" | "challenge"; slug: string; title: string; subtitle: string | null; description: string | null; host_name: string | null; accent: string | null; starts_at: string | null; duration_min: number; timezone: string; join_url: string | null; days: number | null; starts_on: string | null; send_hour: number; capacity: number | null; tags: string[]; follow_up_key: string | null; replay_url: string | null; replay_hours: number | null; replay_sent_at: string | null; status: string };
type Day = { day: number; title: string; body: string | null; video_url: string | null; url: string | null; action: string | null };
type Detail = { event: Ev; url: string; registrations: { id: string; email: string; first_name: string | null; attended: boolean | null; created_at: string; last_day_sent: number; replay_sent_at: string | null }[]; days: Day[]; campaigns: { key: string; name: string }[]; sender: { ok: boolean; reason: string | null; setupPath: string } };

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898] mb-1";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]";
const primary = "inline-flex items-center gap-1.5 rounded-full bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const h2 = "mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";
const STATUS: Record<string, string> = { draft: "Draft", published: "Open for sign-ups", ended: "Ended" };
// A Date as the value of an <input type="datetime-local"> in the browser's own time.
const localInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export default function Events({ eventId }: { eventId: string | null }) {
  const [list, setList] = useState<EvRow[] | null>(null);
  const [sel, setSel] = useState<string | null>(eventId);
  const [d, setD] = useState<Detail | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<"live" | "challenge">("live");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const j = await fetch("/api/events", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setList(j.events ?? []);
  }, []);
  const loadOne = useCallback(async (id: string) => {
    const r = await fetch(`/api/events?id=${id}`, { cache: "no-store" });
    if (!r.ok) return setMsg("That event could not be found.");
    setD(await r.json());
  }, []);
  useEffect(() => {
    void loadList();
  }, [loadList]);
  useEffect(() => {
    setD(null);
    if (sel) {
      void loadOne(sel);
      window.history.replaceState(null, "", `/events?id=${sel}`);
    }
  }, [sel, loadOne]);

  const act = useCallback(async (body: Record<string, unknown>, ok?: string) => {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sel, ...body }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setMsg(j.error || "That didn't work.");
      return null;
    }
    if (ok) setMsg(typeof j.sent === "number" ? `${ok} (${j.sent} sent)` : ok);
    if (sel && body.action !== "delete") await loadOne(sel);
    await loadList();
    return j as Record<string, unknown>;
  }, [sel, loadOne, loadList]);

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a2b4a] to-[#c9a227]"><Megaphone className="h-6 w-6 text-white" /></div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Clients &amp; Sales</p>
          <h1 className="text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Events</h1>
          <p className="mt-1 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">Run a webinar, MasterClass, workshop or challenge with its own sign-up page. The Suite sends the confirmation, an add-to-calendar link, reminders the day before and an hour before, each challenge day, and the replay with an optional deadline. Sign-ups land in Contacts with tags.</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className={card}>
            <label className={label} htmlFor="ev-new">New event</label>
            <input id="ev-new" className={input} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="The Clarity Workshop" />
            <div className="mt-2 flex gap-3 text-sm">
              <label className="flex items-center gap-1.5"><input type="radio" name="ev-kind" checked={newKind === "live"} onChange={() => setNewKind("live")} />Live event</label>
              <label className="flex items-center gap-1.5"><input type="radio" name="ev-kind" checked={newKind === "challenge"} onChange={() => setNewKind("challenge")} />Challenge</label>
            </div>
            <button className={`${primary} mt-2`} disabled={busy || !newTitle.trim()} onClick={async () => { const j = await act({ action: "create", title: newTitle, kind: newKind }, "Event created. Fill in the details, then open it for sign-ups."); if (j?.id) { setNewTitle(""); setSel(j.id as string); } }}><Plus className="h-4 w-4" />Create</button>
          </div>
          <div className={`${card} p-0`}>
            {list === null ? <p className="p-4 text-sm text-[#7b6b8d]">Loading…</p> : !list.length ? <p className="p-4 text-sm text-[#7b6b8d]">No events yet.</p> : (
              <ul className="divide-y divide-[#1a2b4a]/10">
                {list.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => setSel(e.id)} className={`block w-full px-4 py-3 text-left hover:bg-[#1a2b4a]/5 ${sel === e.id ? "bg-[#c9a227]/10" : ""}`}>
                      <span className="block truncate font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{e.title}</span>
                      <span className="block text-xs text-[#7b6b8d]">{e.kind === "challenge" ? `${e.days ?? "?"}-day challenge` : e.starts_at ? new Date(e.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No date yet"} · {STATUS[e.status]} · {e.registrations} signed up</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        <main className="min-w-0 space-y-5">
          {msg && <p className="rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm" role="status">{msg}</p>}
          {!sel && <p className="text-sm text-[#7b6b8d]">Choose an event, or create one.</p>}
          {sel && !d && <p className="flex items-center gap-2 text-sm text-[#7b6b8d]"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
          {d && <Detail key={d.event.id + d.event.status} d={d} act={act} busy={busy} onDeleted={() => { setSel(null); setD(null); window.history.replaceState(null, "", "/events"); }} />}
        </main>
      </div>
    </div>
  );
}

function Detail({ d, act, busy, onDeleted }: { d: Detail; act: (b: Record<string, unknown>, ok?: string) => Promise<Record<string, unknown> | null>; busy: boolean; onDeleted: () => void }) {
  const e = d.event;
  const [f, setF] = useState({
    title: e.title, subtitle: e.subtitle ?? "", description: e.description ?? "", hostName: e.host_name ?? "", accent: e.accent ?? "#2E7C83", slug: e.slug,
    startsAt: localInput(e.starts_at), durationMin: String(e.duration_min), timezone: e.timezone, joinUrl: e.join_url ?? "", days: String(e.days ?? 5), startsOn: e.starts_on ?? "",
    sendHour: String(e.send_hour), capacity: e.capacity ? String(e.capacity) : "", tags: e.tags.join(", "), followUpKey: e.follow_up_key ?? "", replayUrl: e.replay_url ?? "", replayHours: e.replay_hours ? String(e.replay_hours) : "",
  });
  const [days, setDays] = useState<Day[]>(() => {
    const n = e.days ?? 0;
    return Array.from({ length: n }, (_, i) => d.days.find((x) => x.day === i + 1) ?? { day: i + 1, title: "", body: null, video_url: null, url: null, action: null });
  });
  const [copied, setCopied] = useState(false);
  const save = () => act({ action: "update", ...f, startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : "", tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean) }, "Saved.");
  const attended = d.registrations.filter((r) => r.attended).length;

  return (
    <>
      {!d.sender.ok && (
        <div className="rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 px-4 py-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          Confirmation and reminder emails can&apos;t go out until your email sending is set up. <Link href={d.sender.setupPath} className="font-semibold text-[#2E7C83] underline">Set up email sending</Link>.
        </div>
      )}
      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{e.title}</h2>
            <p className="text-xs text-[#7b6b8d]">{e.kind === "challenge" ? "Challenge" : "Live event"} · {STATUS[e.status]} · {d.registrations.length} signed up</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={async () => { try { await navigator.clipboard.writeText(d.url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* shown below */ } }}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy sign-up link"}</button>
            <a className={btn} href={d.url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />Open the page</a>
            {e.status !== "published" ? <button className={primary} disabled={busy} onClick={() => void act({ action: "status", status: "published" }, "Open for sign-ups.")}>Open for sign-ups</button> : <button className={btn} disabled={busy} onClick={() => void act({ action: "status", status: "ended" }, "Marked ended: the page no longer takes sign-ups.")}>Mark ended</button>}
            {e.status === "ended" && <button className={btn} disabled={busy} onClick={() => void act({ action: "status", status: "draft" }, "Back to draft.")}>Back to draft</button>}
            {!d.registrations.length && <button className={btn} disabled={busy} onClick={async () => { if (await act({ action: "delete" }, "Deleted.")) onDeleted(); }}><Trash2 className="h-3.5 w-3.5" />Delete</button>}
          </div>
        </div>
        <p className="mt-2 break-all text-xs text-[#7b6b8d]">{d.url}</p>
      </section>

      <section className={card}>
        <h2 className={h2}>The page</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div><label className={label} htmlFor="e-title">Title</label><input id="e-title" className={input} value={f.title} onChange={(x) => setF({ ...f, title: x.target.value })} /></div>
          <div><label className={label} htmlFor="e-sub">Subtitle</label><input id="e-sub" className={input} value={f.subtitle} onChange={(x) => setF({ ...f, subtitle: x.target.value })} placeholder="One line on the promise" /></div>
          <div><label className={label} htmlFor="e-host">Host name (shown and used as the email sender name)</label><input id="e-host" className={input} value={f.hostName} onChange={(x) => setF({ ...f, hostName: x.target.value })} placeholder="Your business name" /></div>
          <div className="flex gap-3">
            <div className="flex-1"><label className={label} htmlFor="e-slug">Web address: /e/…</label><input id="e-slug" className={input} value={f.slug} onChange={(x) => setF({ ...f, slug: x.target.value })} /></div>
            <div><label className={label} htmlFor="e-accent">Color</label><input id="e-accent" type="color" className="h-10 w-14 cursor-pointer rounded border border-[#1a2b4a]/15" value={f.accent} onChange={(x) => setF({ ...f, accent: x.target.value })} /></div>
          </div>
          <div className="md:col-span-2"><label className={label} htmlFor="e-desc">Description (what they&apos;ll get, who it&apos;s for)</label><textarea id="e-desc" rows={5} className={input} value={f.description} onChange={(x) => setF({ ...f, description: x.target.value })} /></div>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>{e.kind === "live" ? "When and where" : "Challenge schedule"}</h2>
        {e.kind === "live" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div><label className={label} htmlFor="e-at">Date and time</label><input id="e-at" type="datetime-local" className={input} value={f.startsAt} onChange={(x) => setF({ ...f, startsAt: x.target.value })} /></div>
            <div><label className={label} htmlFor="e-min">Minutes</label><input id="e-min" inputMode="numeric" className={input} value={f.durationMin} onChange={(x) => setF({ ...f, durationMin: x.target.value })} /></div>
            <div className="xl:col-span-2"><label className={label} htmlFor="e-join">Join link (Zoom, Meet, Teams…)</label><input id="e-join" className={input} value={f.joinUrl} onChange={(x) => setF({ ...f, joinUrl: x.target.value })} placeholder="https://" /></div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div><label className={label} htmlFor="e-days">Number of days</label><input id="e-days" inputMode="numeric" className={input} value={f.days} onChange={(x) => setF({ ...f, days: x.target.value })} /></div>
            <div><label className={label} htmlFor="e-start">Day 1 (empty = the day after each person joins)</label><input id="e-start" type="date" className={input} value={f.startsOn} onChange={(x) => setF({ ...f, startsOn: x.target.value })} /></div>
            <div><label className={label} htmlFor="e-hour">Daily email at (hour, {f.timezone})</label><select id="e-hour" className={input} value={f.sendHour} onChange={(x) => setF({ ...f, sendHour: x.target.value })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{new Date(2026, 0, 1, h).toLocaleTimeString("en-US", { hour: "numeric" })}</option>)}</select></div>
          </div>
        )}
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div><label className={label} htmlFor="e-tz">Time zone</label><input id="e-tz" className={input} value={f.timezone} onChange={(x) => setF({ ...f, timezone: x.target.value })} placeholder="America/Denver" /></div>
          <div><label className={label} htmlFor="e-cap">Seat limit (optional)</label><input id="e-cap" inputMode="numeric" className={input} value={f.capacity} onChange={(x) => setF({ ...f, capacity: x.target.value })} /></div>
          <div><label className={label} htmlFor="e-tags">Extra tags for sign-ups</label><input id="e-tags" className={input} value={f.tags} onChange={(x) => setF({ ...f, tags: x.target.value })} placeholder="lead, workshop" /></div>
        </div>
        <p className="mt-2 text-xs text-[#7b6b8d]">Everyone who signs up is tagged <code>registered-{e.slug}</code> in Contacts.</p>
        <button className={`${primary} mt-3`} disabled={busy} onClick={() => void save()}>Save</button>
      </section>

      {e.kind === "challenge" && (
        <section className={card}>
          <h2 className={h2}>Each day</h2>
          <p className="mb-3 text-xs text-[#7b6b8d]">Each day goes out by email at the daily time and opens on their challenge page. Change the number of days above, press Save, and the list updates.</p>
          <div className="space-y-4">
            {days.map((x, i) => (
              <div key={x.day} className="rounded-xl bg-[#1a2b4a]/5 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#2E7C83]">Day {x.day}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <input aria-label={`Day ${x.day} title`} className={input} value={x.title} onChange={(ev) => setDays(days.map((y, j) => (j === i ? { ...y, title: ev.target.value } : y)))} placeholder="Title" />
                  <input aria-label={`Day ${x.day} step`} className={input} value={x.action ?? ""} onChange={(ev) => setDays(days.map((y, j) => (j === i ? { ...y, action: ev.target.value } : y)))} placeholder="Today's small step" />
                  <input aria-label={`Day ${x.day} video`} className={input} value={x.video_url ?? ""} onChange={(ev) => setDays(days.map((y, j) => (j === i ? { ...y, video_url: ev.target.value } : y)))} placeholder="Video link (optional)" />
                  <input aria-label={`Day ${x.day} link`} className={input} value={x.url ?? ""} onChange={(ev) => setDays(days.map((y, j) => (j === i ? { ...y, url: ev.target.value } : y)))} placeholder="Other link (optional)" />
                  <textarea aria-label={`Day ${x.day} text`} rows={3} className={`${input} md:col-span-2`} value={x.body ?? ""} onChange={(ev) => setDays(days.map((y, j) => (j === i ? { ...y, body: ev.target.value } : y)))} placeholder="The day's lesson" />
                </div>
              </div>
            ))}
          </div>
          <button className={`${primary} mt-3`} disabled={busy} onClick={() => void act({ action: "days", days: days.map((x) => ({ day: x.day, title: x.title, body: x.body, videoUrl: x.video_url, url: x.url, action: x.action })) }, "Challenge days saved.")}>Save the days</button>
        </section>
      )}

      <section className={card}>
        <h2 className={h2}>{e.kind === "live" ? "Replay and follow-up" : "Follow-up"}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {e.kind === "live" && <div className="md:col-span-2"><label className={label} htmlFor="e-replay">Replay link (Vimeo, YouTube…)</label><input id="e-replay" className={input} value={f.replayUrl} onChange={(x) => setF({ ...f, replayUrl: x.target.value })} placeholder="https://" /></div>}
          {e.kind === "live" && <div><label className={label} htmlFor="e-rh">Available for (hours, empty = no limit)</label><input id="e-rh" inputMode="numeric" className={input} value={f.replayHours} onChange={(x) => setF({ ...f, replayHours: x.target.value })} placeholder="72" /></div>}
          <div className="md:col-span-3"><label className={label} htmlFor="e-fu">Follow-up campaign ({e.kind === "live" ? "starts when the replay goes out" : "starts when the challenge ends"})</label><select id="e-fu" className={input} value={f.followUpKey} onChange={(x) => setF({ ...f, followUpKey: x.target.value })}><option value="">None</option>{d.campaigns.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}</select></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className={btn} disabled={busy} onClick={() => void save()}>Save</button>
          {e.kind === "live" && <button className={primary} disabled={busy || !f.replayUrl.trim()} onClick={() => void act({ action: "send-replay", replayUrl: f.replayUrl }, "Replay emailed to everyone registered")}><Send className="h-4 w-4" />{e.replay_sent_at ? "Send the replay to anyone who hasn't had it" : "Email the replay to everyone"}</button>}
          {e.replay_sent_at && <span className="text-xs text-[#7b6b8d]">Replay sent {new Date(e.replay_sent_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{e.replay_hours ? `; it closes ${new Date(Date.parse(e.replay_sent_at) + e.replay_hours * 3_600_000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} (a reminder goes out about 12 hours before)` : ""}</span>}
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Sign-ups ({d.registrations.length}){e.kind === "live" && d.registrations.length ? ` · ${attended} attended` : ""}</h2>
        {!d.registrations.length ? <p className="text-sm text-[#7b6b8d]">Nobody yet. Share the sign-up link.</p> : (
          <ul className="divide-y divide-[#1a2b4a]/10 text-sm">
            {d.registrations.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><span className="font-semibold">{r.first_name || r.email}</span> <span className="text-xs text-[#7b6b8d]">{r.email} · signed up {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{e.kind === "challenge" ? ` · day ${r.last_day_sent} sent` : ""}{r.replay_sent_at && e.kind === "live" ? " · replay sent" : ""}</span></span>
                {e.kind === "live" && (
                  <span className="flex gap-1">
                    <button className={`${btn} ${r.attended === true ? "bg-[#2E7C83] text-white" : ""}`} disabled={busy} onClick={() => void act({ action: "attended", regId: r.id, attended: true })}>Attended</button>
                    <button className={`${btn} ${r.attended === false ? "bg-[#8a2f2f] text-white" : ""}`} disabled={busy} onClick={() => void act({ action: "attended", regId: r.id, attended: false })}>Missed</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
