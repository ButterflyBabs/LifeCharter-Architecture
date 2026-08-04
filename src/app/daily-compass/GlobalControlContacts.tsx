"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Users, Search, Save, CheckCircle, Mail, Phone, Circle, Link2, MessageSquare } from "lucide-react";
import { ACTIVITY_EVENT } from "./TodaysActivity";

interface GcContact {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  lastActiveAt: string | null;
  isDead: boolean;
}

export function GlobalControlContacts() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [contacts, setContacts] = useState<GcContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<GcContact>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Activity logging (call / follow-up + optional note).
  const [logNote, setLogNote] = useState("");
  const [logging, setLogging] = useState<null | "call" | "followup">(null);
  const [logMsg, setLogMsg] = useState<string | null>(null);

  // Schedule a follow-up (unified into Tasks so it surfaces in Today's Focus).
  const [fuChannel, setFuChannel] = useState<"call" | "email">("call");
  const [fuDate, setFuDate] = useState("");
  const [fuTime, setFuTime] = useState("");
  const [fuNote, setFuNote] = useState("");
  const [fuEmailMode, setFuEmailMode] = useState<"none" | "draft" | "auto">("draft");
  const [fuTagId, setFuTagId] = useState("");
  const [fuCalendar, setFuCalendar] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [fuMsg, setFuMsg] = useState<string | null>(null);

  // Global Control tags (workflow drop) + groups (for creating tags).
  const [tags, setTags] = useState<{ id: string; name: string; group: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [fireTagId, setFireTagId] = useState("");
  const [firing, setFiring] = useState(false);
  const [tagMsg, setTagMsg] = useState<string | null>(null);

  // Create-tag form state.
  const [showNewTag, setShowNewTag] = useState(false);
  const [ntName, setNtName] = useState("");
  const [ntGroupId, setNtGroupId] = useState("");
  const [ntNewGroup, setNtNewGroup] = useState("");
  const [ntDesc, setNtDesc] = useState("");
  const [ntWorkflows, setNtWorkflows] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [ntMsg, setNtMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadTagsAndGroups = useCallback(async () => {
    try {
      const [tr, gr] = await Promise.all([
        fetch("/api/global-control/tags").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/global-control/tag-groups").then((r) => (r.ok ? r.json() : null)),
      ]);
      if (tr?.tags) setTags(tr.tags);
      if (gr?.groups) setGroups(gr.groups);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadTagsAndGroups();
  }, [loadTagsAndGroups]);

  const handleCreateTag = async () => {
    if (!ntName.trim()) {
      setNtMsg({ ok: false, text: "Name the tag first." });
      return;
    }
    setCreatingTag(true);
    setNtMsg(null);
    try {
      // Create the group first if a new one was typed.
      let groupId = ntGroupId;
      if (ntNewGroup.trim()) {
        const gr = await fetch("/api/global-control/tag-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: ntNewGroup.trim() }),
        });
        const gd = await gr.json().catch(() => ({}));
        if (!gr.ok || !gd.group?.id) throw new Error(gd?.error || "Couldn't create the group.");
        groupId = gd.group.id;
      }
      if (!groupId) {
        setNtMsg({ ok: false, text: "Pick a group or create a new one." });
        setCreatingTag(false);
        return;
      }
      const workflows = ntWorkflows
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/global-control/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ntName.trim(), groupId, description: ntDesc.trim(), workflows }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.tag) {
        setNtMsg({ ok: false, text: d?.error || "Couldn't create the tag." });
      } else {
        setNtMsg({ ok: true, text: `Created "${d.tag.name}" — it's now in your tag pickers.` });
        setNtName("");
        setNtDesc("");
        setNtWorkflows("");
        setNtNewGroup("");
        await loadTagsAndGroups();
      }
    } catch (e) {
      setNtMsg({ ok: false, text: (e as Error)?.message || "Couldn't create the tag." });
    } finally {
      setCreatingTag(false);
    }
  };

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/global-control/contacts${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json().catch(() => ({}));
      setConnected(Boolean(data.connected));
      if (data.connected) {
        setContacts(Array.isArray(data.contacts) ? data.contacts : []);
        if (data.error) setLoadError(data.error);
      }
    } catch {
      setLoadError("Couldn't load contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = contacts.find((c) => c.id === selectedId) || null;

  const openContact = (c: GcContact) => {
    setSelectedId(c.id);
    setDraft({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone });
    setMsg(null);
    setLogNote("");
    setLogMsg(null);
    setFuChannel("call");
    setFuDate("");
    setFuTime("");
    setFuNote("");
    setFuEmailMode("draft");
    setFuTagId("");
    setFuCalendar(false);
    setFuMsg(null);
    setFireTagId("");
    setTagMsg(null);
  };

  // Fire a tag on the selected contact right now (drop into a GC workflow).
  const fireWorkflowTag = async () => {
    if (!selected || !fireTagId) return;
    setFiring(true);
    setTagMsg(null);
    try {
      const res = await fetch("/api/global-control/tags/fire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId: fireTagId,
          email: selected.email,
          firstName: selected.firstName,
          lastName: selected.lastName,
          phone: selected.phone,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTagMsg(d?.error || "Couldn't fire that tag.");
      } else {
        const t = tags.find((x) => x.id === fireTagId);
        setTagMsg(`Dropped into workflow: ${t?.name || "tag fired"}.`);
      }
    } catch {
      setTagMsg("Couldn't fire that tag.");
    } finally {
      setFiring(false);
    }
  };

  // Schedule a follow-up: creates a task with a due time + follow-up metadata so
  // it appears in Today's Focus when due.
  const scheduleFollowup = async () => {
    if (!selected) return;
    if (!fuDate) {
      setFuMsg("Pick a date first.");
      return;
    }
    setScheduling(true);
    setFuMsg(null);
    const dueAt = new Date(`${fuDate}T${fuTime || "09:00"}`).toISOString();
    const label = fuChannel === "call" ? "Follow-up call" : "Follow-up email";

    // For an email follow-up with AI drafting on, ask the bot to compose it now
    // and store the draft on the task so it's ready to send when due.
    const emailMode = fuChannel === "email" ? fuEmailMode : "none";
    const followup: Record<string, unknown> = {
      channel: fuChannel,
      contactId: selected.id,
      contactName: selected.name,
      contactEmail: selected.email || "",
      aiMode: emailMode,
    };
    let draftedNote = "";
    if (fuChannel === "email" && (emailMode === "draft" || emailMode === "auto")) {
      try {
        const dr = await fetch("/api/followups/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactName: selected.name, guidance: fuNote.trim() }),
        });
        const dd = await dr.json().catch(() => ({}));
        if (dd.needsKey) {
          followup.aiMode = "none";
          draftedNote = " (AI is offline — add your OpenAI key; scheduled as a reminder)";
        } else if (dd.subject && dd.body) {
          followup.aiSubject = dd.subject;
          followup.aiBody = dd.body;
          draftedNote =
            emailMode === "auto"
              ? " — AI drafted it; it will auto-send at the scheduled time"
              : " with an AI-drafted email ready to review & send";
        } else {
          followup.aiMode = "none";
          draftedNote = " (couldn't draft the email — scheduled as a reminder)";
        }
      } catch {
        followup.aiMode = "none";
        draftedNote = " (couldn't draft the email — scheduled as a reminder)";
      }
    }
    // No auto-send without a draft.
    if (followup.aiMode === "auto" && !followup.aiBody) followup.aiMode = "none";

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${label}: ${selected.name}`,
          description: fuNote.trim() || null,
          status: "backlog",
          priority: "high",
          dueAt,
          followup,
        }),
      });
      if (!res.ok) throw new Error();

      // Optional: drop the contact into a GC workflow via a tag.
      let extra = "";
      if (fuTagId && selected.email) {
        try {
          const tr = await fetch("/api/global-control/tags/fire", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tagId: fuTagId,
              email: selected.email,
              firstName: selected.firstName,
              lastName: selected.lastName,
              phone: selected.phone,
            }),
          });
          if (tr.ok) {
            const t = tags.find((x) => x.id === fuTagId);
            extra += ` · dropped into ${t?.name || "workflow"}`;
          }
        } catch {
          /* non-fatal */
        }
      }

      // Optional: add a calendar time-block for a timed call.
      if (fuCalendar && fuChannel === "call" && fuTime) {
        try {
          const cr = await fetch("/api/calendar/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: `Follow-up call: ${selected.name}`,
              startISO: dueAt,
              durationMin: 30,
              note: fuNote.trim(),
            }),
          });
          if (cr.ok) extra += " · added to calendar";
          else {
            const cd = await cr.json().catch(() => ({}));
            if (cd?.needsScope) extra += " · (reconnect Google to add to calendar)";
          }
        } catch {
          /* non-fatal */
        }
      }

      setFuMsg(
        `Scheduled${draftedNote}${extra} — appears in Today's Focus on ${new Date(dueAt).toLocaleDateString()}.`
      );
      setFuDate("");
      setFuTime("");
      setFuNote("");
      setFuTagId("");
      setFuCalendar(false);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("tasks-changed"));
    } catch {
      setFuMsg("Couldn't schedule that — please try again.");
    } finally {
      setScheduling(false);
    }
  };

  // Log a call or follow-up (with the optional note) against the selected
  // contact. Stored in the app ledger and reflected in Today's Activity.
  const logActivity = async (type: "call" | "followup") => {
    if (!selectedId || !selected) return;
    setLogging(type);
    setLogMsg(null);
    try {
      const res = await fetch("/api/global-control/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          contactId: selected.id,
          contactName: selected.name,
          note: logNote.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setLogNote("");
      setLogMsg(type === "call" ? "Call logged for today." : "Follow-up logged for today.");
      if (typeof window !== "undefined") window.dispatchEvent(new Event(ACTIVITY_EVENT));
    } catch {
      setLogMsg("Couldn't log that — please try again.");
    } finally {
      setLogging(null);
    }
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/global-control/contacts/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.contact) {
        setMsg({ ok: false, text: data?.error || "Couldn't save — please try again." });
      } else {
        setContacts((prev) => prev.map((c) => (c.id === selectedId ? data.contact : c)));
        setMsg({ ok: true, text: "Saved to Global Control." });
      }
    } catch {
      setMsg({ ok: false, text: "Couldn't save — please try again." });
    }
    setSaving(false);
  };

  // Not connected → prompt to connect.
  if (connected === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-[#4a9b9b]" />
            Global Control Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-5 rounded-lg border border-dashed border-[#4a9b9b]/40 text-center">
            <p className="text-sm text-[#b8a898] mb-3">
              Connect your Global Control account to pull your contacts in here — view and edit them right on
              the Compass, no need to open Global Control.
            </p>
            <Link href="/settings?tab=integrations">
              <Button variant="outline" size="sm">
                <Link2 className="w-4 h-4 mr-2" />
                Connect Global Control
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-[#4a9b9b]" />
          Global Control Contacts
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowNewTag((v) => !v)}>
            {showNewTag ? "Close" : "+ New tag"}
          </Button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(search.trim());
            }}
            className="relative"
          >
            <Search className="w-4 h-4 text-[#b8a898] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="pl-8 h-9 w-40"
            />
          </form>
        </div>
      </CardHeader>
      <CardContent>
        {/* Create a new tag (optionally wired to existing workflows) */}
        {showNewTag && (
          <div className="mb-5 p-4 rounded-lg border border-[#4a9b9b]/30 bg-[#4a9b9b]/5">
            <h4 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3">
              New Global Control tag
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Tag name</label>
                <Input value={ntName} onChange={(e) => setNtName(e.target.value)} placeholder="e.g. AmiLynne Speaks – Follow-up Call" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Group</label>
                <select
                  value={ntGroupId}
                  onChange={(e) => setNtGroupId(e.target.value)}
                  disabled={Boolean(ntNewGroup.trim())}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] disabled:opacity-50"
                >
                  <option value="">Choose a group…</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">…or new group</label>
                <Input
                  value={ntNewGroup}
                  onChange={(e) => setNtNewGroup(e.target.value)}
                  placeholder="Create a group instead"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">
                  Workflow ID(s) — optional
                </label>
                <Input
                  value={ntWorkflows}
                  onChange={(e) => setNtWorkflows(e.target.value)}
                  placeholder="Paste GC workflow id(s), comma-separated"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-[#b8a898] mb-1">Description — optional</label>
              <Input value={ntDesc} onChange={(e) => setNtDesc(e.target.value)} placeholder="What this tag is for" />
            </div>
            {ntMsg && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  ntMsg.ok
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                {ntMsg.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : null}
                <span>{ntMsg.text}</span>
              </div>
            )}
            <div className="mt-3 flex items-center gap-3">
              <Button size="sm" onClick={handleCreateTag} disabled={creatingTag}>
                {creatingTag ? "Creating…" : "Create tag"}
              </Button>
              <span className="text-xs text-[#b8a898]">
                Attach workflows by pasting their IDs from Global Control — new automations are built in GC.
              </span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* List */}
          <div className="md:col-span-2 border border-[#1a2b4a]/10 rounded-lg divide-y divide-[#1a2b4a]/8 max-h-[420px] overflow-y-auto">
            {loading ? (
              <p className="text-sm text-[#b8a898] p-4">Loading contacts…</p>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-[#b8a898] p-4">
                {loadError || (search ? "No contacts match your search." : "No contacts found.")}
              </p>
            ) : (
              contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openContact(c)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                    selectedId === c.id ? "bg-[#c9a227]/10" : "hover:bg-[#1a2b4a]/5"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#4a9b9b]/15 flex items-center justify-center text-xs font-semibold text-[#2E7C83] flex-shrink-0">
                    {(c.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{c.name}</p>
                    <p className="text-xs text-[#b8a898] truncate">{c.email || c.phone || "—"}</p>
                  </div>
                  {c.isDead && (
                    <Circle className="w-2.5 h-2.5 text-red-400 ml-auto flex-shrink-0" fill="currentColor" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Editable panel */}
          <div className="md:col-span-3">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-center p-6 border border-dashed border-[#1a2b4a]/15 rounded-lg">
                <p className="text-sm text-[#b8a898]">
                  Select a contact to view and edit their details.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#b8a898] mb-1">First name</label>
                    <Input
                      value={draft.firstName ?? ""}
                      onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#b8a898] mb-1">Last name</label>
                    <Input
                      value={draft.lastName ?? ""}
                      onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#b8a898] mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <Input
                    type="email"
                    value={draft.email ?? ""}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#b8a898] mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </label>
                  <Input
                    value={draft.phone ?? ""}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  />
                </div>

                {selected.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-[#7b6b8d]/12 text-[#7b6b8d]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {msg && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      msg.ok
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-red-50 border border-red-200 text-red-600"
                    }`}
                  >
                    {msg.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : null}
                    <span>{msg.text}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <Button onClick={save} disabled={saving}>
                    <Save className="w-4 h-4 mr-1.5" />
                    {saving ? "Saving…" : "Save to Global Control"}
                  </Button>
                  {selected.lastActiveAt && (
                    <span className="text-xs text-[#b8a898]">
                      Last active {new Date(selected.lastActiveAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Log today's activity against this contact */}
                <div className="mt-2 pt-4 border-t border-[#1a2b4a]/10">
                  <label className="block text-xs font-medium text-[#b8a898] mb-1.5">
                    Log a call or follow-up
                  </label>
                  <textarea
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="Optional note (e.g. left voicemail, booked a call for Thursday)…"
                    rows={2}
                    className="w-full p-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={logging !== null}
                      onClick={() => logActivity("call")}
                    >
                      <Phone className="w-4 h-4 mr-1.5" />
                      {logging === "call" ? "Logging…" : "Log call"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={logging !== null}
                      onClick={() => logActivity("followup")}
                    >
                      <MessageSquare className="w-4 h-4 mr-1.5" />
                      {logging === "followup" ? "Logging…" : "Log follow-up"}
                    </Button>
                    {logMsg && <span className="text-xs text-[#2E7C83]">{logMsg}</span>}
                  </div>
                  <p className="text-xs text-[#b8a898] mt-2">
                    Recorded for today and counted in Today&apos;s Activity. Notes are stored here (Global
                    Control&apos;s API doesn&apos;t accept notes yet).
                  </p>
                </div>

                {/* Schedule a follow-up for later */}
                <div className="mt-2 pt-4 border-t border-[#1a2b4a]/10">
                  <label className="block text-xs font-medium text-[#b8a898] mb-1.5">
                    Schedule a follow-up
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg border border-[#1a2b4a]/20 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setFuChannel("call")}
                        className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
                          fuChannel === "call" ? "bg-[#c9a227]/15 text-[#1a2b4a]" : "text-[#b8a898]"
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </button>
                      <button
                        type="button"
                        onClick={() => setFuChannel("email")}
                        className={`px-3 py-1.5 text-sm flex items-center gap-1.5 border-l border-[#1a2b4a]/20 ${
                          fuChannel === "email" ? "bg-[#c9a227]/15 text-[#1a2b4a]" : "text-[#b8a898]"
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" /> Email
                      </button>
                    </div>
                    <input
                      type="date"
                      value={fuDate}
                      onChange={(e) => setFuDate(e.target.value)}
                      className="p-1.5 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                    />
                    <input
                      type="time"
                      value={fuTime}
                      onChange={(e) => setFuTime(e.target.value)}
                      className="p-1.5 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                    />
                  </div>
                  <input
                    type="text"
                    value={fuNote}
                    onChange={(e) => setFuNote(e.target.value)}
                    placeholder={
                      fuChannel === "email"
                        ? "What should the email be about? (guides the AI draft)"
                        : "What's this follow-up about? (optional)"
                    }
                    className="w-full mt-2 p-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  {fuChannel === "email" && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-[#b8a898] mb-1">Email handling</label>
                      <select
                        value={fuEmailMode}
                        onChange={(e) => setFuEmailMode(e.target.value as "none" | "draft" | "auto")}
                        className="w-full p-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                      >
                        <option value="none">Just remind me to write it</option>
                        <option value="draft">AI drafts it — I&apos;ll review &amp; send</option>
                        <option value="auto">AI drafts it — send automatically at the time</option>
                      </select>
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-[#b8a898] mb-1">
                        Also drop into a Global Control workflow (optional)
                      </label>
                      <select
                        value={fuTagId}
                        onChange={(e) => setFuTagId(e.target.value)}
                        className="w-full p-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                      >
                        <option value="">— none —</option>
                        {tags.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.group ? `${t.group} · ` : ""}
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {fuChannel === "call" && fuTime && (
                    <label className="flex items-center gap-2 mt-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fuCalendar}
                        onChange={(e) => setFuCalendar(e.target.checked)}
                        className="w-4 h-4 rounded border-[#1a2b4a]/30 text-[#c9a227] focus:ring-[#c9a227]"
                      />
                      Add to my calendar as a time block
                    </label>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" disabled={scheduling || !fuDate} onClick={scheduleFollowup}>
                      {scheduling ? "Scheduling…" : "Schedule follow-up"}
                    </Button>
                    {fuMsg && <span className="text-xs text-[#2E7C83]">{fuMsg}</span>}
                  </div>
                  <p className="text-xs text-[#b8a898] mt-2">
                    Lands in Today&apos;s Focus on its date (overdue rolls forward). Emails can be AI-drafted or
                    auto-sent; calls can be time-blocked on your calendar.
                  </p>
                </div>

                {/* Drop into a Global Control workflow right now */}
                {tags.length > 0 && (
                  <div className="mt-2 pt-4 border-t border-[#1a2b4a]/10">
                    <label className="block text-xs font-medium text-[#b8a898] mb-1.5">
                      Drop into a Global Control workflow now
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={fireTagId}
                        onChange={(e) => setFireTagId(e.target.value)}
                        className="p-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] max-w-[240px]"
                      >
                        <option value="">Choose a tag…</option>
                        {tags.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.group ? `${t.group} · ` : ""}
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={firing || !fireTagId}
                        onClick={fireWorkflowTag}
                      >
                        {firing ? "Firing…" : "Fire tag"}
                      </Button>
                      {tagMsg && <span className="text-xs text-[#2E7C83]">{tagMsg}</span>}
                    </div>
                    <p className="text-xs text-[#b8a898] mt-2">
                      Assigns the tag to this contact in Global Control and triggers its workflow. Needs the
                      contact to have an email on file.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-[#b8a898] mt-4">
          Contacts and edits sync live with Global Control. Logging calls &amp; follow-ups and adding notes
          from here is coming next.
        </p>
      </CardContent>
    </Card>
  );
}
