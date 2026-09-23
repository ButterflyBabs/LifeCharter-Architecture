"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, Monitor, Moon, Sun } from "lucide-react";
import { useThemePref, type ThemePref } from "@/lib/community/prefs";
import { useCommunity } from "@/lib/community/context";
import { uploadCommunityFile } from "@/lib/community/storage";
import type { Membership } from "@/lib/community/types";
import { Avatar, Button, Card, ErrorNote, Heading, Input, Label, TextArea } from "@/components/community/ui";
import { PushToggle } from "@/components/community/PushToggle";
import { InstallAppCard } from "@/components/community/InstallApp";

export default function ProfilePage() {
  const { supabase, userId, email, profile, spaces, memberships, refresh } = useCommunity();
  const [form, setForm] = useState({ display_name: "", headline: "", bio: "", location: "", website: "", phone: "" });
  const [prefs, setPrefs] = useState({ show_in_directory: true, allow_dms: true, notify_email: true, notify_push: true, journal_reminders: true });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile || !userId) return;
    setForm((f) => ({
      ...f,
      display_name: profile.display_name ?? "",
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      website: profile.website ?? "",
    }));
    setPrefs({
      show_in_directory: profile.show_in_directory,
      allow_dms: profile.allow_dms,
      notify_email: profile.notify_email,
      notify_push: profile.notify_push,
      journal_reminders: profile.journal_reminders ?? true,
    });
    setAvatar(profile.avatar_url);
    void supabase
      .from("cm_private_profiles")
      .select("phone")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }: { data: { phone: string | null } | null }) => setForm((f) => ({ ...f, phone: data?.phone ?? "" })));
  }, [profile, userId, supabase]);

  async function save() {
    if (!userId) return;
    if (!form.display_name.trim()) return setError("Please add your name.");
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("cm_profiles")
      .update({
        display_name: form.display_name.trim().slice(0, 80),
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        website: form.website.trim() || null,
        avatar_url: avatar,
        ...prefs,
      })
      .eq("user_id", userId);
    await supabase.from("cm_private_profiles").upsert({ user_id: userId, phone: form.phone.trim() || null, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return setError(error.message);
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function pickAvatar(file: File) {
    if (!userId) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image.");
    try {
      const a = await uploadCommunityFile(file, userId);
      setAvatar(a.path ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  if (!profile) {
    return <Heading sub="Super admins without a member profile can still manage the Collective.">Your profile</Heading>;
  }

  const field = (k: keyof typeof form, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} {...props} />
    </div>
  );

  return (
    <div className="space-y-5">
      <Heading sub={email ?? undefined}>Your profile</Heading>

      <Card className="p-5">
        <div className="mb-5 flex items-center gap-4">
          <button onClick={() => fileRef.current?.click()} className="group relative" aria-label="Change photo">
            <Avatar name={form.display_name} url={avatar} size={84} />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void pickAvatar(e.target.files[0])} />
          <div>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Change photo
            </Button>
            <p className="mt-1 text-[12.5px] text-[var(--cm-muted)]">A clear, friendly photo helps the Collective get to know you.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("display_name", "Name", { maxLength: 80 })}
          {field("headline", "What you do / focus", { placeholder: "Coach · Founder of …", maxLength: 120 })}
          {field("location", "Location", { placeholder: "City, State" })}
          {field("website", "Website", { placeholder: "yoursite.com" })}
          <div className="sm:col-span-2">
            <Label htmlFor="bio">About you</Label>
            <TextArea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Where you are now, what you're creating, what alignment looks like for you." maxLength={1500} />
          </div>
          {field("phone", "Phone (private — only admins can see it)", { type: "tel" })}
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-[22px] font-semibold text-[var(--cm-ink)]">My Alignment Journal</h2>
          <p className="text-[13.5px] text-[var(--cm-muted)]">Your private intentions, wins and weekly reflections.</p>
        </div>
        <Link href="/community/journal">
          <Button variant="gold" size="sm">
            Open my journal
          </Button>
        </Link>
      </Card>

      <Appearance />

      <Card className="p-5">
        <h2 className="mb-3 font-display text-[22px] font-semibold text-[var(--cm-ink)]">Privacy</h2>
        <Toggle label="Show me in the member directory" checked={prefs.show_in_directory} onChange={(v) => setPrefs({ ...prefs, show_in_directory: v })} />
        <Toggle label="Let members send me direct messages" checked={prefs.allow_dms} onChange={(v) => setPrefs({ ...prefs, allow_dms: v })} />
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-display text-[22px] font-semibold text-[var(--cm-ink)]">Notifications</h2>
        <Toggle label="Email me about announcements, replies and messages" checked={prefs.notify_email} onChange={(v) => setPrefs({ ...prefs, notify_email: v })} />
        <Toggle label="Send push notifications to my devices" checked={prefs.notify_push} onChange={(v) => setPrefs({ ...prefs, notify_push: v })} />
        <Toggle
          label="Journal reminders — Monday: set an intention · Friday: capture a win"
          checked={prefs.journal_reminders}
          onChange={(v) => setPrefs({ ...prefs, journal_reminders: v })}
        />
        <div className="mt-3">
          <PushToggle />
        </div>
        <SpaceNotifyLevels memberships={memberships} spaces={spaces} />
      </Card>

      <ErrorNote>{error}</ErrorNote>
      <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-4">
        <Button variant="gold" onClick={save} disabled={saving} className="shadow-lg">
          {saved ? (
            <>
              <Check className="h-4 w-4" /> Saved
            </>
          ) : saving ? (
            "Saving…"
          ) : (
            "Save changes"
          )}
        </Button>
      </div>

      <BlockedMembers />

      <InstallAppCard />

      <p className="text-center text-[12.5px] text-[var(--cm-muted)]">
        <Link href="/legal/community-guidelines" className="underline">
          Community guidelines
        </Link>{" "}
        ·{" "}
        <Link href="/forgot-password" className="underline">
          Change password
        </Link>
      </p>
    </div>
  );
}

function Appearance() {
  const { pref, setPref } = useThemePref();
  const options: { value: ThemePref; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <Card className="p-5">
      <h2 className="mb-1 font-display text-[22px] font-semibold text-[var(--cm-ink)]">Appearance</h2>
      <p className="mb-3 text-[13.5px] text-[var(--cm-muted)]">System matches your phone or computer. Saved on this device.</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Appearance">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            role="radio"
            aria-checked={pref === value}
            onClick={() => setPref(value)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-[13.5px] font-semibold transition ${
              pref === value
                ? "border-[#D4AF63] bg-[var(--cm-gold-soft)] text-[var(--cm-ink)]"
                : "border-[var(--cm-line-strong)] bg-[var(--cm-surface)] text-[var(--cm-muted-2)] hover:border-[#D4AF63]"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function BlockedMembers() {
  const { supabase, blockedIds, unblock } = useCommunity();
  const [people, setPeople] = useState<{ user_id: string; display_name: string; avatar_url: string | null }[]>([]);
  const key = Array.from(blockedIds).sort().join(",");
  useEffect(() => {
    if (!key) return setPeople([]);
    void supabase
      .from("cm_profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", key.split(","))
      .then(({ data }: { data: { user_id: string; display_name: string; avatar_url: string | null }[] | null }) => setPeople(data ?? []));
  }, [supabase, key]);
  if (!people.length) return null;
  return (
    <Card className="p-5">
      <h2 className="mb-1 font-display text-[22px] font-semibold text-[var(--cm-ink)]">Blocked members</h2>
      <p className="mb-3 text-[13.5px] text-[var(--cm-muted)]">You don&rsquo;t see their posts or replies, and you can&rsquo;t message each other. They aren&rsquo;t told.</p>
      <div className="space-y-2">
        {people.map((p) => (
          <div key={p.user_id} className="flex items-center gap-3">
            <Avatar name={p.display_name} url={p.avatar_url} size={34} />
            <span className="flex-1 font-semibold text-[var(--cm-ink)]">{p.display_name}</span>
            <Button size="sm" variant="outline" onClick={() => void unblock(p.user_id)}>
              Unblock
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2 text-[14.5px] text-[var(--cm-body)]">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[var(--cm-navy)]" : "bg-[var(--cm-line-strong)]"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--cm-surface)] shadow transition ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function SpaceNotifyLevels({ memberships, spaces }: { memberships: Membership[]; spaces: ReturnType<typeof useCommunity>["spaces"] }) {
  const { supabase, userId, refresh } = useCommunity();
  if (!memberships.length) return null;
  return (
    <div className="mt-4 border-t border-[var(--cm-line-soft)] pt-3">
      <p className="mb-2 text-[13px] font-semibold text-[var(--cm-muted-2)]">Per channel</p>
      <div className="space-y-1.5">
        {memberships.map((m) => {
          const s = spaces.find((x) => x.id === m.space_id);
          if (!s) return null;
          return (
            <div key={m.space_id} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="text-[var(--cm-ink)]">
                {s.emoji} {s.name}
              </span>
              <select
                value={m.notify_level}
                aria-label={`Notifications for ${s.name}`}
                onChange={async (e) => {
                  await supabase.from("cm_space_members").update({ notify_level: e.target.value }).eq("space_id", m.space_id).eq("user_id", userId);
                  await refresh();
                }}
                className="rounded-lg border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-2 py-1 text-[13px]"
              >
                <option value="all">Everything</option>
                <option value="announcements">Announcements only</option>
                <option value="none">Muted</option>
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
