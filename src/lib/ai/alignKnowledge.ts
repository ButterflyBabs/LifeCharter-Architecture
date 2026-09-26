import { createServerClient } from "@/lib/supabase/server";
import { latestInsight } from "@/lib/ai/planKnowledge";
import { DIMENSION_LABEL } from "@/lib/scoring/dimensionModel";
import { planBusinessIds } from "@/lib/planScope";

// What the Alignment area knows about a client, as text for their assistant:
// how their scores have moved since baseline, their businesses and segments and
// where the revenue sits, what their clients say about them (approved reviews),
// and what their assistant last concluded about each Alignment area. Everything
// is this client's own. This is what lets Progress, Segments, Reviews and the
// Alignment Profile inform the rest of the Suite.

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trim()}…` : s.trim());
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
const label = (k: string) => (DIMENSION_LABEL as Record<string, string>)[k] ?? k;

export async function alignmentKnowledge(masterPlanId: string): Promise<string> {
  const db = createServerClient();
  const parts: string[] = [];

  // Movement since their baseline.
  try {
    const { data: snaps } = await db
      .from("client_score_snapshots")
      .select("snapshot_type, overall, domains, created_at")
      .eq("master_plan_id", masterPlanId)
      .order("created_at", { ascending: true });
    const rows = (snaps ?? []) as { snapshot_type: string; overall: number | null; domains: Record<string, number>; created_at: string }[];
    const base = rows.find((r) => r.snapshot_type === "baseline") ?? rows[0];
    const latest = rows[rows.length - 1];
    if (base && latest && base !== latest) {
      const moves = Object.keys(latest.domains ?? {})
        .filter((k) => typeof base.domains?.[k] === "number")
        .map((k) => ({ k, d: latest.domains[k] - base.domains[k] }))
        .filter((m) => m.d !== 0)
        .sort((a, b) => b.d - a.d);
      const fmt = (m: { k: string; d: number }) => `${label(m.k)} ${m.d > 0 ? "+" : ""}${m.d}`;
      parts.push(
        `Progress since baseline (${base.created_at.slice(0, 10)}, ${rows.length} score points so far): overall ${base.overall ?? "?"} → ${latest.overall ?? "?"}` +
          (moves.length ? `; up — ${moves.filter((m) => m.d > 0).slice(0, 3).map(fmt).join(", ") || "none"}; down — ${moves.filter((m) => m.d < 0).slice(-3).map(fmt).join(", ") || "none"}` : "; no dimension has moved yet") +
          "."
      );
    } else if (base) {
      parts.push(`Progress: only a baseline score exists so far (${base.created_at.slice(0, 10)}) — no movement to measure yet.`);
    }
  } catch {
    /* optional */
  }

  // Their businesses and segments, and where this month's revenue sits.
  try {
    const bizIds = await planBusinessIds(masterPlanId);
    if (bizIds.length) {
      const { data: biz } = await db.from("businesses").select("id, name, segments ( id, name )").in("id", bizIds).eq("active", true).order("sort_order");
      const list = (biz ?? []) as unknown as { id: number; name: string; segments: { id: number; name: string }[] }[];
      const segIds = list.flatMap((b) => b.segments.map((s) => s.id));
      const now = new Date();
      const yearStart = `${now.getUTCFullYear()}-01-01`;
      const monthStart = `${yearStart.slice(0, 5)}${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
      // Income they tagged to each segment in the Finance Center, this month.
      const revBySeg = new Map<number, { actual: number; target: number }>();
      if (segIds.length) {
        const { data: ent } = await db.from("finance_entries").select("segment_id, amount").eq("master_plan_id", masterPlanId).eq("type", "income").in("segment_id", segIds).gte("occurred_on", monthStart);
        for (const e of (ent ?? []) as { segment_id: number; amount: number | string | null }[]) {
          const c = revBySeg.get(e.segment_id) ?? { actual: 0, target: 0 };
          c.actual += Number(e.amount ?? 0);
          revBySeg.set(e.segment_id, c);
        }
      }
      const total = Array.from(revBySeg.values()).reduce((s, v) => s + v.actual, 0);
      const lines = list.map((b) => {
        const segs = b.segments.map((s) => {
          const r = revBySeg.get(s.id);
          return r && (r.actual || r.target) ? `${s.name} ${usd(r.actual)}${r.target ? ` of ${usd(r.target)}` : ""}` : s.name;
        });
        const bizActual = b.segments.reduce((s, x) => s + (revBySeg.get(x.id)?.actual ?? 0), 0);
        return `${b.name}${bizActual ? ` (${usd(bizActual)} this month${total ? `, ${Math.round((bizActual / total) * 100)}% of revenue` : ""})` : ""}: ${segs.join("; ") || "no segments yet"}`;
      });
      parts.push(`Businesses & segments (income tagged to each segment this month):\n${lines.map((l) => `  • ${l}`).join("\n")}`);
    } else {
      parts.push("Businesses & segments: none set up yet.");
    }
  } catch {
    /* optional */
  }

  // What their clients say (only approved/featured reviews are ever shared).
  try {
    const { data } = await db
      .from("testimonials")
      .select("rating, status, headline, content, client_name")
      .eq("master_plan_id", masterPlanId)
      .order("created_at", { ascending: false })
      .limit(200);
    const rows = (data ?? []) as { rating: number | null; status: string; headline: string | null; content: string | null; client_name: string }[];
    if (rows.length) {
      const rated = rows.filter((r) => r.rating);
      const avg = rated.length ? (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1) : null;
      const shown = rows.filter((r) => r.status === "approved" || r.status === "featured");
      const { count: waiting } = await db.from("review_requests").select("id", { count: "exact", head: true }).eq("master_plan_id", masterPlanId).in("status", ["sent", "opened"]);
      parts.push(
        `Client reviews: ${rows.length} collected${avg ? `, average ${avg}/5` : ""}; ${shown.length} approved to share; ${rows.filter((r) => r.status === "pending").length} waiting for approval; ${waiting ?? 0} requests out.` +
          (shown.length ? `\n  What clients say: ${shown.slice(0, 3).map((r) => `"${clip(oneLine(r.headline || r.content || ""), 140)}" — ${r.client_name.split(" ")[0]}`).join("; ")}` : "")
      );
    } else {
      parts.push("Client reviews: none collected yet.");
    }
  } catch {
    /* optional */
  }

  // What their assistant last concluded.
  try {
    for (const [area, name] of [["alignment", "Alignment briefing"], ["progress", "Progress read"], ["profile", "Alignment Profile"], ["segments", "Segment read"], ["reviews", "Social-proof read"]] as const) {
      const i = await latestInsight(masterPlanId, area);
      const summary = typeof i?.content?.summary === "string" ? i.content.summary : "";
      if (summary) parts.push(`${name} (${i!.createdAt.slice(0, 10)}): ${clip(oneLine(summary), 260)}`);
    }
  } catch {
    /* optional */
  }

  return parts.length ? `ALIGNMENT —\n${parts.join("\n")}` : "";
}
