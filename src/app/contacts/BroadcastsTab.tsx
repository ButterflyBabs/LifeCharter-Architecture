"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Send, CalendarClock, Megaphone, Plus, Trash2, XCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OWNER_TZ, addDays, slotsIn, zonedParts } from "@/lib/broadcasts/shared";
import { offersOf } from "@/lib/offerSections";
import OfferSections from "@/components/crm/OfferSections";
import ContactPicker, { personName, type PickedContact } from "./ContactPicker";
import { Pill } from "./ContactRecord";
import ContactLookupInput, { lookupName } from "@/components/crm/ContactLookupInput";

interface Summary {
  id: string;
  template_key: string | null;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "canceled";
  scheduled_at: string | null;
  recipient_count: number;
  tags: string[];
  created_at: string;
  offer?: string | null;
}
interface Full extends Summary {
  timezone: string;
  preview: string | null;
  body: string;
  button_label: string | null;
  button_url: string | null;
  brand: string;
  from_name: string;
  from_email: string;
  tag_match: "any" | "all";
  contact_ids: string[];
  skip_prior_template: boolean;
  skip_active_sequences?: string[] | null;
  skip_tags?: string[] | null;
  variables: Record<string, string>;
}
interface Template {
  key: string;
  name: string;
  description: string;
  schedule: { daysAfter: number; time: string; label: string };
  slots: { key: string; label: string; placeholder: string }[];
}
interface Detail {
  broadcast: Full;
  reach: number;
  counts: Record<string, number>;
  problems: string[];
  failures: { contact_id: string; email: string; error: string | null }[];
  people: PickedContact[];
  recipients?: { contactId: string; email: string; name: string; status: string; sentAt: string | null; error: string | null }[];
}

