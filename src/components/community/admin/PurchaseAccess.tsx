"use client";

// Admin → Purchase access (co022): which Stripe purchases unlock which channels.
// The Stripe webhook reads these rows; buyers are added with no invite code.
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { timeAgo } from "@/lib/community/format";
import { Badge, Button, Card, ErrorNote, Input, PageLoading } from "@/components/community/ui";

interface AccessRow {
  id: string;
  match_key: string;
  label: string | null;
  space_ids: string[];
  crm_tags: string[];
  active: boolean;
}
interface GrantRow {
  id: string;
  email: string;
  space_id: string;
  status: "pending" | "applied";
  created_at: string;
  applied_at: string | null;
}

export function PurchaseAccess() {
  const { supabase, spaces } = useCommunity();
  const [rows, setRows] = useState<AccessRow[] | null>(null);
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, g] = await Promise.all([
      supabase.from("cm_purchase_access").select("*").order("created_at"),
      supabase.from("cm_purchase_grants").select("id, email, space_id, status, created_at, applied_at").order("created_at", { ascending: false }).limit(25),
    ]);
    if (a.error) setError(a.error.message);
    setRows((a.data as AccessRow[]) ?? []);
    setGrants((g.data as GrantRow[]) ?? []);
  }, [supabase]);
  useEffect(() => {
    void load();
  }, [load]);

  async function update(id: string, patch: Partial<AccessRow>) {
    setRows((r) => (r ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error: e } = await supabase.from("cm_purchase_access").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    setError(e ? (/duplicate/i.test(e.message) ? "Another row already uses that Stripe id or key." : e.message) : null);
  }

  if (rows === null) return <PageLoading />;
  const spaceName = (id: string) => spaces.find((s) => s.id === id)?.name ?? "Removed channel";

  return (
    <div className="space-y-3">
      <p className="text-[14px] text-[var(--cm-muted-2)]">
        When someone buys through Stripe, every row that matches the purchase adds them to its channels &mdash; no invite code. Buyers who already have a LifeCharter login are added at once; everyone else gets an email with a link to create their login, and the channel is waiting for them.
      </p>
      <Card className="bg-[var(--cm-fill)] p-4 text-[13px] leading-relaxed text-[var(--cm-muted-2)]">
        <strong className="text-[var(--cm-ink)]">What to put in &ldquo;Stripe match&rdquo;</strong> (any one works):
        <br />• A Stripe Price id (<code>price_…</code>) or Product id (<code>prod_…</code>)
        <br />• A Payment Link id (<code>plink_…</code>)
        <br />• A word of your choosing, e.g. <code>soul-sessions</code>, then in Stripe add metadata to the Payment Link: key <code>collective_access</code>, value <code>soul-sessions</code>
      </Card>
      {error && <ErrorNote>{error}</ErrorNote>}

      {rows.map((r) => (
        <Card key={r.id} className={cn("space-y-3 p-4", !r.active && "opacity-60")}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={r.label ?? ""} onChange={(e) => update(r.id, { label: e.target.value || null })} placeholder="What they bought (e.g. SOUL Sessions)" aria-label="Purchase name" />
            <Input
              value={r.match_key}
              onChange={(e) => setRows((all) => (all ?? []).map((x) => (x.id === r.id ? { ...x, match_key: e.target.value } : x)))}
              onBlur={(e) => e.target.value.trim() && update(r.id, { match_key: e.target.value.trim() })}
              placeholder="Stripe match: price_…, prod_…, plink_… or a metadata value"
              aria-label="Stripe match"
              className="font-mono text-[13px]"
            />
          </div>
          <div>
            <p className="mb-1.5 text-[12.5px] font-semibold text-[var(--cm-muted)]">Unlocks these channels</p>
            <div className="flex flex-wrap gap-1.5">
              {spaces.map((s) => {
                const on = r.space_ids.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update(r.id, { space_ids: on ? r.space_ids.filter((x) => x !== s.id) : [...r.space_ids, s.id] })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[13px]",
                      on ? "border-[var(--cm-ink)] bg-[var(--cm-navy)] text-white" : "border-[var(--cm-line-strong)] bg-[var(--cm-surface)] text-[var(--cm-ink)] hover:border-[#D4AF63]"
                    )}
                  >
                    {s.emoji} {s.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <Input
              defaultValue={r.crm_tags.join(", ")}
              onBlur={(e) => update(r.id, { crm_tags: e.target.value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) })}
              placeholder="CRM tags for the buyer, comma-separated (e.g. soul-sessions)"
              aria-label="CRM tags"
            />
            <div className="flex items-center justify-end gap-3">
              <label className="flex items-center gap-2 text-[13.5px]">
                <input type="checkbox" checked={r.active} onChange={(e) => update(r.id, { active: e.target.checked })} /> On
              </label>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Delete"
                onClick={async () => {
                  if (!confirm("Delete this purchase access rule? People already added keep their channels.")) return;
                  await supabase.from("cm_purchase_access").delete().eq("id", r.id);
                  void load();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {!r.space_ids.length && <p className="text-[12.5px] text-[var(--cm-gold-ink)]">Pick at least one channel.</p>}
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          const { error: e } = await supabase.from("cm_purchase_access").insert({ match_key: `new-${Date.now().toString(36)}`, label: "New purchase" });
          if (e) setError(e.message);
          void load();
        }}
      >
        <Plus className="h-4 w-4" /> Add purchase
      </Button>

      <div className="pt-4">
        <p className="mb-2 font-semibold text-[var(--cm-ink)]">Recent purchases</p>
        {grants.length ? (
          <Card className="divide-y divide-[var(--cm-line-soft)]">
            {grants.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[13.5px]">
                <span className="text-[var(--cm-ink)]">
                  {g.email} <span className="text-[var(--cm-muted)]">· {spaceName(g.space_id)}</span>
                </span>
                <span className="flex items-center gap-2 text-[12.5px] text-[var(--cm-muted)]">
                  {timeAgo(g.created_at)}
                  {g.status === "applied" ? <Badge tone="green">In the channel</Badge> : <Badge tone="gold">Waiting for login</Badge>}
                </span>
              </div>
            ))}
          </Card>
        ) : (
          <p className="text-[13.5px] text-[var(--cm-muted-2)]">No purchases yet.</p>
        )}
      </div>
    </div>
  );
}
