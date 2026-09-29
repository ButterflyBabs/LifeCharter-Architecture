"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Plus, Trash2, Send, Eye, Pause, Play, Square } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import BroadcastsTab from "../contacts/BroadcastsTab";

interface Seq {
  id: string;
  key: string;
  name: string;
  description: string | null;
  from_name: string;
  from_email: string;
  brand: string;
  send_hour: number;
  active: boolean;
  step_count?: number;
  people?: { total: number; active: number; completed: number };
}
interface Step {
  id: string;
  position: number;
  day_offset: number;
  subject: string;
  preview: string | null;
  body: string;
  button_label: string | null;
  button_url: string | null;
}
interface Person {
  id: string;
  status: string;
  enrolled_at: string;
  start_date: string;
  source: string | null;
  sent: number;
  failed: number;
  seq_contacts: { email: string; first_name: string | null; last_name: string | null; timezone: string; unsubscribed_at: string | null } | null;
}
interface Sender { house: boolean; ok: boolean; reason?: string | null; setupPath?: string; fromName?: string; fromEmail?: string | null; replyTo?: string }
const EMPTY = { id: "", position: 0, dayOffset: 0, subject: "", preview: "", body: "", buttonLabel: "", buttonUrl: "" };
type StepForm = typeof EMPTY;
const TIMEZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "America/Toronto", "Europe/London", "Australia/Sydney"];
const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-3 text-sm";

