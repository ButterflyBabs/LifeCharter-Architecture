"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Copy, ExternalLink, Plus, Trash2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Conn { id: string; provider: string; email: string | null; check_busy: boolean; add_events: boolean }
interface Host { id: string; name: string; email: string; zoom_email: string | null; timezone: string; weekly: Record<string, [string, string][]>; connect_key: string; active: boolean; connections: Conn[] }
interface Q { name?: string; label: string; type?: string; required?: boolean; options?: string[] }
interface Cal {
  id: string; slug: string; name: string; description: string | null; duration_min: number; slot_step_min: number; buffer_before_min: number; buffer_after_min: number;
  min_notice_hours: number; max_days_ahead: number; daily_cap: number | null; assignment: "single" | "round_robin"; host_ids: string[]; cc_emails: string[];
  location: "zoom" | "phone" | "custom"; location_detail: string | null; questions: Q[]; tags: string[]; sequence_key: string | null; confirmation_note: string | null; active: boolean;
  create_deal: boolean; deal_value: number | null; noshow_subject: string | null; noshow_body: string | null;
}
interface Booking { id: string; calendar_id: string; host_id: string | null; start_at: string; invitee_name: string; invitee_email: string; invitee_phone: string | null; answers: Record<string, string>; status: string; meeting_url: string | null; cancel_reason: string | null }
interface Data { calendars: Cal[]; hosts: Host[]; bookings: Booking[]; zoom: { configured: boolean; canCreate: boolean; available?: boolean }; house?: boolean; sender?: { house: boolean; ok: boolean; reason?: string | null; setupPath?: string } }

const DAYS: [string, string][] = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]];
const TZS = ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "Europe/London"];
const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-2.5 text-sm";
const sel = "h-10 w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2 text-sm";
const ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://lccommandsuite.com";

export default function CalendarsManager() {
  const [d, setD] = useState<Data | null>(null);
  const [tab, setTab] = useState<"bookings" | "calendars" | "hosts">("bookings");
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const x = await fetch("/api/calendars", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (x?.calendars) setD(x);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const act = useCallback(
    async (body: Record<string, unknown>, ok?: string) => {
      const r = await fetch("/api/calendars", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const x = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(x.error || "Something went wrong.");
        return null;
      }
      if (ok) setMsg(ok);
      await load();
      return x;
    },
    [load]
  );

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a] flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Calendars</h1>
          <p className="text-[#7a8a99]">Booking links that check each host&rsquo;s real calendars{d?.house ? ", add Zoom" : ""}, send reminders and put every booking in Contacts.</p>
        </div>
      </div>
      {d?.sender && !d.sender.house && !d.sender.ok && (
        <p className="mb-4 rounded-lg bg-[#c9a227]/15 px-4 py-2 text-sm">
          Booking confirmation and reminder emails are off until your own sending domain is verified. Bookings still work, and calendar invites from a host&rsquo;s connected Google or Microsoft calendar still go out.{" "}
          <a href={d.sender.setupPath} className="font-semibold text-[#2E7C83] underline">Set up email sending</a>
        </p>
      )}
      {d && d.zoom.configured && !d.zoom.canCreate && (
        <p className="mb-4 rounded-lg bg-[#c9a227]/15 px-4 py-2 text-sm">Zoom links: the Suite&rsquo;s Zoom app can&rsquo;t create meetings yet (it needs the &ldquo;meeting:write&rdquo; permission). Until then, bookings say &ldquo;Zoom link to follow.&rdquo;</p>
      )}
      <div className="flex gap-2 mb-5">
        {(["bookings", "calendars", "hosts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${tab === t ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
            {t}
          </button>
        ))}
      </div>
      {msg && (
        <button onClick={() => setMsg("")} className="mb-4 block w-full text-left rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">{msg}</button>
      )}
      {!d ? <p className="text-sm text-[#7a8a99]">Loading…</p> : tab === "bookings" ? <Bookings d={d} act={act} /> : tab === "calendars" ? <Calendars d={d} act={act} setMsg={setMsg} /> : <Hosts d={d} act={act} setMsg={setMsg} />}
    </div>
  );
}

