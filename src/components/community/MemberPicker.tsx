"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import type { Profile } from "@/lib/community/types";
import { Avatar, Input, Spinner } from "./ui";

// Search the Collective's directory and pick a member.
export function MemberPicker({ onPick, excludeSelf = true }: { onPick: (p: Profile) => void; excludeSelf?: boolean }) {
  const { supabase, userId } = useCommunity();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      let query = supabase.from("cm_profiles").select("*").eq("status", "active").order("display_name").limit(30);
      if (q.trim()) query = query.ilike("display_name", `%${q.trim().replace(/[%_]/g, "")}%`);
      const { data } = await query;
      setRows(((data as Profile[]) ?? []).filter((p) => !excludeSelf || p.user_id !== userId));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q, supabase, userId, excludeSelf]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA0B0]" />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members by name" className="pl-9" />
      </div>
      <div className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto">
        {loading && rows.length === 0 ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-[#8A8FA0]">No members found.</p>
        ) : (
          rows.map((p) => (
            <button key={p.user_id} onClick={() => onPick(p)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[#F3EEE3]">
              <Avatar name={p.display_name} url={p.avatar_url} size={38} />
              <span className="min-w-0">
                <span className="block font-semibold text-[#1F315B]">{p.display_name}</span>
                {p.headline && <span className="block truncate text-[12.5px] text-[#8A8FA0]">{p.headline}</span>}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
