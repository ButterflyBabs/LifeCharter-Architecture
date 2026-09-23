"use client";

// Session + structure for the Collective, loaded once by the community shell:
// who's signed in, their profile, whether they're a super admin, and the
// spaces/channels/memberships they can see. Everything is read through the
// signed-in user's own Supabase session, so RLS decides what comes back.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Channel, Membership, Profile, Space } from "./types";

type Supabase = ReturnType<typeof createClient>;

interface CommunityState {
  loading: boolean;
  supabase: Supabase;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  isAdmin: boolean;
  spaces: Space[];
  channels: Channel[];
  memberships: Membership[];
  unreadDms: number;
  unreadNotifications: number;
  refresh: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  isMember: (spaceId: string) => boolean;
  canModerate: (spaceId: string) => boolean;
  spaceBySlug: (slug: string) => Space | undefined;
  channelsFor: (spaceId: string) => Channel[];
}

const Ctx = createContext<CommunityState | null>(null);

let browserClient: Supabase | null = null;
export function communityClient(): Supabase {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const supabase = communityClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [unreadDms, setUnreadDms] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const uidRef = useRef<string | null>(null);

  const refreshCounts = useCallback(async () => {
    const uid = uidRef.current;
    if (!uid) return;
    const [dm, notes] = await Promise.all([
      supabase.rpc("cm_unread_dm_count"),
      supabase
        .from("cm_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .is("read_at", null)
        .neq("kind", "dm"),
    ]);
    setUnreadDms(typeof dm.data === "number" ? dm.data : 0);
    setUnreadNotifications(notes.count ?? 0);
  }, [supabase]);

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;
    uidRef.current = user?.id ?? null;
    setUserId(user?.id ?? null);
    setEmail(user?.email ?? null);
    if (!user) {
      setLoading(false);
      return;
    }
    const [prof, admin, sp, ch, mem] = await Promise.all([
      supabase.from("cm_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.rpc("cm_is_admin"),
      supabase.from("cm_spaces").select("*").eq("archived", false).order("sort_order"),
      supabase.from("cm_channels").select("*").eq("archived", false).order("sort_order"),
      supabase.from("cm_space_members").select("*").eq("user_id", user.id),
    ]);
    setProfile((prof.data as Profile) ?? null);
    setIsAdmin(admin.data === true);
    setSpaces((sp.data as Space[]) ?? []);
    setChannels((ch.data as Channel[]) ?? []);
    setMemberships((mem.data as Membership[]) ?? []);
    setLoading(false);
    void refreshCounts();
  }, [supabase, refreshCounts]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Live badge counts: any new notification row for me bumps the counters.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`cm-notes-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cm_notifications", filter: `user_id=eq.${userId}` },
        () => void refreshCounts()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, refreshCounts]);

  const value = useMemo<CommunityState>(() => {
    const memberSet = new Map(memberships.map((m) => [m.space_id, m]));
    return {
      loading,
      supabase,
      userId,
      email,
      profile,
      isAdmin,
      spaces,
      channels,
      memberships,
      unreadDms,
      unreadNotifications,
      refresh,
      refreshCounts,
      isMember: (id) => memberSet.has(id),
      canModerate: (id) => isAdmin || ["moderator", "admin"].includes(memberSet.get(id)?.role ?? ""),
      spaceBySlug: (slug) => spaces.find((s) => s.slug === slug),
      channelsFor: (id) => channels.filter((c) => c.space_id === id),
    };
  }, [loading, supabase, userId, email, profile, isAdmin, spaces, channels, memberships, unreadDms, unreadNotifications, refresh, refreshCounts]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommunity(): CommunityState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCommunity must be used inside <CommunityProvider>");
  return v;
}

// ─── Profile cache ─────────────────────────────────────────────────────────
// Author names/avatars are needed everywhere (posts, comments, DMs). Fetch
// each profile once per page load and share it across components.

type ProfileLite = Pick<Profile, "user_id" | "display_name" | "avatar_url" | "headline">;
const profileCache = new Map<string, ProfileLite>();
const pending = new Map<string, Promise<void>>();

export function useProfiles(ids: (string | null | undefined)[]): Record<string, ProfileLite> {
  const supabase = communityClient();
  const key = Array.from(new Set(ids.filter(Boolean) as string[])).sort().join(",");
  const [, bump] = useState(0);

  useEffect(() => {
    if (!key) return;
    const missing = key.split(",").filter((id) => !profileCache.has(id) && !pending.has(id));
    if (missing.length === 0) {
      // Something else may be fetching them — re-render when that finishes.
      const waits = key.split(",").map((id) => pending.get(id)).filter(Boolean) as Promise<void>[];
      if (waits.length) void Promise.all(waits).then(() => bump((n) => n + 1));
      return;
    }
    const p = (async () => {
      const { data } = await supabase
        .from("cm_profiles")
        .select("user_id, display_name, avatar_url, headline")
        .in("user_id", missing);
      for (const row of (data as ProfileLite[]) ?? []) profileCache.set(row.user_id, row);
      for (const id of missing) {
        if (!profileCache.has(id)) profileCache.set(id, { user_id: id, display_name: "Former member", avatar_url: null, headline: null });
        pending.delete(id);
      }
    })();
    for (const id of missing) pending.set(id, p);
    void p.then(() => bump((n) => n + 1));
  }, [key, supabase]);

  const out: Record<string, ProfileLite> = {};
  for (const id of key ? key.split(",") : []) {
    const p = profileCache.get(id);
    if (p) out[id] = p;
  }
  return out;
}

export function primeProfile(p: ProfileLite) {
  profileCache.set(p.user_id, p);
}
