"use client";

import { useCallback, useEffect, useState } from "react";
import { MailCheck, Plus, Trash2, Check, UserPlus, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import ContactLookupInput, { lookupName } from "@/components/crm/ContactLookupInput";

interface List {
  id: string;
  name: string;
  form_id: string | null;
  invite_tag: string | null;
  invite_tags: string[];
}
interface Invite {
  id: string; // the contact
  name: string | null;
  email: string;
  invited_at: string;
  sent_at: string | null;
  registered_at: string | null;
}
interface WalkIn {
  email: string;
  name: string;
  registered_at: string;
}

const LOOKUP = "flex h-10 w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] placeholder:text-[#b8a898] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 focus:border-[#c9a227] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]";
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
// "Jane Doe <jane@x.com>", "Jane Doe, jane@x.com", "jane@x.com" or a tab-separated spreadsheet row.
function parseLines(text: string) {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const email = (l.match(/[^\s<>,;"']+@[^\s<>,;"']+\.[^\s<>,;"']+/) || [""])[0];
      const name = l.replace(email, "").replace(/[<>,;"'\t]/g, " ").replace(/\s+/g, " ").trim();
      return { name, email };
    });
}

export default function InviteTracker() {
  const [lists, setLists] = useState<List[]>([]);
  const [forms, setForms] = useState<{ id: string; name: string }[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [listId, setListId] = useState("");
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [mode, setMode] = useState<"send" | "already">("send");
  const [showSettings, setShowSettings] = useState(false);
  const [inviteCampaign, setInviteCampaign] = useState<{ id: string; name: string; active: boolean; subject: string } | null>(null);
  const [newList, setNewList] = useState({ open: false, name: "", tag: "", formId: "" });
  const [filter, setFilter] = useState<"all" | "not-sent" | "sent" | "registered" | "not-registered">("all");

  const load = useCallback(async (id?: string) => {
    const d = await fetch(`/api/crm/invites${id ? `?list=${id}` : ""}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setLists(d.lists ?? []);
    setForms(d.forms ?? []);
    setAllTags(d.allTags ?? []);
    setInviteCampaign(d.inviteCampaign ?? null);
    setListId(d.list?.id ?? "");
    setInvites(d.invites ?? []);
    setWalkIns(d.walkIns ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/crm/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error || "Something went wrong.");
      return null;
    }
    return d;
  }

  async function addPeople(people: { name: string; email: string }[]) {
    const d = await post({ action: "add", listId, people, mode: inviteCampaign ? mode : "already" });
    if (!d) return;
    setMsg(`${d.added} ${mode === "send" && inviteCampaign ? (d.added === 1 ? "invite sent" : "invites sent") : "added to the list"}.${d.skipped?.length ? ` Skipped: ${d.skipped.join(", ")}` : ""}`);
    void load(listId);
  }

  const list = lists.find((l) => l.id === listId) ?? null;
  const rows = invites ?? [];
  const counts = {
    invited: rows.length,
    sent: rows.filter((r) => r.sent_at).length,
    registered: rows.filter((r) => r.registered_at).length,
  };
  const shown = rows.filter((r) =>
    filter === "not-sent" ? !r.sent_at : filter === "sent" ? Boolean(r.sent_at) : filter === "registered" ? Boolean(r.registered_at) : filter === "not-registered" ? !r.registered_at : true
  );

  function exportCsv() {
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [["Name", "Email", "Tagged", "Invite sent", "Registered"].join(","), ...rows.map((r) => [q(r.name ?? ""), q(r.email), q(when(r.invited_at)), q(when(r.sent_at)), q(when(r.registered_at))].join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(list?.name ?? "invites").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    a.click();
  }

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a] flex items-center justify-center">
          <MailCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Invite Tracker</h1>
          <p className="text-[#7a8a99]">Who you invited, whether the invite went out, and who registered (and when).</p>
        </div>
      </div>

      {msg && (
        <button onClick={() => setMsg("")} className="mb-4 block w-full text-left rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">
          {msg}
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {lists.map((l) => (
          <button key={l.id} onClick={() => void load(l.id)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${l.id === listId ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
            {l.name}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setNewList((n) => ({ ...n, open: !n.open }))}><Plus className="w-4 h-4 mr-1" /> New invite list</Button>
      </div>

      {newList.open && (
        <Card className="mb-5">
          <CardContent className="p-4 grid gap-2 sm:grid-cols-[1fr_200px_240px_auto]">
            <Input placeholder="Event name, e.g. Open House (Nov 5)" value={newList.name} onChange={(e) => setNewList({ ...newList, name: e.target.value })} />
            <Input placeholder="Invite tag, e.g. open-house-invite" value={newList.tag} onChange={(e) => setNewList({ ...newList, tag: e.target.value })} aria-label="Invite tag" />
            <select value={newList.formId} onChange={(e) => setNewList({ ...newList, formId: e.target.value })} className="h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 text-sm" aria-label="Sign-up form">
              <option value="">Sign-up form (for registrations)…</option>
              {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <Button
              disabled={!newList.name.trim()}
              onClick={async () => {
                const d = await post({ action: "create-list", name: newList.name, tag: newList.tag, formId: newList.formId });
                if (d) {
                  setNewList({ open: false, name: "", tag: "", formId: "" });
                  void load(d.id);
                }
              }}
            >
              Create
            </Button>
          </CardContent>
        </Card>
      )}

      {!list ? (
        <p className="text-sm text-[#7a8a99]">{invites === null ? "Loading…" : "No invite lists yet. Create one above."}</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Invited", value: counts.invited },
              { label: "Invite sent", value: counts.sent },
              { label: "Registered", value: counts.registered },
              { label: "Registered, not invited", value: walkIns.length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/30 p-4">
                <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.value}</p>
                <p className="text-xs text-[#7a8a99]">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">
            This list is everyone tagged{" "}
            {(list.invite_tags ?? []).map((t) => (
              <span key={t} className="mx-0.5 rounded-full bg-[#2E7C83]/10 px-2 py-0.5 font-medium text-[#1F5E63] dark:text-[#9fd3d6]">{t}</span>
            ))}
            .{" "}
            <button type="button" onClick={() => setShowSettings((v) => !v)} className="text-[#2E7C83] hover:underline">{showSettings ? "Hide list settings" : "List settings"}</button>
          </div>
          {showSettings && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">List settings: which tags make up this list</p>
              <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">Usually set once. Anyone in Contacts with any of the highlighted tags shows on this list. Changing this sends no email.</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set([...(list.invite_tags ?? []), ...allTags])).sort().map((t) => {
                  const on = (list.invite_tags ?? []).includes(t);
                  return (
                    <button
                      key={t}
                      onClick={async () => {
                        const next = on ? list.invite_tags.filter((x) => x !== t) : [...(list.invite_tags ?? []), t];
                        if (!next.length) return setMsg("Keep at least one tag on the list.");
                        if (await post({ action: "tags", listId, tags: next })) void load(listId);
                      }}
                      className={`rounded-full px-3 py-1 text-xs border ${on ? "bg-[#2E7C83] text-white border-[#2E7C83]" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 max-w-md">
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag, e.g. sneak-peek-invite" aria-label="New invite tag" />
                <Button
                  variant="outline"
                  disabled={!newTag.trim()}
                  onClick={async () => {
                    if (await post({ action: "tags", listId, tags: [...(list.invite_tags ?? []), newTag] })) {
                      setNewTag("");
                      void load(listId);
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          )}
          {!list.form_id && <p className="text-sm rounded-lg bg-[#c9a227]/15 px-4 py-2">This list isn&rsquo;t linked to a sign-up form, so registrations can&rsquo;t be tracked.</p>}

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Invite people</p>
              <div className="space-y-2">
                {inviteCampaign && (
                  <label className={`flex items-start gap-2 rounded-lg border p-3 text-sm cursor-pointer ${mode === "send" ? "border-[#2E7C83] bg-[#2E7C83]/5" : "border-[#1a2b4a]/15"}`}>
                    <input type="radio" name="invite-mode" checked={mode === "send"} onChange={() => setMode("send")} className="mt-0.5 accent-[#2E7C83]" />
                    <span>
                      <strong>Send them the invite email</strong>
                      <span className="block text-xs text-[#7a8a99]">They get &ldquo;{inviteCampaign.subject}&rdquo; from you, with a Save my seat button. When they register you get an email and they show as Registered.</span>
                    </span>
                  </label>
                )}
                <label className={`flex items-start gap-2 rounded-lg border p-3 text-sm cursor-pointer ${mode === "already" || !inviteCampaign ? "border-[#2E7C83] bg-[#2E7C83]/5" : "border-[#1a2b4a]/15"}`}>
                  <input type="radio" name="invite-mode" checked={mode === "already" || !inviteCampaign} onChange={() => setMode("already")} className="mt-0.5 accent-[#2E7C83]" />
                  <span>
                    <strong>I already invited them myself</strong>
                    <span className="block text-xs text-[#7a8a99]">No email is sent. They&rsquo;re added to this list and marked &ldquo;Invite sent&rdquo; now.</span>
                  </span>
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <ContactLookupInput className={LOOKUP} placeholder="Name (or search your contacts)" value={name} onChange={setName} pickLabel="Use" onPick={(c) => { setName(lookupName(c)); setEmail(c.email); }} />
                <ContactLookupInput className={LOOKUP} type="email" placeholder="Email" value={email} onChange={setEmail} pickLabel="Use" onPick={(c) => { setName(lookupName(c)); setEmail(c.email); }} />
                <Button disabled={!email.trim()} onClick={() => { void addPeople([{ name, email }]); setName(""); setEmail(""); }}><UserPlus className="w-4 h-4 mr-1" /> {inviteCampaign && mode === "send" ? "Send invite" : "Add to list"}</Button>
              </div>
              <button type="button" onClick={() => setShowPaste((v) => !v)} className="text-sm text-[#2E7C83] hover:underline">{showPaste ? "Hide" : "Or paste a list of people"}</button>
              {showPaste && (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={paste}
                    onChange={(e) => setPaste(e.target.value)}
                    placeholder={"One person per line, for example:\nJane Doe <jane@example.com>\nSam Lee, sam@example.com\nalex@example.com"}
                    className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-3 text-sm font-mono"
                  />
                  <Button
                    disabled={!paste.trim()}
                    onClick={() => {
                      const people = parseLines(paste);
                      if (inviteCampaign && mode === "send" && !confirm(`Send the invite email to ${people.length} ${people.length === 1 ? "person" : "people"}?`)) return;
                      void addPeople(people);
                      setPaste("");
                      setShowPaste(false);
                    }}
                  >
                    {inviteCampaign && mode === "send" ? `Send invite to ${parseLines(paste).length || ""} people` : `Add ${parseLines(paste).length || ""} people to the list`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            {([
              ["all", "Everyone"],
              ["not-sent", "Invite not sent"],
              ["sent", "Invite sent"],
              ["registered", "Registered"],
              ["not-registered", "Not registered yet"],
            ] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 text-xs font-medium border ${filter === k ? "bg-[#2E7C83] text-white border-[#2E7C83]" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                {l}
              </button>
            ))}
            <div className="flex-1" />
            {rows.length > 0 && <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-1" /> Download CSV</Button>}
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10">
            <table className="w-full text-sm">
              <thead className="bg-[#1a2b4a]/5 text-left">
                <tr>
                  <th className="p-3">Invited</th>
                  <th className="p-3 whitespace-nowrap">Tagged</th>
                  <th className="p-3">Invite sent</th>
                  <th className="p-3">Registered</th>
                  <th className="p-3 w-10"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t border-[#1a2b4a]/10 align-top">
                    <td className="p-3">
                      <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{r.name || r.email}</p>
                      {r.name && <p className="text-xs text-[#7a8a99]">{r.email}</p>}
                    </td>
                    <td className="p-3 whitespace-nowrap text-[#5a6472]">{when(r.invited_at)}</td>
                    <td className="p-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(r.sent_at)}
                          onChange={async (e) => {
                            const d = await post({ action: "sent", listId, contactId: r.id, sent: e.target.checked });
                            if (d) setInvites((xs) => (xs ?? []).map((x) => (x.id === r.id ? { ...x, sent_at: d.sent_at } : x)));
                          }}
                          className="w-4 h-4 accent-[#2E7C83]"
                        />
                        <span className={r.sent_at ? "text-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#7a8a99]"}>{r.sent_at ? when(r.sent_at) : "Not yet"}</span>
                      </label>
                    </td>
                    <td className="p-3">
                      {r.registered_at ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7C83]/10 px-2.5 py-1 text-xs font-medium text-[#1F5E63] dark:text-[#9fd3d6]">
                          <Check className="w-3.5 h-3.5" /> {when(r.registered_at)}
                        </span>
                      ) : (
                        <span className="text-[#7a8a99]">Not yet</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={async () => {
                          if (!confirm(`Take ${r.name || r.email} off this invite list? This removes the ${list.invite_tag} tag; they stay in Contacts.`)) return;
                          if (await post({ action: "remove", listId, contactId: r.id })) void load(listId);
                        }}
                        aria-label={`Remove ${r.name || r.email}`}
                        className="p-1 text-[#7a8a99] hover:text-[#D83A34]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!shown.length && (
                  <tr>
                    <td colSpan={5} className="p-4 text-[#7a8a99]">{rows.length ? "No one matches this filter." : "No one on this list yet. Add people above."}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {walkIns.length > 0 && (
            <div>
              <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">Registered without an invite on this list ({walkIns.length})</p>
              <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10">
                <table className="w-full text-sm">
                  <tbody>
                    {walkIns.map((w) => (
                      <tr key={w.email} className="border-t first:border-t-0 border-[#1a2b4a]/10">
                        <td className="p-3">
                          <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{w.name || w.email}</p>
                          {w.name && <p className="text-xs text-[#7a8a99]">{w.email}</p>}
                        </td>
                        <td className="p-3 text-[#5a6472]">Registered {when(w.registered_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
