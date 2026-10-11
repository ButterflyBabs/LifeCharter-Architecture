import { test } from "node:test";
import assert from "node:assert/strict";
import { activateEvent, rollSessions, todayMT } from "../src/lib/sessionChecklists";

// A tiny in-memory stand-in for the Supabase client: just the chain calls sessionChecklists.ts makes.
type Row = Record<string, unknown>;
function fakeDb(seed: Record<string, Row[]>) {
  const tables: Record<string, Row[]> = JSON.parse(JSON.stringify(seed));
  let nextId = 1000;
  const q = (name: string) => {
    const t = (tables[name] = tables[name] || []);
    let rows = t;
    let patch: Row | null = null;
    let inserted: Row[] | null = null;
    let del = false;
    let wantSingle = false;
    const api: Record<string, unknown> = {
      select() { return api; },
      eq(col: string, val: unknown) { rows = rows.filter((r) => r[col] === val); return api; },
      order(col: string) { rows = [...rows].sort((a, b) => String(a[col]) < String(b[col]) ? -1 : 1); return api; },
      update(p: Row) { patch = p; return api; },
      insert(p: Row | Row[]) { inserted = (Array.isArray(p) ? p : [p]).map((r) => ({ id: `id${nextId++}`, ...r })); t.push(...inserted); return api; },
      delete() { del = true; return api; },
      single() { wantSingle = true; return api; },
      maybeSingle() { wantSingle = true; return api; },
      then(res: (v: unknown) => void) {
        if (patch) { rows.forEach((r) => Object.assign(r, patch)); }
        if (del) { const ids = new Set(rows); tables[name] = t.filter((r) => !ids.has(r)); }
        const out = inserted ?? rows;
        res({ data: wantSingle ? out[0] ?? null : out, error: null });
      },
    };
    return api;
  };
  return { db: { from: q } as never, tables };
}

const PLAN = "plan1";
const ev = (id: string, kind: string, date: string, status: string) => ({ id, master_plan_id: PLAN, kind, title: `${kind} ${date}`, session_date: date, business_id: 15, project_id: null, status });

test("todayMT gives a Mountain-time date", () => {
  assert.match(todayMT(new Date("2026-10-23T05:00:00Z")), /^2026-10-2[23]$/);
  assert.equal(todayMT(new Date("2026-10-23T14:00:00Z")), "2026-10-23");
});

test("the morning after a session, it is closed and the next one's checklist joins the task list", async () => {
  const { db, tables } = fakeDb({
    session_events: [ev("a", "masterclass", "2026-10-22", "active"), ev("b", "masterclass", "2026-11-05", "scheduled"), ev("c", "masterclass", "2026-11-19", "scheduled")],
    session_event_items: [
      { event_id: "b", position: 1, title: "Send the invite", description: null, priority: "high", status: "backlog", owner_action: true, energy: null, time_kind: "deadline" },
      { event_id: "b", position: 2, title: "Host it", description: null, priority: "medium", status: "backlog", owner_action: false, energy: null, time_kind: null },
      { event_id: "c", position: 1, title: "Later step", description: null, priority: "medium", status: "backlog", owner_action: true, energy: null, time_kind: null },
    ],
    tasks: [], projects: [],
  });
  const r = await rollSessions(db, PLAN, "2026-10-23");
  assert.equal(r.closed, 1);
  assert.deepEqual(r.activated, ["masterclass 2026-11-05"]);
  assert.equal(tables.session_events.find((e) => e.id === "a")?.status, "done");
  assert.equal(tables.session_events.find((e) => e.id === "b")?.status, "active");
  assert.equal(tables.session_events.find((e) => e.id === "c")?.status, "scheduled");
  assert.equal(tables.tasks.length, 2);
  assert.equal(tables.tasks[0].business_id, 15);
  assert.equal(tables.tasks[1].time_kind, "deadline");
});

test("nothing happens while a session is still ahead of today", async () => {
  const { db, tables } = fakeDb({ session_events: [ev("a", "incubator", "2026-11-12", "active"), ev("b", "incubator", "2026-12-10", "scheduled")], session_event_items: [], tasks: [], projects: [] });
  const r = await rollSessions(db, PLAN, "2026-11-10");
  assert.equal(r.closed, 0);
  assert.deepEqual(r.activated, []);
  assert.equal(tables.tasks.length, 0);
});

test("activating twice adds the checklist once", async () => {
  const { db, tables } = fakeDb({
    session_events: [ev("b", "masterclass", "2026-11-05", "scheduled")],
    session_event_items: [{ event_id: "b", position: 1, title: "Step", description: null, priority: "medium", status: "backlog", owner_action: true, energy: null, time_kind: null }],
    tasks: [], projects: [],
  });
  const first = await activateEvent(db, "b");
  const second = await activateEvent(db, "b");
  assert.equal(first.added, 1);
  assert.equal(second.added, 0);
  assert.equal(tables.tasks.length, 1);
});
