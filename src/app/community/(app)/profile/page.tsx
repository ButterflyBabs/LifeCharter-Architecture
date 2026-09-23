"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { uploadCommunityFile } from "@/lib/community/storage";
import type { Membership } from "@/lib/community/types";
import { Avatar, Button, Card, ErrorNote, Heading, Input, Label, TextArea } from "@/components/community/ui";
import { PushToggle } from "@/components/community/PushToggle";
import { InstallAppCard } from "@/components/community/InstallApp";

export default function ProfilePage() {
  const { supabase, userId, email, profile, spaces, memberships, refresh } = useCommunity();
  const [form, setForm] = useState({ display_name: "", headline: "", bio: "", location: "", website: "", phone: "" });
  const [prefs, setPrefs] = useState({ show_in_directory: true, allow_dms: true, notify_email: true, notify_push: true });
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
    setPrefs({ show_in_directory: profile.show_in_directory, allow_dms: profile.allow_dms, notify_email: profile.notify_email, notify_push: profile.notify_push });
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
            <p className="mt-1 text-[12.5px] text-[#8A8FA0]">A clear, friendly photo helps the Collective get to know you.</p>
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

      <Card className="p-5">
        <h2 className="mb-3 font-display text-[22px] font-semibold text-[#1F315B]">Privacy</h2>
        <Toggle label="Show me in the member directory" checked={prefs.show_in_directory} onChange={(v) => setPrefs({ ...prefs, show_in_directory: v })} />
        <Toggle label="Let members send me direct messages" checked={prefs.allow_dms} onChange={(v) => setPrefs({ ...prefs, allow_dms: v })} />
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-display text-[22px] font-semibold text-[#1F315B]">Notifications</h2>
        <Toggle label="Email me about announcements, replies and messages" checked={prefs.notify_email} onChange={(v) => setPrefs({ ...prefs, notify_email: v })} />
        <Toggle label="Send push notifications to my devices" checked={prefs.notify_push} onChange={(v) => setPrefs({ ...prefs, notify_push: v })} />
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

      <InstallAppCard />

      <p className="text-center text-[12.5px] text-[#8A8FA0]">
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2 text-[14.5px] text-[#2A3552]">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[#1F315B]" : "bg-[#D5D8E0]"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function SpaceNotifyLevels({ memberships, spaces }: { memberships: Membership[]; spaces: ReturnType<typeof useCommunity>["spaces"] }) {
  const { supabase, userId, refresh } = useCommunity();
  if (!memberships.length) return null;
  return (
    <div className="mt-4 border-t border-[#F0EBE0] pt-3">
      <p className="mb-2 text-[13px] font-semibold text-[#5B6275]">Per channel</p>
      <div className="space-y-1.5">
        {memberships.map((m) => {
          const s = spaces.find((x) => x.id === m.space_id);
          if (!s) return null;
          return (
            <div key={m.space_id} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="text-[#1F315B]">
                {s.emoji} {s.name}
              </span>
              <select
                value={m.notify_level}
                aria-label={`Notifications for ${s.name}`}
                onChange={async (e) => {
                  await supabase.from("cm_space_members").update({ notify_level: e.target.value }).eq("space_id", m.space_id).eq("user_id", userId);
                  await refresh();
                }}
                className="rounded-lg border border-[#DCD3C1] bg-white px-2 py-1 text-[13px]"
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
