import { createServerClient } from "@/lib/supabase/server";
import { OPERATIONS_PILLARS } from "@/lib/operations";
import { reminderLeadFor, minutesUntil, inMinutes, ownerTimezone, upcomingRecurringToday } from "@/lib/taskReminders";
import { DIMENSION_LABEL } from "@/lib/scoring/dimensionModel";

// The Suite's alerts: what needs the owner's attention right now, derived from
// their own live data. The bell shows them; the daily alert email sends the
// important ones (EMAIL_WORTHY) once each. Every rule is best-effort — a failure
// in one never blocks the others.

export interface Derived {
  nkey: string;
  type: string;
  title: string;
  body: string;
  href: string;
}

// Synthesize the current set of "derived" notifications from live business
// state. Each has a stable nkey so read/dismissed state persists. Every source
// is best-effort — a failure in one never blocks the others.
export async function deriveNotifications(
  supabase: ReturnType<typeof createServerClient>,
  masterPlanId: string
): Promise<Derived[]> {
  const out: Derived[] = [];
  const nowIso = new Date().toISOString();

  // 1. Uncategorized expenses → tax accuracy.
  try {
    const { data } = await supabase
      .from("finance_entries")
      .select("id, category")
      .eq("master_plan_id", masterPlanId)
      .eq("type", "expense");
    const uncat = (data || []).filter(
      (e: { category: string | null }) => !e.category || !String(e.category).trim()
    ).length;
    if (uncat > 0) {
      out.push({
        nkey: "uncat-expenses",
        type: "warning",
        title: `${uncat} expense${uncat === 1 ? "" : "s"} need categorizing`,
        body: "Categorize these before your next estimated-tax calculation for an accurate number.",
        href: "/finance/tax",
      });
    }
  } catch {
    /* best effort */
  }

  // 2. Operational pillars marked "needs attention".
  try {
    const { data } = await supabase
      .from("operations_pillars")
      .select("pillar_key, status")
      .eq("master_plan_id", masterPlanId)
      .eq("status", "needs_attention");
    const nameOf = (k: string) => OPERATIONS_PILLARS.find((p) => p.key === k)?.name || k;
    for (const row of (data || []) as { pillar_key: string }[]) {
      out.push({
        nkey: `pillar-attn:${row.pillar_key}`,
        type: "action",
        title: `${nameOf(row.pillar_key)} needs attention`,
        body: "You flagged this operational pillar — take one step to move it forward.",
        href: "/operations",
      });
    }
  } catch {
    /* best effort */
  }

  // 3. Tasks due today or overdue (not done).
  try {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, due_at, due_date")
      .eq("master_plan_id", masterPlanId)
      .neq("status", "done");
    const due = (data || []).filter((t: { due_at: string | null; due_date: string | null }) => {
      const d = t.due_at || t.due_date;
      return d ? new Date(d).getTime() <= Date.now() : false;
    });
    if (due.length > 0) {
      out.push({
        nkey: "tasks-due",
        type: "action",
        title: `${due.length} task${due.length === 1 ? "" : "s"} due`,
        body:
          due.length === 1
            ? `"${String((due[0] as { title: string }).title).slice(0, 60)}" is due.`
            : "You have tasks due today or overdue — knock them out.",
        href: "/tasks",
      });
    }
  } catch {
    /* best effort */
  }

  // 3b. Deadline reminders: timed tasks coming up within the client's lead time.
  try {
    const lead = await reminderLeadFor(masterPlanId);
    const nowMs = Date.now();
    const { data } = await supabase
      .from("tasks")
      .select("id, title, due_at, time_kind")
      .eq("master_plan_id", masterPlanId)
      .eq("due_has_time", true)
      .neq("status", "done")
      .gt("due_at", new Date(nowMs).toISOString())
      .lte("due_at", new Date(nowMs + lead * 60000).toISOString());
    for (const t of (data || []) as { id: number; title: string; due_at: string; time_kind: string }[]) {
      const mins = Math.max(1, minutesUntil(t.due_at));
      out.push({
        nkey: `task-soon-${t.id}-${new Date(t.due_at).getTime()}`,
        type: "action",
        title: t.time_kind === "scheduled" ? `Starts in ${inMinutes(mins)}` : `Due in ${inMinutes(mins)}`,
        body: `"${String(t.title).slice(0, 80)}"`,
        href: "/tasks",
      });
    }
    // Timed recurring tasks due today, still open, coming up within the lead time.
    const tz = await ownerTimezone(masterPlanId);
    for (const r of await upcomingRecurringToday(masterPlanId, tz)) {
      if (new Date(r.dueAt).getTime() > nowMs + lead * 60000) continue;
      const mins = Math.max(1, minutesUntil(r.dueAt));
      out.push({
        nkey: `rtask-soon-${r.id}-${r.today}`,
        type: "action",
        title: r.timeKind === "scheduled" ? `Starts in ${inMinutes(mins)}` : `Due in ${inMinutes(mins)}`,
        body: `"${r.title.slice(0, 80)}" (recurring)`,
        href: "/",
      });
    }
  } catch {
    /* best effort */
  }

  // 4. Follow-ups that are due (tasks with a followup.dueAt in the past).
  try {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, followup, status")
      .eq("master_plan_id", masterPlanId)
      .neq("status", "done");
    const dueFollowups = (data || []).filter((t: { followup: unknown }) => {
      const f = t.followup as { dueAt?: string; nextAt?: string } | null;
      const at = f?.dueAt || f?.nextAt;
      return at ? new Date(at).getTime() <= Date.now() : false;
    });
    if (dueFollowups.length > 0) {
      out.push({
        nkey: "followups-due",
        type: "action",
        title: `${dueFollowups.length} follow-up${dueFollowups.length === 1 ? "" : "s"} ready`,
        body: "Contacts are due for a follow-up — reach out while you're top of mind.",
        href: "/daily-compass",
      });
    }
  } catch {
    /* best effort */
  }

  // 5. Alignment score dropped since a week or more ago.
  try {
    const { data } = await supabase
      .from("client_score_snapshots")
      .select("id, overall, domains, created_at")
      .eq("master_plan_id", masterPlanId)
      .order("created_at", { ascending: false })
      .limit(40);
    const snaps = (data || []) as { id: string; overall: number | null; domains: Record<string, number> | null; created_at: string }[];
    const latest = snaps[0];
    const weekAgo = latest ? new Date(latest.created_at).getTime() - 7 * 86400000 : 0;
    const prior = snaps.find((s) => new Date(s.created_at).getTime() <= weekAgo);
    if (latest && prior && latest.overall !== null && prior.overall !== null) {
      const drop = prior.overall - latest.overall;
      const dims = Object.entries(latest.domains || {})
        .map(([k, v]) => ({ k, d: (prior.domains?.[k] ?? v) - v }))
        .filter((x) => x.d >= 8)
        .sort((a, b) => b.d - a.d)
        .slice(0, 3);
      if (drop >= 5 || dims.length) {
        out.push({
          nkey: `score-drop:${latest.id}`,
          type: "warning",
          title: drop >= 5 ? `Your alignment score dropped ${drop} points` : "Part of your alignment slipped",
          body: dims.length
            ? `Biggest drops: ${dims.map((x) => `${(DIMENSION_LABEL as Record<string, string>)[x.k] || x.k} (−${x.d})`).join(", ")}. Worth a look before it becomes a pattern.`
            : `From ${prior.overall} to ${latest.overall} since ${new Date(prior.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
          href: "/progress",
        });
      }
    }
  } catch {
    /* best effort */
  }

  // 6. Plan goals marked "slipped".
  try {
    const { data: plans } = await supabase.from("client_plans").select("id").eq("master_plan_id", masterPlanId).eq("status", "active");
    const ids = ((plans || []) as { id: string }[]).map((p) => p.id);
    if (ids.length) {
      const { data } = await supabase.from("client_plan_goals").select("id, title").in("plan_id", ids).eq("status", "slipped");
      const slipped = (data || []) as { id: string; title: string }[];
      if (slipped.length) {
        out.push({
          nkey: `goals-slipped:${slipped.map((g) => g.id).sort().join(",").slice(0, 180)}`,
          type: "warning",
          title: slipped.length === 1 ? "A plan goal has slipped" : `${slipped.length} plan goals have slipped`,
          body: slipped.length === 1 ? `"${slipped[0].title.slice(0, 80)}" — reset the target or the next step.` : "Reset the targets or choose the next step for each.",
          href: "/planning",
        });
      }
    }
  } catch {
    /* best effort */
  }

  // 7. Pipeline: overdue next steps, and a pipeline that has gone quiet.
  try {
    const { data } = await supabase
      .from("pipeline_deals")
      .select("id, contact_name, next_step_due, updated_at")
      .eq("master_plan_id", masterPlanId)
      .is("closed_at", null);
    const open = (data || []) as { id: string; contact_name: string | null; next_step_due: string | null; updated_at: string }[];
    const today = new Date().toISOString().slice(0, 10);
    const overdue = open.filter((d) => d.next_step_due && d.next_step_due < today);
    if (overdue.length) {
      out.push({
        nkey: `deals-next-step:${today}`,
        type: "action",
        title: overdue.length === 1 ? "A deal's next step is overdue" : `${overdue.length} deals have an overdue next step`,
        body: overdue.length === 1 && overdue[0].contact_name ? `${overdue[0].contact_name} is waiting on you.` : "Move them forward or update the next step.",
        href: "/sales/pipeline",
      });
    }
    const newest = open.reduce((m, d) => Math.max(m, new Date(d.updated_at).getTime()), 0);
    if (open.length && Date.now() - newest > 14 * 86400000) {
      out.push({
        nkey: `pipeline-quiet:${new Date(newest).toISOString().slice(0, 10)}`,
        type: "warning",
        title: "Your pipeline has gone quiet",
        body: `None of your ${open.length} open deal${open.length === 1 ? "" : "s"} has moved in two weeks.`,
        href: "/sales/pipeline",
      });
    }
  } catch {
    /* best effort */
  }

  // 8. Rhythm: the monthly Quick Pulse check-in is due.
  try {
    const { data } = await supabase
      .from("quick_pulse_checkins")
      .select("created_at")
      .eq("master_plan_id", masterPlanId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const last = (data as { created_at: string } | null)?.created_at;
    if (last && Date.now() - new Date(last).getTime() > 30 * 86400000) {
      const dueOn = new Date(new Date(last).getTime() + 30 * 86400000).toISOString().slice(0, 10);
      out.push({
        nkey: `rhythm:quick_pulse:${dueOn}`,
        type: "action",
        title: "Your monthly Quick Pulse is due",
        body: "Five minutes keeps your scores and trend line current.",
        href: "/assessments/quick-pulse-checkin",
      });
    }
  } catch {
    /* best effort */
  }

  // 9. Bills due in the next 3 days (or overdue) that aren't on autopay.
  try {
    const { data } = await supabase
      .from("finance_bills")
      .select("id, name, amount, next_due, autopay")
      .eq("master_plan_id", masterPlanId)
      .eq("active", true)
      .eq("autopay", false)
      .lte("next_due", new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
    const today = new Date().toISOString().slice(0, 10);
    for (const b of (data || []) as { id: string; name: string; amount: number | null; next_due: string }[]) {
      const late = b.next_due < today;
      const [y, m, d] = b.next_due.split("-").map(Number);
      const when = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      out.push({
        nkey: `bill-due:${b.id}:${b.next_due}`,
        type: late ? "warning" : "action",
        title: late ? `${b.name} is overdue` : `${b.name} is due ${b.next_due === today ? "today" : when}`,
        body: `${b.amount ? `$${Math.round(Number(b.amount)).toLocaleString("en-US")} · ` : ""}${late ? `was due ${when}. ` : ""}Mark it paid on your Bills calendar once it's done.`,
        href: "/finance/bills",
      });
    }
  } catch {
    /* best effort */
  }

  // 10. The weekly review is due (Fri–Mon) and the monthly one at month's turn.
  try {
    const tz = await ownerTimezone(masterPlanId);
    const local = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
    const dow = local.getDay(); // 0 Sun … 6 Sat
    const dom = local.getDate();
    const { periodFor } = await import("@/lib/reviews");
    const checks: { cadence: "weekly" | "monthly"; on: boolean }[] = [
      { cadence: "weekly", on: dow === 5 || dow === 6 || dow === 0 || dow === 1 },
      { cadence: "monthly", on: dom <= 5 || dom >= new Date(local.getFullYear(), local.getMonth() + 1, 0).getDate() - 1 },
    ];
    for (const c of checks) {
      if (!c.on) continue;
      const p = periodFor(c.cadence, tz);
      const { data } = await supabase
        .from("business_reviews")
        .select("id")
        .eq("master_plan_id", masterPlanId)
        .eq("cadence", c.cadence)
        .eq("period_start", p.start)
        .eq("status", "completed")
        .maybeSingle();
      if (!data) {
        out.push({
          nkey: `review-due:${c.cadence}:${p.start}`,
          type: "action",
          title: c.cadence === "weekly" ? "Your weekly review is ready" : "Your monthly review is ready",
          body: `${p.label}: ten minutes to see how it went and choose your three tasks for next ${c.cadence === "weekly" ? "week" : "month"}.`,
          href: `/planning/review${c.cadence === "monthly" ? "?cadence=monthly" : ""}`,
        });
      }
    }
  } catch {
    /* best effort */
  }

  // 11. Legal & compliance renewals due within 14 days (or overdue).
  try {
    const { LEGAL_ITEMS } = await import("@/lib/legalChecklist");
    const { data } = await supabase
      .from("legal_checklist")
      .select("item_key, due_date, status, custom_title")
      .eq("master_plan_id", masterPlanId)
      .not("due_date", "is", null)
      .neq("status", "na")
      .lte("due_date", new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    const today = new Date().toISOString().slice(0, 10);
    for (const r of (data || []) as { item_key: string; due_date: string; custom_title: string | null }[]) {
      const title = LEGAL_ITEMS.find((i) => i.key === r.item_key)?.title ?? r.custom_title ?? "A compliance item";
      out.push({
        nkey: `legal-due:${r.item_key}:${r.due_date}`,
        type: r.due_date < today ? "warning" : "action",
        title: r.due_date < today ? `Overdue: ${title}` : `Coming due ${r.due_date}: ${title}`,
        body: "Renew or file it, then update the date on your Legal & Compliance checklist.",
        href: "/compliance",
      });
    }
  } catch {
    /* best effort */
  }

  // 12. Accountability Partner: encouragement, nudges, "I'm stuck" requests, a partner's wins and
  // reminders waiting for you, plus an invitation from another Suite client. They leave the
  // bell once you've opened the page (that marks them read there).
  try {
    const { data: parts } = await supabase
      .from("accountability_partnerships")
      .select("id, a_plan_id, b_plan_id, a_name, b_name, status")
      .or(`a_plan_id.eq.${masterPlanId},b_plan_id.eq.${masterPlanId}`)
      .neq("status", "ended");
    const rows = (parts || []) as { id: string; a_plan_id: string; b_plan_id: string | null; a_name: string; b_name: string; status: string }[];
    const mine = new Map(rows.map((p) => [p.id, { side: p.a_plan_id === masterPlanId ? "a" : "b", partner: ((p.a_plan_id === masterPlanId ? p.b_name : p.a_name) || "Your partner").trim().split(/\s+/)[0] || "Your partner" }]));
    for (const p of rows) {
      if (p.b_plan_id === masterPlanId && p.status === "invited") {
        out.push({ nkey: `acc-invite:${p.id}`, type: "action", title: `${(p.a_name || "Someone").trim().split(/\s+/)[0]} invited you to be accountability partners`, body: "Open Accountability Partner to say yes, or not right now.", href: "/accountability" });
      }
    }
    if (rows.length) {
      const { data: nudges } = await supabase
        .from("accountability_nudges")
        .select("id, partnership_id, from_side, to_side, kind, message")
        .in("partnership_id", rows.map((p) => p.id))
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(40);
      let n = 0;
      for (const x of (nudges || []) as { id: string; partnership_id: string; from_side: string; to_side: string; kind: string; message: string }[]) {
        const m = mine.get(x.partnership_id);
        if (!m || x.to_side !== m.side || n >= 10) continue;
        n++;
        const name = m.partner;
        const system = x.from_side === "system";
        const title = system
          ? x.kind === "celebrate" ? "A win to celebrate" : "Accountability reminder"
          : x.kind === "stuck" ? `${name} is stuck and asked for support`
          : x.kind === "nudge" ? `${name} sent you a nudge`
          : x.kind === "encourage" ? `${name} sent you encouragement`
          : x.kind === "inspire" ? `${name} sent you some inspiration`
          : x.kind === "support" ? `${name} is offering support`
          : x.kind === "celebrate" ? `${name} is celebrating you`
          : `${name} sent you a note`;
        out.push({ nkey: `acc-nudge:${x.id}`, type: x.kind === "stuck" || x.kind === "nudge" || x.kind === "reminder" ? "action" : x.kind === "celebrate" ? "success" : "info", title, body: x.message.slice(0, 220), href: "/accountability" });
      }
    }
  } catch {
    /* best effort */
  }

  void nowIso;
  return out;
}


// Alerts worth an email (the rest stay in the bell): keyed by nkey prefix.
export const EMAIL_WORTHY = ["score-drop:", "goals-slipped:", "deals-next-step:", "pipeline-quiet:", "rhythm:", "bill-due:", "review-due:", "legal-due:"];
export const isEmailWorthy = (nkey: string | null) => !!nkey && EMAIL_WORTHY.some((p) => nkey.startsWith(p));

// Brings the stored notifications in line with the live alerts (keeping
// read/dismissed state), and returns the ones still showing.
export async function syncNotifications(masterPlanId: string) {
  const supabase = createServerClient();
  const derived = await deriveNotifications(supabase, masterPlanId);
  const derivedKeys = new Set(derived.map((d) => d.nkey));

  const { data: existingRows } = await supabase
    .from("notifications")
    .select("id, nkey, read, dismissed")
    .eq("master_plan_id", masterPlanId);
  const existing = new Map(
    ((existingRows || []) as { id: string; nkey: string | null; read: boolean; dismissed: boolean }[])
      .filter((r) => r.nkey)
      .map((r) => [r.nkey as string, r])
  );

  for (const d of derived) {
    const prev = existing.get(d.nkey);
    if (prev) {
      await supabase
        .from("notifications")
        .update({ title: d.title, body: d.body, href: d.href, type: d.type, updated_at: new Date().toISOString() })
        .eq("id", prev.id);
    } else {
      await supabase.from("notifications").insert({ master_plan_id: masterPlanId, nkey: d.nkey, type: d.type, title: d.title, body: d.body, href: d.href });
    }
  }

  // Remove derived rows whose condition no longer holds (keep one-offs: nkey null).
  const staleIds = ((existingRows || []) as { id: string; nkey: string | null }[])
    .filter((r) => r.nkey && !derivedKeys.has(r.nkey))
    .map((r) => r.id);
  if (staleIds.length) await supabase.from("notifications").delete().in("id", staleIds);

  const { data: finalRows } = await supabase
    .from("notifications")
    .select("id, nkey, type, title, body, href, read, created_at, emailed_at")
    .eq("master_plan_id", masterPlanId)
    .eq("dismissed", false)
    .order("created_at", { ascending: false })
    .limit(30);
  return (finalRows || []) as {
    id: string;
    nkey: string | null;
    type: string;
    title: string;
    body: string;
    href: string;
    read: boolean;
    created_at: string;
    emailed_at: string | null;
  }[];
}
