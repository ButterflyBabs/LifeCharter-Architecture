"use client";

// Pick one or more members (chips + directory search). Used to start a
// conversation — one person for a private message, two or more for a group —
// and to add people to an existing group.
import { X } from "lucide-react";
import type { Profile } from "@/lib/community/types";
import { MemberPicker } from "./MemberPicker";
import { Avatar } from "./ui";

export type Chosen = Pick<Profile, "user_id" | "display_name" | "avatar_url">;

export function PeopleChooser({ chosen, onChange, exclude }: { chosen: Chosen[]; onChange: (next: Chosen[]) => void; exclude?: string[] }) {
  return (
    <div>
      {chosen.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {chosen.map((p) => (
            <span key={p.user_id} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--cm-line)] bg-[var(--cm-surface)] py-1 pl-1 pr-2 text-[13px] font-semibold text-[var(--cm-ink)]">
              <Avatar name={p.display_name} url={p.avatar_url} size={22} className="ring-0" />
              <span className="truncate">{p.display_name}</span>
              <button
                type="button"
                onClick={() => onChange(chosen.filter((c) => c.user_id !== p.user_id))}
                aria-label={`Remove ${p.display_name}`}
                className="rounded-full p-0.5 text-[var(--cm-muted-2)] hover:bg-black/5 hover:text-[var(--cm-ink)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <MemberPicker
        exclude={[...(exclude ?? []), ...chosen.map((c) => c.user_id)]}
        onPick={(p) => onChange([...chosen, { user_id: p.user_id, display_name: p.display_name, avatar_url: p.avatar_url }])}
      />
    </div>
  );
}

// Overlapping avatars for a group conversation.
export function GroupAvatar({ people, size = 44 }: { people: { display_name?: string | null; avatar_url?: string | null }[]; size?: number }) {
  const [a, b] = people;
  const small = Math.round(size * 0.68);
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden>
      <span className="absolute left-0 top-0">
        <Avatar name={a?.display_name} url={a?.avatar_url} size={small} />
      </span>
      <span className="absolute bottom-0 right-0">
        <Avatar name={b?.display_name ?? "+"} url={b?.avatar_url} size={small} />
      </span>
    </span>
  );
}

// "Beth, Carl and 2 others"
export function groupNames(names: string[], max = 3) {
  const list = names.filter(Boolean);
  if (list.length <= max) return list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "";
  const rest = list.length - max;
  return `${list.slice(0, max).join(", ")} and ${rest} other${rest === 1 ? "" : "s"}`;
}
