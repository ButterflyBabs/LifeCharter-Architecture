"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Users, Search, Save, CheckCircle, Mail, Phone, Circle, Link2 } from "lucide-react";

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
            className="pl-8 h-9 w-48"
          />
        </form>
      </CardHeader>
      <CardContent>
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
