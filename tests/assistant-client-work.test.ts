import { test } from "node:test";
import assert from "node:assert/strict";
import { createEvent, addTimeEntry, addPortalItem, addProgramMember, mondayOf } from "../src/lib/ai/actions/clientWork";
import { ACTION_TOOLS } from "../src/lib/ai/actions/registry";
import type { ActionCtx } from "../src/lib/ai/actions/types";

// A tiny stand-in for the database: every query on a table answers with that table's rows.
function fakeDb(rows: Record<string, unknown[]>) {
  return {
    from(table: string) {
      const data = rows[table] ?? [];
      const q: Record<string, unknown> = {};
      for (const m of ["select", "eq", "neq", "in", "or", "ilike", "limit", "order", "is", "gte", "lt", "overlaps"]) q[m] = () => q;
      q.maybeSingle = async () => ({ data: data[0] ?? null });
      q.single = async () => ({ data: data[0] ?? null });
      q.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data, count: data.length }).then(ok);
      return q;
    },
  };
}
const ctxWith = (rows: Record<string, unknown[]>) => ({ planId: "p", userEmail: null, db: fakeDb(rows) }) as unknown as ActionCtx;
const ctx = ctxWith({});
const future = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10);
const eloise = { id: "c1", email: "eloise@example.com", first_name: "Eloise", last_name: "Test" };

test("event card is a draft and never opens sign-ups", async () => {
  const r = await createEvent.plan!({ kind: "live", title: "Price With Confidence", date: future, time: "18:30", join_url: "https://zoom.us/j/1" }, ctx);
  assert.ok("preview" in r);
  if ("preview" in r) {
    assert.match(r.preview.title, /Draft the live event "Price With Confidence"/);
    assert.ok(r.preview.lines.some((l) => /6:30 PM/.test(l)));
    assert.ok(r.preview.lines.some((l) => /nobody can sign up and no email goes out/.test(l)));
  }
  const ch = await createEvent.plan!({ kind: "challenge", title: "5-Day Reset", days: 5, challenge_days: [{ title: "Clear the desk" }, { title: "One promise" }] }, ctx);
  assert.ok("preview" in ch && ch.preview.lines.some((l) => l === "Day 2: One promise"));
  assert.ok("error" in (await createEvent.plan!({ kind: "live" }, ctx)));
  assert.ok("error" in (await createEvent.plan!({ kind: "live", title: "Old", date: "2020-01-01" }, ctx)));
});

test("time card checks the day and length", async () => {
  const r = await addTimeEntry.plan!({ date: "2026-10-15", start_time: "09:00", minutes: 90, note: "Client prep" }, ctx);
  assert.ok("preview" in r && r.preview.lines.some((l) => /1 h 30 m/.test(l)) && r.preview.lines.some((l) => /Billable/.test(l)));
  assert.ok("error" in (await addTimeEntry.plan!({ date: "2026-10-15", minutes: 0 }, ctx)));
  assert.ok("error" in (await addTimeEntry.plan!({ date: "2099-01-01", minutes: 30 }, ctx)));
  assert.equal(mondayOf("2026-10-18"), "2026-10-12");
});

test("portal homework card names the client and sends nothing", async () => {
  const r = await addPortalItem.plan!({ client: "Eloise", kind: "homework", title: "Write your three prices", due_on: future }, ctxWith({ seq_contacts: [eloise] }));
  assert.ok("preview" in r);
  if ("preview" in r) {
    assert.match(r.preview.title, /homework to Eloise Test's portal/);
    assert.ok(r.preview.lines.some((l) => /Nothing is emailed/.test(l)));
    assert.equal(r.preview.links?.[0].href, "/client-portals?contact=c1");
  }
  const two = await addPortalItem.plan!({ client: "E", kind: "goal", title: "x" }, ctxWith({ seq_contacts: [eloise, { ...eloise, id: "c2", last_name: "Two" }] }));
  assert.ok("error" in two && /More than one/.test(two.error));
  assert.ok("error" in (await addPortalItem.plan!({ client: "Eloise", kind: "resource", title: "x" }, ctx)));
});

test("program member card says nothing is emailed", async () => {
  const r = await addProgramMember.plan!({ client: "eloise@example.com", program: "reset" }, ctxWith({ programs: [{ id: "g1", name: "Reset Circle", kind: "cohort", status: "active" }], seq_contacts: [eloise], program_members: [] }));
  assert.ok("preview" in r);
  if ("preview" in r) {
    assert.match(r.preview.title, /Add Eloise Test to "Reset Circle"/);
    assert.ok(r.preview.lines.some((l) => /Nothing is emailed/.test(l)));
  }
  const already = await addProgramMember.plan!({ client: "eloise@example.com", program: "reset" }, ctxWith({ programs: [{ id: "g1", name: "Reset Circle", kind: "cohort", status: "active" }], seq_contacts: [eloise], program_members: [{ status: "active" }] }));
  assert.ok("error" in already && /already in/.test(already.error));
});

test("new tools are registered once, with writes that can be undone", () => {
  for (const n of ["list_events", "create_event", "time_summary", "add_time_entry", "portal_status", "add_portal_item", "client_care_status", "add_program_member"]) {
    const t = ACTION_TOOLS.filter((x) => x.name === n);
    assert.equal(t.length, 1, n);
    if (t[0].kind === "write") assert.ok(t[0].plan && t[0].run && t[0].undo, n);
    else assert.ok(t[0].read, n);
  }
});
