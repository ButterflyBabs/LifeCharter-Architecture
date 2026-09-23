"use client";

// Super-admin console for the Collective: invite links & codes, spaces and
// their channels, "Explore LifeCharter" discover cards, and the member list.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Plus, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { timeAgo } from "@/lib/community/format";
import { SECTION_LABELS, type Channel, type DiscoverCard, type Profile, type Space, type SpaceSection } from "@/lib/community/types";
import { Avatar, Badge, Button, Card, EmptyState, ErrorNote, Heading, Input, Label, Modal, PageLoading, TextArea } from "@/components/community/ui";

type Tab = "invites" | "spaces" | "discover" | "members";

function newCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = new Uint32Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => abc[n % abc.length]).join("");
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

export default function AdminPage() {
  const { isAdmin, loading } = useCommunity();
  const [tab, setTab] = useState<Tab>("invites");
  if (loading) return <PageLoading />;
  if (!isAdmin) return <EmptyState icon="🔒" title="Admins only" />;

  return (
    <div>
      <Heading sub="Manage the Collective's channels, invitations and members.">Admin</Heading>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {(
          [
            ["invites", "Invite links"],
            ["spaces", "Channels & pathways"],
            ["discover", "Explore cards"],
            ["members", "Members"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold",
              tab === t ? "border-[#1F315B] bg-[#1F315B] text-white" : "border-[#DCD3C1] bg-white text-[#1F315B] hover:border-[#D4AF63]"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "invites" && <Invites />}
      {tab === "spaces" && <Spaces />}
      {tab === "discover" && <Discover />}
      {tab === "members" && <Members />}
    </div>
  );
}

// ─── Invite links ──────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {label}
    </Button>
  );
}

function Invites() {
  const { supabase, spaces, refresh } = useCommunity();
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const load = useCallback(async () => {
    const [c, m] = await Promise.all([
      supabase.from("cm_space_codes").select("space_id, code"),
      supabase.from("cm_space_members").select("space_id"),
    ]);
    setCodes(Object.fromEntries(((c.data as { space_id: string; code: string }[]) ?? []).map((r) => [r.space_id, r.code])));
    const n: Record<string, number> = {};
    for (const r of (m.data as { space_id: string }[]) ?? []) n[r.space_id] = (n[r.space_id] ?? 0) + 1;
    setCounts(n);
  }, [supabase]);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      <p className="text-[14px] text-[#5B6275]">
        Share a channel&rsquo;s link <em>and</em> its code. New people create their account there; existing members use &ldquo;Already a member&rdquo;.
        Everyone who joins any channel also lands in Start Here and The Commons.
      </p>
      {spaces.map((s) => {
        const link = `${origin}/join/${s.slug === "start-here" ? "collective" : s.slug}`;
        const code = codes[s.id];
        return (
          <Card key={s.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-[#1F315B]">
                {s.emoji} {s.name}{" "}
                <span className="ml-1 text-[12.5px] font-normal text-[#8A8FA0]">
                  {counts[s.id] ?? 0} {counts[s.id] === 1 ? "member" : "members"} · {s.visibility}
                  {s.is_default ? " · everyone" : ""}
                </span>
              </p>
              <label className="flex items-center gap-2 text-[13px] text-[#5B6275]">
                <input
                  type="checkbox"
                  checked={s.join_enabled}
                  onChange={async (e) => {
                    await supabase.from("cm_spaces").update({ join_enabled: e.target.checked }).eq("id", s.id);
                    await refresh();
                  }}
                />
                Accepting new members
              </label>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-[#F7F3EA] px-2.5 py-1.5 text-[13px] text-[#1F315B]">{link.replace(/^https?:\/\//, "")}</code>
              <CopyButton text={link} label="Link" />
              <code className="rounded-lg bg-[#1F315B] px-2.5 py-1.5 font-mono text-[13px] tracking-[0.15em] text-[#E6C988]">{code ?? "—"}</code>
              {code && <CopyButton text={code} label="Code" />}
              {code && <CopyButton text={`Join ${s.name}: ${link}\nInvite code: ${code}`} label="Both" />}
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!confirm(`Replace the invite code for ${s.name}? The old code stops working immediately.`)) return;
                  await supabase.from("cm_space_codes").upsert({ space_id: s.id, code: newCode(), updated_at: new Date().toISOString() });
                  void load();
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" /> New code
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Spaces & channels ─────────────────────────────────────────────────────

function Spaces() {
  const { spaces } = useCommunity();
  const [editing, setEditing] = useState<Partial<Space> | null>(null);
  const [channelsFor, setChannelsFor] = useState<Space | null>(null);

  const sections: SpaceSection[] = ["start", "community", "programs", "alumni"];
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="gold" size="sm" onClick={() => setEditing({ section: "programs", visibility: "private", join_enabled: true })}>
          <Plus className="h-4 w-4" /> New channel
        </Button>
      </div>
      {sections.map((sec) => (
        <section key={sec}>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A8873F]">{SECTION_LABELS[sec]}</h2>
          <div className="space-y-2">
            {spaces
              .filter((s) => s.section === sec)
              .map((s) => (
                <Card key={s.id} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="text-[24px]">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1F315B]">{s.name}</p>
                    <p className="text-[12.5px] text-[#8A8FA0]">
                      /{s.slug} · {s.visibility}
                      {s.is_default ? " · everyone joins" : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setChannelsFor(s)}>
                    Pathways
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                    Edit
                  </Button>
                </Card>
              ))}
          </div>
        </section>
      ))}
      {editing && <SpaceEditor initial={editing} onClose={() => setEditing(null)} />}
      {channelsFor && <ChannelsEditor space={channelsFor} onClose={() => setChannelsFor(null)} />}
    </div>
  );
}

function SpaceEditor({ initial, onClose }: { initial: Partial<Space>; onClose: () => void }) {
  const { supabase, userId, refresh } = useCommunity();
  const [f, setF] = useState({
    name: initial.name ?? "",
    slug: initial.slug ?? "",
    emoji: initial.emoji ?? "✨",
    tagline: initial.tagline ?? "",
    description: initial.description ?? "",
    section: (initial.section ?? "programs") as SpaceSection,
    visibility: initial.visibility ?? "private",
    is_default: initial.is_default ?? false,
    join_enabled: initial.join_enabled ?? true,
    sort_order: initial.sort_order ?? 200,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.name.trim()) return setError("Name is required.");
    const slug = slugify(f.slug || f.name);
    if (!slug) return setError("Please use letters or numbers in the link name.");
    setBusy(true);
    const row = { ...f, slug, name: f.name.trim(), tagline: f.tagline.trim() || null, description: f.description.trim() || null };
    if (initial.id) {
      const { error } = await supabase.from("cm_spaces").update(row).eq("id", initial.id);
      if (error) {
        setBusy(false);
        return setError(error.message.includes("duplicate") ? "That link name is taken." : error.message);
      }
    } else {
      const { data, error } = await supabase.from("cm_spaces").insert(row).select("id").single();
      if (error || !data) {
        setBusy(false);
        return setError(error?.message.includes("duplicate") ? "That link name is taken." : error?.message ?? "Couldn't create.");
      }
      const id = (data as { id: string }).id;
      await Promise.all([
        supabase.from("cm_space_codes").insert({ space_id: id, code: newCode() }),
        supabase.from("cm_space_members").insert({ space_id: id, user_id: userId, role: "admin", joined_via: "admin" }),
        supabase.from("cm_channels").insert([
          { space_id: id, slug: "home", name: `${f.name.trim()} Home`, emoji: "🏠", kind: "announcements", post_policy: "moderators", sort_order: 10 },
          { space_id: id, slug: "discussion", name: "Discussion", emoji: "💬", kind: "discussion", post_policy: "members", sort_order: 20 },
        ]),
      ]);
    }
    await refresh();
    setBusy(false);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={initial.id ? `Edit ${initial.name}` : "New channel"} wide>
      <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
        <div>
          <Label>Emoji</Label>
          <Input value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value.slice(0, 4) })} className="text-center text-[20px]" />
        </div>
        <div>
          <Label>Name</Label>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, slug: initial.id ? f.slug : slugify(e.target.value) })} />
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Link name (/join/…)</Label>
          <Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
        </div>
        <div>
          <Label>Section</Label>
          <select value={f.section} onChange={(e) => setF({ ...f, section: e.target.value as SpaceSection })} className="w-full rounded-xl border border-[#DCD3C1] bg-white px-3 py-2.5 text-[15px]">
            {Object.entries(SECTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label>Tagline</Label>
          <Input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Label>Description (shown on the join page)</Label>
          <TextArea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="min-h-[70px]" />
        </div>
        <div>
          <Label>Visibility</Label>
          <select value={f.visibility} onChange={(e) => setF({ ...f, visibility: e.target.value as Space["visibility"] })} className="w-full rounded-xl border border-[#DCD3C1] bg-white px-3 py-2.5 text-[15px]">
            <option value="private">Private — members only, invite code to join</option>
            <option value="public">Public — every Collective member can read and join</option>
          </select>
        </div>
        <div>
          <Label>Order</Label>
          <Input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} />
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-[14px] text-[#2A3552]">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.is_default} onChange={(e) => setF({ ...f, is_default: e.target.checked })} /> Everyone who joins the Collective is added automatically
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.join_enabled} onChange={(e) => setF({ ...f, join_enabled: e.target.checked })} /> Accepting new members through its join link
        </label>
      </div>
      <div className="mt-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        {initial.id ? (
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              if (!confirm(`Archive ${initial.name}? It disappears for members; nothing is deleted.`)) return;
              await supabase.from("cm_spaces").update({ archived: true }).eq("id", initial.id);
              await refresh();
              onClose();
            }}
          >
            Archive channel
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gold" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ChannelsEditor({ space, onClose }: { space: Space; onClose: () => void }) {
  const { supabase, refresh } = useCommunity();
  const [rows, setRows] = useState<Channel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("cm_channels").select("*").eq("space_id", space.id).order("sort_order");
    setRows((data as Channel[]) ?? []);
  }, [supabase, space.id]);
  useEffect(() => {
    void load();
  }, [load]);

  async function update(id: string, patch: Partial<Channel>) {
    setRows((r) => (r ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase.from("cm_channels").update(patch).eq("id", id);
    if (error) setError(error.message);
  }

  async function add() {
    const n = (rows?.length ?? 0) + 1;
    const { error } = await supabase
      .from("cm_channels")
      .insert({ space_id: space.id, slug: `channel-${Date.now().toString(36)}`, name: `New pathway ${n}`, emoji: "💬", sort_order: (rows?.at(-1)?.sort_order ?? 0) + 10 });
    if (error) setError(error.message);
    void load();
  }

  return (
    <Modal
      open
      onClose={() => {
        void refresh();
        onClose();
      }}
      title={`${space.emoji} ${space.name} — pathways`}
      wide
    >
      <ErrorNote>{error}</ErrorNote>
      {rows === null ? (
        <PageLoading />
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <div key={c.id} className={cn("rounded-xl border border-[#E9E2D3] bg-white p-3", c.archived && "opacity-50")}>
              <div className="grid gap-2 sm:grid-cols-[56px_1fr_150px_150px]">
                <Input value={c.emoji ?? ""} onChange={(e) => update(c.id, { emoji: e.target.value.slice(0, 4) })} className="text-center" aria-label="Emoji" />
                <Input value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} onBlur={(e) => !c.slug.startsWith("channel-") || update(c.id, { slug: slugify(e.target.value) || c.slug })} aria-label="Name" />
                <select value={c.kind} onChange={(e) => update(c.id, { kind: e.target.value as Channel["kind"] })} className="rounded-xl border border-[#DCD3C1] bg-white px-2 text-[13.5px]" aria-label="Kind">
                  <option value="discussion">Discussion</option>
                  <option value="announcements">Announcements</option>
                </select>
                <select value={c.post_policy} onChange={(e) => update(c.id, { post_policy: e.target.value as Channel["post_policy"] })} className="rounded-xl border border-[#DCD3C1] bg-white px-2 text-[13.5px]" aria-label="Who can post">
                  <option value="members">Anyone posts</option>
                  <option value="moderators">Admins post</option>
                </select>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input value={c.prompt ?? ""} onChange={(e) => update(c.id, { prompt: e.target.value || null })} placeholder="Composer prompt (optional)" className="flex-1 text-[13.5px]" />
                <Input type="number" value={c.sort_order} onChange={(e) => update(c.id, { sort_order: Number(e.target.value) })} className="w-20 text-[13.5px]" aria-label="Order" />
                <Button size="sm" variant="ghost" onClick={() => update(c.id, { archived: !c.archived })}>
                  {c.archived ? "Restore" : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={add}>
            <Plus className="h-4 w-4" /> Add pathway
          </Button>
        </div>
      )}
    </Modal>
  );
}

// ─── Discover cards ────────────────────────────────────────────────────────

function Discover() {
  const { supabase, spaces } = useCommunity();
  const [rows, setRows] = useState<DiscoverCard[] | null>(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from("cm_discover_cards").select("*").order("sort_order");
    setRows((data as DiscoverCard[]) ?? []);
  }, [supabase]);
  useEffect(() => {
    void load();
  }, [load]);

  async function update(id: string, patch: Partial<DiscoverCard>) {
    setRows((r) => (r ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)));
    await supabase.from("cm_discover_cards").update(patch).eq("id", id);
  }

  if (rows === null) return <PageLoading />;
  return (
    <div className="space-y-3">
      <p className="text-[14px] text-[#5B6275]">
        These appear under &ldquo;Explore LifeCharter&rdquo; on members&rsquo; home screens. A card tied to a channel is hidden from people already in it.
      </p>
      {rows.map((c) => (
        <Card key={c.id} className={cn("space-y-2 p-4", !c.active && "opacity-60")}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={c.title} onChange={(e) => update(c.id, { title: e.target.value })} aria-label="Title" />
            <select value={c.space_id ?? ""} onChange={(e) => update(c.id, { space_id: e.target.value || null })} className="rounded-xl border border-[#DCD3C1] bg-white px-3 text-[14px]" aria-label="Space">
              <option value="">Not tied to a channel</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  Hide from members of {s.name}
                </option>
              ))}
            </select>
          </div>
          <Input value={c.blurb ?? ""} onChange={(e) => update(c.id, { blurb: e.target.value || null })} placeholder="Short description" />
          <Input value={c.teaser ?? ""} onChange={(e) => update(c.id, { teaser: e.target.value || null })} placeholder="A glimpse from inside (optional)" />
          <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
            <Input value={c.cta_url ?? ""} onChange={(e) => update(c.id, { cta_url: e.target.value || null })} placeholder="Learn more link (sales page)" />
            <Input value={c.cta_label} onChange={(e) => update(c.id, { cta_label: e.target.value })} placeholder="Button text" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" checked={c.active} onChange={(e) => update(c.id, { active: e.target.checked })} /> Showing
            </label>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (!confirm("Delete this card?")) return;
                await supabase.from("cm_discover_cards").delete().eq("id", c.id);
                void load();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await supabase.from("cm_discover_cards").insert({ title: "New card", sort_order: (rows.at(-1)?.sort_order ?? 0) + 10 });
          void load();
        }}
      >
        <Plus className="h-4 w-4" /> Add card
      </Button>
    </div>
  );
}