const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-3 text-sm";
const selectCls = "h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 text-sm";
const STATUS: Record<Summary["status"], string> = { draft: "Draft", scheduled: "Scheduled", sending: "Sending", sent: "Sent", canceled: "Canceled" };
interface Sender { house: boolean; ok: boolean; reason?: string | null; setupPath?: string; fromName?: string; fromEmail?: string | null; replyTo?: string }
// Times show in the account's zone: Mountain for Babs (as always), the client's own otherwise.
const zoneAbbr = (tz: string) => (tz === OWNER_TZ ? "MT" : new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date()).find((x) => x.type === "timeZoneName")?.value || tz);
const zoneName = (tz: string) => (tz === OWNER_TZ ? "Mountain" : tz.replace(/^[^/]+\//, "").replace(/_/g, " "));
const mt = (iso: string | null, tz = OWNER_TZ) =>
  iso ? `${new Date(iso).toLocaleString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} ${zoneAbbr(tz)}` : "";
const todayMt = (tz = OWNER_TZ) => zonedParts(new Date(), tz).date;

export default function BroadcastsTab({ setMsg }: { setMsg: (m: string) => void }) {
  const [list, setList] = useState<Summary[] | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tz, setTz] = useState(OWNER_TZ);
  const [sender, setSender] = useState<Sender | null>(null);
  const [openId, setOpenId] = useState("");
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/crm/broadcasts", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setList(d.broadcasts ?? []);
    setTemplates(d.templates ?? []);
    setAllTags(d.tags ?? []);
    if (typeof d.timezone === "string") setTz(d.timezone);
    setSender(d.sender ?? null);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function create(payload: Record<string, unknown>) {
    const r = await fetch("/api/crm/broadcasts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Couldn't create it.");
    setNewName("");
    setOpenId(d.id);
    void load();
  }

  return (
    <div className="space-y-4">
    {sender && !sender.house && !sender.ok && (
      <p className="rounded-lg bg-[#c9a227]/15 px-4 py-2 text-sm">
        {sender.reason} <a href={sender.setupPath} className="font-semibold text-[#2E7C83] underline">Set up email sending</a>
      </p>
    )}
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-2 min-w-0">
        {templates.map((t) => (
          <button key={t.key} onClick={() => create({ templateKey: t.key })} className="w-full text-left rounded-xl border border-dashed border-[#c9a227] p-3 hover:bg-[#c9a227]/10">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              <Sparkles className="w-4 h-4 text-[#c9a227]" /> New: {t.name}
            </p>
            <p className="text-xs text-[#7a8a99]">{t.description}</p>
          </button>
        ))}
        <div className="flex gap-2">
          <Input placeholder="New blank broadcast" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={() => newName.trim() && create({ name: newName })} aria-label="Create broadcast">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="pt-2 space-y-2">
          <OfferSections items={list ?? []} storageKey="broadcasts">
          {(b) => (
            <button
              key={b.id}
              onClick={() => setOpenId(b.id)}
              className={`w-full text-left rounded-xl border p-3 transition ${b.id === openId ? "border-[#c9a227] bg-[#c9a227]/10" : "border-[#1a2b4a]/10 hover:bg-[#1a2b4a]/5"}`}
            >
              <p className="truncate font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{b.name}</p>
              <p className="text-xs text-[#7a8a99]">
                {STATUS[b.status]}
                {b.status === "scheduled" ? ` · ${mt(b.scheduled_at, tz)}` : ""}
                {b.recipient_count ? ` · ${b.recipient_count} people` : ""}
              </p>
            </button>
          )}
          </OfferSections>
          {list && !list.length && <p className="text-sm text-[#7a8a99]">No broadcasts yet.</p>}
        </div>
      </div>
      <div className="min-w-0">
        {openId ? (
          <Editor key={openId} id={openId} offers={offersOf(list ?? [])} allTags={allTags} templates={templates} tz={tz} sender={sender} setMsg={setMsg} onChange={load} onGone={() => { setOpenId(""); void load(); }} />
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-[#7a8a99]">
              <Megaphone className="w-6 h-6 mb-2 text-[#c9a227]" />
              A broadcast is a one-time email to everyone with a tag. Pick one on the left, or start a new one. Unsubscribed contacts are always left out.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </div>
  );
}

function Editor({ id, offers, allTags, templates, tz, sender, setMsg: setPageMsg, onChange, onGone }: { id: string; offers: string[]; allTags: string[]; templates: Template[]; tz: string; sender: Sender | null; setMsg: (m: string) => void; onChange: () => void; onGone: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [f, setF] = useState<Full | null>(null);
  // What just happened (saved, test sent, or what went wrong), shown right beside the buttons as well as
  // at the top of the page, which is out of sight from the bottom of a long email.
  const [note, setNote] = useState("");
  const setMsg = (m: string) => {
    setNote(m);
    setPageMsg(m);
  };
  const [reach, setReach] = useState<number | null>(null);
  const [known, setKnown] = useState<Record<string, PickedContact>>({});
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(todayMt(tz));
  const [when, setWhen] = useState({ date: addDays(todayMt(tz), 1), time: "09:00" });
  const [resendQ, setResendQ] = useState("");
  // The account's campaigns, for "skip anyone still receiving ...".
  const [campaigns, setCampaigns] = useState<{ key: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/sequences", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => setCampaigns(((x?.sequences ?? []) as { key: string; name: string }[]).map((q) => ({ key: q.key, name: q.name }))))
      .catch(() => {});
  }, []);
  const tpl = templates.find((t) => t.key === f?.template_key) ?? null;

  const load = useCallback(async () => {
    const r = await fetch(`/api/crm/broadcasts/${id}`, { cache: "no-store" }).then((x) => x.json()).catch(() => ({}));
    if (!r.broadcast) return;
    setD(r);
    setF(r.broadcast);
    setReach(r.reach);
    setKnown((k) => ({ ...k, ...Object.fromEntries(((r.people ?? []) as PickedContact[]).map((p) => [p.id, p])) }));
    if (r.broadcast.scheduled_at) setWhen(zonedParts(new Date(r.broadcast.scheduled_at), r.broadcast.timezone || tz));
  }, [id, tz]);
  useEffect(() => {
    void load();
  }, [load]);

  // Keep the default send time in step with the session date (template broadcasts).
  useEffect(() => {
    if (tpl && d?.broadcast.status === "draft") setWhen({ date: addDays(session, tpl.schedule.daysAfter), time: tpl.schedule.time });
  }, [session, tpl, d?.broadcast.status]);

  const draft = f
    ? { name: f.name, subject: f.subject, preview: f.preview ?? "", body: f.body, buttonLabel: f.button_label ?? "", buttonUrl: f.button_url ?? "", brand: f.brand, fromName: f.from_name, fromEmail: f.from_email, tags: f.tags, contactIds: f.contact_ids ?? [], tagMatch: f.tag_match, skipPriorTemplate: f.skip_prior_template, skipActiveSequences: f.skip_active_sequences ?? [], skipTags: f.skip_tags ?? [], offer: f.offer ?? "", variables: f.variables }
    : null;

  // Live recipient count as tags change.
  const tagKey = f ? `${f.tags.join(",")}|${(f.contact_ids ?? []).join(",")}|${f.tag_match}|${f.skip_prior_template}|${(f.skip_active_sequences ?? []).join(",")}|${(f.skip_tags ?? []).join(",")}` : "";
  useEffect(() => {
    if (!f || !d || d.broadcast.status !== "draft") return;
    const t = setTimeout(async () => {
      const r = await post({ action: "count", draft: { tags: f.tags, contactIds: f.contact_ids ?? [], tagMatch: f.tag_match, skipPriorTemplate: f.skip_prior_template, skipActiveSequences: f.skip_active_sequences ?? [], skipTags: f.skip_tags ?? [] } }, true);
      if (r) setReach(r.reach);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagKey]);

  async function post(body: Record<string, unknown>, quiet = false) {
    const r = await fetch(`/api/crm/broadcasts/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (!quiet) setMsg(out.error || "Something went wrong.");
      return null;
    }
    return out;
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }
  // This broadcast, again, to one person (after checking with you which email it is).
  const resendTo = (contactId: string, label: string) =>
    run(async () => {
      if (!confirm(`Send "${d?.broadcast.subject}" to ${label} now?`)) return;
      const r = await post({ action: "resend", contactId });
      if (r) {
        setMsg(`Sent "${r.subject}" to ${r.to}.`);
        setResendQ("");
        await load();
      }
    });
  const save = async (okMsg?: string) => {
    const r = await post({ action: "save", draft });
    if (r) {
      if (r.unscheduled) setMsg("Saved. It's back to a draft because something still needs filling in.");
      else if (okMsg) setMsg(okMsg);
      await load();
      onChange();
    }
    return Boolean(r);
  };

  if (!d || !f) return <p className="text-sm text-[#7a8a99]">Loading…</p>;
  const b = d.broadcast;
  const editable = b.status === "draft" || b.status === "scheduled";
  const slots = Array.from(new Set([...(tpl?.slots.map((s) => s.key) ?? []), ...slotsIn(f.subject, f.preview, f.body, f.button_url)]));
  const tagOptions = Array.from(new Set([...allTags, ...f.tags])).sort();
  const set = (patch: Partial<Full>) => setF({ ...f, ...patch });
  const picked = f.contact_ids ?? [];
  const nameOf = (cid: string) => {
    const p = known[cid];
    return p ? personName(p) : "…";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] break-words">{b.name}</p>
              <p className="text-sm text-[#7a8a99]">
                {STATUS[b.status]}
                {b.status === "scheduled" && ` for ${mt(b.scheduled_at, b.timezone || tz)}`}
                {" · "}From {!sender || sender.house ? <>{b.from_name} &lt;{b.from_email}&gt;</> : <>{sender.fromName} &lt;{sender.fromEmail || "your own domain, once it's set up"}&gt;</>}
              </p>
            </div>
            {b.status === "draft" && (
              <button title="Delete draft" onClick={async () => { if (confirm(`Delete "${b.name}"?`) && (await post({ action: "delete" }))) onGone(); }} className="p-2 text-[#C76F56] hover:bg-[#C76F56]/10 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {!editable && (
            <div className="flex flex-wrap gap-2 text-sm">
              {(["sent", "queued", "failed", "skipped"] as const).map((k) => (
                <span key={k} className="rounded-full bg-[#1a2b4a]/5 px-3 py-1">
                  {d.counts[k] ?? 0} {k === "queued" ? "waiting" : k}
                </span>
              ))}
              <span className="rounded-full bg-[#1a2b4a]/5 px-3 py-1">of {b.recipient_count}</span>
              <Button variant="ghost" size="sm" onClick={() => void load()}>Refresh</Button>
              {b.status === "sending" && (
                <Button size="sm" className="bg-[#C76F56] hover:bg-[#b05e47]" onClick={() => run(async () => { if (confirm("Stop sending? Anyone already emailed stays emailed.")) { await post({ action: "cancel" }); await load(); onChange(); } })}>
                  <XCircle className="w-4 h-4 mr-1" /> Stop sending
                </Button>
              )}
            </div>
          )}
          {!!d.failures.length && (
            <div className="text-xs text-[#C76F56] space-y-1">
              {d.failures.map((x) => (
                <p key={x.email} className="break-all">
                  {x.email}: {x.error}{" "}
                  {b.status !== "sending" && <button disabled={busy} onClick={() => resendTo(x.contact_id, x.email)} className="ml-1 underline text-[#2E7C83]">Resend</button>}
                </p>
              ))}
            </div>
          )}
          {!!d.recipients?.length && (
            <details className="rounded-xl border border-[#1a2b4a]/10" open={b.status === "sent"}>
              <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">People · who this went to ({d.recipients.length})</summary>
              <div className="overflow-x-auto border-t border-[#1a2b4a]/10">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-[#7a8a99]">
                    <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">When</th></tr>
                  </thead>
                  <tbody>
                    {d.recipients.map((x) => (
                      <tr key={x.contactId} className="border-t border-[#1a2b4a]/10">
                        <td className="px-4 py-1.5 text-[#1a2b4a] dark:text-[#F8F5F0]">{x.name || "—"}</td>
                        <td className="px-4 py-1.5 break-all text-[#5a6472] dark:text-[#b8c2cf]">{x.email}</td>
                        <td className={`px-4 py-1.5 ${x.status === "sent" ? "text-[#1F5E63]" : x.status === "failed" ? "text-[#C76F56]" : "text-[#7a8a99]"}`}>{x.status === "sent" ? "Sent" : x.status === "failed" ? "Failed" : x.status === "skipped" ? `Skipped${x.error ? ` (${x.error})` : ""}` : "Waiting"}</td>
                        <td className="px-4 py-1.5 text-[#7a8a99]">{x.sentAt ? mt(x.sentAt, b.timezone || tz) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
          {(b.status === "sent" || b.status === "canceled") && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Resend to one person</p>
              <ContactLookupInput value={resendQ} onChange={setResendQ} onPick={(c) => void resendTo(c.id, `${lookupName(c)} (${c.email})`)} placeholder="Type a name or email…" pickLabel="Send" className={field} />
              <p className="text-xs text-[#7a8a99]">They get this same email, now. Handy when someone didn&apos;t get it or joined after it went out.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {tpl && editable && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Fill in for this session</p>
            <label className="block text-sm">
              Session date
              <Input type="date" value={session} onChange={(e) => setSession(e.target.value)} />
              <span className="text-xs text-[#7a8a99]">Sets the send time to {tpl.schedule.label}. You can still change it below.</span>
            </label>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Who gets it</p>
          <div className="flex flex-wrap gap-1.5">
            {tagOptions.map((t) => {
              const on = f.tags.includes(t);
              return (
                <button
                  key={t}
                  disabled={!editable}
                  onClick={() => set({ tags: on ? f.tags.filter((x) => x !== t) : [...f.tags, t] })}
                  className={`rounded-full px-3 py-1 text-xs border ${on ? "bg-[#2E7C83] text-white border-[#2E7C83]" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}
                >
                  {t}
                </button>
              );
            })}
            {!tagOptions.length && <span className="text-sm text-[#7a8a99]">No tags in use yet.</span>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select value={f.tag_match} disabled={!editable} onChange={(e) => set({ tag_match: e.target.value === "all" ? "all" : "any" })} className={selectCls} aria-label="Match">
              <option value="any">Has any of these tags</option>
              <option value="all">Has all of these tags</option>
            </select>
            {f.template_key && (
              <label className="flex items-center gap-2">
                <input type="checkbox" disabled={!editable} checked={f.skip_prior_template} onChange={(e) => set({ skip_prior_template: e.target.checked })} />
                Skip anyone who already got an earlier one of these
              </label>
            )}
          </div>
          <div className="pt-2 border-t border-[#1a2b4a]/10 space-y-1.5">
            <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Skip anyone with these tags</p>
            <p className="text-xs text-[#7a8a99]">Anyone carrying a tag you pick here is left out, even if they match the tags above.</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...allTags, ...(f.skip_tags ?? [])])).sort().map((t) => {
                const on = (f.skip_tags ?? []).includes(t);
                return (
                  <button key={t} type="button" disabled={!editable} aria-pressed={on} onClick={() => set({ skip_tags: on ? (f.skip_tags ?? []).filter((x) => x !== t) : [...(f.skip_tags ?? []), t] })} className={`rounded-full px-3 py-1 text-xs border ${on ? "bg-[#8a2f2f] text-white border-[#8a2f2f]" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                    {t}
                  </button>
                );
              })}
            </div>
            {editable && (
              <input aria-label="Skip a tag that isn't on anyone yet" placeholder="Or type a tag that isn't on anyone yet, then press Enter" onKeyDown={(e) => { if (e.key !== "Enter") return; e.preventDefault(); const v = e.currentTarget.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); if (v && !(f.skip_tags ?? []).includes(v)) set({ skip_tags: [...(f.skip_tags ?? []), v] }); e.currentTarget.value = ""; }} className="h-9 w-full max-w-md rounded-lg border border-[#1a2b4a]/20 bg-white px-3 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]" />
            )}
          </div>
          {campaigns.length > 0 && (
            <div className="pt-2 border-t border-[#1a2b4a]/10 space-y-1.5">
              <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Skip anyone still receiving</p>
              <p className="text-xs text-[#7a8a99]">People in the middle of a campaign you tick are left out of this broadcast, so they aren&rsquo;t sent two things at once.</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                {campaigns.map((c) => {
                  const on = (f.skip_active_sequences ?? []).includes(c.key);
                  return (
                    <label key={c.key} className="flex items-center gap-2">
                      <input type="checkbox" disabled={!editable} checked={on} onChange={(e) => set({ skip_active_sequences: e.target.checked ? [...(f.skip_active_sequences ?? []), c.key] : (f.skip_active_sequences ?? []).filter((k) => k !== c.key) })} />
                      {c.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-[#1a2b4a]/10 space-y-2">
            <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Plus people you add by name</p>
            {picked.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {picked.map((cid) => (
                  <Pill key={cid} onRemove={editable ? () => set({ contact_ids: picked.filter((x) => x !== cid) }) : undefined}>{nameOf(cid)}</Pill>
                ))}
              </div>
            )}
            {editable && (
              <ContactPicker
                taken={picked}
                onPick={(c) => {
                  setKnown((k) => ({ ...k, [c.id]: c }));
                  set({ contact_ids: [...picked, c.id] });
                }}
              />
            )}
            {editable && <p className="text-xs text-[#7a8a99]">Remember to click Save below so your changes stick.</p>}
          </div>
          <p className="text-sm">
            <strong>{reach ?? "…"}</strong> {reach === 1 ? "person" : "people"}
            <span className="text-[#7a8a99]"> · unsubscribed contacts are always left out{editable ? "; the list is fixed the moment it starts sending" : ""}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">The email</p>
          <fieldset disabled={!editable} className="space-y-3">
            <Input placeholder="Name (only you see this)" value={f.name} onChange={(e) => set({ name: e.target.value })} />
            <Input placeholder="Offer: the section it sits under (for example LCMC)" list="broadcast-offers" value={f.offer ?? ""} onChange={(e) => set({ offer: e.target.value })} />
            <datalist id="broadcast-offers">{offers.map((o) => <option key={o} value={o} />)}</datalist>
            {slots.map((k) => {
              const meta = tpl?.slots.find((s) => s.key === k);
              return (
                <label key={k} className="block text-sm">
                  {meta?.label ?? `{{${k}}}`}
                  <Input placeholder={meta?.placeholder ?? ""} value={f.variables[k] ?? ""} onChange={(e) => set({ variables: { ...f.variables, [k]: e.target.value } })} />
                </label>
              );
            })}
            <Input placeholder="Subject" value={f.subject} onChange={(e) => set({ subject: e.target.value })} />
            <Input placeholder="Inbox preview line (optional)" value={f.preview ?? ""} onChange={(e) => set({ preview: e.target.value })} />
            <textarea
              value={f.body}
              onChange={(e) => set({ body: e.target.value })}
              rows={16}
              placeholder={"{{greeting}}\n\nBlank lines make paragraphs. \"- \" makes bullets, \"1. \" numbered steps, \"## \" a heading, **bold**. {{first_name}} fills their name. Your sign-off and the footer are added for you."}
              className={field}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <Input placeholder="Button label (optional)" value={f.button_label ?? ""} onChange={(e) => set({ button_label: e.target.value })} />
              <Input placeholder="Button link https://… or {{slot}}" value={f.button_url ?? ""} onChange={(e) => set({ button_url: e.target.value })} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Input placeholder="Brand line at the top" value={f.brand} onChange={(e) => set({ brand: e.target.value })} />
              {(!sender || sender.house) && <Input placeholder="From address (@lifecharter.life or @lccommandsuite.com)" value={f.from_email} onChange={(e) => set({ from_email: e.target.value })} />}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            {editable && <Button disabled={busy} onClick={() => run(async () => { await save("Saved."); })}>Save</Button>}
            <Button variant="outline" disabled={busy} onClick={() => run(async () => { const r = await post({ action: "preview", draft }); if (r) setPreview(r); })}>
              <Eye className="w-4 h-4 mr-1" /> Preview
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => run(async () => { if (editable && !(await save())) return; if (await post({ action: "test" })) setMsg("Test sent to your inbox. If it isn't there in a minute, look in Junk."); })}>
              <Send className="w-4 h-4 mr-1" /> Send me a test
            </Button>
            {busy && <span className="self-center text-sm text-[#7a8a99]" role="status">Working…</span>}
          </div>
          {note && !busy && <p role="status" aria-live="polite" className="rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{note}</p>}
          {preview && (
            <div className="rounded-xl border border-[#1a2b4a]/10 overflow-hidden">
              <p className="px-4 py-2 text-sm bg-[#1a2b4a]/5 break-words"><strong>Subject:</strong> {preview.subject} <span className="text-[#7a8a99]">(as Eloise)</span></p>
              <iframe title="Email preview" srcDoc={preview.html} sandbox="" className="w-full h-[560px] bg-white" />
            </div>
          )}
        </CardContent>
      </Card>

      {editable && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Send</p>
            {!!d.problems.length && (
              <ul className="text-sm text-[#C76F56] list-disc pl-5">
                {d.problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm">
                Date
                <Input type="date" value={when.date} onChange={(e) => setWhen({ ...when, date: e.target.value })} />
              </label>
              <label className="text-sm">
                Time ({zoneName(b.timezone || tz)})
                <Input type="time" value={when.time} onChange={(e) => setWhen({ ...when, time: e.target.value })} />
              </label>
              <Button
                disabled={busy}
                onClick={() => run(async () => {
                  if (!(await save())) return;
                  const r = await post({ action: "schedule", ...when });
                  if (r) { setMsg(`Scheduled for ${mt(r.scheduledAt, b.timezone || tz)}.`); await load(); onChange(); }
                })}
              >
                <CalendarClock className="w-4 h-4 mr-1" /> {b.status === "scheduled" ? "Reschedule" : "Schedule"}
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => run(async () => {
                  if (!confirm(`Send "${f.subject}" to ${reach ?? "these"} people right now?`)) return;
                  if (!(await save())) return;
                  const r = await post({ action: "send-now" });
                  if (r) { setMsg(`Sending now. ${r.sent} out so far; the rest follow within a few minutes.`); await load(); onChange(); }
                })}
              >
                <Send className="w-4 h-4 mr-1" /> Send now
              </Button>
              {b.status === "scheduled" && (
                <Button variant="ghost" disabled={busy} onClick={() => run(async () => { await post({ action: "unschedule" }); setMsg("Unscheduled. It's a draft again."); await load(); onChange(); })}>
                  Unschedule
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
