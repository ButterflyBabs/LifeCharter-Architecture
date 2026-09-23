"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import type { Profile } from "@/lib/community/types";
import { Avatar, Card, EmptyState, Heading, Input, PageLoading, PlusMark } from "@/components/community/ui";

export default function MembersPage() {
  const { supabase, spaces, isMember, blockedIds, plusIds } = useCommunity();
  const [q, setQ] = useState("");
  const [spaceFilter, setSpaceFilter] = useState("");
  const [rows, setRows] = useState<Profile[] | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      let ids: string[] | null = null;
      if (spaceFilter) {
        const { data } = await supabase.from("cm_space_members").select("user_id").eq("space_id", spaceFilter);
        ids = ((data as { user_id: string }[]) ?? []).map((r) => r.user_id);
      }
      let query = supabase.from("cm_profiles").select("*").eq("status", "active").eq("show_in_directory", true).order("display_name").limit(200);
      const term = q.trim().replace(/[%_,()]/g, "");
      if (term) query = query.or(`display_name.ilike.%${term}%,headline.ilike.%${term}%,location.ilike.%${term}%`);
      if (ids) query = query.in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const { data } = await query;
      setRows(((data as Profile[]) ?? []).filter((p) => !blockedIds.has(p.user_id)));
    }, 200);
    return () => clearTimeout(t);
  }, [supabase, q, spaceFilter, blockedIds]);

  const filterable = spaces.filter((s) => isMember(s.id));

  return (
    <div>
      <Heading sub="The people of The LifeCharter Collective.">Members</Heading>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cm-faint)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, focus or location" className="pl-9" />
        </div>
        <select
          value={spaceFilter}
          onChange={(e) => setSpaceFilter(e.target.value)}
          aria-label="Filter by channel"
          className="rounded-xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-3 py-2.5 text-[14px] text-[var(--cm-ink)]"
        >
          <option value="">Everyone</option>
          {filterable.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji} {s.name}
            </option>
          ))}
        </select>
      </div>
      {rows === null ? (
        <PageLoading />
      ) : rows.length === 0 ? (
        <EmptyState icon="🔍" title="No members found" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((p) => (
            <Link key={p.user_id} href={`/community/members/${p.user_id}`}>
              <Card className="flex h-full items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-[#D4AF63]">
                <Avatar name={p.display_name} url={p.avatar_url} size={52} />
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--cm-ink)]">
                    {p.display_name} {plusIds.has(p.user_id) && <PlusMark className="ml-1" />}
                  </p>
                  {p.headline && <p className="truncate text-[13.5px] text-[var(--cm-muted-2)]">{p.headline}</p>}
                  {p.location && (
                    <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-[var(--cm-muted)]">
                      <MapPin className="h-3.5 w-3.5" /> {p.location}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