// ─── Members ───────────────────────────────────────────────────────────────

function Members() {
  const { supabase } = useCommunity();
  const [rows, setRows] = useState<(Profile & { spaces: number })[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    void (async () => {
      const [p, m] = await Promise.all([
        supabase.from("cm_profiles").select("*").order("created_at", { ascending: false }).limit(1000),
        supabase.from("cm_space_members").select("user_id"),
      ]);
      const n: Record<string, number> = {};
      for (const r of (m.data as { user_id: string }[]) ?? []) n[r.user_id] = (n[r.user_id] ?? 0) + 1;
      setRows(((p.data as Profile[]) ?? []).map((x) => ({ ...x, spaces: n[x.user_id] ?? 0 })));
    })();
  }, [supabase]);
  if (rows === null) return <PageLoading />;
  const list = rows.filter((r) => !q || r.display_name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[14px] text-[#5B6275]">{rows.length} members</p>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="max-w-xs" />
      </div>
      <Card className="divide-y divide-[#F0EBE0] overflow-hidden">
        {list.map((p) => (
          <Link key={p.user_id} href={`/community/members/${p.user_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FBF8F2]">
            <Avatar name={p.display_name} url={p.avatar_url} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-[#1F315B]">{p.display_name}</span>
              <span className="block text-[12.5px] text-[#8A8FA0]">
                Joined {timeAgo(p.created_at)} · {p.spaces} {p.spaces === 1 ? "channel" : "channels"}
              </span>
            </span>
            {p.status === "suspended" && <Badge tone="gray">Paused</Badge>}
          </Link>
        ))}
      </Card>
    </div>
  );
}
