"use client";

// App frame for The LifeCharter Collective. Desktop: navy sidebar with the
// member's own spaces (never locked rooms). Mobile: slim top bar + bottom tab
// bar, with the sidebar as a slide-over drawer for "Spaces".
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, CalendarDays, ChevronDown, HelpCircle, Home, NotebookPen, Library, Sparkles, LogOut, Menu, MessageCircle, Settings2, Shield, Users, X, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunityProvider, useCommunity } from "@/lib/community/context";
import { SECTION_LABELS, type Space, type SpaceSection } from "@/lib/community/types";
import { Avatar, Button, PageLoading } from "./ui";
import { PwaRegister } from "./PwaRegister";
import { AiConsentHost } from "./JournalAssist";
import { useCollapsedChannels, useThemePref, useViewAs } from "@/lib/community/prefs";

export function CommunityShell({ children }: { children: ReactNode }) {
  return (
    <CommunityProvider>
      <Frame>{children}</Frame>
    </CommunityProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const { loading, userId, profile, isAdmin } = useCommunity();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const { dark } = useThemePref();
  // Paint the page behind the app too (overscroll, phone status bar area).
  useEffect(() => {
    document.body.style.background = dark ? "#0E1628" : "#F8F5F0";
    return () => {
      document.body.style.background = "";
    };
  }, [dark]);

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!loading && !userId) router.replace("/community/sign-in");
  }, [loading, userId, router]);

  if (loading || !userId) {
    return (
      <div className="min-h-screen bg-[var(--cm-ground)]">
        <PageLoading />
      </div>
    );
  }

  if (!profile && !isAdmin) return <NotYetMember />;

  return (
    <div className={cn("min-h-screen bg-[var(--cm-ground)] font-ui text-[var(--cm-ink)]", dark && "cm-dark")}>
      <PwaRegister />
      <AiConsentHost />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-[#0F1A38]/50" />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[320px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Sidebar onClose={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <MobileTopBar onMenu={() => setDrawer(true)} />

      <main className="pb-24 lg:ml-[272px] lg:pb-10">
        <div className="mx-auto w-full max-w-[860px] px-4 pt-4 sm:px-6 lg:pt-8">
          <SuiteRedirectNotice />
          {children}
        </div>
      </main>

      <MobileTabBar onSpaces={() => setDrawer(true)} />
    </div>
  );
}

// Shown when a Collective-only account tried to open a Command Suite page and
// was sent here instead — so nobody is left wondering which account they're in.
function SuiteRedirectNotice() {
  const { profile, email, supabase } = useCommunity();
  const [show, setShow] = useState(false);
  // They were heading for the Command Suite, so sign out to its sign-in page.
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("from") === "suite") {
      setShow(true);
      url.searchParams.delete("from");
      window.history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);
    }
  }, []);
  if (!show) return null;
  const who = [profile?.display_name, email ? `(${email})` : null].filter(Boolean).join(" ") || "this account";
  return (
    <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-[#E6C988] bg-[var(--cm-gold-soft)] px-4 py-3 text-[14px] text-[var(--cm-ink)]">
      <p className="flex-1 leading-relaxed">
        That page is part of <strong>LifeCharter Command Suite</strong>. You&rsquo;re signed in as <strong>{who}</strong>, a Collective member.{" "}
        <button onClick={signOut} className="font-semibold text-[var(--cm-gold-text)] underline underline-offset-2 hover:text-[var(--cm-ink)]">
          Sign out to switch accounts
        </button>
        .
      </p>
      <button onClick={() => setShow(false)} aria-label="Dismiss" className="rounded-lg p-1 text-[var(--cm-muted)] hover:bg-black/5">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function NotYetMember() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cm-ground)] px-4 font-ui">
      <div className="max-w-md rounded-2xl border border-[var(--cm-line)] bg-[var(--cm-surface)] p-8 text-center shadow-lg">
        <p className="font-display text-[28px] font-semibold text-[var(--cm-ink)]">You&rsquo;re not in the Collective yet</p>
        <p className="mt-2 text-[14.5px] text-[var(--cm-muted-2)]">
          Use the join link and invite code you were given to become a member of The LifeCharter Collective.
        </p>
        <Link href="/join/collective" className="mt-5 inline-block">
          <Button variant="gold">Join the Collective</Button>
        </Link>
      </div>
    </div>
  );
}