export default function SequencesManager() {
  const [list, setList] = useState<Seq[] | null>(null);
  const [sender, setSender] = useState<Sender | null>(null);
  const [openId, setOpenId] = useState("");
  const [seq, setSeq] = useState<Seq | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [tab, setTab] = useState<"steps" | "people">("steps");
  const [form, setForm] = useState<StepForm | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [add, setAdd] = useState({ email: "", firstName: "", lastName: "", timezone: "America/Denver" });
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState("");
  // Campaigns (timed email series) and Broadcasts (one-time sends) share this page.
  const [pageTab, setPageTab] = useState<"campaigns" | "broadcasts">("campaigns");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "broadcasts") setPageTab("broadcasts");
  }, []);

  const loadList = useCallback(async () => {
    const d = await fetch("/api/sequences", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setList(d.sequences ?? []);
    setSender(d.sender ?? null);
    if (!openId && d.sequences?.[0]) setOpenId(d.sequences[0].id);
  }, [openId]);
  const loadOne = useCallback(async (id: string) => {
    if (!id) return;
    const d = await fetch(`/api/sequences/${id}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setSeq(d.sequence ?? null);
    setSteps(d.steps ?? []);
    setPeople(d.people ?? []);
  }, []);
  useEffect(() => {
    void loadList();
  }, [loadList]);
  useEffect(() => {
    void loadOne(openId);
  }, [openId, loadOne]);

  async function act(body: Record<string, unknown>, okMsg?: string) {
    const r = await fetch(`/api/sequences/${openId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error || "Something went wrong.");
      return null;
    }
    if (okMsg) setMsg(okMsg);
    return d;
  }

  async function createSeq() {
    if (!newName.trim()) return;
    const r = await fetch("/api/sequences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Couldn't create it.");
    setNewName("");
    setOpenId(d.sequence.id);
    void loadList();
  }

  async function saveSettings(patch: Record<string, unknown>, okMsg: string) {
    const d = await act({ action: "settings", ...patch }, okMsg);
    if (d?.sequence) setSeq(d.sequence);
    void loadList();
  }

  async function saveStep() {
    if (!form) return;
    const d = await act({ action: "save-step", step: form }, "Step saved.");
    if (d) {
      setForm(null);
      setPreview(null);
      void loadOne(openId);
      void loadList();
    }
  }

  const editStep = (s: Step) => {
    setPreview(null);
    setForm({ id: s.id, position: s.position, dayOffset: s.day_offset, subject: s.subject, preview: s.preview || "", body: s.body, buttonLabel: s.button_label || "", buttonUrl: s.button_url || "" });
  };
  const newStep = () => {
    const last = steps[steps.length - 1];
    setPreview(null);
    setForm({ ...EMPTY, position: (last?.position ?? -1) + 1, dayOffset: last ? last.day_offset + 1 : 0 });
  };

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a] flex items-center justify-center">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Campaigns &amp; Broadcasts</h1>
          <p className="text-[#7a8a99]">
            {pageTab === "campaigns"
              ? <>Campaigns are timed email series: each email goes out at the set hour in each person&rsquo;s own time zone. Only your account sees these.</>
              : <>Broadcasts are one-time emails to everyone with a tag, sent now or at a time you schedule.</>}
          </p>
        </div>
      </div>
      {sender && !sender.house && !sender.ok && (
        <p className="mb-4 rounded-lg bg-[#c9a227]/15 px-4 py-2 text-sm">
          {sender.reason} <a href={sender.setupPath} className="font-semibold text-[#2E7C83] underline">Set up email sending</a>
        </p>
      )}
      {msg && (
        <button onClick={() => setMsg("")} className="mb-4 block w-full text-left rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">
          {msg}
        </button>
      )}

      <div className="flex gap-2 mb-5">
        {(["campaigns", "broadcasts"] as const).map((t) => (
          <button key={t} onClick={() => setPageTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${pageTab === t ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
            {t === "campaigns" ? "Campaigns" : "Broadcasts"}
          </button>
        ))}
      </div>

      {pageTab === "broadcasts" ? <BroadcastsTab setMsg={setMsg} /> : (
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <div className="space-y-2">
          {(list ?? []).map((s) => (
            <button
              key={s.id}
              onClick={() => { setOpenId(s.id); setForm(null); setPreview(null); }}
              className={`w-full text-left rounded-xl border p-3 transition ${s.id === openId ? "border-[#c9a227] bg-[#c9a227]/10" : "border-[#1a2b4a]/10 hover:bg-[#1a2b4a]/5"}`}
            >
              <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.name}</p>
              <p className="text-xs text-[#7a8a99]">
                {s.active ? "Live" : "Paused"} · {s.step_count ?? 0} emails · {s.people?.active ?? 0} active
              </p>
            </button>
          ))}
          <div className="flex gap-2 pt-2">
            <Input placeholder="New campaign name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button onClick={createSeq} aria-label="Create campaign"><Plus className="w-4 h-4" /></Button>
          </div>
        </div>

        {seq && (
          <div className="space-y-4 min-w-0">
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{seq.name}</p>
                    <p className="text-sm text-[#7a8a99]">
                      {!sender || sender.house
                        ? <>From {seq.from_name} &lt;{seq.from_email}&gt; · replies to support@amilynnecarroll.com</>
                        : <>From {sender.fromName} &lt;{sender.fromEmail || "your own domain, once it's set up"}&gt;{sender.replyTo ? ` · replies to ${sender.replyTo}` : ""}</>}
                    </p>
                  </div>
                  <Button
                    onClick={() => saveSettings({ active: !seq.active }, seq.active ? "Paused. Nothing more goes out until you turn it back on." : "Live. Emails go out on schedule.")}
                    className={seq.active ? "bg-[#C76F56] hover:bg-[#b05e47]" : ""}
                  >
                    {seq.active ? <><Pause className="w-4 h-4 mr-1" /> Pause whole campaign</> : <><Play className="w-4 h-4 mr-1" /> Turn on</>}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    Daily send time
                    <select value={seq.send_hour} onChange={(e) => saveSettings({ sendHour: Number(e.target.value) }, "Send time saved.")} className="h-9 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2">
                      {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                    </select>
                    <span className="text-[#7a8a99]">their time</span>
                  </label>
                  <span className="text-[#7a8a99]">· {people.length} people · {people.filter((p) => p.status === "completed").length} finished</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              {(["steps", "people"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                  {t === "steps" ? `Emails (${steps.length})` : `People (${people.length})`}
                </button>
              ))}
            </div>

            {tab === "steps" && (
              <>
                {form && (
                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{form.id ? "Edit email" : "New email"}</p>
                      <div className="grid gap-2 md:grid-cols-[140px_1fr]">
                        <label className="text-sm">
                          Send on day
                          <Input type="number" min={0} value={form.dayOffset} onChange={(e) => setForm({ ...form, dayOffset: Math.max(0, Number(e.target.value) || 0) })} />
                          <span className="text-xs text-[#7a8a99]">0 = right away</span>
                        </label>
                        <label className="text-sm">
                          Subject
                          <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                        </label>
                      </div>
                      <Input placeholder="Inbox preview line (optional)" value={form.preview} onChange={(e) => setForm({ ...form, preview: e.target.value })} />
                      <textarea
                        value={form.body}
                        onChange={(e) => setForm({ ...form, body: e.target.value })}
                        rows={14}
                        placeholder={"{{greeting}}\n\nBlank lines make paragraphs. \"- \" makes bullets, \"1. \" numbered steps, \"## \" a heading, **bold**. {{first_name}} fills their name. Your sign-off and the footer are added for you."}
                        className={field}
                      />
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input placeholder="Button label (optional)" value={form.buttonLabel} onChange={(e) => setForm({ ...form, buttonLabel: e.target.value })} />
                        <Input placeholder="Button link https://…" value={form.buttonUrl} onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={saveStep}>Save</Button>
                        <Button variant="outline" onClick={async () => { const d = await act({ action: "preview", step: form }); if (d) setPreview(d); }}>
                          <Eye className="w-4 h-4 mr-1" /> Preview
                        </Button>
                        <Button variant="outline" onClick={() => { setForm(null); setPreview(null); }}>Cancel</Button>
                      </div>
                      {preview && (
                        <div className="rounded-xl border border-[#1a2b4a]/10 overflow-hidden">
                          <p className="px-4 py-2 text-sm bg-[#1a2b4a]/5"><strong>Subject:</strong> {preview.subject}</p>
                          <iframe title="Email preview" srcDoc={preview.html} sandbox="" className="w-full h-[560px] bg-white" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                <div className="space-y-2">
                  {steps.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl border border-[#1a2b4a]/10 p-3">
                      <span className="w-16 shrink-0 text-xs font-semibold text-[#c9a227]">{s.day_offset === 0 ? "Right away" : `Day ${s.day_offset}`}</span>
                      <button onClick={() => editStep(s)} className="flex-1 min-w-0 text-left">
                        <p className="truncate font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{s.subject}</p>
                        {s.preview && <p className="truncate text-xs text-[#7a8a99]">{s.preview}</p>}
                      </button>
                      <button title="Send a test to you" onClick={() => act({ action: "test", stepId: s.id }, "Test sent to your inbox.")} className="p-2 text-[#2E7C83] hover:bg-[#2E7C83]/10 rounded-lg">
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete"
                        onClick={async () => { if (confirm(`Delete "${s.subject}"?`)) { await act({ action: "delete-step", stepId: s.id }); void loadOne(openId); void loadList(); } }}
                        className="p-2 text-[#C76F56] hover:bg-[#C76F56]/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {!steps.length && !form && <p className="text-sm text-[#7a8a99]">No emails yet.</p>}
                  {!form && <Button variant="outline" onClick={newStep}><Plus className="w-4 h-4 mr-1" /> Add email</Button>}
                </div>
              </>
            )}

            {tab === "people" && (
              <>
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Add someone by hand</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input placeholder="Email" value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} />
                      <select value={add.timezone} onChange={(e) => setAdd({ ...add, timezone: e.target.value })} className="h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 text-sm" aria-label="Time zone">
                        {TIMEZONES.map((z) => <option key={z} value={z}>{z.replace("America/", "").replace("_", " ")}</option>)}
                      </select>
                      <Input placeholder="First name" value={add.firstName} onChange={(e) => setAdd({ ...add, firstName: e.target.value })} />
                      <Input placeholder="Last name" value={add.lastName} onChange={(e) => setAdd({ ...add, lastName: e.target.value })} />
                    </div>
                    <Button
                      onClick={async () => {
                        const d = await act({ action: "enrol", ...add }, seq.active ? "Added. Their first email is on its way." : "Added. Emails start when you turn the sequence on.");
                        if (d) { setAdd({ email: "", firstName: "", lastName: "", timezone: add.timezone }); void loadOne(openId); void loadList(); }
                      }}
                    >
                      Add to {seq.name}
                    </Button>
                  </CardContent>
                </Card>
                <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10">
                  <table className="w-full text-sm">
                    <thead className="bg-[#1a2b4a]/5 text-left">
                      <tr><th className="p-3">Person</th><th className="p-3">Started</th><th className="p-3">Sent</th><th className="p-3">Status</th><th className="p-3"></th></tr>
                    </thead>
                    <tbody>
                      {people.map((p) => {
                        const c = p.seq_contacts;
                        const status = c?.unsubscribed_at ? "unsubscribed" : p.status;
                        return (
                          <tr key={p.id} className="border-t border-[#1a2b4a]/10">
                            <td className="p-3">
                              <p className="font-medium">{[c?.first_name, c?.last_name].filter(Boolean).join(" ") || "—"}</p>
                              <p className="text-xs text-[#7a8a99]">{c?.email} · {c?.timezone.replace("America/", "")}</p>
                            </td>
                            <td className="p-3 whitespace-nowrap">{p.start_date}<span className="block text-xs text-[#7a8a99]">{p.source}</span></td>
                            <td className="p-3">{p.sent}/{steps.length}{p.failed ? <span className="text-[#C76F56]"> · {p.failed} failed</span> : null}</td>
                            <td className="p-3 capitalize">{status}</td>
                            <td className="p-3 whitespace-nowrap">
                              {status === "active" && (
                                <button title="Pause" onClick={async () => { await act({ action: "person", enrollmentId: p.id, status: "paused" }); void loadOne(openId); }} className="p-2 rounded-lg hover:bg-[#1a2b4a]/5"><Pause className="w-4 h-4" /></button>
                              )}
                              {status === "paused" && (
                                <button title="Resume" onClick={async () => { await act({ action: "person", enrollmentId: p.id, status: "active" }); void loadOne(openId); }} className="p-2 rounded-lg hover:bg-[#1a2b4a]/5"><Play className="w-4 h-4" /></button>
                              )}
                              {(status === "active" || status === "paused") && (
                                <button title="Stop for good" onClick={async () => { if (confirm("Stop this person's emails for good?")) { await act({ action: "person", enrollmentId: p.id, status: "stopped" }); void loadOne(openId); } }} className="p-2 rounded-lg text-[#C76F56] hover:bg-[#C76F56]/10"><Square className="w-4 h-4" /></button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {!people.length && <tr><td colSpan={5} className="p-4 text-[#7a8a99]">{sender?.house ? "No one yet. Life Shift buyers are added automatically when they pay." : "No one yet. Add people here, or have a form or booking calendar start this campaign."}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