type Act = (b: Record<string, unknown>, ok?: string) => Promise<Record<string, unknown> | null>;
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function Bookings({ d, act }: { d: Data; act: Act }) {
  const [past, setPast] = useState(false);
  const now = Date.now();
  const list = d.bookings.filter((b) => (past ? Date.parse(b.start_at) < now : Date.parse(b.start_at) >= now)).sort((a, b) => (past ? Date.parse(b.start_at) - Date.parse(a.start_at) : Date.parse(a.start_at) - Date.parse(b.start_at)));
  const calName = (id: string) => d.calendars.find((c) => c.id === id)?.name ?? "";
  const hostName = (id: string | null) => d.hosts.find((h) => h.id === id)?.name ?? "";
  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-sm">
        <button onClick={() => setPast(false)} className={!past ? "font-semibold underline" : "text-[#7a8a99]"}>Upcoming</button>
        <button onClick={() => setPast(true)} className={past ? "font-semibold underline" : "text-[#7a8a99]"}>Past 30 days</button>
      </div>
      {list.map((b) => (
        <div key={b.id} className="rounded-xl border border-[#1a2b4a]/10 p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{when(b.start_at)} · {calName(b.calendar_id)}</p>
              <p className="text-[#5a6472]">
                {b.invitee_name} · <a href={`mailto:${b.invitee_email}`} className="text-[#2E7C83]">{b.invitee_email}</a>
                {b.invitee_phone ? ` · ${b.invitee_phone}` : ""} · host {hostName(b.host_id)}
              </p>
              {Object.entries(b.answers ?? {}).map(([k, v]) => (
                <p key={k} className="text-xs text-[#7a8a99]">{k.replace(/_/g, " ")}: {v}</p>
              ))}
              {b.meeting_url && <a href={b.meeting_url} target="_blank" rel="noreferrer" className="text-xs text-[#2E7C83] underline">Zoom link</a>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${b.status === "confirmed" ? "bg-[#2E7C83]/10 text-[#1F5E63]" : "bg-[#1a2b4a]/5 text-[#5a6472]"}`}>{b.status.replace("_", "-")}</span>
              {b.status === "confirmed" && !past && (
                <Button variant="outline" onClick={() => { const r = prompt("Cancel this meeting? Add a note for them (optional):"); if (r !== null) void act({ action: "cancel-booking", id: b.id, reason: r }, "Canceled. They've been told."); }}>Cancel</Button>
              )}
              {b.status === "confirmed" && past && (
                <>
                  <Button variant="outline" onClick={() => act({ action: "booking-status", id: b.id, status: "completed" })}>Attended</Button>
                  <Button variant="outline" onClick={() => act({ action: "booking-status", id: b.id, status: "no_show" })}>No-show</Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      {!list.length && <p className="text-sm text-[#7a8a99]">{past ? "No meetings in the last 30 days." : "Nothing booked yet."}</p>}
    </div>
  );
}

function Calendars({ d, act, setMsg }: { d: Data; act: Act; setMsg: (m: string) => void }) {
  const [openId, setOpenId] = useState(d.calendars[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const cal = d.calendars.find((c) => c.id === openId);
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="space-y-2">
        {d.calendars.map((c) => (
          <button key={c.id} onClick={() => setOpenId(c.id)} className={`w-full text-left rounded-xl border p-3 ${c.id === openId ? "border-[#c9a227] bg-[#c9a227]/10" : "border-[#1a2b4a]/10 hover:bg-[#1a2b4a]/5"}`}>
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.name}</p>
            <p className="text-xs text-[#7a8a99]">{c.active ? "Live" : "Off"} · {c.duration_min} min · {c.assignment === "round_robin" ? "round robin" : "one host"}</p>
          </button>
        ))}
        <div className="flex gap-2 pt-2">
          <Input placeholder="New calendar name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button aria-label="Create calendar" onClick={async () => { const x = await act({ action: "create-calendar", name: newName }); if (x?.id) { setNewName(""); setOpenId(String(x.id)); } }}><Plus className="w-4 h-4" /></Button>
        </div>
      </div>
      {cal ? <CalendarEditor key={cal.id} cal={cal} hosts={d.hosts} house={Boolean(d.house)} act={act} setMsg={setMsg} /> : <p className="text-sm text-[#7a8a99]">Create a calendar to get started.</p>}
    </div>
  );
}

function CalendarEditor({ cal, hosts, house, act, setMsg }: { cal: Cal; hosts: Host[]; house: boolean; act: Act; setMsg: (m: string) => void }) {
  const [f, setF] = useState({
    name: cal.name, slug: cal.slug, description: cal.description ?? "", duration: cal.duration_min, step: cal.slot_step_min, bufferBefore: cal.buffer_before_min, bufferAfter: cal.buffer_after_min,
    minNotice: cal.min_notice_hours, maxDays: cal.max_days_ahead, dailyCap: cal.daily_cap ?? 0, assignment: cal.assignment, hostIds: cal.host_ids, cc: cal.cc_emails.join(", "),
    location: !house && cal.location === "zoom" ? "custom" : cal.location, locationDetail: cal.location_detail ?? "", confirmationNote: cal.confirmation_note ?? "", tags: cal.tags.join(", "),
    createDeal: cal.create_deal, dealValue: cal.deal_value ?? 0, noshowSubject: cal.noshow_subject ?? "", noshowBody: cal.noshow_body ?? "",
    questions: cal.questions.map((q) => `${q.label}${q.required ? " *" : ""}${q.type === "textarea" ? " (textarea)" : ""}${q.options?.length ? `: ${q.options.join(" | ")}` : ""}`).join("\n"),
  });
  const link = `${ORIGIN}/book/${cal.slug}`;
  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) || 0 });
  const parseQs = () =>
    f.questions.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const at = l.indexOf(":");
      const head = at >= 0 ? l.slice(0, at) : l;
      const opts = at >= 0 ? l.slice(at + 1).split("|").map((o) => o.trim()).filter(Boolean) : undefined;
      return { label: head.replace("(textarea)", "").replace("*", "").trim(), required: head.includes("*"), type: head.includes("(textarea)") ? "textarea" : undefined, options: opts };
    });
  const save = () =>
    act({
      action: "update-calendar", id: cal.id, name: f.name, slug: f.slug, description: f.description, duration: f.duration, step: f.step, bufferBefore: f.bufferBefore, bufferAfter: f.bufferAfter,
      minNotice: f.minNotice, maxDays: f.maxDays, dailyCap: f.dailyCap || null, assignment: f.assignment, hostIds: f.hostIds, ccEmails: f.cc.split(",").map((s) => s.trim()).filter(Boolean),
      location: f.location, locationDetail: f.locationDetail, confirmationNote: f.confirmationNote, tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean), questions: parseQs(),
      createDeal: f.createDeal, dealValue: f.dealValue || null, noshowSubject: f.noshowSubject, noshowBody: f.noshowBody,
    }, "Calendar saved.");
  const noCalendars = f.hostIds.filter((id) => !(hosts.find((h) => h.id === id)?.connections.length));
  return (
    <div className="space-y-4 min-w-0">
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{cal.name}</p>
            <Button onClick={() => act({ action: "update-calendar", id: cal.id, active: !cal.active }, cal.active ? "Turned off. The link shows it's unavailable." : "Live. People can book now.")} className={cal.active ? "bg-[#C76F56] hover:bg-[#b05e47]" : ""}>
              {cal.active ? "Turn off" : "Turn on"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[#7a8a99]">Booking link:</span>
            <a href={link} target="_blank" rel="noreferrer" className="text-[#2E7C83] break-all inline-flex items-center gap-1">{link} <ExternalLink className="w-3 h-3" /></a>
            <button onClick={() => navigator.clipboard.writeText(link).then(() => setMsg("Link copied."))} className="p-1 rounded hover:bg-[#1a2b4a]/5" aria-label="Copy link"><Copy className="w-4 h-4" /></button>
          </div>
          {noCalendars.length > 0 && <p className="text-xs text-[#8a6a15]">Heads up: {noCalendars.map((id) => hosts.find((h) => h.id === id)?.name).join(", ")} hasn&rsquo;t connected a calendar yet, so their busy times aren&rsquo;t checked. Send their connect link from the Hosts tab.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>Name<Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label>Link ending (/book/…)<Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} /></label>
          </div>
          <label className="block">Description (shown on the booking page)<textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={field} /></label>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <label>Length (min)<Input type="number" value={f.duration} onChange={num("duration")} /></label>
            <label>Start every (min)<Input type="number" value={f.step} onChange={num("step")} /></label>
            <label>Gap before (min)<Input type="number" value={f.bufferBefore} onChange={num("bufferBefore")} /></label>
            <label>Gap after (min)<Input type="number" value={f.bufferAfter} onChange={num("bufferAfter")} /></label>
            <label>Notice needed (hrs)<Input type="number" value={f.minNotice} onChange={num("minNotice")} /></label>
            <label>Book up to (days)<Input type="number" value={f.maxDays} onChange={num("maxDays")} /></label>
            <label>Max per host/day<Input type="number" value={f.dailyCap} onChange={num("dailyCap")} placeholder="0 = none" /></label>
          </div>
          <div>
            <p className="font-medium mb-1">Who takes these calls</p>
            <select value={f.assignment} onChange={(e) => setF({ ...f, assignment: e.target.value as Cal["assignment"] })} className={`${sel} mb-2 sm:w-72`}>
              <option value="single">One host (the first one ticked)</option>
              <option value="round_robin">Round robin among the hosts ticked</option>
            </select>
            <div className="flex flex-wrap gap-3">
              {hosts.map((h) => (
                <label key={h.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={f.hostIds.includes(h.id)} onChange={(e) => setF({ ...f, hostIds: e.target.checked ? [...f.hostIds, h.id] : f.hostIds.filter((x) => x !== h.id) })} />
                  {h.name}
                </label>
              ))}
              {!hosts.length && <span className="text-[#7a8a99]">Add hosts on the Hosts tab first.</span>}
            </div>
          </div>
          <label className="block">Copy these people on every booking (emails, comma-separated)<Input value={f.cc} onChange={(e) => setF({ ...f, cc: e.target.value })} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>Where
              <select value={f.location} onChange={(e) => setF({ ...f, location: e.target.value as Cal["location"] })} className={sel}>
                {house && <option value="zoom">Zoom (a link is created for each booking)</option>}
                <option value="phone">Phone (host calls them)</option>
                <option value="custom">Somewhere else</option>
              </select>
            </label>
            {f.location === "custom" && <label>Details{!house && " (e.g. your Zoom or Google Meet link, or an address)"}<Input value={f.locationDetail} onChange={(e) => setF({ ...f, locationDetail: e.target.value })} /></label>}
          </div>
          <label className="block">Questions to ask when booking, one per line
            <textarea rows={4} value={f.questions} onChange={(e) => setF({ ...f, questions: e.target.value })} className={`${field} font-mono text-xs`} />
            <span className="text-xs text-[#7a8a99]">Name, email and phone are always asked. Add * for required, (textarea) for a long answer, &ldquo;: a | b&rdquo; for choices.</span>
          </label>
          <label className="block">Note in the confirmation email<textarea rows={2} value={f.confirmationNote} onChange={(e) => setF({ ...f, confirmationNote: e.target.value })} className={field} /></label>
          <label className="block">Tags for people who book<Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></label>
          <div className="rounded-lg border border-[#1a2b4a]/10 p-3 space-y-2">
            <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={f.createDeal} onChange={(e) => setF({ ...f, createDeal: e.target.checked })} /> Add each booking to the Pipeline as a deal</label>
            {f.createDeal && (
              <label className="block">Deal value ($)<Input type="number" value={f.dealValue} onChange={(e) => setF({ ...f, dealValue: Number(e.target.value) || 0 })} /></label>
            )}
            <p className="text-xs text-[#7a8a99]">
              {house
                ? <>The deal starts in your first open stage (Discovery call), moves to Won when they buy the Command Suite, and to Lost if they cancel or don&rsquo;t show. Booking again reopens it.</>
                : <>The deal starts in your first open stage and moves to Lost if they cancel or don&rsquo;t show; mark it Won in the Pipeline when they buy. Booking again reopens it.</>}
            </p>
          </div>
          <div className="rounded-lg border border-[#1a2b4a]/10 p-3 space-y-2">
            <p className="font-medium">No-show follow-up email</p>
            <p className="text-xs text-[#7a8a99]">Sent when you mark someone No-show on the Bookings tab, with a button to choose a new time. Leave it blank to send nothing. You can use {"{{first_name}}"}, {"{{host}}"} and {"{{meeting}}"}.</p>
            <Input placeholder="Subject" value={f.noshowSubject} onChange={(e) => setF({ ...f, noshowSubject: e.target.value })} />
            <textarea rows={5} value={f.noshowBody} onChange={(e) => setF({ ...f, noshowBody: e.target.value })} className={field} placeholder="The email (blank lines make paragraphs)" />
          </div>
          <Button onClick={save}>Save calendar</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Hosts({ d, act, setMsg }: { d: Data; act: Act; setMsg: (m: string) => void }) {
  const [add, setAdd] = useState({ name: "", email: "", zoomEmail: "", timezone: "America/Denver" });
  return (
    <div className="space-y-4">
      {d.hosts.map((h) => <HostCard key={h.id} h={h} house={Boolean(d.house)} act={act} setMsg={setMsg} />)}
      <Card>
        <CardContent className="p-5 space-y-2 text-sm">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Add a host</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Name" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} />
            <Input placeholder="Email" value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} />
            {d.house && <Input placeholder="Zoom account email (if different)" value={add.zoomEmail} onChange={(e) => setAdd({ ...add, zoomEmail: e.target.value })} />}
            <select value={add.timezone} onChange={(e) => setAdd({ ...add, timezone: e.target.value })} className={sel}>{TZS.map((z) => <option key={z} value={z}>{z.replace("America/", "").replace("_", " ")}</option>)}</select>
          </div>
          <Button onClick={async () => { const x = await act({ action: "create-host", ...add }, "Host added. Send them their connect link below."); if (x) setAdd({ name: "", email: "", zoomEmail: "", timezone: add.timezone }); }}>Add host</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function HostCard({ h, house, act, setMsg }: { h: Host; house: boolean; act: Act; setMsg: (m: string) => void }) {
  const [weekly, setWeekly] = useState(h.weekly ?? {});
  const [info, setInfo] = useState({ name: h.name, email: h.email, zoomEmail: h.zoom_email ?? "", timezone: h.timezone });
  const link = `${ORIGIN}/book/connect/${h.id}?k=${h.connect_key}`;
  const setDay = (day: string, text: string) => {
    const ranges = text.split(",").map((r) => r.trim()).filter(Boolean).map((r) => r.split("-").map((t) => t.trim()) as [string, string]);
    setWeekly({ ...weekly, [day]: ranges });
  };
  return (
    <Card>
      <CardContent className="p-5 space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-4">
          <label>Name<Input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></label>
          <label>Email<Input value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} /></label>
          {house && <label>Zoom email<Input value={info.zoomEmail} onChange={(e) => setInfo({ ...info, zoomEmail: e.target.value })} placeholder={h.email} /></label>}
          <label>Time zone<select value={info.timezone} onChange={(e) => setInfo({ ...info, timezone: e.target.value })} className={sel}>{(TZS.includes(info.timezone) ? TZS : [info.timezone, ...TZS]).map((z) => <option key={z} value={z}>{z.replace("America/", "").replace("_", " ")}</option>)}</select></label>
        </div>
        <div>
          <p className="font-medium mb-1">Working hours ({info.timezone.replace("America/", "").replace("_", " ")} time) — e.g. 09:00-12:00, 13:00-17:00. Leave blank for a day off.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {DAYS.map(([k, label]) => (
              <label key={k} className="flex items-center gap-2">
                <span className="w-10">{label}</span>
                <Input defaultValue={(weekly[k] ?? []).map((r) => r.join("-")).join(", ")} onChange={(e) => setDay(k, e.target.value)} placeholder="Off" />
              </label>
            ))}
          </div>
        </div>
        <Button onClick={() => act({ action: "update-host", id: h.id, ...info, weekly }, "Host saved.")}>Save host</Button>
        <div>
          <p className="font-medium mb-1">Connected calendars</p>
          {h.connections.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#1a2b4a]/10 px-3 py-2 mb-1.5">
              <span><strong className="capitalize">{c.provider}</strong> · {c.email}</span>
              <span className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1"><input type="checkbox" checked={c.check_busy} onChange={(e) => act({ action: "connection", id: c.id, checkBusy: e.target.checked })} /> Check for busy times</label>
                {c.add_events ? <span className="inline-flex items-center gap-1 text-[#2c6b3f]"><Check className="w-4 h-4" /> New bookings go here</span> : <button onClick={() => act({ action: "connection", id: c.id, addEvents: true })} className="text-[#2E7C83] underline">Put new bookings here</button>}
                <button onClick={() => confirm("Disconnect this calendar?") && act({ action: "remove-connection", id: c.id })} aria-label="Disconnect" className="text-[#C76F56]"><Trash2 className="w-4 h-4" /></button>
              </span>
            </div>
          ))}
          {!h.connections.length && <p className="text-[#8a6a15]">No calendars connected yet.</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a href={link} target="_blank" rel="noreferrer" className="text-[#2E7C83] underline">Connect calendars</a>
            <span className="text-[#7a8a99]">or send {h.name.split(" ")[0]} their private link:</span>
            <button onClick={() => navigator.clipboard.writeText(link).then(() => setMsg(`Connect link for ${h.name} copied. Send it to them; it only connects calendars.`))} className="inline-flex items-center gap-1 text-[#2E7C83]"><Copy className="w-4 h-4" /> Copy link</button>
            <button onClick={() => confirm("Make a new link? The old one will stop working.") && act({ action: "new-connect-key", id: h.id }, "New link made.")} className="text-xs text-[#7a8a99] underline">New link</button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