function useSignOut() {
  const { supabase } = useCommunity();
  return async () => {
    await supabase.auth.signOut();
    window.location.href = "/community/sign-in";
  };
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { supabase, spaces, channelsFor, isMember, isAdmin, profile, memberships, unreadDms, unreadNotifications, isPlus } = useCommunity();
  const pathname = usePathname() || "";
  // The Library only appears once there's something in it (admins always see it, to stock it).
  const [libraryCount, setLibraryCount] = useState<number | null>(null);
  useEffect(() => {
    void supabase
      .from("cm_resources")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .then(({ count }: { count: number | null }) => setLibraryCount(count ?? 0));
  }, [supabase]);
  const signOut = useSignOut();
  const [viewAs, setViewAs] = useViewAs();
  const { collapsed, toggle } = useCollapsedChannels();
  const memberView = isAdmin && viewAs === "member";

  // Only channels this person belongs to — plus public ones — ever appear
  // here. A super admin belongs to everything, so "member view" hides the
  // channels they were only added to as an admin.
  const adminOnly = new Set(memberships.filter((m) => m.joined_via === "admin").map((m) => m.space_id));
  const visible = spaces.filter((s) => {
    if (s.visibility === "public" || s.is_default) return true;
    if (!isMember(s.id)) return false;
    return !(memberView && adminOnly.has(s.id));
  });
  const bySection = (sec: SpaceSection) => visible.filter((s) => s.section === sec);
  // Until someone chooses, Start Here folds away once they've settled in.
  const settled = !profile || profile.onboarded;
  const defaultCollapsed = profile?.onboarded ? spaces.filter((s) => s.section === "start").map((s) => s.id) : [];
  const isCollapsed = (id: string) => (collapsed ?? defaultCollapsed).includes(id);

  return (
    <nav
      aria-label="Community"
      className="flex h-full flex-col overflow-y-auto bg-gradient-to-b from-[#1B2B52] via-[#16244A] to-[#0F1A38] text-[#EDE6D6]"
    >
      <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-5">
        <Link href="/community" className="flex items-center gap-3">
          <Image src="/lifecharter-collective-mark.png" alt="" width={803} height={772} className="h-11 w-auto drop-shadow" />
          <span className="leading-tight">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D4AF63]">The LifeCharter</span>
            <span className="block font-display text-[21px] font-semibold text-[#F8F5F0]">Collective</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className="rounded-lg p-1.5 text-[#EDE6D6]/70 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {(() => {
        const items = [
          { href: "/community", icon: Home, label: "Home", active: pathname === "/community" },
          { href: "/community/journal", icon: NotebookPen, label: "My Journal", active: pathname.startsWith("/community/journal") },
          { href: "/community/messages", icon: MessageCircle, label: "Messages", active: pathname.startsWith("/community/messages"), badge: unreadDms },
          { href: "/community/notifications", icon: Bell, label: "Notifications", active: pathname.startsWith("/community/notifications"), badge: unreadNotifications },
          { href: "/community/events", icon: CalendarDays, label: "Events", active: pathname.startsWith("/community/events") },
          ...(isAdmin || (libraryCount ?? 0) > 0
            ? [{ href: "/community/library", icon: Library, label: "LifeCharter Library", active: pathname.startsWith("/community/library") }]
            : []),
          { href: "/community/members", icon: Users, label: "Members", active: pathname.startsWith("/community/members") },
          { href: "/community/plus", icon: Sparkles, label: isPlus ? "My Plus" : "Collective Plus", active: pathname.startsWith("/community/plus") },
          { href: "/community/help", icon: HelpCircle, label: "Help & FAQ", active: pathname.startsWith("/community/help") },
          ...(isAdmin ? [{ href: "/community/admin", icon: Shield, label: "Admin", active: pathname.startsWith("/community/admin") }] : []),
        ];
        const folded = isCollapsed("section:menu");
        // A folded menu keeps the page you're on — and anything with unread items — in view.
        const shown = folded ? items.filter((i) => i.active || ("badge" in i && i.badge)) : items;
        return (
          <div className="px-3">
            <FoldHeading label="Menu" collapsed={folded} onToggle={() => toggle("section:menu", folded, defaultCollapsed)} />
            <div className="space-y-0.5">
              {shown.map((i) => (
                <NavItem key={i.href} href={i.href} icon={i.icon} label={i.label} active={i.active} badge={"badge" in i ? i.badge : undefined} />
              ))}
            </div>
          </div>
        );
      })()}

      {(settled ? (["community"] as SpaceSection[]) : (["start", "community"] as SpaceSection[])).map((sec) =>
        bySection(sec).map((space) => (
          <SpaceChannels
            key={space.id}
            label={bySection(sec).length > 1 ? space.name : SECTION_LABELS[sec]}
            space={space}
            channels={channelsFor(space.id)}
            pathname={pathname}
            collapsed={isCollapsed(space.id)}
            onToggle={() => toggle(space.id, isCollapsed(space.id), defaultCollapsed)}
          />
        ))
      )}

      {(["programs", "alumni"] as SpaceSection[]).map((sec) => {
        const list = bySection(sec);
        if (!list.length) return null;
        const key = `section:${sec}`;
        const folded = isCollapsed(key);
        // A folded section still shows the channel you're in.
        const shown = folded ? list.filter((space) => pathname.startsWith(`/community/s/${space.slug}`)) : list;
        return (
          <div key={sec} className="mt-5 px-3">
            <FoldHeading label={SECTION_LABELS[sec]} collapsed={folded} onToggle={() => toggle(key, folded, defaultCollapsed)} />
            {shown.map((space) => {
              const base = `/community/s/${space.slug}`;
              const open = pathname.startsWith(base);
              return (
                <div key={space.id}>
                  <Link
                    href={base}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition",
                      open ? "bg-white/10 text-white" : "text-[#EDE6D6]/85 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <span className="w-5 text-center">{space.emoji}</span>
                    <span className="truncate">{space.name}</span>
                  </Link>
                  {open && (
                    <div className="mb-1 ml-5 border-l border-white/10 pl-2">
                      {channelsFor(space.id).map((c) => (
                        <ChannelLink key={c.id} href={`${base}/${c.slug}`} emoji={c.emoji} name={c.name} active={pathname === `${base}/${c.slug}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Settled members: Start Here moves to the bottom, out of the way but still there. */}
      {settled &&
        (["start"] as SpaceSection[]).map((sec) =>
        bySection(sec).map((space) => (
          <SpaceChannels
            key={space.id}
            label={bySection(sec).length > 1 ? space.name : SECTION_LABELS[sec]}
            space={space}
            channels={channelsFor(space.id)}
            pathname={pathname}
            collapsed={isCollapsed(space.id)}
            onToggle={() => toggle(space.id, isCollapsed(space.id), defaultCollapsed)}
          />
        ))
      )}

      <div className="mt-auto border-t border-white/10 px-3 pb-4 pt-3">
        {isAdmin && (
          <div className="mb-3 px-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#EDE6D6]/50">Viewing as</p>
            <div className="grid grid-cols-2 rounded-full bg-white/[0.07] p-0.5" role="group" aria-label="Viewing as">
              {(["member", "admin"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewAs(v)}
                  aria-pressed={viewAs === v}
                  className={cn(
                    "rounded-full py-1 text-[12px] font-semibold transition",
                    viewAs === v ? "bg-[#D4AF63] text-[#0F1A38]" : "text-[#EDE6D6]/70 hover:text-white"
                  )}
                >
                  {v === "member" ? "Member" : "Admin"}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] leading-snug text-[#EDE6D6]/45">
              {viewAs === "member" ? "Showing the channels a free member sees." : "Showing every channel."}
            </p>
          </div>
        )}
        <Link href="/community/profile" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.06]">
          <Avatar name={profile?.display_name} url={profile?.avatar_url} size={34} className="ring-[#D4AF63]/40" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-white">{profile?.display_name ?? "Your profile"}</span>
            <span className="block text-[12px] text-[#EDE6D6]/60">Profile & settings</span>
          </span>
          <Settings2 className="h-4 w-4 text-[#EDE6D6]/50" />
        </Link>
        {isAdmin && (
          <Link href="/" className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#EDE6D6]/70 hover:bg-white/[0.06] hover:text-white">
            <ArrowLeftRight className="h-4 w-4" /> Command Suite
          </Link>
        )}
        <button onClick={signOut} className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#EDE6D6]/70 hover:bg-white/[0.06] hover:text-white">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </nav>
  );
}

function SpaceChannels({
  label,
  space,
  channels,
  pathname,
  collapsed,
  onToggle,
}: {
  label: string;
  space: Space;
  channels: ReturnType<ReturnType<typeof useCommunity>["channelsFor"]>;
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const base = `/community/s/${space.slug}`;
  // A folded heading still shows the pathway you're currently on.
  const shown = collapsed ? channels.filter((c) => pathname === `${base}/${c.slug}`) : channels;
  return (
    <div className="mt-5 px-3">
      <FoldHeading label={label} collapsed={collapsed} onToggle={onToggle} />
      {shown.map((c) => (
        <ChannelLink key={c.id} href={`${base}/${c.slug}`} emoji={c.emoji} name={c.name} active={pathname === `${base}/${c.slug}`} />
      ))}
    </div>
  );
}

function FoldHeading({ label, collapsed, onToggle }: { label: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="mb-1.5 flex w-full items-center justify-between rounded-md px-3 py-0.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#D4AF63]/90 hover:text-[#E6C988]"
    >
      <span>{label}</span>
      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", collapsed && "-rotate-90")} aria-hidden />
    </button>
  );
}

function ChannelLink({ href, emoji, name, active }: { href: string; emoji: string | null; name: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13.5px] transition",
        active ? "bg-[#D4AF63]/15 font-semibold text-[#F3E3BC]" : "text-[#EDE6D6]/75 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <span className="w-5 text-center text-[14px]">{emoji}</span>
      <span className="truncate">{name}</span>
    </Link>
  );
}

function NavItem({ href, icon: Icon, label, active, badge }: { href: string; icon: typeof Home; label: string; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition",
        active ? "bg-[#D4AF63]/15 font-semibold text-[#F3E3BC]" : "text-[#EDE6D6]/85 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px]", active ? "text-[#D4AF63]" : "text-[#EDE6D6]/60")} />
      <span className="flex-1">{label}</span>
      {!!badge && <span className="rounded-full bg-[#D4AF63] px-1.5 text-[11px] font-bold text-[#0F1A38]">{badge > 99 ? "99+" : badge}</span>}
    </Link>
  );
}

function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  const { unreadNotifications } = useCommunity();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--cm-line)] bg-[var(--cm-ground)] px-3 py-2 backdrop-blur lg:hidden">
      <button onClick={onMenu} aria-label="Open menu" className="rounded-lg p-2 text-[var(--cm-ink)] hover:bg-black/5">
        <Menu className="h-5 w-5" />
      </button>
      <Link href="/community" className="flex items-center gap-2">
        <Image src="/lifecharter-collective-mark.png" alt="" width={803} height={772} className="h-8 w-auto" />
        <span className="font-display text-[19px] font-semibold text-[var(--cm-ink)]">The Collective</span>
      </Link>
      <Link href="/community/notifications" aria-label="Notifications" className="relative rounded-lg p-2 text-[var(--cm-ink)] hover:bg-black/5">
        <Bell className="h-5 w-5" />
        {!!unreadNotifications && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#D4AF63] ring-2 ring-[#F8F5F0]" />}
      </Link>
    </header>
  );
}

function MobileTabBar({ onSpaces }: { onSpaces: () => void }) {
  const pathname = usePathname() || "";
  const { unreadDms, profile } = useCommunity();
  const tab = "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-semibold";
  const on = "text-[var(--cm-ink)]";
  const off = "text-[var(--cm-muted)]";
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--cm-line)] bg-[var(--cm-surface)] pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <Link href="/community" className={cn(tab, pathname === "/community" ? on : off)}>
        <Home className="h-5 w-5" /> Home
      </Link>
      <button onClick={onSpaces} className={cn(tab, pathname.startsWith("/community/s/") ? on : off)}>
        <Menu className="h-5 w-5" /> Channels
      </button>
      <Link href="/community/messages" className={cn(tab, "relative", pathname.startsWith("/community/messages") ? on : off)}>
        <MessageCircle className="h-5 w-5" /> Messages
        {!!unreadDms && <span className="absolute right-[26%] top-1 rounded-full bg-[#D4AF63] px-1 text-[10px] font-bold text-[#0F1A38]">{unreadDms}</span>}
      </Link>
      <Link href="/community/events" className={cn(tab, pathname.startsWith("/community/events") ? on : off)}>
        <CalendarDays className="h-5 w-5" /> Events
      </Link>
      <Link href="/community/profile" className={cn(tab, pathname.startsWith("/community/profile") ? on : off)}>
        <Avatar name={profile?.display_name} url={profile?.avatar_url} size={20} className="ring-0" /> Me
      </Link>
    </nav>
  );
}
